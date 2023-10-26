import { app, ipcMain } from 'electron';

import { createWindow } from '../../common/utils';
import { Channels } from '../../common/constant';
import { logger } from '../utils/logger';
import { checkUpdate } from '../updater';
import MainWindow from './MainWindow';

export class Controller {
  logger = logger.scope('controller');
  mainWindow: MainWindow | null = null;

  async startApp() {
    try {
      this.logger.info('app start');

      this.registerAppEvent();
      await app.whenReady();

      this.mainWindow = new MainWindow();

      this.registerMainEvent();
      checkUpdate();

      this.logger.info('app start success');
    } catch (e) {
      this.logger.error(e);
    }
  }

  private registerAppEvent() {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  registerMainEvent() {
    ipcMain.handle(Channels.CreateWindow, async (_, ...args: Parameters<typeof createWindow>) => {
      return Boolean(createWindow(args[0]));
    });
  }
}
