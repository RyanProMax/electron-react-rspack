import { BrowserWindow, ipcMain } from 'electron';
import { CancellationToken, UpdateInfo, autoUpdater } from 'electron-updater';
import path from 'path';

import { Channels, Pages } from '../../common/constant';
import { isDev } from '../../common/env';
import { logger } from '../utils/logger';
import { getHtmlPath, getPreloadPath } from '../utils';

type CheckAvailableVersionResult = {
  result: boolean
  data?: UpdateInfo
}

export default class AppUpdater {
  private logger = logger.scope('AppUpdater');
  private TIME_OUT = 10 * 1000;

  browserWindow: BrowserWindow | null = null;

  constructor() {
    if (isDev) {
      autoUpdater.updateConfigPath = path.join(
        process.cwd(),
        'test/dev-app-update.yml'
      );
      autoUpdater.forceDevUpdateConfig = true;
    }
    autoUpdater.autoDownload = false;
    autoUpdater.logger = this.logger;
  }

  async checkUpdate() {
    const { result, data } = await this.checkAvailableVersion();
    if (result && data) {
      const option = await this.updateConfirm(data);
      this.logger.info('confirm option', option);

      if (option) {
        // start update
        autoUpdater.on('download-progress', (progress) => {
          console.log('download-progress', progress);
          this.browserWindow?.webContents.send(
            Channels.AppUpdaterProgress,
            progress
          );
        });

        autoUpdater.on('update-downloaded', (updateDownloadedEvent) => {
          this.logger.info('update-downloaded', updateDownloadedEvent);
          autoUpdater.quitAndInstall(false);
        });

        const cancellationToken = new CancellationToken();

        ipcMain.once(Channels.AppUpdaterAbort, () => {
          cancellationToken.cancel();
          this.browserWindow?.close();
        });

        autoUpdater.downloadUpdate(cancellationToken);
      } else {
        // cancel update
        this.browserWindow?.close();
      }
    }
  }

  checkAvailableVersion(): Promise<CheckAvailableVersionResult> {
    return new Promise(r => {
      const timer = setTimeout(() => {
        r({ result: false });
      }, this.TIME_OUT);

      const finish = (result: CheckAvailableVersionResult) => {
        clearTimeout(timer);
        r(result);
      };

      autoUpdater.on('error', (...args) => {
        this.logger.error(...args);
        finish({ result: false });
      });

      autoUpdater.on('checking-for-update', (...args) => {
        console.log('checking-for-update', args);
      });

      autoUpdater.on('update-available', (versionAvailable) => {
        this.logger.info('update-available', versionAvailable);
        finish({ result: true, data: versionAvailable });
      });

      autoUpdater.on('update-not-available', (updateVersionNotAvailable) => {
        this.logger.info('update-not-available', updateVersionNotAvailable);
        finish({ result: false, data: updateVersionNotAvailable });
      });

      autoUpdater.checkForUpdates();
    });
  }

  updateConfirm(data: UpdateInfo): Promise<boolean> {
    this.browserWindow = new BrowserWindow({
      show: false,
      width: 360,
      height: 240,
      autoHideMenuBar: true,
      frame: false,
      transparent: true,
      resizable: false,
      webPreferences: {
        preload: getPreloadPath(),
      },
    });

    this.browserWindow.loadURL(getHtmlPath(Pages.Update));

    this.browserWindow.webContents.on('did-finish-load', () => {
      if (this.browserWindow) {
        this.browserWindow.webContents.send(Channels.Render, data);
        this.browserWindow.show();
      }
    });

    this.browserWindow.on('close', () => {
      this.browserWindow = null;
    });

    return new Promise((resolve) => {
      ipcMain.once(Channels.AppUpdaterConfirm, (_, option: boolean) => {
        resolve(option);
      });
    });
  }
}
