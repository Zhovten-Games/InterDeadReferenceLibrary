import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ConfigModel } from '../domain/config.js';
import { TextOverlayContentResolver } from './text-overlay-content-resolver.js';

export class ConfigLoader {
  constructor(workdir) {
    this.workdir = workdir;
  }

  async load() {
    const configPath = path.join(this.workdir, 'config.json');
    const content = await readFile(configPath, 'utf8');
    const parsed = JSON.parse(content);
    ConfigModel.validateConfig(parsed);

    const resolved = await new TextOverlayContentResolver(this.workdir).resolve(parsed);
    ConfigModel.validateConfig(resolved);
    return new ConfigModel(resolved);
  }
}
