import { BrowserWindow, shell } from 'electron';
import { merge } from 'lodash';

import { getHtmlPath, getPreloadPath } from '../utils/index';
import { Pages } from '../../common/constant';

export default abstract class BaseWindow {
  abstract page: Pages;
  browserWindow: BrowserWindow | null = null;

  private DefaultConfig: Electron.BrowserWindowConstructorOptions = {
    show: false,
    width: 480,
    height: 240,
    minWidth: 480,
    minHeight: 240,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    resizable: true,
    webPreferences: {
      preload: getPreloadPath(),
    },
  };

  constructor() {
    this.register();
  }

  createWindow(options?: Electron.BrowserWindowConstructorOptions) {
    if (this.browserWindow && !this.browserWindow.isDestroyed()) {
      this.browserWindow.show();
      this.browserWindow.focus();
    } else {
      this.browserWindow = new BrowserWindow(merge({}, this.DefaultConfig, options));

      this.browserWindow.loadURL(getHtmlPath(this.page));

      this.browserWindow.on('ready-to-show', () => {
        this.browserWindow?.show();
      });

      this.browserWindow.webContents.on('will-navigate', (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
      });

      this.browserWindow.on('close', () => {
        this.browserWindow = null;
      });
    }

    return this.browserWindow;
  }

  register() {
    // ...
  }

  close() {
    this.browserWindow?.closable && this.browserWindow.close();
  }
}
