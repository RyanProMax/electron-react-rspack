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
      await this.checkUpdate();

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

  checkUpdate(): Promise<boolean> {
    return new Promise(r => {
      if (isDev) {
        autoUpdater.updateConfigPath = path.join(
          process.cwd(),
          'test/dev-app-update.yml'
        );
        autoUpdater.forceDevUpdateConfig = true;
      }

      autoUpdater.autoDownload = false;
      autoUpdater.logger = log;

      autoUpdater.on('error', (...args) => {
        log.error(...args);
        r(false);
      });

      autoUpdater.on('checking-for-update', (...args) => {
        console.log('checking-for-update', args);
      });

      autoUpdater.on('update-available', (versionAvailable) => {
        log.info('[main] update-available', versionAvailable);
        const confirmUpdate = true;
        if (confirmUpdate) {
          autoUpdater.downloadUpdate();
        } else {
          r(false);
        }
      });

      autoUpdater.on('update-not-available', (updateVersionNotAvailable) => {
        log.info('[main] update-not-available', updateVersionNotAvailable);
      });

      autoUpdater.on('download-progress', (progress) => {
        console.log('download-progress', progress);
      });

      autoUpdater.on('update-downloaded', (updateDownloadedEvent) => {
        log.info('update-downloaded', updateDownloadedEvent);
        r(true);
      });

      autoUpdater.checkForUpdates();
    });
  }
}
