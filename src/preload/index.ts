import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { CHANNELS } from '../common/constant';

const electronHandler = {
  ipcRenderer: {
    invoke(channel: CHANNELS, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
    on(channel: CHANNELS, subscription: (_event: IpcRendererEvent, ...args: unknown[]) => void) {
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: CHANNELS, subscription: (_event: IpcRendererEvent, ...args: unknown[]) => void) {
      ipcRenderer.once(channel, subscription);
    },
  },
};

contextBridge.exposeInMainWorld('__ELECTRON__', electronHandler);

export type ElectronHandler = typeof electronHandler;
