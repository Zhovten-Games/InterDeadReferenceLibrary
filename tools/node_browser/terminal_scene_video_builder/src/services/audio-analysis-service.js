import { spawnSync } from 'node:child_process';

export class AudioAnalysisService {
  static probeDuration(audioPath) {
    const result = spawnSync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      audioPath,
    ]);
    if (result.status !== 0) {
      throw new Error('ffprobe failed to read audio duration.');
    }
    return Number.parseFloat(result.stdout.toString().trim());
  }

  static extractMonoPcm(audioPath, sampleRate) {
    const result = spawnSync('ffmpeg', [
      '-v',
      'error',
      '-i',
      audioPath,
      '-ac',
      '1',
      '-ar',
      String(sampleRate),
      '-f',
      's16le',
      'pipe:1',
    ], { maxBuffer: 1024 * 1024 * 256 });

    if (result.status !== 0) {
      throw new Error('ffmpeg failed to extract mono PCM audio.');
    }
    return result.stdout;
  }

  static buildFeaturesFromPcm({ pcmBuffer, sampleRate, fps, durationSec }) {
    const int16 = new Int16Array(
      pcmBuffer.buffer,
      pcmBuffer.byteOffset,
      Math.floor(pcmBuffer.byteLength / Int16Array.BYTES_PER_ELEMENT),
    );

    const frameCount = Math.ceil(durationSec * fps);
    const samplesPerFrame = Math.max(1, Math.round(sampleRate / fps));

    const frameRms = [];
    const frameEnergyDelta = [];
    for (let frame = 0; frame <= frameCount; frame += 1) {
      const start = frame * samplesPerFrame;
      const end = Math.min(int16.length, start + samplesPerFrame);

      let sumSquares = 0;
      let absoluteSum = 0;
      for (let i = start; i < end; i += 1) {
        const sample = int16[i] / 32768;
        sumSquares += sample * sample;
        absoluteSum += Math.abs(sample);
      }

      const sampleLength = Math.max(1, end - start);
      const rms = Math.sqrt(sumSquares / sampleLength);
      const energy = absoluteSum / sampleLength;
      frameRms.push(rms);
      frameEnergyDelta.push(energy);
    }

    const maxRms = Math.max(...frameRms, 1e-6);
    const smoothedEnergy = frameEnergyDelta.map((value, index) => {
      const a = frameEnergyDelta[Math.max(0, index - 1)] ?? value;
      const b = frameEnergyDelta[index] ?? value;
      const c = frameEnergyDelta[Math.min(frameEnergyDelta.length - 1, index + 1)] ?? value;
      return (a + b + c) / 3;
    });

    const beatWindow = Math.max(2, Math.round(fps * 0.35));
    const features = [];
    for (let frame = 0; frame <= frameCount; frame += 1) {
      const time = frame / fps;
      const rms = frameRms[frame] / maxRms;
      const energy = smoothedEnergy[frame] / Math.max(...smoothedEnergy, 1e-6);

      const prevEnergy = smoothedEnergy[Math.max(0, frame - 1)] ?? smoothedEnergy[frame];
      const onsetRaw = Math.max(0, smoothedEnergy[frame] - prevEnergy);

      const localStart = Math.max(0, frame - beatWindow);
      const localSlice = smoothedEnergy.slice(localStart, frame + 1);
      const localMean = localSlice.reduce((acc, value) => acc + value, 0) / Math.max(1, localSlice.length);
      const beat = smoothedEnergy[frame] > localMean * 1.18 && onsetRaw > 0 ? 1 : 0;

      features.push({
        time: Number(time.toFixed(3)),
        rms: Number(rms.toFixed(4)),
        energy: Number(energy.toFixed(4)),
        onset: Number(Math.min(1, onsetRaw * 3.5).toFixed(4)),
        beat,
      });
    }

    return features;
  }

  static analyzeAudio({ audioPath, fps, durationSec, sampleRate = 22050 }) {
    const pcm = this.extractMonoPcm(audioPath, sampleRate);
    return this.buildFeaturesFromPcm({
      pcmBuffer: pcm,
      sampleRate,
      fps,
      durationSec,
    });
  }
}
