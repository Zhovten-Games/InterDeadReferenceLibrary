import { assertTimedStanzaConfigValid } from './timed-stanza-validation.js';

const SCENE_MODES = new Set(['text_overlay']);
const TEXT_ALIGNMENTS = new Set(['left', 'center', 'right']);
export const REVEAL_MODE_VALUES = ['instant', 'line_by_line', 'credits_scroll', 'timed_stanzas'];
export const REVEAL_MODES = new Set(REVEAL_MODE_VALUES);
export const STANZA_REVEAL_MODE_VALUES = ['line_by_line', 'credits_scroll'];
export const STANZA_REVEAL_MODES = new Set(STANZA_REVEAL_MODE_VALUES);

export class ConfigModel {
  constructor(data) {
    this.data = data;
  }

  get video() {
    return this.data.video;
  }

  static validateConfig(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Configuration root must be an object.');
    }
    if (!data.inputs || typeof data.inputs.background !== 'string' || typeof data.inputs.audio !== 'string') {
      throw new Error('inputs.background and inputs.audio must be provided.');
    }
    if (!data.video || typeof data.video.width !== 'number' || typeof data.video.height !== 'number' || typeof data.video.fps !== 'number') {
      throw new Error('video.width, video.height and video.fps must be provided.');
    }
    if (!data.render || typeof data.render !== 'object') {
      throw new Error('render section must be provided.');
    }
    if (!data.scene || typeof data.scene !== 'object') {
      throw new Error('scene section must be provided.');
    }
    if (!SCENE_MODES.has(data.scene.mode)) {
      throw new Error(`Unsupported scene mode: ${data.scene.mode}`);
    }
    if (!data.output || typeof data.output.file !== 'string') {
      throw new Error('output.file must be provided.');
    }
    if ('timeline' in data) {
      throw new Error('timeline is not supported in text_overlay mode.');
    }

    const textOverlay = data.textOverlay ?? {};
    if ('reveal' in textOverlay && (typeof textOverlay.reveal !== 'object' || textOverlay.reveal === null || Array.isArray(textOverlay.reveal))) {
      throw new Error('textOverlay.reveal must be an object when provided.');
    }
    const reveal = textOverlay.reveal ?? {};
    const isTimedStanzasMode = reveal.mode === 'timed_stanzas';
    const hasInlineContent = typeof textOverlay.content === 'string';
    const hasContentFile = typeof textOverlay.contentFile === 'string';

    if (hasInlineContent && hasContentFile) {
      throw new Error('textOverlay.content and textOverlay.contentFile cannot be used together.');
    }
    if (hasInlineContent && textOverlay.content.trim().length === 0) {
      throw new Error('textOverlay.content must not be empty.');
    }
    if (hasContentFile && textOverlay.contentFile.trim().length === 0) {
      throw new Error('textOverlay.contentFile must not be empty.');
    }
    if (!isTimedStanzasMode && !hasInlineContent && !hasContentFile) {
      throw new Error('textOverlay.content or textOverlay.contentFile must be provided.');
    }
    if (isTimedStanzasMode && !hasInlineContent && !hasContentFile && !Array.isArray(textOverlay.timedStanzas)) {
      throw new Error(
        'textOverlay.timedStanzas must be provided when reveal.mode is timed_stanzas and no content/contentFile is set.',
      );
    }
    if (typeof textOverlay.start !== 'number') {
      throw new Error('textOverlay.start must be a number.');
    }
    if ('end' in textOverlay && (typeof textOverlay.end !== 'number' || textOverlay.end <= textOverlay.start)) {
      throw new Error('textOverlay.end must be a number greater than textOverlay.start when provided.');
    }
    if ('mode' in reveal && !REVEAL_MODES.has(reveal.mode)) {
      throw new Error('textOverlay.reveal.mode must be one of: instant, line_by_line, credits_scroll, timed_stanzas.');
    }
    if ('lineDelaySec' in reveal && (typeof reveal.lineDelaySec !== 'number' || reveal.lineDelaySec <= 0)) {
      throw new Error('textOverlay.reveal.lineDelaySec must be > 0.');
    }
    if ('minLineDurationSec' in reveal && (typeof reveal.minLineDurationSec !== 'number' || reveal.minLineDurationSec <= 0)) {
      throw new Error('textOverlay.reveal.minLineDurationSec must be > 0.');
    }
    if ('fitToAudioDuration' in reveal && typeof reveal.fitToAudioDuration !== 'boolean') {
      throw new Error('textOverlay.reveal.fitToAudioDuration must be a boolean.');
    }
    if ('stanzaRevealMode' in reveal && !STANZA_REVEAL_MODES.has(reveal.stanzaRevealMode)) {
      throw new Error(`textOverlay.reveal.stanzaRevealMode must be one of: ${STANZA_REVEAL_MODE_VALUES.join(', ')}.`);
    }
    assertTimedStanzaConfigValid(textOverlay, reveal.mode);


    if ('topInsetPx' in textOverlay && (typeof textOverlay.topInsetPx !== 'number' || textOverlay.topInsetPx < 0)) {
      throw new Error('textOverlay.topInsetPx must be >= 0 when provided.');
    }
    if ('bottomInsetPx' in textOverlay && (typeof textOverlay.bottomInsetPx !== 'number' || textOverlay.bottomInsetPx < 0)) {
      throw new Error('textOverlay.bottomInsetPx must be >= 0 when provided.');
    }

    if ('align' in textOverlay && !TEXT_ALIGNMENTS.has(textOverlay.align)) {
      throw new Error(`Unsupported text alignment: ${textOverlay.align}`);
    }

    if ('layout' in data && data.layout && 'fontFamily' in data.layout) {
      if (typeof data.layout.fontFamily !== 'string') {
        throw new Error('layout.fontFamily must be a string when provided.');
      }
      const normalizedFontFamily = data.layout.fontFamily.trim();
      if (normalizedFontFamily.length === 0) {
        throw new Error('layout.fontFamily must not be empty.');
      }
      if (normalizedFontFamily.length > 200) {
        throw new Error('layout.fontFamily must be <= 200 characters.');
      }
      if (/[\u0000-\u001F\u007F]/.test(normalizedFontFamily)) {
        throw new Error('layout.fontFamily contains unsupported control characters.');
      }
    }
  }
}
