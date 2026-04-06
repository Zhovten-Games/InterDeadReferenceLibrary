import path from 'node:path';
import { pathToFileURL } from 'node:url';

class ScenePageUrlBuilder {
  build({ sceneHtmlPath, scenePageBaseUrl = null, payloadUri, frameworkUri = null }) {
    const sceneUrl = scenePageBaseUrl ? new URL(scenePageBaseUrl) : pathToFileURL(sceneHtmlPath);
    sceneUrl.searchParams.set('mode', 'record');
    sceneUrl.searchParams.set('payload', payloadUri);
    if (frameworkUri) {
      sceneUrl.searchParams.set('framework', frameworkUri);
    }
    return sceneUrl.href;
  }
}

export class PlaywrightRenderer {
  constructor(logger = console) {
    this.logger = logger;
    this.scenePageUrlBuilder = new ScenePageUrlBuilder();
  }

  async renderFrames({
    sceneHtmlPath,
    scenePageBaseUrl = null,
    width,
    height,
    fps,
    durationSec,
    payloadUri,
    outDir,
    frameworkUri = null,
  }) {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width, height } });

    if (!frameworkUri) {
      throw new Error('Framework bundle URI is required for recording.');
    }
    const resolvedFrameworkUri = scenePageBaseUrl && frameworkUri.startsWith('/')
      ? new URL(frameworkUri, scenePageBaseUrl).href
      : frameworkUri;
    const sceneUrl = this.scenePageUrlBuilder.build({ sceneHtmlPath, scenePageBaseUrl, payloadUri, frameworkUri: resolvedFrameworkUri });
    this.logger.info(`Opening scene URL for recording: ${sceneUrl}`);
    page.on('console', (msg) => this.logger.info(`[BrowserConsole] ${msg.text()}`));
    page.on('pageerror', (err) => this.logger.error(`[BrowserError] ${err.message}`));
    await page.goto(sceneUrl);
    await page.evaluate(async () => {
      await document.fonts?.ready;
    });
    await page.waitForFunction(() => Boolean(window.scenePlayer?.payload), { timeout: 20_000 });

    const totalFrames = Math.ceil(durationSec * fps);
    for (let frame = 0; frame <= totalFrames; frame += 1) {
      const timeSec = frame / fps;
      await page.evaluate((time) => window.scenePlayer?.setTime(time), timeSec);
      const framePath = path.join(outDir, `frame_${String(frame).padStart(6, '0')}.png`);
      await page.screenshot({ path: framePath });
    }

    await browser.close();
  }
}
