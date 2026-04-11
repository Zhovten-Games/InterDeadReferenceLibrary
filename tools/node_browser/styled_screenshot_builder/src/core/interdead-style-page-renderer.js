const { BasePageRenderer } = require('./base-page-renderer');

class InterDeadStylePageRenderer extends BasePageRenderer {
  buildBodyBackground(background) {
    const imageLayer = background.image ? `, url('${this.escapeHtml(background.image)}')` : '';
    return `
      background-color: ${background.color};
      background-image:
        radial-gradient(circle at top left, rgba(0, 0, 0, ${background.vignetteOpacity}) 0%, transparent 40%),
        radial-gradient(circle at top right, rgba(0, 0, 0, ${background.vignetteOpacity}) 0%, transparent 40%),
        radial-gradient(circle at bottom right, rgba(0, 0, 0, ${background.vignetteOpacity}) 0%, transparent 40%),
        radial-gradient(circle at bottom left, rgba(0, 0, 0, ${background.vignetteOpacity}) 0%, transparent 40%)${imageLayer};
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    `;
  }

  buildScanlines(background) {
    if (!background.enableScanlines) {
      return 'display:none;';
    }

    return `
      background: repeating-linear-gradient(
        rgba(0, 42, 2, 0.6) 0,
        rgba(0, 42, 2, 0.6) 1px,
        transparent 1px,
        transparent 4px
      );
      opacity: ${background.scanlinesOpacity};
      mix-blend-mode: screen;
    `;
  }

  buildHtml({ width, height, lang, textItems, background }) {
    const renderedTextItems = this.buildTextItems(textItems);
    return `<!doctype html>
<html lang="${this.escapeHtml(lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>InterDead Styled Screenshot</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Pirata+One&family=Triodion&display=swap');

      :root {
        --color-text: #8ae590;
        --font-body: 'Calling Code', 'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', monospace;
        --font-heading: 'Calling Code', sans-serif;
      }

      html[lang='en'] {
        --font-heading: 'Pirata One', 'Calling Code', sans-serif;
      }

      html[lang='ru'],
      html[lang='uk'] {
        --font-heading: 'Triodion', 'Calling Code', sans-serif;
      }

      * { box-sizing: border-box; }
      html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; }

      body {
        position: relative;
        font-family: var(--font-body);
        ${this.buildBodyBackground(background)}
        color: var(--color-text);
      }

      body::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        ${this.buildScanlines(background)}
      }

      .shot-text {
        position: absolute;
        z-index: 2;
        white-space: pre-wrap;
        font-family: var(--font-heading);
      }
    </style>
  </head>
  <body>
    ${renderedTextItems}
  </body>
</html>`;
  }
}

module.exports = { InterDeadStylePageRenderer };
