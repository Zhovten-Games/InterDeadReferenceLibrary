import fs from 'node:fs';
import path from 'node:path';

export class FileSystemAdapter {
  exists(targetPath) {
    return fs.existsSync(targetPath);
  }

  ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
  }

  removeDir(dir) {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  }

  writeJson(file, data) {
    this.ensureDir(path.dirname(file));
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }
}
