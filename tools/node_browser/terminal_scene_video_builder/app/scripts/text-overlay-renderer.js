class OverlayTimingWindowResolver {
  static resolve(config = {}, runtimeContext = {}) {
    const start = Number.isFinite(config.start) ? config.start : 0;
    const audioDuration = runtimeContext.audioDurationSec;
    const configuredEnd = Number.isFinite(config.end)
      ? config.end
      : (Number.isFinite(audioDuration) ? audioDuration : start + 3);

    const shouldFitToAudio = config.reveal?.fitToAudioDuration === true;
    const audioBoundedEnd = Number.isFinite(audioDuration) && shouldFitToAudio
      ? Math.min(configuredEnd, audioDuration)
      : configuredEnd;

    const end = Math.max(start + 0.001, audioBoundedEnd);
    return { start, end };
  }
}

class BaseRevealStrategy {
  resolveState({ text }) {
    return {
      text,
      translateYPx: 0,
    };
  }
}

class InstantRevealStrategy extends BaseRevealStrategy {
  resolveState({ text, timeSec, start, end }) {
    if (timeSec < start || timeSec > end) {
      return { text: '', translateYPx: 0 };
    }

    return { text, translateYPx: 0 };
  }
}

class LineByLineRevealStrategy extends BaseRevealStrategy {
  resolveState({ text, timeSec, start, end, config }) {
    if (timeSec < start || timeSec > end) {
      return { text: '', translateYPx: 0 };
    }

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return { text: '', translateYPx: 0 };
    }

    const revealConfig = config.reveal ?? {};
    const totalDuration = Math.max(0.001, end - start);
    const defaultLineDelaySec = totalDuration / lines.length;
    const minLineDurationSec = Number.isFinite(revealConfig.minLineDurationSec)
      ? Math.max(0.01, revealConfig.minLineDurationSec)
      : 0.01;
    const lineDelaySec = Number.isFinite(revealConfig.lineDelaySec)
      ? Math.max(minLineDurationSec, revealConfig.lineDelaySec)
      : Math.max(minLineDurationSec, defaultLineDelaySec);

    const passed = timeSec - start;
    const visibleLineCount = Math.min(lines.length, Math.max(1, Math.floor(passed / lineDelaySec) + 1));

    return {
      text: lines.slice(0, visibleLineCount).join('\n'),
      translateYPx: 0,
    };
  }
}

class CreditsScrollRevealStrategy extends BaseRevealStrategy {
  resolveState({ text, timeSec, start, end, layoutContext }) {
    if (timeSec < start || timeSec > end) {
      return { text: '', translateYPx: 0 };
    }

    const totalDuration = Math.max(0.001, end - start);
    const progress = Math.min(1, Math.max(0, (timeSec - start) / totalDuration));

    const viewportHeight = Math.max(1, layoutContext.viewportHeightPx);
    const contentHeight = Math.max(1, layoutContext.contentHeightPx);
    const startOffsetPx = viewportHeight;
    const endOffsetPx = -contentHeight;
    const travelPx = startOffsetPx - endOffsetPx;

    return {
      text,
      translateYPx: startOffsetPx - (travelPx * progress),
    };
  }
}

class TimedStanzaTimelineResolver {
  static resolveWindow(config = {}) {
    const stanzas = Array.isArray(config.timedStanzas) ? config.timedStanzas : [];
    let minStart = Number.POSITIVE_INFINITY;
    let maxEnd = Number.NEGATIVE_INFINITY;

    for (const stanza of stanzas) {
      if (!Number.isFinite(stanza?.start) || !Number.isFinite(stanza?.end)) {
        continue;
      }

      minStart = Math.min(minStart, stanza.start);
      maxEnd = Math.max(maxEnd, stanza.end);
    }

    if (!Number.isFinite(minStart) || !Number.isFinite(maxEnd)) {
      return null;
    }

    return { start: minStart, end: maxEnd };
  }

  static resolve(config = {}, timeSec) {
    const stanzas = Array.isArray(config.timedStanzas) ? config.timedStanzas : [];

    for (let index = 0; index < stanzas.length; index += 1) {
      const stanza = stanzas[index];
      const start = Number.isFinite(stanza?.start) ? stanza.start : null;
      const end = Number.isFinite(stanza?.end) ? stanza.end : null;
      if (start === null || end === null || end <= start) {
        continue;
      }

      const isLastStanza = index === stanzas.length - 1;
      const isActive = isLastStanza ? (timeSec >= start && timeSec <= end) : (timeSec >= start && timeSec < end);
      if (isActive) {
        return {
          text: typeof stanza.text === 'string' ? stanza.text : '',
          start,
          end,
          lineDelaySec: Number.isFinite(stanza.lineDelaySec) ? stanza.lineDelaySec : null,
        };
      }
    }

    return null;
  }
}

class TimedStanzasRevealStrategy extends BaseRevealStrategy {
  resolveState({ timeSec, config, layoutContext }) {
    const activeStanza = TimedStanzaTimelineResolver.resolve(config, timeSec);
    if (!activeStanza || activeStanza.text.trim().length === 0) {
      return { text: '', translateYPx: 0 };
    }

    const stanzaRevealMode = config.reveal?.stanzaRevealMode ?? 'line_by_line';
    const inlineConfig = {
      ...config,
      content: activeStanza.text,
      start: activeStanza.start,
      end: activeStanza.end,
      reveal: {
        ...(config.reveal ?? {}),
        mode: stanzaRevealMode,
        ...(Number.isFinite(activeStanza.lineDelaySec) ? { lineDelaySec: activeStanza.lineDelaySec } : {}),
      },
    };

    if (stanzaRevealMode === 'credits_scroll') {
      const creditsScrollStrategy = new CreditsScrollRevealStrategy();
      return creditsScrollStrategy.resolveState({
        text: activeStanza.text,
        timeSec,
        start: activeStanza.start,
        end: activeStanza.end,
        config: inlineConfig,
        layoutContext,
      });
    }

    if (stanzaRevealMode !== 'line_by_line') {
      throw new Error(`Unsupported stanza reveal mode: ${stanzaRevealMode}`);
    }

    const lineByLineStrategy = new LineByLineRevealStrategy();
    return lineByLineStrategy.resolveState({
      text: activeStanza.text,
      timeSec,
      start: activeStanza.start,
      end: activeStanza.end,
      config: inlineConfig,
    });
  }
}

class TextRevealStrategyFactory {
  static create(config = {}) {
    const mode = config.reveal?.mode ?? 'instant';

    if (mode === 'line_by_line') {
      return new LineByLineRevealStrategy();
    }

    if (mode === 'credits_scroll') {
      return new CreditsScrollRevealStrategy();
    }

    if (mode === 'timed_stanzas') {
      return new TimedStanzasRevealStrategy();
    }

    return new InstantRevealStrategy();
  }
}

class TextOverlayContainerStyler {
  apply(node, config = {}) {
    const x = config.x ?? 0.5;
    const y = config.y ?? 0.5;
    const anchorX = config.anchorX ?? 0.5;
    const anchorY = config.anchorY ?? 0.5;
    const align = config.align ?? 'center';
    const maxWidth = config.maxWidth ?? 900;
    const fontSize = config.fontSize ?? 72;
    const topInsetPx = Number.isFinite(config.topInsetPx) ? Math.max(0, config.topInsetPx) : 0;
    const bottomInsetPx = Number.isFinite(config.bottomInsetPx) ? Math.max(0, config.bottomInsetPx) : 0;

    node.style.left = `${x * 100}%`;
    node.style.top = `${y * 100}%`;
    node.style.transform = `translate(${-anchorX * 100}%, ${-anchorY * 100}%)`;
    node.style.textAlign = align;
    node.style.maxWidth = `${maxWidth}px`;
    node.style.fontSize = `${fontSize}px`;
    node.style.whiteSpace = 'pre-line';

    const isCreditsScrollMode = config.reveal?.mode === 'credits_scroll';
    const isTimedStanzaCreditsScrollMode = config.reveal?.mode === 'timed_stanzas'
      && config.reveal?.stanzaRevealMode === 'credits_scroll';

    if (isCreditsScrollMode || isTimedStanzaCreditsScrollMode) {
      node.style.top = `${topInsetPx}px`;
      node.style.bottom = `${bottomInsetPx}px`;
      node.style.height = `calc(100% - ${topInsetPx + bottomInsetPx}px)`;
      node.style.transform = `translateX(${-anchorX * 100}%)`;
      node.style.overflow = 'hidden';
      node.style.willChange = 'opacity';
      return;
    }

    node.style.removeProperty('bottom');
    node.style.removeProperty('height');
    node.style.removeProperty('overflow');
    node.style.willChange = 'opacity, transform';
  }
}

export class TextOverlayRenderer {
  constructor(node) {
    if (!node) {
      throw new Error('TextOverlayRenderer requires a target DOM node.');
    }
    this.node = node;
    this.contentNode = this.ensureContentNode(node);
    this.containerStyler = new TextOverlayContainerStyler();
    this.runtimeContext = {
      audioDurationSec: null,
    };
  }

  ensureContentNode(node) {
    if (!node.ownerDocument || typeof node.ownerDocument.createElement !== 'function' || typeof node.appendChild !== 'function') {
      return node;
    }

    const existingNode = node.querySelector?.('[data-text-overlay-content]');
    if (existingNode) {
      return existingNode;
    }

    const contentNode = node.ownerDocument.createElement('div');
    contentNode.dataset.textOverlayContent = 'true';
    contentNode.style.whiteSpace = 'pre-line';
    contentNode.style.willChange = 'transform';
    node.textContent = '';
    node.appendChild(contentNode);
    return contentNode;
  }

  setRuntimeContext(context = {}) {
    this.runtimeContext = {
      ...this.runtimeContext,
      ...context,
    };
  }

  applyStyle(config = {}) {
    this.containerStyler.apply(this.node, config);

    if (this.contentNode !== this.node) {
      this.contentNode.style.textAlign = this.node.style.textAlign;
    }
  }

  resolveLayoutContext() {
    const viewportHeightPx = this.node.clientHeight ?? 0;
    const contentHeightPx = this.contentNode.scrollHeight ?? 0;

    return {
      viewportHeightPx,
      contentHeightPx,
    };
  }

  setTime(config = {}, timeSec) {
    const text = config.content ?? '';
    const hasTimedStanzas = config.reveal?.mode === 'timed_stanzas';
    const timedWindow = hasTimedStanzas ? TimedStanzaTimelineResolver.resolveWindow(config) : null;

    const fallbackWindow = OverlayTimingWindowResolver.resolve(config, this.runtimeContext);
    const start = timedWindow?.start ?? fallbackWindow.start;
    const end = timedWindow?.end ?? fallbackWindow.end;
    const fadeInSec = Number.isFinite(config.fadeInSec) ? Math.max(0, config.fadeInSec) : 1.2;
    const fadeOutSec = Number.isFinite(config.fadeOutSec) ? Math.max(0, config.fadeOutSec) : 0.6;

    const revealStrategy = TextRevealStrategyFactory.create(config);
    const revealState = revealStrategy.resolveState({
      text,
      timeSec,
      start,
      end,
      config,
      layoutContext: this.resolveLayoutContext(),
    });

    this.contentNode.textContent = revealState.text;
    this.contentNode.style.transform = `translateY(${revealState.translateYPx}px)`;

    if (timeSec < start || timeSec > end || !revealState.text) {
      this.node.style.opacity = '0';
      return;
    }

    const fadeInProgress = fadeInSec > 0 ? Math.min(1, Math.max(0, (timeSec - start) / fadeInSec)) : 1;
    const fadeOutProgress = fadeOutSec > 0 ? Math.min(1, Math.max(0, (end - timeSec) / fadeOutSec)) : 1;
    const opacity = Math.min(fadeInProgress, fadeOutProgress);
    this.node.style.opacity = String(opacity);
  }
}
