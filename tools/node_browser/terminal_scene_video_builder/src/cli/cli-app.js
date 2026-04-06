import path from 'node:path';
import { ConfigLoader } from '../services/config-loader.js';
import { ValidationService } from '../services/validation-service.js';
import { SceneBuildService } from '../services/scene-build-service.js';
import { AudioAnalysisService } from '../services/audio-analysis-service.js';
import { FfmpegRunner } from '../adapters/ffmpeg-runner.js';
import { FileSystemAdapter } from '../adapters/filesystem.js';
import { SessionPayloadBuilder } from '../services/session-payload-builder.js';
import { WebPreviewServer } from '../services/web-preview-server.js';
import { FrameworkBundleResolver } from '../services/framework-bundle-resolver.js';

class ConsoleLogger {
  info(message) {
    console.log(`[INFO] ${message}`);
  }
  warn(message) {
    console.warn(`[WARN] ${message}`);
  }
  error(message) {
    console.error(`[ERROR] ${message}`);
  }
}

export class CliApp {
  constructor({ argv, cwd, env = process.env }) {
    this.argv = argv;
    this.cwd = cwd;
    this.env = env;
    this.logger = new ConsoleLogger();
  }

  parseArgs() {
    const [command] = this.argv;
    const workdirFlag = this.argv.indexOf('--workdir');
    const workdir = workdirFlag >= 0 ? this.argv[workdirFlag + 1] : './session';
    const portFlag = this.argv.indexOf('--port');
    const port = portFlag >= 0 ? Number(this.argv[portFlag + 1]) : 4173;

    if (!command) throw new Error('Command is required: validate | probe | serve | record | build');
    if (!Number.isFinite(port) || port <= 0 || port > 65535) throw new Error('Port must be in range 1..65535.');
    return { command, port, workdir: path.resolve(this.cwd, workdir) };
  }

  resolveSceneHtmlPath(workdir, config) {
    const sceneHtmlPath = config.data.render.sceneHtmlPath;
    if (sceneHtmlPath) {
      return path.resolve(workdir, sceneHtmlPath);
    }
    return path.resolve(workdir, '..', 'app', 'scene.html');
  }

  resolveFrameworkBundle(workdir, config) {
    return FrameworkBundleResolver.resolve({
      sceneHtmlPath: this.resolveSceneHtmlPath(workdir, config),
      configuredPath: config.data.render.frameworkBundlePath,
      envPath: this.env.TSVB_FRAMEWORK_BUNDLE,
    });
  }

  async runServeMode({ workdir, config, port }) {
    const fsAdapter = new FileSystemAdapter();
    const payloadBuilder = new SessionPayloadBuilder(workdir, config, fsAdapter);
    const artifacts = payloadBuilder.preparePayloadFiles({
      resourceMode: 'http',
      payloadOverrides: structuredClone(config.data),
    });
    const appRoot = path.resolve(workdir, '..', 'app');
    const frameworkBundlePath = this.resolveFrameworkBundle(workdir, config);
    const frameworkRoute = '/__framework__/interdead-framework.global.js';

    const server = new WebPreviewServer({
      workdir,
      appRoot,
      logger: this.logger,
      staticFiles: { [frameworkRoute]: frameworkBundlePath },
    });
    await server.start(port);

    const payloadName = path.basename(artifacts.payloadPath);
    const previewUrl = new URL(`http://127.0.0.1:${port}/scene.html`);
    previewUrl.searchParams.set('mode', 'preview');
    previewUrl.searchParams.set('payload', `/${config.data.render.tmpDir}/${payloadName}`);
    previewUrl.searchParams.set('framework', frameworkRoute);
    this.logger.info(`Preview URL: ${previewUrl.href}`);
    this.logger.info('Press Ctrl+C to stop preview server.');

    const stop = async () => {
      await server.stop();
      this.logger.info('Preview server stopped.');
      process.exit(0);
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  }

  async run() {
    const { command, workdir, port } = this.parseArgs();
    const config = await new ConfigLoader(workdir).load();
    const validation = new ValidationService(workdir, config, this.env).run();

    validation.warnings.forEach((warning) => this.logger.warn(warning));
    validation.diagnostics?.forEach((message) => this.logger.info(message));
    if (!validation.ok) {
      validation.errors.forEach((error) => this.logger.error(error));
      throw new Error('Validation failed.');
    }
    this.logger.info('Session validated.');

    if (command === 'validate') {
      this.logger.info('Validation command finished successfully.');
      return;
    }

    const data = config.data;
    const audioPath = path.join(workdir, data.inputs.audio);
    const duration = AudioAnalysisService.probeDuration(audioPath);
    const totalFrames = Math.ceil(duration * data.video.fps);

    const ffmpegPreview = FfmpegRunner.composeMuxCommand({
      fps: data.video.fps,
      framePattern: path.join(workdir, data.render.tmpDir, 'frame_%06d.png'),
      audioPath,
      outputPath: path.join(workdir, data.output.file),
      crf: data.video.crf,
      pixelFormat: data.video.pixelFormat,
      x264Preset: data.video.x264Preset,
      videoBitrate: data.video.videoBitrate,
    });

    this.logger.info(`Audio duration: ${duration.toFixed(2)}s`);
    this.logger.info(`Video: ${data.video.width}x${data.video.height} @ ${data.video.fps}fps`);
    this.logger.info(`Scene mode: ${data.scene.mode}`);
    this.logger.info(`Total frames: ${totalFrames}`);
    this.logger.info('Membrane mode: framework runtime');
    this.logger.info(`Text overlay content length: ${(data.textOverlay?.content ?? '').length}`);
    this.logger.info(`Scene HTML: ${this.resolveSceneHtmlPath(workdir, config)}`);
    this.logger.info('Browser backend: playwright-chromium');
    this.logger.info(`Output: ${data.output.file}`);
    this.logger.info('FFmpeg mux command:');
    console.log(FfmpegRunner.preview(ffmpegPreview));

    if (command === 'probe') return;
    if (command === 'serve') {
      await this.runServeMode({ workdir, config, port });
      return;
    }

    if (command === 'build' || command === 'record') {
      await new SceneBuildService(workdir, config, this.logger, this.env, {
        payloadOverrides: structuredClone(config.data),
      }).build();
      return;
    }

    throw new Error(`Unsupported command: ${command}`);
  }
}
