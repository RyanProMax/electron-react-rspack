import { app, BrowserWindow, ipcMain } from 'electron';

import { createWindow } from '../common/utils';
import { Channels, Pages } from '../common/constant';
import { logger } from './logger';
import { checkUpdate } from './updater';

export class Controller {
  mainWindow: BrowserWindow | null = null;
  logger = logger.scope('controller');

  async init() {
    try {
      this.logger.info('init app');

      app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
          app.quit();
        }
      });

      this.register();
      await app.whenReady();
      await checkUpdate();

      this.mainWindow = createWindow({
        htmlFileName: Pages.Home,
        onClose: () => {
          this.mainWindow = null;
        }
      });
      app.on('activate', () => {
        if (this.mainWindow === null) {
          this.mainWindow = createWindow({
            htmlFileName: Pages.Home,
            onClose: () => {
              this.mainWindow = null;
            }
          });
        }
      });
      this.logger.info('init app success');
    } catch (e) {
      this.logger.error(e);
    }
  }

  register() {
    ipcMain.handle(Channels.CreateWindow, async (_, ...args: Parameters<typeof createWindow>) => {
      return Boolean(createWindow(args[0]));
    });
  }
}
