import { spawnSync } from 'node:child_process';
import { CommandPrinter } from '../cli/command-printer.js';

export class FfmpegRunner {
  static composeMuxCommand({ fps, framePattern, audioPath, outputPath, crf, pixelFormat, x264Preset, videoBitrate }) {
    const resolvedPixelFormat = pixelFormat ?? 'yuv420p';
    const resolvedPreset = x264Preset ?? 'medium';
    return [
      'ffmpeg',
      '-y',
      '-framerate',
      String(fps),
      '-i',
      framePattern,
      '-i',
      audioPath,
      '-c:v',
      'libx264',
      '-preset',
      String(resolvedPreset),
      '-pix_fmt',
      String(resolvedPixelFormat),
      '-crf',
      String(crf),
      ...(videoBitrate ? ['-b:v', String(videoBitrate)] : []),
      '-c:a',
      'aac',
      '-shortest',
      outputPath,
    ];
  }

  static run(command) {
    const result = spawnSync(command[0], command.slice(1), { stdio: 'inherit' });
    if (result.status !== 0) {
      throw new Error('ffmpeg mux command failed.');
    }
  }

  static preview(command) {
    return CommandPrinter.toShell(command);
  }
}
