const fs = require('node:fs');
const path = require('node:path');

class ConfigLoader {
  constructor(workdir) {
    this.workdir = workdir;
  }

  load(configFileName = 'config.json') {
    const configPath = path.resolve(this.workdir, configFileName);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return { path: configPath, data: raw };
  }
}

module.exports = { ConfigLoader };
