import { BrowserWindow, ipcMain, shell } from 'electron';

import BaseWindow from './base';
import Main from './main';
import About from './about';
import Update from './update';

import Core from '../core';
import { logger } from '../logger';
import { Channels, Pages } from '../../common/constant';

export default class Windows {
  logger = logger.scope('Windows');

  private windowInstances = new Map<Pages, BaseWindow>();
  private RegisterWindows = [
    Main,
    About,
    Update,
  ];
  private core: Core;

  constructor(core: Core) {
    this.core = core;
    this.register();
  }

  private register() {
    this.RegisterWindows.forEach(WindowClass => {
      const instance = new WindowClass();
      this.windowInstances.set(instance.page, instance);
    });

    // events
    ipcMain.on(Channels.Close, (event) => {
      this.logger.info(Channels.Close);
      const { sender } = event;

      const mainWindow = this.getBrowserWindow(Pages.Home);
      if (sender.id === mainWindow?.id) {
        this.core.quitApp();
      } else {
        const browserWindow = BrowserWindow.fromWebContents(sender);
        browserWindow?.closable && browserWindow.close();
      }
    });

    ipcMain.on(Channels.Maximize, (event) => {
      this.logger.info(Channels.Maximize);
      const { sender } = event;
      const browserWindow = BrowserWindow.fromWebContents(sender);
      if (browserWindow?.maximizable) {
        if (browserWindow.isMaximized()) {
          browserWindow.unmaximize();
        } else {
          browserWindow.maximize();
        }
      }
    });

    ipcMain.on(Channels.Minimize, (event) => {
      this.logger.info(Channels.Minimize);
      const { sender } = event;
      const browserWindow = BrowserWindow.fromWebContents(sender);
      browserWindow?.minimizable && browserWindow.minimize();
    });

    ipcMain.on(Channels.OpenExternal, (_, url: string, options?: Electron.OpenExternalOptions) => {
      shell.openExternal(url, options);
    });
  }

  getWindowInstance(page: Pages) {
    return this.windowInstances.get(page) || null;
  }

  getBrowserWindow(page: Pages) {
    const windowInstance = this.getWindowInstance(page);
    return windowInstance?.browserWindow || null;
  }

  getAllWindows() {
    return Array.from(this.windowInstances.values())
      .map(instance => instance.browserWindow)
      .filter(v => Boolean(v)) as Electron.BrowserWindow[];
  }
}
