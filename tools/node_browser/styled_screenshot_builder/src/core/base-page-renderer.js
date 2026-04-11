class BasePageRenderer {
  escapeHtml(input) {
    return String(input)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  buildTextItems(textItems) {
    return textItems
      .map((item) => this.buildTextItem(item))
      .join('\n');
  }

  resolvePosition(item, axis) {
    const pxKey = axis;
    const pctKey = `${axis}Pct`;
    if (Number.isFinite(item[pxKey])) {
      return `${item[pxKey]}px`;
    }
    return `${item[pctKey]}%`;
  }

  resolveAnchor(anchor = 'center') {
    const anchors = {
      'top-left': { x: '0%', y: '0%' },
      'top-center': { x: '-50%', y: '0%' },
      'top-right': { x: '-100%', y: '0%' },
      'center-left': { x: '0%', y: '-50%' },
      center: { x: '-50%', y: '-50%' },
      'center-right': { x: '-100%', y: '-50%' },
      'bottom-left': { x: '0%', y: '-100%' },
      'bottom-center': { x: '-50%', y: '-100%' },
      'bottom-right': { x: '-100%', y: '-100%' },
    };

    return anchors[anchor] ?? anchors.center;
  }

  buildTextItem(item) {
    const x = this.resolvePosition(item, 'x');
    const y = this.resolvePosition(item, 'y');
    const anchor = this.resolveAnchor(item.anchor);
    const color = item.color ?? '#8ae590';
    const size = Number.isFinite(item.fontSize) ? `${item.fontSize}px` : '96px';
    const align = item.align ?? 'left';
    const maxWidth = Number.isFinite(item.maxWidth) ? `${item.maxWidth}px` : '75vw';
    const weight = Number.isFinite(item.fontWeight) ? String(item.fontWeight) : '400';
    const lineHeight = Number.isFinite(item.lineHeight) ? String(item.lineHeight) : '1.12';
    const letterSpacing = Number.isFinite(item.letterSpacing) ? `${item.letterSpacing}em` : '0.02em';
    const textTransform = item.textTransform ?? 'uppercase';
    const textShadow = item.textShadow ?? '0 0 28px rgba(138, 229, 144, 0.35)';

    return `
      <div class="shot-text" style="left:${x}; top:${y}; transform: translate(${anchor.x}, ${anchor.y}); color:${color}; font-size:${size}; text-align:${align}; max-width:${maxWidth}; font-weight:${weight}; line-height:${lineHeight}; letter-spacing:${letterSpacing}; text-transform:${textTransform}; text-shadow:${textShadow};">${this.escapeHtml(item.text)}</div>
    `;
  }
}

module.exports = { BasePageRenderer };
