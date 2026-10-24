import { app, ipcMain, shell } from 'electron';

import BaseWindow from './base';
import Main from './main';
import About from './about';
import Update from './update';

import Core from '../core';
import { logger } from '../logger';
import { Channels, Pages } from '../../common/constant';
import { getHtmlPath } from '../utils';
import { isAppSender, openExternal } from './external';
import Cleanup from '../lifecycle';

export default class Windows {
  logger = logger.scope('Windows');

  private windowInstances = new Map<Pages, BaseWindow>();
  private RegisterWindows = [Main, About, Update];
  private core: Core;
  private readonly cleanup = new Cleanup();
  private started = false;

  constructor(core: Core) {
    this.core = core;
    this.RegisterWindows.forEach((WindowClass) => {
      const instance = new WindowClass();
      this.windowInstances.set(instance.page, instance);
    });
  }

  start() {
    if (this.started || this.cleanup.disposed) return;
    this.started = true;
    this.register();
    this.cleanup.on(app, 'activate', () => {
      this.getWindowInstance(Pages.Home)?.createWindow();
    });
    this.getWindowInstance(Pages.Home)?.createWindow();
    (this.getWindowInstance(Pages.Update) as Update).start();
  }

  private register() {
    const on = (
      channel: Channels,
      listener: (event: Electron.IpcMainEvent, ...args: unknown[]) => void
    ) => {
      this.cleanup.on(ipcMain, channel, (event: Electron.IpcMainEvent, ...args: unknown[]) => {
        if (this.isTrustedSender(event)) listener(event, ...args);
      });
    };

    // events
    on(Channels.Close, (event) => {
      this.logger.info(Channels.Close);
      const { sender } = event;

      const mainWindow = this.getBrowserWindow(Pages.Home);
      if (sender === mainWindow?.webContents) {
        this.core.quitApp();
      } else {
        const browserWindow = this.getAllWindows().find((window) => window.webContents === sender);
        if (browserWindow?.closable) {
          browserWindow.close();
        }
      }
    });

    on(Channels.Maximize, (event) => {
      this.logger.info(Channels.Maximize);
      const { sender } = event;
      const browserWindow = this.getAllWindows().find((window) => window.webContents === sender);
      if (browserWindow?.maximizable) {
        if (browserWindow.isMaximized()) {
          browserWindow.unmaximize();
        } else {
          browserWindow.maximize();
        }
      }
    });

    on(Channels.Minimize, (event) => {
      this.logger.info(Channels.Minimize);
      const { sender } = event;
      const browserWindow = this.getAllWindows().find((window) => window.webContents === sender);
      if (browserWindow?.minimizable) {
        browserWindow.minimize();
      }
    });

    on(Channels.AboutMe, () => this.getWindowInstance(Pages.About)?.createWindow());

    on(Channels.OpenExternal, (event, url: unknown, options?: unknown) => {
      void openExternal(shell.openExternal, url, options).catch((error) =>
        this.logger.error(error)
      );
    });
  }

  dispose() {
    this.cleanup.dispose();
    for (const instance of this.windowInstances.values()) instance.dispose();
  }

  isTrustedSender(event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent) {
    return Array.from(this.windowInstances.values()).some((instance) =>
      isAppSender(event, instance.browserWindow, getHtmlPath(`${instance.page}.html`))
    );
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
      .map((instance) => instance.browserWindow)
      .filter((window): window is Electron.BrowserWindow =>
        Boolean(window && !window.isDestroyed())
      );
  }
}
