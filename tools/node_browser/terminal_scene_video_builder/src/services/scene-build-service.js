import path from 'node:path';
import { FileSystemAdapter } from '../adapters/filesystem.js';
import { PlaywrightRenderer } from '../adapters/playwright-renderer.js';
import { FfmpegRunner } from '../adapters/ffmpeg-runner.js';
import { SessionPayloadBuilder } from './session-payload-builder.js';
import { WebPreviewServer } from './web-preview-server.js';
import { FrameworkBundleResolver } from './framework-bundle-resolver.js';

class PayloadRequestPathBuilder {
  constructor(workdir) {
    this.workdir = workdir;
  }

  build(absolutePayloadPath) {
    const relativePath = path.relative(this.workdir, absolutePayloadPath);
    const normalizedSegments = relativePath
      .split(path.sep)
      .filter((segment) => segment.length > 0)
      .map((segment) => encodeURIComponent(segment));

    return `/${normalizedSegments.join('/')}`;
  }
}

export class SceneBuildService {
  constructor(workdir, config, logger, env = process.env, options = {}) {
    this.workdir = workdir;
    this.config = config;
    this.logger = logger;
    this.env = env;
    this.options = options;
    this.fs = new FileSystemAdapter();
    this.renderer = new PlaywrightRenderer(logger);
    this.payloadBuilder = new SessionPayloadBuilder(workdir, config, this.fs);
    this.payloadRequestPathBuilder = new PayloadRequestPathBuilder(workdir);
  }

  resolveSceneHtmlPath() {
    const configuredScenePath = this.config.data.render.sceneHtmlPath;
    if (configuredScenePath) {
      return path.resolve(this.workdir, configuredScenePath);
    }
    return path.resolve(this.workdir, '..', 'app', 'scene.html');
  }

  async build() {
    const data = this.config.data;
    const sessionArtifacts = this.payloadBuilder.preparePayloadFiles({
      resourceMode: 'http',
      payloadOverrides: this.options.payloadOverrides ?? null,
    });

    const sceneHtmlPath = this.resolveSceneHtmlPath();
    const frameworkBundlePath = FrameworkBundleResolver.resolve({
      sceneHtmlPath,
      configuredPath: data.render.frameworkBundlePath,
      envPath: this.env.TSVB_FRAMEWORK_BUNDLE,
    });
    const appRoot = path.resolve(this.workdir, '..', 'app');
    const frameworkRoute = '/__framework__/interdead-framework.global.js';
    const recordServer = new WebPreviewServer({
      workdir: this.workdir,
      appRoot,
      logger: this.logger,
      staticFiles: { [frameworkRoute]: frameworkBundlePath },
    });
    const recordPort = Number(this.env.TSVB_RECORD_PORT ?? 0);
    await recordServer.start(recordPort);

    const payloadRequestPath = this.payloadRequestPathBuilder.build(sessionArtifacts.payloadPath);
    const scenePageBaseUrl = `http://127.0.0.1:${recordServer.port}/scene.html`;

    try {
      await this.renderer.renderFrames({
        sceneHtmlPath,
        scenePageBaseUrl,
        width: data.video.width,
        height: data.video.height,
        fps: data.video.fps,
        durationSec: sessionArtifacts.duration,
        payloadUri: payloadRequestPath,
        outDir: sessionArtifacts.tmpFramesDir,
        frameworkUri: frameworkRoute,
      });
    } finally {
      await recordServer.stop();
    }

    const outputPath = sessionArtifacts.outputPath;
    this.fs.ensureDir(path.dirname(outputPath));
    const command = FfmpegRunner.composeMuxCommand({
      fps: data.video.fps,
      framePattern: sessionArtifacts.framePattern,
      audioPath: sessionArtifacts.audioPath,
      outputPath,
      crf: data.video.crf,
      pixelFormat: data.video.pixelFormat,
      x264Preset: data.video.x264Preset,
      videoBitrate: data.video.videoBitrate,
    });
    FfmpegRunner.run(command);

    if (!data.render.keepFrames) {
      this.fs.removeDir(sessionArtifacts.tmpFramesDir);
    }
    this.logger.info(`Build completed: ${outputPath}`);
  }
}
