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
