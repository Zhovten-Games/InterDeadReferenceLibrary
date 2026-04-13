import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REVEAL_MODES, REVEAL_MODE_VALUES, STANZA_REVEAL_MODES, STANZA_REVEAL_MODE_VALUES } from '../domain/config.js';
import { collectTimedStanzaValidationErrors } from '../domain/timed-stanza-validation.js';
import { FrameworkBundleResolver } from './framework-bundle-resolver.js';
import { FrameworkBuildGuide } from './framework-build-guide.js';

const TEXT_ALIGNMENTS = new Set(['left', 'center', 'right']);

export class ValidationService {
  constructor(workdir, config, env = process.env) {
    this.workdir = workdir;
    this.config = config;
    this.env = env;
  }

  resolveSceneHtmlPath() {
    const sceneHtmlPath = this.config.data.render.sceneHtmlPath;
    if (sceneHtmlPath) {
      return path.resolve(this.workdir, sceneHtmlPath);
    }
    return path.resolve(this.workdir, '..', 'app', 'scene.html');
  }

  resolveFrameworkBundlePath(sceneHtmlPath) {
    return FrameworkBundleResolver.resolve({
      sceneHtmlPath,
      configuredPath: this.config.data.render.frameworkBundlePath,
      envPath: this.env.TSVB_FRAMEWORK_BUNDLE,
    });
  }

  validateFrameworkBundle(errors, diagnostics, sceneHtmlPath) {
    const configuredPath = this.config.data.render.frameworkBundlePath ?? null;
    const envPath = this.env.TSVB_FRAMEWORK_BUNDLE ?? null;
    if (!configuredPath && !envPath) {
      const frameworkBundlePath = this.resolveFrameworkBundlePath(sceneHtmlPath);
      errors.push('Framework bundle path is required. Set render.frameworkBundlePath or TSVB_FRAMEWORK_BUNDLE.');
      diagnostics.push(...FrameworkBuildGuide.create({ sceneHtmlPath, frameworkBundlePath }));
      return;
    }

    const frameworkBundlePath = this.resolveFrameworkBundlePath(sceneHtmlPath);
    diagnostics.push(`Framework bundle resolved path: ${frameworkBundlePath}`);
    if (!fs.existsSync(frameworkBundlePath)) {
      errors.push(`Missing framework bundle file: ${frameworkBundlePath}`);
      diagnostics.push(...FrameworkBuildGuide.create({ sceneHtmlPath, frameworkBundlePath }));
    }
  }

  validateFrameworkMembrane(errors) {
    const membrane = this.config.data.render.frameworkMembrane ?? {};
    const checkRange = (key, min, max, includeMin = true) => {
      if (!(key in membrane)) return;
      const value = membrane[key];
      if (typeof value !== 'number' || Number.isNaN(value)) {
        errors.push(`render.frameworkMembrane.${key} must be a number.`);
        return;
      }
      const minOk = includeMin ? value >= min : value > min;
      if (!minOk || value > max) {
        errors.push(`render.frameworkMembrane.${key} must be in range ${includeMin ? '[' : '('}${min}..${max}].`);
      }
    };

    checkRange('lineCount', 4, 120);
    checkRange('amplitude', 0, 40);
    checkRange('pulseDecay', 0, 1, false);
    if ('lineColor' in membrane && typeof membrane.lineColor !== 'string') {
      errors.push('render.frameworkMembrane.lineColor must be a string.');
    }
    if ('pulseColor' in membrane && typeof membrane.pulseColor !== 'string') {
      errors.push('render.frameworkMembrane.pulseColor must be a string.');
    }
  }

  validateTextOverlay(errors) {
    const textOverlay = this.config.data.textOverlay ?? {};

    if (typeof textOverlay.content !== 'string' || textOverlay.content.trim().length === 0) {
      errors.push('textOverlay.content must be a non-empty string.');
    }
    if (typeof textOverlay.start !== 'number') {
      errors.push('textOverlay.start must be a number.');
    }
    if ('end' in textOverlay) {
      if (typeof textOverlay.end !== 'number') {
        errors.push('textOverlay.end must be a number when provided.');
      } else if (typeof textOverlay.start === 'number' && textOverlay.end <= textOverlay.start) {
        errors.push('textOverlay.end must be greater than textOverlay.start.');
      }
    }

    if ('reveal' in textOverlay && (typeof textOverlay.reveal !== 'object' || textOverlay.reveal === null || Array.isArray(textOverlay.reveal))) {
      errors.push('textOverlay.reveal must be an object when provided.');
    }

    const reveal = textOverlay.reveal ?? {};
    if ('mode' in reveal && !REVEAL_MODES.has(reveal.mode)) {
      errors.push(`textOverlay.reveal.mode must be one of: ${REVEAL_MODE_VALUES.join(', ')}.`);
    }
    if ('lineDelaySec' in reveal && (typeof reveal.lineDelaySec !== 'number' || reveal.lineDelaySec <= 0)) {
      errors.push('textOverlay.reveal.lineDelaySec must be > 0.');
    }
    if ('minLineDurationSec' in reveal && (typeof reveal.minLineDurationSec !== 'number' || reveal.minLineDurationSec <= 0)) {
      errors.push('textOverlay.reveal.minLineDurationSec must be > 0.');
    }
    if ('fitToAudioDuration' in reveal && typeof reveal.fitToAudioDuration !== 'boolean') {
      errors.push('textOverlay.reveal.fitToAudioDuration must be a boolean.');
    }
    if ('stanzaRevealMode' in reveal && !STANZA_REVEAL_MODES.has(reveal.stanzaRevealMode)) {
      errors.push(`textOverlay.reveal.stanzaRevealMode must be one of: ${STANZA_REVEAL_MODE_VALUES.join(', ')}.`);
    }
    errors.push(...collectTimedStanzaValidationErrors(textOverlay, reveal.mode));

    const check01 = (key) => {
      if (!(key in textOverlay)) return;
      const value = textOverlay[key];
      if (typeof value !== 'number' || value < 0 || value > 1) {
        errors.push(`textOverlay.${key} must be in range 0..1.`);
      }
    };

    check01('x');
    check01('y');
    check01('anchorX');
    check01('anchorY');

    if ('align' in textOverlay && !TEXT_ALIGNMENTS.has(textOverlay.align)) {
      errors.push('textOverlay.align must be one of: left, center, right.');
    }
    if ('maxWidth' in textOverlay && (typeof textOverlay.maxWidth !== 'number' || textOverlay.maxWidth <= 0)) {
      errors.push('textOverlay.maxWidth must be > 0.');
    }
    if ('fontSize' in textOverlay && (typeof textOverlay.fontSize !== 'number' || textOverlay.fontSize <= 0)) {
      errors.push('textOverlay.fontSize must be > 0.');
    }
    if ('fadeInSec' in textOverlay && (typeof textOverlay.fadeInSec !== 'number' || textOverlay.fadeInSec < 0)) {
      errors.push('textOverlay.fadeInSec must be >= 0.');
    }
    if ('fadeOutSec' in textOverlay && (typeof textOverlay.fadeOutSec !== 'number' || textOverlay.fadeOutSec < 0)) {
      errors.push('textOverlay.fadeOutSec must be >= 0.');
    }
  }

  run() {
    const data = this.config.data;
    const errors = [];
    const warnings = [];
    const diagnostics = [];

    const bgPath = path.join(this.workdir, data.inputs.background);
    const audioPath = path.join(this.workdir, data.inputs.audio);
    const sceneHtmlPath = this.resolveSceneHtmlPath();

    if (!fs.existsSync(bgPath)) errors.push(`Missing background file: ${bgPath}`);
    if (!fs.existsSync(audioPath)) errors.push(`Missing audio file: ${audioPath}`);
    if (!fs.existsSync(sceneHtmlPath)) errors.push(`Missing scene HTML file: ${sceneHtmlPath}`);

    if (data.video.width <= 0 || data.video.height <= 0 || data.video.fps <= 0) {
      errors.push('Video dimensions and fps must be positive.');
    }
    if (data.video.crf < 0 || data.video.crf > 51) errors.push('CRF must be in range 0..51.');
    if (data.scene?.mode !== 'text_overlay') {
      errors.push(`scene.mode must be 'text_overlay' (received: ${data.scene?.mode ?? 'undefined'}).`);
    }
    this.validateFrameworkBundle(errors, diagnostics, sceneHtmlPath);
    this.validateFrameworkMembrane(errors);
    this.validateTextOverlay(errors);

    if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
      errors.push('ffmpeg is not available.');
    }
    if (spawnSync('ffprobe', ['-version'], { stdio: 'ignore' }).status !== 0) {
      errors.push('ffprobe is not available.');
    }

    const playwrightProbe = spawnSync(
      process.execPath,
      ['-e', "import('playwright').then(() => process.exit(0)).catch(() => process.exit(1));"],
      { stdio: 'ignore' },
    );
    if (playwrightProbe.status !== 0) {
      errors.push('Playwright package is not available.');
    }

    return { ok: errors.length === 0, errors, warnings, diagnostics };
  }
}
