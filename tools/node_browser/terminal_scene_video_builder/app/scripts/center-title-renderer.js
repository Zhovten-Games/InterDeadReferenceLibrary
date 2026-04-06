const revealChars = (text, ratio) => text.slice(0, Math.max(0, Math.floor(text.length * ratio)));

export class CenterTitleRenderer {
  constructor(node) {
    this.node = node;
  }

  setText(event, timeSec) {
    if (!event) {
      this.node.textContent = '';
      return;
    }
    const start = event.start ?? 0;
    const end = event.end ?? start + 1;
    const progress = Math.min(1, Math.max(0, (timeSec - start) / Math.max(0.001, end - start)));

    const mode = event.revealMode ?? 'instant';
    if (mode === 'chars' || mode === 'fade_chars') {
      this.node.textContent = revealChars(event.text, progress);
    } else if (mode === 'words') {
      const words = event.text.split(/\s+/);
      this.node.textContent = words.slice(0, Math.max(1, Math.floor(words.length * progress))).join(' ');
    } else {
      this.node.textContent = event.text;
    }
    this.node.style.opacity = mode.startsWith('fade') ? String(progress) : '1';
  }
}
