import { BrowserWindow, ipcMain } from 'electron';

import { Channels, Pages } from '../../common/constant';
import { getAssetPath, getHtmlPath, getPreloadPath } from '../utils/index';

export default class SubWindow {
  browserWindow: BrowserWindow | null = null;

  private createWindow() {
    if (this.browserWindow) {
      this.browserWindow.show();
      this.browserWindow.focus();
    } else {
      this.browserWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 728,
        icon: getAssetPath('icon.png'),
        webPreferences: {
          preload: getPreloadPath(),
        },
      });

      this.browserWindow.loadURL(getHtmlPath(Pages.Sub));

      this.browserWindow.on('ready-to-show', () => {
        this.browserWindow!.show();
      });
    }

    return this.browserWindow;
  }

  register() {
    ipcMain.on(Channels.CreateSubWindow, this.createWindow);
  }
}
