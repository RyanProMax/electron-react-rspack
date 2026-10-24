import { app } from 'electron';
import ElectronStore from 'electron-store';
import path from 'path';

import { Channels } from '../../common/constant';
import Cleanup from '../lifecycle';

function storeKey(key: unknown): string {
  if (typeof key !== 'string' || key.length === 0) {
    throw new TypeError('Store key must be a non-empty string');
  }
  return key;
}

export default class Store {
  private readonly cleanup = new Cleanup();
  private userStore: ElectronStore | null = null;

  start(isTrustedSender: (event: Electron.IpcMainInvokeEvent) => boolean) {
    if (this.userStore || this.cleanup.disposed) return;
    this.userStore = new ElectronStore({
      cwd: path.join(app.getPath('userData'), 'ElectronStorage'),
      name: 'userStore',
    });
    this.cleanup.handle(Channels.GetUserStore, (event, key: unknown) => {
      if (!isTrustedSender(event)) throw new Error('Untrusted IPC sender');
      return this.userStore!.get(storeKey(key));
    });
    this.cleanup.handle(Channels.SetUserStore, (event, key: unknown, val: unknown) => {
      if (!isTrustedSender(event)) throw new Error('Untrusted IPC sender');
      return this.userStore!.set(storeKey(key), val);
    });
  }

  dispose() {
    this.cleanup.dispose();
  }
}
