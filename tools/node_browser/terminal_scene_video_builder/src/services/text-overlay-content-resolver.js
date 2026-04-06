import path from 'node:path';
import { readFile } from 'node:fs/promises';

export class TextOverlayContentResolver {
  constructor(workdir) {
    this.workdir = workdir;
  }

  async resolve(configData) {
    const textOverlay = configData.textOverlay ?? {};
    const contentFile = textOverlay.contentFile ?? null;
    if (!contentFile) {
      return configData;
    }

    const resolvedPath = path.resolve(this.workdir, contentFile);

    let content;
    try {
      content = await readFile(resolvedPath, 'utf8');
    } catch (error) {
      throw new Error(
        `Failed to read textOverlay.contentFile: ${contentFile} (resolved to ${resolvedPath}).`,
        { cause: error },
      );
    }

    const { contentFile: _contentFile, ...textOverlayWithoutSourcePath } = textOverlay;

    return {
      ...configData,
      textOverlay: {
        ...textOverlayWithoutSourcePath,
        content,
      },
    };
  }
}
