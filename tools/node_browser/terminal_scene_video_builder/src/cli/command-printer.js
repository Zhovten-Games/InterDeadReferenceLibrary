import { platform } from 'node:os';

export class CommandPrinter {
  static toShell(command) {
    if (platform() === 'win32') {
      return command.join(' ');
    }
    return command.map((part) => (part.includes(' ') ? `'${part}'` : part)).join(' ');
  }
}
