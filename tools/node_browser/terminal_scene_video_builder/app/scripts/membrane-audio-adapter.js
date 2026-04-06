class MembraneFocusState {
  constructor(config, fps) {
    this.config = config;
    this.defaultCenterX = this.clamp01(config.defaultCenterX ?? 0.5);
    this.defaultCenterY = this.clamp01(config.defaultCenterY ?? 0.5);
    this.activeCenterX = Number.isFinite(config.triggerX) ? this.clamp01(config.triggerX) : this.defaultCenterX;
    this.activeCenterY = Number.isFinite(config.triggerY) ? this.clamp01(config.triggerY) : this.defaultCenterY;
    this.strength = Number.isFinite(config.triggerX) || Number.isFinite(config.triggerY) ? 1 : 0;
    this.decayPerFrame = 0.94;
    this.fps = Math.max(1, Math.round(fps ?? 30));
  }

  clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  applyFocusEvents(focusEvents = []) {
    for (const event of focusEvents) {
      this.activeCenterX = this.clamp01(event.xRatio ?? this.defaultCenterX);
      this.activeCenterY = this.clamp01(event.yRatio ?? this.defaultCenterY);
      this.strength = Math.max(this.strength, event.strength ?? 1.3);
      const duration = Math.max(0.1, event.duration ?? 1.8);
      this.decayPerFrame = Math.pow(0.05, 1 / Math.max(1, duration * this.fps));
    }
  }

  stepDecay() {
    this.strength *= this.decayPerFrame;
    if (this.strength < 0.01) {
      this.activeCenterX = this.defaultCenterX;
      this.activeCenterY = this.defaultCenterY;
      this.strength = 0;
      this.decayPerFrame = 0.94;
    }
  }

  toRenderState() {
    return {
      centerX: this.defaultCenterX,
      centerY: this.defaultCenterY,
      triggerX: this.activeCenterX,
      triggerY: this.activeCenterY,
      strength: this.strength,
    };
  }
}

class ColorPulseState {
  constructor(fps) {
    this.fps = Math.max(1, Math.round(fps ?? 30));
    this.travel = 0;
    this.intensity = 0;
    this.decayPerFrame = 0.95;
  }

  trigger(strength = 1, durationSec = 1.4) {
    this.travel = 0;
    this.intensity = Math.max(this.intensity, Math.max(0.15, strength));
    const durationFrames = Math.max(1, Math.round(Math.max(0.1, durationSec) * this.fps));
    this.decayPerFrame = Math.pow(0.08, 1 / durationFrames);
  }

  step(waveSpeed) {
    this.travel += Math.max(0.05, waveSpeed) / this.fps;
    if (this.travel > 2.2) {
      this.travel = 2.2;
    }

    this.intensity *= this.decayPerFrame;
    if (this.intensity < 0.01) {
      this.intensity = 0;
      this.travel = 0;
    }
  }

  toRenderState() {
    return {
      travel: this.travel,
      intensity: this.intensity,
    };
  }
}

class RadialWavePulseEngine {
  constructor(fps, config = {}) {
    this.fps = Math.max(1, Math.round(fps ?? 30));
    this.waveSpeed = Math.max(0.15, config.waveSpeed ?? 1);
    this.activePulses = [];
  }

  enqueue(strength = 1, durationSec = 1.4) {
    const normalizedDuration = Math.max(0.25, durationSec);
    const normalizedStrength = Math.max(0.12, strength);
    this.activePulses.push({
      ageSec: 0,
      durationSec: normalizedDuration,
      strength: normalizedStrength,
    });
  }

  step() {
    for (const pulse of this.activePulses) {
      pulse.ageSec += 1 / this.fps;
    }

    this.activePulses = this.activePulses.filter((pulse) => pulse.ageSec <= pulse.durationSec);
  }

  snapshot() {
    const fronts = this.activePulses.map((pulse) => {
      const progress = Math.max(0, Math.min(1, pulse.ageSec / pulse.durationSec));
      const easedProgress = 1 - Math.pow(1 - progress, 1.6);
      const fade = Math.max(0, 1 - progress);
      return {
        progress: easedProgress,
        strength: pulse.strength,
        fade,
        radiusGain: 0.16 + easedProgress * (1.9 + this.waveSpeed * 0.3),
      };
    });

    const dominantFront = fronts.reduce(
      (acc, front) => (front.strength * front.fade > acc.strength * acc.fade ? front : acc),
      { progress: 0, strength: 0, fade: 0, radiusGain: 0.16 },
    );

    return {
      fronts,
      dominantFront,
      intensity: fronts.reduce((acc, front) => acc + front.strength * front.fade, 0),
    };
  }
}

class AudioWaveEmitter {
  constructor(fps, config = {}) {
    this.fps = Math.max(1, Math.round(fps ?? 30));
    this.config = {
      triggerThreshold: config.triggerThreshold ?? 0.19,
      cooldownFrames: Math.max(1, Math.round((config.cooldownSec ?? 0.16) * this.fps)),
      smoothing: Math.min(0.95, Math.max(0.05, config.smoothing ?? 0.28)),
      baseStrength: config.baseStrength ?? 0.6,
      gainStrength: config.gainStrength ?? 0.82,
      durationSec: config.durationSec ?? 1.35,
    };
    this.cooldown = 0;
    this.envelope = 0;
  }

  step(feature) {
    const energy = feature?.energy ?? 0;
    const onset = feature?.onset ?? 0;
    const beat = feature?.beat ?? 0;
    const rawGain = energy * 0.65 + onset * 1.2 + beat * 0.95;
    this.envelope += (rawGain - this.envelope) * this.config.smoothing;

    if (this.cooldown > 0) {
      this.cooldown -= 1;
      return null;
    }

    if (this.envelope < this.config.triggerThreshold) {
      return null;
    }

    const strength = this.config.baseStrength + this.envelope * this.config.gainStrength;
    this.cooldown = this.config.cooldownFrames;
    return {
      strength: Math.max(0.2, strength),
      duration: this.config.durationSec,
    };
  }
}

class MembraneShapeRenderer {
  constructor(canvas, context, config) {
    this.canvas = canvas;
    this.context = context;
    this.config = config;
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}

class CanvasRuntimeGeometry {
  constructor(canvas, context, logger = console) {
    this.canvas = canvas;
    this.context = context;
    this.logger = logger;
    this.hasLoggedInitialSize = false;
  }

  resolveBitmapSize() {
    const clientWidth = Math.round(this.canvas?.clientWidth ?? 0);
    const clientHeight = Math.round(this.canvas?.clientHeight ?? 0);
    if (clientWidth > 0 && clientHeight > 0) {
      return { width: clientWidth, height: clientHeight, source: 'client' };
    }

    const rectWidth = Math.round(this.canvas?.getBoundingClientRect?.().width ?? 0);
    const rectHeight = Math.round(this.canvas?.getBoundingClientRect?.().height ?? 0);
    if (rectWidth > 0 && rectHeight > 0) {
      return { width: rectWidth, height: rectHeight, source: 'rect' };
    }

    const viewportWidth = Math.round(window?.innerWidth ?? 0);
    const viewportHeight = Math.round(window?.innerHeight ?? 0);
    if (viewportWidth > 0 && viewportHeight > 0) {
      return { width: viewportWidth, height: viewportHeight, source: 'viewport' };
    }

    return { width: 0, height: 0, source: 'invalid' };
  }

  resizeToResolvedSize() {
    const size = this.resolveBitmapSize();
    this.canvas.width = size.width;
    this.canvas.height = size.height;
    return size;
  }

  ensureValidSize(reason = 'runtime') {
    if (this.canvas.width > 0 && this.canvas.height > 0) {
      if (!this.hasLoggedInitialSize) {
        this.logger.info(
          `[Membrane] Canvas size resolved: ${this.canvas.width}x${this.canvas.height} (client ${Math.round(
            this.canvas?.clientWidth ?? 0,
          )}x${Math.round(this.canvas?.clientHeight ?? 0)}).`,
        );
        this.hasLoggedInitialSize = true;
      }
      return;
    }

    const size = this.resizeToResolvedSize();
    if (this.canvas.width > 0 && this.canvas.height > 0) {
      this.logger.info(`[Membrane] Canvas size recovered via ${size.source}: ${this.canvas.width}x${this.canvas.height}.`);
      this.hasLoggedInitialSize = true;
      return;
    }

    throw new Error(
      `[Membrane] Canvas has invalid size for ${reason}: ` +
        `client=${Math.round(this.canvas?.clientWidth ?? 0)}x${Math.round(this.canvas?.clientHeight ?? 0)}, ` +
        `bitmap=${Math.round(this.canvas?.width ?? 0)}x${Math.round(this.canvas?.height ?? 0)}.`,
    );
  }
}

class LegacyLinesMembraneRenderer extends MembraneShapeRenderer {
  draw({ pulse, feature, focus }) {
    const ctx = this.context;
    const { width, height } = this.canvas;
    const lines = Math.max(0, this.config.lineCount ?? 18);
    const amplitude = this.config.amplitude ?? 5;

    ctx.save();
    ctx.globalAlpha = this.clamp((this.config.baseOpacity ?? 0.18) + pulse * 0.06, 0.1, 0.92);
    ctx.strokeStyle = this.config.lineColor;
    ctx.lineWidth = Math.max(1, this.config.lineWidth ?? 1);

    for (let i = 0; i < lines; i += 1) {
      const y = (height / (lines + 1)) * (i + 1);
      const wobble = Math.sin((i + 1) * 0.4 + pulse * 0.2) * amplitude * (0.25 + (feature?.energy ?? 0));
      ctx.beginPath();
      for (let x = 0; x <= width; x += 12) {
        const nx = x / width;
        const distanceToFocus = Math.hypot(nx - focus.triggerX, y / height - focus.triggerY);
        const focusGain = this.clamp(1 - distanceToFocus * 1.4, 0, 1);
        const bias = Math.sin(x * 0.022 + i * 0.8 + pulse * 0.4) * wobble;
        const yOffset = bias * (0.5 + focusGain + focus.strength * 0.65);
        if (x === 0) {
          ctx.moveTo(x, y + yOffset);
        } else {
          ctx.lineTo(x, y + yOffset);
        }
      }
      ctx.stroke();
    }

    const glowX = width * focus.triggerX;
    const glowY = height * focus.triggerY;
    const radial = ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, 260);
    radial.addColorStop(0, this.config.pulseColor);
    radial.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

class RadialColorWaveMembraneRenderer extends MembraneShapeRenderer {
  resolveAudioInfluence(feature) {
    const energy = feature?.energy ?? 0;
    const onset = feature?.onset ?? 0;
    const beat = feature?.beat ?? 0;
    const energyGain = this.config.audioReactive?.energyGain ?? 1.8;
    const onsetGain = this.config.audioReactive?.onsetGain ?? 2.6;
    const beatGain = this.config.audioReactive?.beatGain ?? 2.2;

    return {
      energy,
      onset,
      beat,
      gain: energy * energyGain + onset * onsetGain + beat * beatGain,
    };
  }

  resolveWaveFront({ baseRadius, influence, pulse, colorPulseState }) {
    const waveWidth = this.clamp(this.config.waveWidth ?? 0.12, 0.05, 0.38);
    const pulseFront = colorPulseState.waveFronts?.dominantFront ?? null;
    const normalizedPulseTravel = pulseFront ? pulseFront.radiusGain : this.clamp(colorPulseState.travel, 0, 1.75);
    const audioTravel = this.clamp((pulse * 0.0014 + influence.onset * 0.5 + influence.beat * 0.3), 0, 1.2);
    const travel = this.clamp(normalizedPulseTravel + audioTravel * 0.3, 0, 2.15);
    const waveRadius = baseRadius * travel;

    return {
      radius: waveRadius,
      widthPx: baseRadius * waveWidth,
      opacity: this.clamp(0.24 + influence.gain * 0.22 + colorPulseState.intensity * 0.65, 0.28, 1),
    };
  }

  drawCoreGlow({ centerX, centerY, baseRadius, influence, pulse }) {
    const ctx = this.context;
    const coreRadius = Math.max(10, baseRadius * (0.48 + influence.energy * 0.5 + Math.sin(pulse * 0.01) * 0.04));
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 1.8);
    coreGradient.addColorStop(0, this.config.coreGlowColor);
    coreGradient.addColorStop(0.6, 'rgba(255, 24, 24, 0.08)');
    coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawTriggerGlow({ triggerX, triggerY, focus, influence, baseRadius }) {
    if (focus.strength <= 0.01) return;

    const ctx = this.context;
    const triggerRadius = Math.max(18, baseRadius * (0.45 + focus.strength * 0.65 + influence.onset * 0.28));
    const glow = ctx.createRadialGradient(triggerX, triggerY, 0, triggerX, triggerY, triggerRadius * 2.1);
    glow.addColorStop(0, this.config.pulseColor);
    glow.addColorStop(0.22, 'rgba(255, 50, 50, 0.45)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.globalAlpha = this.clamp(0.35 + focus.strength * 0.3, 0.2, 0.9);
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalAlpha = 1;
  }

  drawRadialColorWave({
    centerX,
    centerY,
    triggerX,
    triggerY,
    focus,
    pulse,
    influence,
    colorPulseState,
    dynamicPhase,
  }) {
    const ctx = this.context;
    const { width, height } = this.canvas;
    const baseRadius = Math.min(width, height) * (this.config.radius ?? 0.22);
    const ringCount = Math.max(2, Math.floor(this.config.ringCount ?? 3));
    const pulseFronts = colorPulseState.waveFronts?.fronts ?? [];

    this.drawCoreGlow({ centerX, centerY, baseRadius, influence, pulse });

    const waveFront = this.resolveWaveFront({ baseRadius, influence, pulse, colorPulseState });
    const edgeGlow = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.6, centerX, centerY, baseRadius * 2.7);
    edgeGlow.addColorStop(0, 'rgba(0,0,0,0)');
    edgeGlow.addColorStop(0.8, this.config.edgeGlowColor);
    edgeGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = edgeGlow;
    ctx.globalAlpha = this.clamp(0.35 + influence.energy * 0.2 + waveFront.opacity * 0.15, 0.25, 0.86);
    ctx.fillRect(0, 0, width, height);

    for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
      const ringFactor = 1 + ringIndex * 0.26;
      const breathing = Math.sin(dynamicPhase * 0.08 + ringIndex * 0.9) * (this.config.amplitude ?? 10) * 0.16;
      const ringRadius = baseRadius * ringFactor + breathing + influence.gain * (8 + ringIndex * 2.6);

      const distanceToWaveFront = Math.abs(ringRadius - waveFront.radius);
      const waveBand = this.clamp(1 - distanceToWaveFront / Math.max(1, waveFront.widthPx), 0, 1);
      const waveBandEmphasis = Math.pow(waveBand, 0.72);

      const ringTriggerDist = Math.hypot(
        centerX + ringRadius * Math.cos(dynamicPhase * 0.05) - triggerX,
        centerY + ringRadius * Math.sin(dynamicPhase * 0.05) - triggerY,
      );
      const ringTriggerGain = this.clamp(1 - ringTriggerDist / (baseRadius * 3.2), 0, 1) * focus.strength;

      ctx.globalAlpha = this.clamp(
        (this.config.baseOpacity ?? 0.72) * (0.52 + ringIndex * 0.14) + influence.energy * 0.2 + waveBandEmphasis * 0.42,
        0.2,
        1,
      );
      ctx.strokeStyle = waveBandEmphasis > 0.01 ? this.config.waveFrontColor : this.config.lineColor;
      ctx.lineWidth = Math.max(1.8, (this.config.lineWidth ?? 4) + waveBandEmphasis * 2.8 + ringTriggerGain * 2.2);

      ctx.beginPath();
      const steps = 180;
      for (let i = 0; i <= steps; i += 1) {
        const t = (i / steps) * Math.PI * 2;
        const dx = Math.cos(t);
        const dy = Math.sin(t);

        const pointX = centerX + dx * ringRadius;
        const pointY = centerY + dy * ringRadius;
        const triggerDist = Math.hypot(pointX - triggerX, pointY - triggerY);
        const triggerProximity = this.clamp(1 - triggerDist / (baseRadius * 2.4), 0, 1);
        const microBreathe = Math.sin(t * 3 + dynamicPhase * 0.05 + ringIndex * 0.4) * (this.config.amplitude ?? 10) * 0.04;
        const triggerPush = triggerProximity * focus.strength * (this.config.amplitude ?? 10) * 0.18;
        const x = centerX + dx * (ringRadius + microBreathe + triggerPush);
        const y = centerY + dy * (ringRadius + microBreathe + triggerPush);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    for (const pulseFront of pulseFronts) {
      const pulseRadius = baseRadius * pulseFront.radiusGain;
      const pulseWidth = Math.max(8, baseRadius * (0.06 + pulseFront.strength * 0.07));
      ctx.globalAlpha = this.clamp(0.22 + pulseFront.strength * pulseFront.fade * 0.7, 0.16, 1);
      ctx.strokeStyle = this.config.waveFrontColor;
      ctx.lineWidth = pulseWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    this.drawTriggerGlow({ triggerX, triggerY, focus, influence, baseRadius });
    ctx.globalAlpha = 1;
  }

  draw(payload) {
    const ctx = this.context;
    ctx.save();

    const { width, height } = this.canvas;
    const focus = payload.focus;
    const centerX = width * focus.centerX;
    const centerY = height * focus.centerY;
    const triggerX = width * focus.triggerX;
    const triggerY = height * focus.triggerY;

    const influence = this.resolveAudioInfluence(payload.feature);
    this.drawRadialColorWave({
      centerX,
      centerY,
      triggerX,
      triggerY,
      focus,
      pulse: payload.pulse,
      influence,
      colorPulseState: payload.colorPulseState,
      dynamicPhase: payload.dynamicPhase,
    });

    ctx.restore();
  }
}

export class MembraneAudioAdapter {
  constructor(canvas, config = {}, runtime = {}) {
    this.canvas = canvas;
    this.context = canvas?.getContext?.('2d') ?? null;
    this.runtime = runtime;
    this.logger = runtime.logger ?? console;
    this.config = this.normalizeConfig(config);
    this.pulse = 0;
    this.dynamicPhase = 0;
    this.focusState = new MembraneFocusState(this.config, runtime.fps);
    this.colorPulseState = new ColorPulseState(runtime.fps);
    this.wavePulseEngine = new RadialWavePulseEngine(runtime.fps, config);
    this.audioWaveEmitter = new AudioWaveEmitter(runtime.fps, config.audioReactive?.waveEmitter);
    this.canvasGeometry = this.context ? new CanvasRuntimeGeometry(this.canvas, this.context, this.logger) : null;
    this.shapeRenderer = this.context ? this.createShapeRenderer(this.config.shape) : null;
    if (this.context) {
      this.resize();
      this.canvasGeometry?.ensureValidSize('initialization');
    }
  }

  static isSupported(canvas) {
    return Boolean(canvas?.getContext?.('2d'));
  }

  normalizeConfig(config) {
    const normalized = {
      enabled: config.enabled ?? true,
      mode: config.mode ?? 'audio_reactive',
      shape: config.shape ?? 'radial_color_wave',
      defaultCenterX: config.defaultCenterX ?? 0.5,
      defaultCenterY: config.defaultCenterY ?? 0.5,
      triggerX: config.triggerX ?? null,
      triggerY: config.triggerY ?? null,
      radius: config.radius ?? 0.22,
      ringCount: config.ringCount ?? 3,
      lineCount: config.lineCount ?? 18,
      lineWidth: config.lineWidth ?? 4,
      amplitude: config.amplitude ?? 10,
      pulseDecay: config.pulseDecay ?? 0.94,
      baseOpacity: config.baseOpacity ?? 0.72,
      lineColor: config.lineColor ?? 'rgba(255, 48, 48, 0.82)',
      pulseColor: config.pulseColor ?? 'rgba(255, 0, 0, 0.98)',
      coreGlowColor: config.coreGlowColor ?? 'rgba(255, 32, 32, 0.40)',
      waveFrontColor: config.waveFrontColor ?? 'rgba(255, 120, 120, 0.95)',
      edgeGlowColor: config.edgeGlowColor ?? 'rgba(255, 12, 12, 0.22)',
      waveSpeed: config.waveSpeed ?? 1,
      waveWidth: config.waveWidth ?? 0.12,
      audioReactive: {
        energyGain: config.audioReactive?.energyGain ?? 1.8,
        onsetGain: config.audioReactive?.onsetGain ?? 2.6,
        beatGain: config.audioReactive?.beatGain ?? 2.2,
        frequencyBand: config.audioReactive?.frequencyBand ?? 'mid_high',
      },
    };

    if (!['legacy_lines', 'radial_color_wave', 'radial_ring'].includes(normalized.shape)) {
      normalized.shape = 'radial_color_wave';
    }
    if (normalized.shape === 'radial_ring') {
      normalized.shape = 'radial_color_wave';
    }

    return normalized;
  }

  createShapeRenderer(shape) {
    if (!this.context) return null;
    if (shape === 'legacy_lines') {
      return new LegacyLinesMembraneRenderer(this.canvas, this.context, this.config);
    }
    return new RadialColorWaveMembraneRenderer(this.canvas, this.context, this.config);
  }

  resize() {
    if (!this.canvasGeometry) return;
    this.canvasGeometry.resizeToResolvedSize();
  }

  resolveAudioInfluence(feature) {
    const energy = feature?.energy ?? 0;
    const onset = feature?.onset ?? 0;
    const beat = feature?.beat ?? 0;

    this.pulse *= this.config.pulseDecay;
    this.pulse += energy * this.config.audioReactive.energyGain;
    this.pulse += onset * this.config.audioReactive.onsetGain;
    this.pulse += beat * this.config.audioReactive.beatGain;
    this.dynamicPhase += 1;
    this.colorPulseState.step(this.config.waveSpeed ?? 1);
    this.wavePulseEngine.step();

    const audioWavePulse = this.audioWaveEmitter.step(feature);
    if (audioWavePulse) {
      this.colorPulseState.trigger(audioWavePulse.strength, audioWavePulse.duration);
      this.wavePulseEngine.enqueue(audioWavePulse.strength, audioWavePulse.duration);
    }

    if (onset > 0.32 || beat > 0.45) {
      const reactiveStrength = 0.55 + onset * 0.7 + beat * 0.55;
      this.colorPulseState.trigger(reactiveStrength, 1.2);
      this.wavePulseEngine.enqueue(reactiveStrength, 1.2);
    }
  }

  resolveFocus(focusEvents = [], explicitFocusState = null) {
    this.focusState.applyFocusEvents(focusEvents);

    if (explicitFocusState && Number.isFinite(explicitFocusState.xRatio) && Number.isFinite(explicitFocusState.yRatio)) {
      this.focusState.applyFocusEvents([
        {
          xRatio: explicitFocusState.xRatio,
          yRatio: explicitFocusState.yRatio,
          strength: explicitFocusState.strength ?? 1,
          duration: explicitFocusState.duration ?? 1.2,
        },
      ]);
    }

    const state = this.focusState.toRenderState();
    this.focusState.stepDecay();
    return state;
  }

  resolveColorPulses(legacyPulseEvents = [], colorPulseEvents = []) {
    const allEvents = [...legacyPulseEvents, ...colorPulseEvents];
    for (const event of allEvents) {
      this.colorPulseState.trigger(event.strength ?? 1, event.duration ?? 1.4);
      this.wavePulseEngine.enqueue(event.strength ?? 1, event.duration ?? 1.4);
    }
    return {
      ...this.colorPulseState.toRenderState(),
      waveFronts: this.wavePulseEngine.snapshot(),
    };
  }

  applyFrame(feature, runtimeEvents = {}, focusState = null) {
    if (!this.context || !this.shapeRenderer || !this.canvas) {
      return;
    }
    this.canvasGeometry?.ensureValidSize('frame render');

    if (!this.config.enabled) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    this.resolveAudioInfluence(feature);

    const focus = this.resolveFocus(runtimeEvents.focusEvents ?? runtimeEvents.timelinePulses ?? [], focusState);
    const colorPulseState = this.resolveColorPulses(
      runtimeEvents.legacyPulseEvents ?? runtimeEvents.timelinePulses ?? [],
      runtimeEvents.colorPulseEvents ?? [],
    );

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.shapeRenderer.draw({
      pulse: this.pulse,
      feature,
      focus,
      dynamicPhase: this.dynamicPhase,
      colorPulseState,
    });
  }
}
