import { app, BrowserWindow } from 'electron';

import { getHtmlPath, getPreloadPath } from '../utils/index';
import { Pages } from '../../common/constant';

export default class MainWindow {
  browserWindow = this.createWindow();

  constructor() {
    app.on('activate', () => {
      if (!this.browserWindow) {
        this.browserWindow = this.createWindow();
      }
    });
  }

  private createWindow() {
    const browserWindow = new BrowserWindow({
      show: false,
      width: 1024,
      height: 728,
      minWidth: 720,
      minHeight: 480,
      autoHideMenuBar: true,
      frame: false,
      transparent: true,
      webPreferences: {
        preload: getPreloadPath(),
        webSecurity: false,
      },
    });

    browserWindow.loadURL(getHtmlPath(Pages.Home));

    browserWindow.on('ready-to-show', () => {
      browserWindow.show();
    });

    return browserWindow;
  }

  register() {
    // ...
  }
}
