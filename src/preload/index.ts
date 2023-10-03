import { contextBridge, ipcRenderer } from 'electron';

const electronHandler = {
  ipcRenderer,
};

contextBridge.exposeInMainWorld('__ELECTRON__', electronHandler);

export type ElectronHandler = typeof electronHandler;
