import { app, ipcMain } from 'electron';
import ElectronStore from 'electron-store';
import path from 'path';

import { Channels } from '../../common/constant';

export default class Store {
  rootPath = path.join(app.getPath('userData'), 'ElectronStorage');
  defaultOptions = {
    cwd: this.rootPath,
  };

  userStore = new ElectronStore({
    ...this.defaultOptions,
    name: 'userStore',
  });

  register() {
    ipcMain.handle(Channels.GetUserStore, (_, key: string) => {
      return this.userStore.get(key);
    });
    ipcMain.handle(Channels.SetUserStore, (_, key: string, val: unknown) => {
      return this.userStore.set(key, val);
    });
  }
}
