import { dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

import { isDev } from '../common/env';
import { logger } from './utils/logger';

const updaterLogger = logger.scope('updater');

const TIME_OUT = 10 * 1000;

export function checkUpdate(): Promise<void> {
  return new Promise(r => {
    const timer = setTimeout(() => {
      r();
    }, TIME_OUT);

    const _resolve = () => {
      clearTimeout(timer);
      r();
    };

    if (isDev) {
      autoUpdater.updateConfigPath = path.join(
        process.cwd(),
        'test/dev-app-update.yml'
      );
      autoUpdater.forceDevUpdateConfig = true;
    }

    autoUpdater.autoDownload = false;
    autoUpdater.logger = updaterLogger;

    autoUpdater.on('error', (...args) => {
      updaterLogger.error(...args);
      _resolve();
    });

    autoUpdater.on('checking-for-update', (...args) => {
      console.log('checking-for-update', args);
    });

    autoUpdater.on('update-available', (versionAvailable) => {
      updaterLogger.info('update-available', versionAvailable);
      const confirmUpdate = dialog.showMessageBoxSync({
        type: 'info',
        title: 'ElectronReactRspack: new version',
        message: 'There is a new version, update now ?',
        buttons: ['cancel', 'update'],
      });
      updaterLogger.info('confirm result', confirmUpdate);
      if (confirmUpdate) {
        autoUpdater.downloadUpdate();
      } else {
        _resolve();
      }
    });

    autoUpdater.on('update-not-available', (updateVersionNotAvailable) => {
      updaterLogger.info('update-not-available', updateVersionNotAvailable);
      _resolve();
    });

    autoUpdater.on('download-progress', (progress) => {
      console.log('download-progress', progress);
    });

    autoUpdater.on('update-downloaded', (updateDownloadedEvent) => {
      updaterLogger.info('update-downloaded', updateDownloadedEvent);
      autoUpdater.quitAndInstall(false);
      _resolve();
    });

    autoUpdater.checkForUpdates();
  });
}
