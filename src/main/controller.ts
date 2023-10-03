import { app, BrowserWindow } from 'electron';
import log from 'electron-log';

import { createWindow } from '../common/utils';
import { PAGES } from '../common/constant';

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
      this.mainWindow = createWindow({
        htmlFileName: PAGES.MAIN,
        onClose: () => {
          this.mainWindow = null;
        }
      });
      app.on('activate', () => {
        if (this.mainWindow === null) {
          this.mainWindow = createWindow({
            htmlFileName: PAGES.MAIN,
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
}
