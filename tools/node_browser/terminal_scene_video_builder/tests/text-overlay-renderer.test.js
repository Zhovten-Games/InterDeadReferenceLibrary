import test from 'node:test';
import assert from 'node:assert/strict';
import { TextOverlayRenderer } from '../app/scripts/text-overlay-renderer.js';

class FakeOverlayNode {
  constructor() {
    this.textContent = '';
    this.style = {};
    this.clientHeight = 300;
    this.scrollHeight = 600;
  }
}

const createRenderer = () => new TextOverlayRenderer(new FakeOverlayNode());

test('TextOverlayRenderer reveals text line-by-line with explicit line delay', () => {
  const renderer = createRenderer();
  renderer.setRuntimeContext({ audioDurationSec: 30 });

  const config = {
    content: 'first line\nsecond line\nthird line',
    start: 1,
    end: 10,
    reveal: {
      mode: 'line_by_line',
      lineDelaySec: 2,
    },
  };

  renderer.setTime(config, 1.1);
  assert.equal(renderer.node.textContent, 'first line');

  renderer.setTime(config, 3.2);
  assert.equal(renderer.node.textContent, 'first line\nsecond line');

  renderer.setTime(config, 6.1);
  assert.equal(renderer.node.textContent, 'first line\nsecond line\nthird line');
});

test('TextOverlayRenderer limits timing window to audio duration only when fitToAudioDuration=true', () => {
  const renderer = createRenderer();
  renderer.setRuntimeContext({ audioDurationSec: 5 });

  const baseConfig = {
    content: 'line one\nline two',
    start: 0,
    end: 12,
    reveal: { mode: 'line_by_line', lineDelaySec: 1 },
  };

  renderer.setTime(baseConfig, 6);
  assert.equal(renderer.node.textContent, 'line one\nline two');

  const fitConfig = {
    ...baseConfig,
    reveal: {
      ...baseConfig.reveal,
      fitToAudioDuration: true,
    },
  };

  renderer.setTime(fitConfig, 6);
  assert.equal(renderer.node.textContent, '');
});


test('TextOverlayRenderer scrolls text continuously in credits_scroll mode', () => {
  const renderer = createRenderer();
  renderer.setRuntimeContext({ audioDurationSec: 12 });

  const config = {
    content: 'line one\nline two\nline three',
    start: 0,
    end: 10,
    reveal: {
      mode: 'credits_scroll',
    },
  };

  renderer.applyStyle(config);
  renderer.node.clientHeight = 300;
  renderer.contentNode.scrollHeight = 450;

  renderer.setTime(config, 0);
  assert.equal(renderer.contentNode.textContent, 'line one\nline two\nline three');
  assert.equal(renderer.contentNode.style.transform, 'translateY(300px)');

  renderer.setTime(config, 5);
  assert.equal(renderer.contentNode.style.transform, 'translateY(-75px)');

  renderer.setTime(config, 10);
  assert.equal(renderer.contentNode.style.transform, 'translateY(-450px)');
});

test('TextOverlayRenderer switches between timed stanzas and hides timing markers', () => {
  const renderer = createRenderer();
  renderer.setRuntimeContext({ audioDurationSec: 200 });

  const config = {
    content: 'fallback content',
    start: 0,
    end: 180,
    reveal: {
      mode: 'timed_stanzas',
      minLineDurationSec: 0.1,
    },
    timedStanzas: [
      { start: 19, end: 25, text: 'first\nsecond' },
      { start: 55, end: 58, text: 'chorus line' },
    ],
  };

  renderer.setTime(config, 20);
  assert.equal(renderer.contentNode.textContent, 'first');

  renderer.setTime(config, 24.9);
  assert.equal(renderer.contentNode.textContent, 'first\nsecond');

  renderer.setTime(config, 56);
  assert.equal(renderer.contentNode.textContent, 'chorus line');

  renderer.setTime(config, 40);
  assert.equal(renderer.contentNode.textContent, '');
});

test('TextOverlayRenderer hides overlay outside timed stanzas and handles boundaries with half-open windows', () => {
  const renderer = createRenderer();
  renderer.setRuntimeContext({ audioDurationSec: 200 });

  const config = {
    content: 'fallback content',
    start: 0,
    end: 180,
    reveal: {
      mode: 'timed_stanzas',
      minLineDurationSec: 0.1,
    },
    timedStanzas: [
      { start: 10, end: 20, text: 'verse one' },
      { start: 20, end: 30, text: 'verse two' },
    ],
  };

  renderer.setTime(config, 9.9);
  assert.equal(renderer.contentNode.textContent, '');
  assert.equal(renderer.node.style.opacity, '0');

  renderer.setTime(config, 10);
  assert.equal(renderer.contentNode.textContent, 'verse one');

  renderer.setTime(config, 20);
  assert.equal(renderer.contentNode.textContent, 'verse two');

  renderer.setTime(config, 30);
  assert.equal(renderer.contentNode.textContent, 'verse two');

  renderer.setTime(config, 30.1);
  assert.equal(renderer.contentNode.textContent, '');
  assert.equal(renderer.node.style.opacity, '0');
});

test('TextOverlayRenderer supports timed_stanzas without fallback content', () => {
  const renderer = createRenderer();
  renderer.setRuntimeContext({ audioDurationSec: 200 });

  const config = {
    start: 0,
    end: 180,
    reveal: {
      mode: 'timed_stanzas',
      minLineDurationSec: 0.1,
    },
    timedStanzas: [
      { start: 10, end: 20, text: 'standalone stanza' },
    ],
  };

  renderer.setTime(config, 12);
  assert.equal(renderer.contentNode.textContent, 'standalone stanza');
  assert.notEqual(renderer.node.style.opacity, '0');
});

test('TextOverlayRenderer supports timed_stanzas credits_scroll with stanza-local progress', () => {
  const renderer = createRenderer();
  renderer.setRuntimeContext({ audioDurationSec: 200 });

  const config = {
    start: 0,
    end: 180,
    reveal: {
      mode: 'timed_stanzas',
      stanzaRevealMode: 'credits_scroll',
    },
    timedStanzas: [
      { start: 10, end: 20, text: 'first stanza line\nsecond stanza line' },
    ],
  };

  renderer.applyStyle(config);
  renderer.node.clientHeight = 320;
  renderer.contentNode.scrollHeight = 480;

  renderer.setTime(config, 10);
  assert.equal(renderer.contentNode.textContent, 'first stanza line\nsecond stanza line');
  assert.equal(renderer.contentNode.style.transform, 'translateY(320px)');

  renderer.setTime(config, 15);
  assert.equal(renderer.contentNode.style.transform, 'translateY(-80px)');

  renderer.setTime(config, 20);
  assert.equal(renderer.contentNode.style.transform, 'translateY(-480px)');
});

test('TextOverlayRenderer timed_stanzas credits_scroll depends on local stanza time instead of global overlay window', () => {
  const renderer = createRenderer();
  renderer.setRuntimeContext({ audioDurationSec: 200 });

  const config = {
    start: 0,
    end: 100,
    reveal: {
      mode: 'timed_stanzas',
      stanzaRevealMode: 'credits_scroll',
    },
    timedStanzas: [
      { start: 10, end: 20, text: 'verse one' },
      { start: 40, end: 50, text: 'verse two' },
    ],
  };

  renderer.applyStyle(config);
  renderer.node.clientHeight = 320;
  renderer.contentNode.scrollHeight = 280;

  renderer.setTime(config, 15);
  const firstStanzaTransformAtMiddle = renderer.contentNode.style.transform;
  assert.equal(firstStanzaTransformAtMiddle, 'translateY(20px)');

  renderer.setTime(config, 45);
  assert.equal(renderer.contentNode.style.transform, firstStanzaTransformAtMiddle);
});

test('TextOverlayRenderer throws for unsupported timed_stanzas stanzaRevealMode in renderer runtime', () => {
  const renderer = createRenderer();
  renderer.setRuntimeContext({ audioDurationSec: 200 });

  const config = {
    start: 0,
    end: 100,
    reveal: {
      mode: 'timed_stanzas',
      stanzaRevealMode: 'unsupported_runtime_value',
    },
    timedStanzas: [
      { start: 10, end: 20, text: 'verse one' },
    ],
  };

  assert.throws(
    () => renderer.setTime(config, 12),
    /Unsupported stanza reveal mode: unsupported_runtime_value/,
  );
});

test('TextOverlayRenderer applies topInsetPx and bottomInsetPx for timed_stanzas credits_scroll viewport', () => {
  const renderer = createRenderer();

  const config = {
    start: 0,
    end: 100,
    topInsetPx: 40,
    bottomInsetPx: 30,
    reveal: {
      mode: 'timed_stanzas',
      stanzaRevealMode: 'credits_scroll',
    },
    timedStanzas: [
      { start: 10, end: 20, text: 'inset stanza' },
    ],
  };

  renderer.applyStyle(config);

  assert.equal(renderer.node.style.top, '40px');
  assert.equal(renderer.node.style.bottom, '30px');
  assert.equal(renderer.node.style.height, 'calc(100% - 70px)');
  assert.equal(renderer.node.style.overflow, 'hidden');
});
