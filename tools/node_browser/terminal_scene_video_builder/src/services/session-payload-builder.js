import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { AudioAnalysisService } from './audio-analysis-service.js';

class FileResourceUriResolver {
  toUri(filePath) {
    return pathToFileURL(filePath).href;
  }
}

class HttpResourceUriResolver {
  constructor(workdir) {
    this.workdir = workdir;
  }

  toUri(filePath) {
    const relativePath = path.relative(this.workdir, filePath);
    const normalized = relativePath.split(path.sep).map((segment) => encodeURIComponent(segment)).join('/');
    return `/${normalized}`;
  }
}

export class SessionPayloadBuilder {
  constructor(workdir, config, fsAdapter) {
    this.workdir = workdir;
    this.config = config;
    this.fs = fsAdapter;
  }

  resolvePaths() {
    const data = this.config.data;
    const audioPath = path.join(this.workdir, data.inputs.audio);
    const bgPath = path.join(this.workdir, data.inputs.background);
    const tmpFramesDir = path.join(this.workdir, data.render.tmpDir);

    return { data, audioPath, bgPath, tmpFramesDir };
  }

  createUriResolver(resourceMode) {
    if (resourceMode === 'http') {
      return new HttpResourceUriResolver(this.workdir);
    }
    return new FileResourceUriResolver(this.workdir);
  }

  preparePayloadFiles({ resourceMode = 'file', payloadOverrides = null } = {}) {
    const { data, audioPath, bgPath, tmpFramesDir } = this.resolvePaths();
    const duration = AudioAnalysisService.probeDuration(audioPath);

    const payloadConfig = payloadOverrides ? structuredClone(payloadOverrides) : structuredClone(data);
    const uriResolver = this.createUriResolver(resourceMode);

    this.fs.removeDir(tmpFramesDir);
    this.fs.ensureDir(tmpFramesDir);

    const payloadPath = path.join(tmpFramesDir, 'scene-payload.json');
    this.fs.writeJson(payloadPath, {
      config: payloadConfig,
      meta: {
        audioDurationSec: duration,
      },
      inputs: {
        backgroundUri: uriResolver.toUri(bgPath),
        audioUri: uriResolver.toUri(audioPath),
      },
    });

    return {
      duration,
      payloadPath,
      audioPath,
      tmpFramesDir,
      outputPath: path.join(this.workdir, data.output.file),
      framePattern: path.join(tmpFramesDir, 'frame_%06d.png'),
      totalFrames: Math.ceil(duration * data.video.fps),
    };
  }
}
