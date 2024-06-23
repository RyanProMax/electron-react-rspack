import { app, ipcMain } from 'electron';

import { Channels } from '../../common/constant';
import { getPackageJson } from '../utils';
import { logger } from '../logger';

import Store from '../store';
import Windows from '../windows';
import AppUpdater from '../updater';

export default class Core {
  logger = logger.scope('Core');

  store: Store | null = null;
  windows: Windows | null = null;
  appUpdater = new AppUpdater();

  async startApp() {
    try {
      this.logger.info('app start');

      await this.beforeAppReady();
      await app.whenReady();
      await this.afterAppReady();

      this.logger.info('app start success');
    } catch (e) {
      this.logger.error(e);
    }
  }

  // run before app-ready
  private async beforeAppReady() {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  // run after app-ready
  private async afterAppReady() {
    this.store = new Store();

    // init windows
    this.windows = new Windows(this);

    this.register();

    this.appUpdater.checkUpdate();
  }

  private register() {
    // on
    ipcMain.on(Channels.Quit, this.quitApp);

    ipcMain.on(Channels.Broadcast, (event, channel: Channels, ...data: unknown[]) => {
      const { sender } = event;
      const allWindows = this.windows?.getAllWindows() || [];
      allWindows.filter(w => w && w.webContents.id !== sender.id).forEach(w => {
        w?.webContents?.send(channel, ...data);
      });
    });

    // handle
    ipcMain.handle(Channels.GetPackageJson, getPackageJson);
  }

  quitApp() {
    this.logger.info('app quit');
    app.quit();
  }
}
