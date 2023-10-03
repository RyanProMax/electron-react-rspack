import { app, BrowserWindow } from 'electron';
import log from 'electron-log';
import { getAssetPath, getHtmlPath } from './utils';

export class Controller {
  logger = log;
  mainWindow: BrowserWindow | null = null

  async init() {
    try {
      this.logger.info('[main] init app');

      app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
      });

      await app.whenReady();
      this.mainWindow = this.createWindow({
        htmlFileName: 'index.html',
        onClose: () => {
          this.mainWindow = null;
        }
      });
      app.on('activate', () => {
        if (this.mainWindow === null) {
          this.mainWindow = this.createWindow({
            htmlFileName: 'index.html',
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

  createWindow({ htmlFileName, minimize = false, onClose = () => {} }: {
    htmlFileName: string,
    minimize?: boolean,
    onClose?: () => unknown
  }) {
    const browserWindow = new BrowserWindow({
      show: false,
      width: 1024,
      height: 728,
      icon: getAssetPath('icon.png'),
      webPreferences: {
        // preload: getPreloadPath(),
      },
    });

    browserWindow.loadURL(getHtmlPath(htmlFileName));

    browserWindow.on('ready-to-show', () => {
      if (minimize) {
        browserWindow.minimize();
      } else {
        browserWindow.show();
      }
    });

    browserWindow.on('closed', onClose);

    return browserWindow;
  }
}
