import { app, ipcMain } from 'electron';

import { Channels } from '../../common/constant';
import { getPackageJson } from '../utils';
import { logger } from '../logger';
import Cleanup from '../lifecycle';
import Store from '../store';
import Windows from '../windows';

export default class Core {
  logger = logger.scope('Core');
  store: Store | null = null;
  windows: Windows | null = null;
  private readonly cleanup = new Cleanup();
  private startPromise?: Promise<void>;

  startApp() {
    if (this.cleanup.disposed) return Promise.resolve();
    return (this.startPromise ??= this.start());
  }

  private async start() {
    try {
      this.logger.info('app start');
      this.cleanup.on(app, 'window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
      });
      // before-quit can be cancelled; dispose only once quitting is committed.
      this.cleanup.on(app, 'will-quit', () => this.dispose());
      await app.whenReady();
      if (this.cleanup.disposed) return;
      this.windows = new Windows(this);
      this.store = new Store();
      this.register();
      this.store.start((event) => Boolean(this.windows?.isTrustedSender(event)));
      this.windows.start();
      this.logger.info('app start success');
    } catch (error) {
      this.logger.error(error);
      this.dispose();
      app.quit();
    }
  }

  private register() {
    this.cleanup.on(ipcMain, Channels.Quit, (event: Electron.IpcMainEvent) => {
      if (this.windows?.isTrustedSender(event)) this.quitApp();
    });
    this.cleanup.on(
      ipcMain,
      Channels.Broadcast,
      (event: Electron.IpcMainEvent, channel: Channels, ...data: unknown[]) => {
        if (!this.windows?.isTrustedSender(event)) return;
        // The renderer currently broadcasts only theme changes. Do not forward
        // arbitrary channels into another window's privileged preload bridge.
        if (channel !== Channels.ToggleTheme) return;
        if (data.length !== 1 || (data[0] !== 'light' && data[0] !== 'dark')) return;
        for (const window of this.windows.getAllWindows()) {
          if (window.webContents !== event.sender) window.webContents.send(channel, ...data);
        }
      }
    );
    this.cleanup.handle(Channels.GetPackageJson, (event) => {
      if (!this.windows?.isTrustedSender(event)) throw new Error('Untrusted IPC sender');
      return getPackageJson();
    });
  }

  quitApp() {
    this.logger.info('app quit');
    app.quit();
  }

  dispose() {
    this.cleanup.dispose();
    this.store?.dispose();
    this.windows?.dispose();
  }
}
