import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Channels } from '../common/constant';

const electronHandler = {
  ipcRenderer: {
    invoke(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
    send(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, subscription: (_event: IpcRendererEvent, ...args: unknown[]) => void) {
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, subscription: (_event: IpcRendererEvent, ...args: unknown[]) => void) {
      ipcRenderer.once(channel, subscription);
    },
  },
};

contextBridge.exposeInMainWorld('__ELECTRON__', electronHandler);

export type ElectronHandler = typeof electronHandler;
