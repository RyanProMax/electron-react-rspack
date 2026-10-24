import { ipcMain } from 'electron';

// Each module owns exactly the subscriptions and pending work it creates.
export default class Cleanup {
  private callbacks: (() => void)[] = [];
  disposed = false;

  add(callback: () => void) {
    if (this.disposed) callback();
    else this.callbacks.push(callback);
  }

  on<Args extends unknown[]>(
    emitter: NodeJS.EventEmitter,
    event: string,
    listener: (...args: Args) => void
  ) {
    emitter.on(event, listener);
    this.add(() => emitter.removeListener(event, listener));
  }

  handle(channel: string, listener: Parameters<typeof ipcMain.handle>[1]) {
    ipcMain.handle(channel, listener);
    this.add(() => ipcMain.removeHandler(channel));
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const callback of this.callbacks.splice(0).reverse()) callback();
  }
}
