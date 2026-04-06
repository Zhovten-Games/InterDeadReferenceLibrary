class MessageRevealEngine {
  static revealText({ text, mode = 'instant', progress }) {
    if (mode === 'chars') {
      const end = Math.max(0, Math.floor(text.length * progress));
      return text.slice(0, end);
    }

    if (mode === 'words') {
      const words = text.split(/\s+/);
      const count = Math.max(0, Math.floor(words.length * progress));
      return words.slice(0, count).join(' ');
    }

    return text;
  }
}

export class TerminalLogRenderer {
  constructor(node, maxVisibleMessages) {
    this.node = node;
    this.maxVisibleMessages = maxVisibleMessages;
    this.messages = [];
    this.pendingMessage = null;
  }

  clear() {
    this.messages = [];
    this.pendingMessage = null;
    this.render();
  }

  beginMessage({ eventId, text, revealMode = 'instant', revealDuration = 0, startTime }) {
    this.pendingMessage = {
      eventId,
      text,
      revealMode,
      revealDuration,
      startTime,
    };
  }

  updatePending(timeSec) {
    if (!this.pendingMessage) return null;

    const { text, revealDuration, revealMode } = this.pendingMessage;
    const progress = revealDuration > 0 ? Math.min(1, Math.max(0, (timeSec - this.pendingMessage.startTime) / revealDuration)) : 1;

    const shownText = MessageRevealEngine.revealText({
      text,
      mode: revealMode,
      progress: revealMode === 'instant' ? 1 : progress,
    });

    this.pendingMessage.currentText = shownText;
    if (progress >= 1 || revealMode === 'instant') {
      this.commitPending();
    }

    this.render();
    return shownText;
  }

  commitPending() {
    if (!this.pendingMessage) return;
    this.messages.push(this.pendingMessage.text);
    this.messages = this.messages.slice(-this.maxVisibleMessages);
    this.pendingMessage = null;
  }

  render() {
    this.node.innerHTML = '';
    const entries = [...this.messages];
    if (this.pendingMessage?.currentText) {
      entries.push(this.pendingMessage.currentText);
    }

    const visible = entries.slice(-this.maxVisibleMessages);
    visible.forEach((message, index) => {
      const line = document.createElement('div');
      line.className = 'scene__line';
      line.dataset.depth = String(Math.max(0, visible.length - index - 1));
      line.textContent = message;
      this.node.appendChild(line);
    });
  }
}
