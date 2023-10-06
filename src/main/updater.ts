import { autoUpdater } from 'electron-updater';
import path from 'path';

import { isDev } from '../common/env';
import { logger } from './logger';

const updaterLogger = logger.scope('updater');

export function checkUpdate(): Promise<boolean> {
  return new Promise(r => {
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
      r(false);
    });

    autoUpdater.on('checking-for-update', (...args) => {
      console.log('checking-for-update', args);
    });

    autoUpdater.on('update-available', (versionAvailable) => {
      updaterLogger.info('update-available', versionAvailable);
      const confirmUpdate = true;
      if (confirmUpdate) {
        autoUpdater.downloadUpdate();
      } else {
        r(false);
      }
    });

    autoUpdater.on('update-not-available', (updateVersionNotAvailable) => {
      updaterLogger.info('update-not-available', updateVersionNotAvailable);
    });

    autoUpdater.on('download-progress', (progress) => {
      console.log('download-progress', progress);
    });

    autoUpdater.on('update-downloaded', (updateDownloadedEvent) => {
      updaterLogger.info('update-downloaded', updateDownloadedEvent);
      r(true);
    });

    autoUpdater.checkForUpdates();
  });
}
