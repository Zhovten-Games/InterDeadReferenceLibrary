import { TextOverlayRenderer } from './text-overlay-renderer.js';
import { FrameworkMembraneBridge } from './framework-membrane-bridge.js';

export class ScenePlayer {
  constructor(logger = console) {
    this.logger = logger;
    this.payload = null;

    this.backgroundNode = document.querySelector('[data-background]');
    this.textOverlayNode = document.querySelector('[data-text-overlay]');
    this.audioNode = document.querySelector('[data-scene-audio]');
    this.assertRequiredDomNode(this.backgroundNode, '[data-background]');
    this.assertRequiredDomNode(this.textOverlayNode, '[data-text-overlay]');

    this.frameworkBridge = new FrameworkMembraneBridge(this.logger);
    this.textOverlay = new TextOverlayRenderer(this.textOverlayNode);

    this.previewRuntime = {
      running: false,
    };
  }

  assertRequiredDomNode(node, selector) {
    if (!node) {
      throw new Error(`Required scene DOM node is missing: ${selector}`);
    }
  }

  resolveFrameworkBootOptions(config) {
    const frameworkConfig = config.render?.frameworkMembrane ?? {};
    return {
      membrane: {
        lineCount: frameworkConfig.lineCount,
        amplitude: frameworkConfig.amplitude,
        pulseDecay: frameworkConfig.pulseDecay,
        lineColor: frameworkConfig.lineColor,
        pulseColor: frameworkConfig.pulseColor,
      },
    };
  }

  initializeFrameworkMembrane(config) {
    this.frameworkBridge.dispose();
    const booted = this.frameworkBridge.bootIfAvailable(this.resolveFrameworkBootOptions(config));
    if (!booted) {
      throw new Error('Framework membrane runtime is unavailable. Ensure framework bundle is loaded.');
    }
  }

  applyLayoutVariables(config) {
    const root = document.documentElement;
    const safeWidth = config.layout?.safeWidth ?? 1000;
    const fontFamily = config.layout?.fontFamily ?? null;

    root.style.setProperty('--scene-safe-width', `${safeWidth}px`);
    if (fontFamily) {
      root.style.setProperty('--scene-font-family', fontFamily);
      return;
    }

    root.style.removeProperty('--scene-font-family');
  }

  async loadPayload(payloadUri) {
    const payload = await fetch(payloadUri).then((response) => response.json());
    this.payload = payload;

    const cfg = payload.config;
    this.textOverlay.setRuntimeContext({
      audioDurationSec: payload.meta?.audioDurationSec ?? null,
    });
    if (cfg.scene?.mode !== 'text_overlay') {
      throw new Error(`Unsupported scene mode in runtime: ${cfg.scene?.mode ?? 'undefined'}`);
    }
    this.applyLayoutVariables(cfg);
    this.initializeFrameworkMembrane(cfg);

    this.backgroundNode.style.backgroundImage = `url('${payload.inputs.backgroundUri}')`;
    this.textOverlay.applyStyle(cfg.textOverlay ?? {});
    this.textOverlay.setTime(cfg.textOverlay ?? {}, 0);

    if (this.audioNode && payload.inputs.audioUri) {
      this.audioNode.src = payload.inputs.audioUri;
      this.audioNode.load();
    }
  }

  async startPreviewPlayback() {
    if (!this.audioNode || !this.payload || this.previewRuntime.running) return;

    this.previewRuntime.running = true;
    this.audioNode.currentTime = 0;

    try {
      await this.audioNode.play();
    } catch (error) {
      this.logger.warn(`[Scene] Preview audio playback is blocked: ${error?.message ?? 'unknown error'}`);
    }

    const tick = () => {
      if (!this.previewRuntime.running) return;

      const timeSec = this.audioNode.currentTime ?? 0;
      this.setTime(timeSec);
      if (this.audioNode.ended) {
        this.previewRuntime.running = false;
        return;
      }
      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  }

  stopPreviewPlayback() {
    if (!this.previewRuntime.running) return;
    this.previewRuntime.running = false;
    this.audioNode?.pause();
  }

  setTime(timeSec) {
    if (!this.payload) return;
    const overlayConfig = this.payload.config.textOverlay ?? {};
    this.textOverlay.setTime(overlayConfig, timeSec);
  }
}
