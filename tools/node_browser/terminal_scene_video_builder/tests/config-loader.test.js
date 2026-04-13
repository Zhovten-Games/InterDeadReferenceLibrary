import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { ConfigLoader } from '../src/services/config-loader.js';
import { ConfigModel } from '../src/domain/config.js';

test('ConfigLoader loads simplified session config', async () => {
  const workdir = path.resolve(process.cwd(), 'session');
  const config = await new ConfigLoader(workdir).load();
  assert.equal(config.data.scene.mode, 'text_overlay');
  assert.equal(typeof config.data.textOverlay.content, 'string');
  assert.equal(config.data.textOverlay.content.length > 0, true);
});

test('ConfigLoader resolves textOverlay content from contentFile', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'tsvb-config-loader-'));
  const workdir = path.join(tempRoot, 'session');
  await mkdir(workdir, { recursive: true });

  await writeFile(path.join(workdir, 'script.txt'), 'Sample file-based overlay text.', 'utf8');
  await writeFile(
    path.join(workdir, 'config.json'),
    JSON.stringify({
      inputs: { background: 'bg.png', audio: 'input.mp3' },
      video: { width: 1280, height: 720, fps: 30 },
      render: {},
      output: { file: 'out/final.mp4' },
      scene: { mode: 'text_overlay' },
      textOverlay: { contentFile: 'script.txt', start: 0, end: 1 },
    }),
    'utf8',
  );

  const config = await new ConfigLoader(workdir).load();
  assert.equal(config.data.textOverlay.content, 'Sample file-based overlay text.');
});


test('ConfigLoader fails when textOverlay.contentFile does not exist', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'tsvb-config-loader-missing-file-'));
  const workdir = path.join(tempRoot, 'session');
  await mkdir(workdir, { recursive: true });

  await writeFile(
    path.join(workdir, 'config.json'),
    JSON.stringify({
      inputs: { background: 'bg.png', audio: 'input.mp3' },
      video: { width: 1280, height: 720, fps: 30 },
      render: {},
      output: { file: 'out/final.mp4' },
      scene: { mode: 'text_overlay' },
      textOverlay: { contentFile: 'missing-script.txt', start: 0, end: 1 },
    }),
    'utf8',
  );

  await assert.rejects(
    new ConfigLoader(workdir).load(),
    /Failed to read textOverlay\.contentFile: missing-script\.txt/,
  );
});


test('ConfigLoader validates raw contract before resolving contentFile', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'tsvb-config-loader-contract-order-'));
  const workdir = path.join(tempRoot, 'session');
  await mkdir(workdir, { recursive: true });

  await writeFile(
    path.join(workdir, 'config.json'),
    JSON.stringify({
      inputs: { background: 'bg.png', audio: 'input.mp3' },
      video: { width: 1280, height: 720, fps: 30 },
      render: {},
      output: { file: 'out/final.mp4' },
      scene: { mode: 'text_overlay' },
      textOverlay: { content: 'Inline text', contentFile: 'missing-script.txt', start: 0, end: 1 },
    }),
    'utf8',
  );

  await assert.rejects(
    new ConfigLoader(workdir).load(),
    /textOverlay\.content and textOverlay\.contentFile cannot be used together/,
  );
});

test('ConfigModel rejects unsupported scene mode', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'terminal_log' },
    textOverlay: { content: 'x', start: 0, end: 1 },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /Unsupported scene mode/);
});

test('ConfigModel rejects unsupported text alignment', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: { content: 'x', start: 0, end: 1, align: 'justify' },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /Unsupported text alignment/);
});

test('ConfigModel rejects timeline in text_overlay mode', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: { content: 'x', start: 0, end: 1 },
    timeline: { events: [] },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /timeline is not supported/);
});

test('ConfigModel rejects empty layout.fontFamily', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: { content: 'x', start: 0, end: 1 },
    layout: { fontFamily: '   ' },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /layout\.fontFamily must not be empty/);
});


test('ConfigModel rejects empty textOverlay.contentFile', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: { contentFile: '   ', start: 0, end: 1 },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /textOverlay\.contentFile must not be empty/);
});

test('ConfigModel rejects simultaneous textOverlay.content and textOverlay.contentFile', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: { content: 'x', contentFile: 'text.md', start: 0, end: 1 },
  };

  assert.throws(
    () => ConfigModel.validateConfig(sampleConfig),
    /textOverlay\.content and textOverlay\.contentFile cannot be used together/,
  );
});



test('ConfigModel allows missing textOverlay.end for audio-bound timing', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: { content: 'x', start: 0 },
  };

  assert.doesNotThrow(() => ConfigModel.validateConfig(sampleConfig));
});



test('ConfigModel rejects invalid textOverlay.reveal.mode', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: { content: 'x', start: 0, reveal: { mode: 'unsupported_mode' } },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /textOverlay\.reveal\.mode/);
});

test('ConfigModel rejects invalid textOverlay.reveal.lineDelaySec', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: { content: 'x', start: 0, reveal: { mode: 'line_by_line', lineDelaySec: 0 } },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /textOverlay\.reveal\.lineDelaySec/);
});

test('ConfigModel rejects invalid textOverlay.reveal.fitToAudioDuration', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: { content: 'x', start: 0, reveal: { mode: 'line_by_line', fitToAudioDuration: 'yes' } },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /textOverlay\.reveal\.fitToAudioDuration/);
});

test('ConfigModel rejects invalid textOverlay.reveal.stanzaRevealMode', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: {
      content: 'x',
      start: 0,
      reveal: { mode: 'timed_stanzas', stanzaRevealMode: 'unsupported_mode' },
      timedStanzas: [{ start: 0, end: 1, text: 'line' }],
    },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /textOverlay\.reveal\.stanzaRevealMode/);
});

test('ConfigModel rejects missing timedStanzas for timed_stanzas mode', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: { content: 'x', start: 0, reveal: { mode: 'timed_stanzas' } },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /textOverlay\.timedStanzas must be an array/);
});

test('ConfigModel rejects empty timedStanzas for timed_stanzas mode', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: { content: 'x', start: 0, reveal: { mode: 'timed_stanzas' }, timedStanzas: [] },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /textOverlay\.timedStanzas must not be empty/);
});

test('ConfigModel rejects malformed timedStanzas items', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: {
      content: 'x',
      start: 0,
      reveal: { mode: 'timed_stanzas' },
      timedStanzas: [
        { start: '19', end: 54, text: 'verse' },
      ],
    },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /timedStanzas\[0\]\.start must be a number/);
});

test('ConfigModel rejects unsorted timedStanzas', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: {
      content: 'x',
      start: 0,
      reveal: { mode: 'timed_stanzas' },
      timedStanzas: [
        { start: 20, end: 30, text: 'two' },
        { start: 10, end: 19, text: 'one' },
      ],
    },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /must be sorted by start/);
});

test('ConfigModel rejects overlapping timedStanzas', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: {
      content: 'x',
      start: 0,
      reveal: { mode: 'timed_stanzas' },
      timedStanzas: [
        { start: 10, end: 25, text: 'one' },
        { start: 20, end: 30, text: 'two' },
      ],
    },
  };

  assert.throws(() => ConfigModel.validateConfig(sampleConfig), /must not overlap/);
});

test('ConfigModel allows timed_stanzas mode without content/contentFile when timedStanzas is provided', () => {
  const sampleConfig = {
    inputs: { background: 'bg.png', audio: 'input.mp3' },
    video: { width: 1280, height: 720, fps: 30 },
    render: {},
    output: { file: 'out/final.mp4' },
    scene: { mode: 'text_overlay' },
    textOverlay: {
      start: 0,
      reveal: { mode: 'timed_stanzas' },
      timedStanzas: [{ start: 10, end: 20, text: 'one' }],
    },
  };

  assert.doesNotThrow(() => ConfigModel.validateConfig(sampleConfig));
});
