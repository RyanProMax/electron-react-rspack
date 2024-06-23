import { BrowserWindow, app, ipcMain, shell } from 'electron';

import { Channels, Pages } from '../../common/constant';
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

    // main events
    this.registerMainEvents();

    // init windows
    this.windows = new Windows();

    this.appUpdater.checkUpdate();
  }

  private registerMainEvents() {
    // on
    ipcMain.on(Channels.Close, (event) => {
      this.logger.info(Channels.Close);
      const { sender } = event;

      const mainWindow = this.windows?.getBrowserWindow(Pages.Home);
      if (sender.id === mainWindow?.id) {
        this.quitApp();
      } else {
        const browserWindow = BrowserWindow.fromWebContents(sender);
        browserWindow?.closable && browserWindow.close();
      }
    });
    ipcMain.on(Channels.Quit, this.quitApp);
    ipcMain.on(Channels.Maximize, (event) => {
      this.logger.info(Channels.Maximize);
      const { sender } = event;
      const browserWindow = BrowserWindow.fromWebContents(sender);
      if (browserWindow?.maximizable) {
        if (browserWindow.isMaximized()) {
          browserWindow.unmaximize();
        } else {
          browserWindow.maximize();
        }
      }

    });
    ipcMain.on(Channels.Minimize, (event) => {
      this.logger.info(Channels.Minimize);
      const { sender } = event;
      const browserWindow = BrowserWindow.fromWebContents(sender);
      browserWindow?.minimizable && browserWindow.minimize();
    });
    ipcMain.on(Channels.OpenExternal, (_, url: string, options?: Electron.OpenExternalOptions) => {
      shell.openExternal(url, options);
    });
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

  private quitApp() {
    this.logger.info('app quit');
    app.quit();
  }
}
