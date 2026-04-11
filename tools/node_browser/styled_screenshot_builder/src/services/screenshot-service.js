const fs = require('node:fs');
const path = require('node:path');

class FontLoadInspector {
  static async collect(page, lang) {
    const fontFamilies = lang === 'en' ? ['Pirata One'] : ['Triodion'];
    return page.evaluate(async (families) => {
      await document.fonts?.ready;
      const statuses = families.map((family) => ({
        family,
        loaded: document.fonts ? document.fonts.check(`16px "${family}"`) : false,
      }));
      return {
        statuses,
        available: Boolean(document.fonts),
      };
    }, fontFamilies);
  }
}

class ScreenshotService {
  constructor({ logger, renderer }) {
    this.logger = logger;
    this.renderer = renderer;
  }

  logFontStatus(report) {
    if (!report.available) {
      this.logger.info('Font loading API is unavailable in this browser context.');
      return;
    }

    report.statuses.forEach((entry) => {
      if (entry.loaded) {
        this.logger.info(`Font loaded successfully: ${entry.family}`);
      } else {
        this.logger.info(`Font fallback is active, requested font not loaded: ${entry.family}`);
      }
    });
  }

  async capture(runtimeConfig, workdir) {
    const outputPath = path.resolve(workdir, runtimeConfig.outputFile);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const html = this.renderer.buildHtml(runtimeConfig);
    const { chromium } = await import('playwright');
    let browser;

    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage({ viewport: { width: runtimeConfig.width, height: runtimeConfig.height } });

      page.on('console', (msg) => this.logger.info(`[BrowserConsole] ${msg.text()}`));
      page.on('pageerror', (err) => this.logger.error(`[BrowserError] ${err.message}`));

      await page.setContent(html, { waitUntil: 'networkidle' });
      const fontReport = await FontLoadInspector.collect(page, runtimeConfig.lang);
      this.logFontStatus(fontReport);

      await page.screenshot({
        path: outputPath,
        type: runtimeConfig.screenshot.type,
        fullPage: false,
        omitBackground: runtimeConfig.screenshot.omitBackground,
        animations: 'disabled',
      });

      this.logger.info(`Screenshot created: ${outputPath}`);
      return outputPath;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

module.exports = { ScreenshotService };
