import _ElectronUpdater from 'electron-updater';

declare global {
  namespace ElectronUpdater {
    type UpdateInfo = _ElectronUpdater.UpdateInfo;
    type ProgressInfo = _ElectronUpdater.ProgressInfo;
  }
}
