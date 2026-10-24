import { ipcMain } from 'electron';
import { CancellationToken, UpdateInfo, autoUpdater } from 'electron-updater';
import path from 'path';

import BaseWindow from './base';
import { Channels, Pages } from '../../common/constant';
import { isDev } from '../../common/env';
import { logger } from '../logger';
import Cleanup from '../lifecycle';
import { isAppSender } from './external';
import { getHtmlPath } from '../utils';

type CheckAvailableVersionResult = {
  result: boolean;
  data?: UpdateInfo;
};

export default class Update extends BaseWindow {
  private logger = logger.scope('AppUpdater');
  page = Pages.Update;
  private readonly TIME_OUT = 10 * 1000;
  private started = false;
  private checking?: Promise<void>;
  private cancelCheck?: () => void;
  private cancelConfirm?: () => void;
  private cancelDownload?: () => void;

  start() {
    if (this.started || this.cleanup.disposed) return;
    this.started = true;
    // Smoke tests never check, download or install real updates.
    if (process.env.ELECTRON_SKIP_UPDATE === '1') return;
    if (isDev) {
      autoUpdater.updateConfigPath = path.resolve(__dirname, '../test/dev-app-update.yml');
      autoUpdater.forceDevUpdateConfig = true;
    }
    autoUpdater.autoDownload = false;
    autoUpdater.logger = this.logger;
    this.cleanup.on(autoUpdater, 'error', (error: Error) => this.logger.error(error));
    void this.checkUpdate();
  }

  createWindow() {
    return super.createWindow({ width: 360, height: 240, resizable: false });
  }

  checkUpdate() {
    if (this.cleanup.disposed) return Promise.resolve();
    return (this.checking ??= this.runUpdate().finally(() => {
      this.checking = undefined;
    }));
  }

  private async runUpdate() {
    try {
      const { result, data } = await this.checkAvailableVersion();
      if (!result || !data || this.cleanup.disposed) return;
      const confirmed = await this.updateConfirm(data);
      if (!confirmed || this.cleanup.disposed) {
        this.close();
        return;
      }
      await this.download();
    } catch (error) {
      this.logger.error('Update failed', error);
      this.close();
    }
  }

  checkAvailableVersion(): Promise<CheckAvailableVersionResult> {
    if (this.cleanup.disposed) return Promise.resolve({ result: false });
    this.cancelCheck?.();
    return new Promise((resolve) => {
      const pending = new Cleanup();
      const finish = (result: CheckAvailableVersionResult) => {
        if (pending.disposed) return;
        pending.dispose();
        this.cancelCheck = undefined;
        resolve(result);
      };
      this.cancelCheck = () => finish({ result: false });
      const timer = setTimeout(this.cancelCheck, this.TIME_OUT);
      pending.add(() => clearTimeout(timer));
      pending.on(autoUpdater, 'error', () => finish({ result: false }));
      pending.on(autoUpdater, 'update-available', (data: UpdateInfo) =>
        finish({ result: true, data })
      );
      pending.on(autoUpdater, 'update-not-available', (data: UpdateInfo) =>
        finish({ result: false, data })
      );
      try {
        void autoUpdater.checkForUpdates().catch((error) => {
          this.logger.error('Update check failed', error);
          finish({ result: false });
        });
      } catch (error) {
        this.logger.error('Update check failed', error);
        finish({ result: false });
      }
    });
  }

  updateConfirm(data: UpdateInfo): Promise<boolean> {
    if (this.cleanup.disposed) return Promise.resolve(false);
    this.cancelConfirm?.();
    const window = this.createWindow();
    return new Promise((resolve) => {
      const pending = new Cleanup();
      const finish = (confirmed: boolean) => {
        if (pending.disposed) return;
        pending.dispose();
        this.cancelConfirm = undefined;
        resolve(confirmed);
      };
      this.cancelConfirm = () => finish(false);
      pending.on(window, 'closed', () => finish(false));
      pending.on(window.webContents, 'did-fail-load', () => finish(false));
      pending.on(window.webContents, 'did-finish-load', () => {
        if (!window.isDestroyed()) window.webContents.send(Channels.Render, data);
      });
      pending.on(
        ipcMain,
        Channels.AppUpdaterConfirm,
        (event: Electron.IpcMainEvent, option: unknown) => {
          if (
            isAppSender(event, window, getHtmlPath(`${this.page}.html`)) &&
            typeof option === 'boolean'
          ) {
            finish(option);
          }
        }
      );
    });
  }

  private async download() {
    const window = this.browserWindow;
    if (!window || window.isDestroyed() || this.cleanup.disposed) return;
    const pending = new Cleanup();
    const token = new CancellationToken();
    const cancel = () => {
      token.cancel();
      pending.dispose();
    };
    this.cancelDownload = cancel;
    pending.on(window, 'closed', cancel);
    pending.on(ipcMain, Channels.AppUpdaterAbort, (event: Electron.IpcMainEvent) => {
      if (isAppSender(event, window, getHtmlPath(`${this.page}.html`))) {
        cancel();
        this.close();
      }
    });
    pending.on(autoUpdater, 'download-progress', (progress: unknown) => {
      if (!window.isDestroyed() && !this.cleanup.disposed) {
        window.webContents.send(Channels.AppUpdaterProgress, progress);
      }
    });
    pending.on(autoUpdater, 'update-downloaded', () => {
      if (!token.cancelled && !this.cleanup.disposed) {
        pending.dispose();
        autoUpdater.quitAndInstall(false);
      }
    });
    try {
      await autoUpdater.downloadUpdate(token);
    } finally {
      pending.dispose();
      this.cancelDownload = undefined;
    }
  }

  dispose() {
    this.cancelCheck?.();
    this.cancelConfirm?.();
    this.cancelDownload?.();
    super.dispose();
  }
}
