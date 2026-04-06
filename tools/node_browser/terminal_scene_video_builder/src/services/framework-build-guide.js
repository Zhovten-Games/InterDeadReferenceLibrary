import path from 'node:path';
import { CommandPrinter } from '../cli/command-printer.js';

export class FrameworkBuildGuide {
  static create({ sceneHtmlPath, frameworkBundlePath }) {
    const frameworkDir = path.resolve(path.dirname(sceneHtmlPath), '../../../../../InterDeadCore/framework');

    return [
      'Framework setup guide (required for validate/serve/record):',
      `  1) Install dependencies: ${CommandPrinter.toShell(['npm', 'ci'])} (run in ${frameworkDir})`,
      `  2) Build browser bundle: ${CommandPrinter.toShell(['npm', 'run', 'build'])}`,
      `  3) Use bundle in session config: render.frameworkBundlePath = ${frameworkBundlePath}`,
      '  4) Alternative: set TSVB_FRAMEWORK_BUNDLE to the built file path.',
    ];
  }
}
