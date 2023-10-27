import { app, ipcMain, shell } from 'electron';

import { Channels } from '../../common/constant';
import { getPackageJson } from '../utils';
import { logger } from '../utils/logger';
import { checkUpdate } from '../utils/updater';

import Store from './Store';
import MainWindow from './MainWindow';
import SubWindow from './SubWindow';

export class Controller {
  logger = logger.scope('controller');

  store: Store | null = null;

  mainWindow: MainWindow | null = null;
  subWindow: SubWindow | null = null;

  async startApp() {
    try {
      this.logger.info('app start');

      this.registerAppEvent();
      await app.whenReady();

      this.store = new Store();
      this.mainWindow = new MainWindow();
      this.subWindow = new SubWindow();

      this.registerMainEvent();
      checkUpdate();

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
    this.subWindow?.register();
  }

  private _register() {
    ipcMain.on(Channels.Quit, () => {
      this.logger.info('app quit');
      app.quit();
    });
    ipcMain.handle(Channels.GetPackageJson, getPackageJson);
    ipcMain.handle(Channels.OpenExternal, (_, url: string, options?: Electron.OpenExternalOptions) => {
      return shell.openExternal(url, options);
    });
    ipcMain.on(Channels.Broadcast, (event, channel: Channels, ...data: unknown[]) => {
      const { sender } = event;
      const BroadcastList = [
        this.mainWindow?.browserWindow,
        this.subWindow?.browserWindow,
      ];
      const filterBroadcastList = BroadcastList.filter(w => w && w.webContents.id !== sender.id);
      filterBroadcastList.forEach(w => {
        w?.webContents?.send(channel, ...data);
      });
    });
  }
}
