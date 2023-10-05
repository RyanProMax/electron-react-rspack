import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import path from 'path';

import { isDev } from '../common/env';
import { createWindow } from '../common/utils';
import { Channels, Pages } from '../common/constant';

export class Controller {
  mainWindow: BrowserWindow | null = null;

  async init() {
    try {
      log.info('[main] init app');

      app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
          app.quit();
        }
      });

      this.register();
      await app.whenReady();
      this.checkUpdate();

      this.mainWindow = createWindow({
        htmlFileName: Pages.Main,
        onClose: () => {
          this.mainWindow = null;
        }
      });
      app.on('activate', () => {
        if (this.mainWindow === null) {
          this.mainWindow = createWindow({
            htmlFileName: Pages.Main,
            onClose: () => {
              this.mainWindow = null;
            }
          });
        }
      });
      log.info('[main] init app success');
    } catch (e) {
      log.error(e);
    }
  }

  register() {
    ipcMain.handle(Channels.CreateWindow, async (_, ...args: Parameters<typeof createWindow>) => {
      return Boolean(createWindow(args[0]));
    });
  }

  checkUpdate() {
    if (isDev) {
      autoUpdater.updateConfigPath = path.join(
        process.cwd(),
        'test/dev-app-update.yml'
      );
      autoUpdater.forceDevUpdateConfig = true;
    }

    autoUpdater.autoDownload = false;
    autoUpdater.logger = log;

    autoUpdater.on('error', console.error);

    autoUpdater.on('checking-for-update', (...args) => {
      console.log('checking-for-update', args);
    });

    autoUpdater.on('update-available', (...args) => {
      console.log('update-available', args);

      // 也可以默认直接更新，二选一即可
      // autoUpdater.downloadUpdate();
      // sendUpdateMessage(message.updateAva);
    });

    autoUpdater.on('update-not-available', (...args) => {
      console.log('update-not-available', args);
    });

    autoUpdater.on('download-progress', (...args) => {
      console.log('download-progress', args);
    });

    autoUpdater.on('update-downloaded', (...args) => {
      console.log('update-downloaded', args);
    });

    autoUpdater.checkForUpdatesAndNotify();
  }
}
