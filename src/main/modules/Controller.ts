import { app } from 'electron';

import { logger } from '../utils/logger';
import { checkUpdate } from '../utils/updater';

import MainWindow from './MainWindow';
import SubWindow from './SubWindow';

export class Controller {
  logger = logger.scope('controller');
  mainWindow: MainWindow | null = null;
  subWindow: SubWindow | null = null;

  async startApp() {
    try {
      this.logger.info('app start');

      this.registerAppEvent();
      await app.whenReady();

      this.mainWindow = new MainWindow();
      this.subWindow = new SubWindow();

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
    this.mainWindow?.register();
    this.subWindow?.register();
  }
}
