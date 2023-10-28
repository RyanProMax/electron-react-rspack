import { BrowserWindow, app, ipcMain, shell } from 'electron';

import { Channels } from '../../common/constant';
import { getPackageJson } from '../utils';
import { logger } from '../utils/logger';

import Store from './Store';
import AppUpdater from './AppUpdater';
import MainWindow from './MainWindow';
import AboutWindow from './AboutWindow';

export class Controller {
  logger = logger.scope('controller');

  store: Store | null = null;
  appUpdater: AppUpdater = new AppUpdater();

  mainWindow: MainWindow | null = null;
  aboutWindow: AboutWindow | null = null;

  private get broadcastWindows() {
    return [
      this.mainWindow?.browserWindow,
      this.aboutWindow?.browserWindow,
      this.appUpdater?.browserWindow,
    ].filter(w => w) as BrowserWindow[];
  }

  async startApp() {
    try {
      this.logger.info('app start');

      this.registerAppEvent();
      await app.whenReady();

      this.store = new Store();
      this.mainWindow = new MainWindow();
      this.aboutWindow = new AboutWindow();

      this.registerMainEvent();
      this.appUpdater.checkUpdate();

      this.logger.info('app start success');
    } catch (e) {
      this.logger.error(e);
    }
  }

  // run before app-ready
  private registerAppEvent() {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  // run after app ready
  private registerMainEvent() {
    // main events
    this._register();

    // store event
    this.store?.register();

    this.mainWindow?.register();
    this.aboutWindow?.register();
  }

  private _register() {
    // on
    ipcMain.on(Channels.Close, (event) => {
      this.logger.info(Channels.Close);
      const { sender } = event;
      if (sender.id === this.mainWindow?.browserWindow.id) {
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
      const filterBroadcastList = this.broadcastWindows.filter(w => w && w.webContents.id !== sender.id);
      filterBroadcastList.forEach(w => {
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
