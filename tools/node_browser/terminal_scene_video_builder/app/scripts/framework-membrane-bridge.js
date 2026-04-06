export class FrameworkMembraneBridge {
  constructor(logger = console) {
    this.logger = logger;
    this.runtime = null;
  }

  bootIfAvailable(options = {}) {
    const framework = globalThis.InterdeadFramework;
    if (!framework?.FrameworkRuntime || !framework?.JsObjectConfigSourceAdapter) {
      this.logger.info('[Scene] Interdead framework browser bundle is not available.');
      return false;
    }

    const membraneOptions = options.membrane ?? {};
    const configSource = new framework.JsObjectConfigSourceAdapter({
      enabledFeatures: { membrane: true },
      featureOptions: {
        membrane: {
          canvasClassName: 'scene__membrane',
          activeBodyClass: 'proto-membrane-active',
          reducedMotionMode: 'minimal',
          mode: 'scene_timeline',
          ...(Number.isFinite(membraneOptions.lineCount) ? { lineCount: membraneOptions.lineCount } : {}),
          ...(typeof membraneOptions.lineColor === 'string' ? { lineColor: membraneOptions.lineColor } : {}),
          ...(typeof membraneOptions.pulseColor === 'string' ? { pulseColor: membraneOptions.pulseColor } : {}),
          ...(Number.isFinite(membraneOptions.pulseDecay) ? { pulseDecay: membraneOptions.pulseDecay } : {}),
          ...(Number.isFinite(membraneOptions.amplitude) ? { amplitude: membraneOptions.amplitude } : {}),
        },
      },
    });

    this.runtime = new framework.FrameworkRuntime(configSource, {
      windowRef: window,
      documentRef: document,
    });
    this.runtime.boot();
    this.logger.info('[Scene] Interdead framework membrane runtime booted.');
    return true;
  }

  dispose() {
    this.runtime?.destroy?.();
    this.runtime = null;
  }
}
