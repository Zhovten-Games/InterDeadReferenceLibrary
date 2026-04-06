import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioAnalysisService } from '../src/services/audio-analysis-service.js';

test('AudioAnalysisService computes features from real PCM buffer data', () => {
  const sampleRate = 8;
  const fps = 2;
  const durationSec = 2;

  const samples = new Int16Array([
    0, 0, 0, 0,
    32767, 32767, 32767, 32767,
    0, 0, 0, 0,
    12000, 12000, 12000, 12000,
  ]);

  const features = AudioAnalysisService.buildFeaturesFromPcm({
    pcmBuffer: Buffer.from(samples.buffer),
    sampleRate,
    fps,
    durationSec,
  });

  assert.ok(features.length >= 4);
  assert.ok(features.some((item) => item.rms > 0));
  assert.ok(features.some((item) => item.onset > 0));
});
