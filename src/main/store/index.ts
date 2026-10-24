import { app } from 'electron';
import ElectronStore from 'electron-store';
import path from 'path';

import { Channels } from '../../common/constant';
import Cleanup from '../lifecycle';

export default class Store {
  private readonly cleanup = new Cleanup();
  private userStore: ElectronStore | null = null;

  start(isTrustedSender: (event: Electron.IpcMainInvokeEvent) => boolean) {
    if (this.userStore || this.cleanup.disposed) return;
    this.userStore = new ElectronStore({
      cwd: path.join(app.getPath('userData'), 'ElectronStorage'),
      name: 'userStore',
    });
    this.cleanup.handle(Channels.GetUserStore, (event, key: string) => {
      if (!isTrustedSender(event)) throw new Error('Untrusted IPC sender');
      return this.userStore!.get(key);
    });
    this.cleanup.handle(Channels.SetUserStore, (event, key: string, val: unknown) => {
      if (!isTrustedSender(event)) throw new Error('Untrusted IPC sender');
      return this.userStore!.set(key, val);
    });
  }

  dispose() {
    this.cleanup.dispose();
  }
}
