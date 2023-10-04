import { app, BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';

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
}
