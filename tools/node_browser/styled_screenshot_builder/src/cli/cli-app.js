const path = require('node:path');
const { ConfigLoader } = require('../services/config-loader');
const { RenderConfig } = require('../domain/render-config');
const { ScreenshotService } = require('../services/screenshot-service');
const { InterDeadStylePageRenderer } = require('../core/interdead-style-page-renderer');

class ConsoleLogger {
  info(message) {
    console.log(`[INFO] ${message}`);
  }

  error(message) {
    console.error(`[ERROR] ${message}`);
  }
}

class CliApp {
  constructor({ argv, cwd }) {
    this.argv = argv;
    this.cwd = cwd;
    this.logger = new ConsoleLogger();
  }

  parseArgs() {
    const command = this.argv[0] ?? 'shot';
    const workdirFlag = this.argv.indexOf('--workdir');
    const workdir = workdirFlag >= 0 ? this.argv[workdirFlag + 1] : './session';
    const configFlag = this.argv.indexOf('--config');
    const configName = configFlag >= 0 ? this.argv[configFlag + 1] : 'config.json';

    if (!['shot', 'validate'].includes(command)) {
      throw new Error('Command is required: shot | validate');
    }

    return {
      command,
      workdir: path.resolve(this.cwd, workdir),
      configName,
    };
  }

  async run() {
    const { command, workdir, configName } = this.parseArgs();
    const loadedConfig = new ConfigLoader(workdir).load(configName);
    const runtimeConfig = new RenderConfig(loadedConfig.data).toRuntime();

    this.logger.info(`Config loaded: ${loadedConfig.path}`);
    this.logger.info(`Target viewport: ${runtimeConfig.width}x${runtimeConfig.height}`);
    this.logger.info(`Text items: ${runtimeConfig.textItems.length}`);

    if (command === 'validate') {
      this.logger.info('Validation finished successfully.');
      return;
    }

    const screenshotService = new ScreenshotService({
      logger: this.logger,
      renderer: new InterDeadStylePageRenderer(),
    });

    await screenshotService.capture(runtimeConfig, workdir);
  }
}

module.exports = { CliApp };
