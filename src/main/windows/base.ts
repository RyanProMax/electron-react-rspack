import { BrowserWindow, shell } from 'electron';
import { merge } from 'lodash';

import { getHtmlPath, getPreloadPath } from '../utils/index';
import { Pages } from '../../common/constant';
import { isAppWindow, openExternal } from './external';
import { logger } from '../logger';
import Cleanup from '../lifecycle';

export default abstract class BaseWindow {
  abstract page: Pages;
  browserWindow: BrowserWindow | null = null;
  protected readonly cleanup = new Cleanup();

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

  createWindow(options?: Electron.BrowserWindowConstructorOptions) {
    if (this.cleanup.disposed) throw new Error('Window module has been disposed');
    if (this.browserWindow && !this.browserWindow.isDestroyed()) {
      this.browserWindow.show();
      this.browserWindow.focus();
    } else {
      this.browserWindow = new BrowserWindow(merge({}, this.DefaultConfig, options));

      const window = this.browserWindow;
      const listeners = new Cleanup();
      listeners.on(window, 'ready-to-show', () => {
        if (!window.isDestroyed()) window.show();
      });

      const openLink = (url: string) => {
        if (isAppWindow(window, getHtmlPath(`${this.page}.html`))) {
          void openExternal(shell.openExternal, url).catch((error) => logger.error(error));
        }
      };
      const navigate = (e: Electron.Event, url: string) => {
        e.preventDefault();
        openLink(url);
      };
      listeners.on(window.webContents, 'will-navigate', navigate);
      listeners.on(window.webContents, 'will-redirect', navigate);
      window.webContents.setWindowOpenHandler(({ url }) => {
        openLink(url);
        return { action: 'deny' };
      });

      listeners.on(window, 'closed', () => {
        listeners.dispose();
        if (this.browserWindow === window) this.browserWindow = null;
      });

      void window.loadURL(getHtmlPath(`${this.page}.html`)).catch((error) => {
        logger.error('Failed to load application window', this.page, error);
        if (!window.isDestroyed()) window.destroy();
      });
    }

    return this.browserWindow;
  }

  dispose() {
    this.cleanup.dispose();
    if (this.browserWindow && !this.browserWindow.isDestroyed()) this.browserWindow.destroy();
  }

  close() {
    if (this.browserWindow?.closable) {
      this.browserWindow.close();
    }
  }
}
