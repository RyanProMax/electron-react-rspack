import { BrowserWindow, ipcMain, shell } from 'electron';

import { Channels, Pages } from '../../common/constant';
import { getHtmlPath, getPreloadPath } from '../utils/index';

export default class AboutWindow {
  browserWindow: BrowserWindow | null = null;

  private createWindow() {
    if (this.browserWindow && !this.browserWindow.isDestroyed()) {
      this.browserWindow.show();
      this.browserWindow.focus();
    } else {
      this.browserWindow = new BrowserWindow({
        show: false,
        width: 480,
        height: 240,
        autoHideMenuBar: true,
        frame: false,
        transparent: true,
        resizable: false,
        webPreferences: {
          preload: getPreloadPath(),
        },
      });

      this.browserWindow.loadURL(getHtmlPath(Pages.About));

      this.browserWindow.on('ready-to-show', () => {
        this.browserWindow!.show();
      });

      this.browserWindow.webContents.setWindowOpenHandler((data) => {
        shell.openExternal(data.url);
        return { action: 'deny' };
      });

      this.browserWindow.on('close', () => {
        this.browserWindow = null;
      });
    }

    return this.browserWindow;
  }

  register() {
    ipcMain.on(Channels.AboutMe, this.createWindow);
  }

  close() {
    this.browserWindow?.closable && this.browserWindow.close();
    this.browserWindow = null;
  }
}
