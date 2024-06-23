import { contextBridge, ipcRenderer } from 'electron';

const __ELECTRON_API__ = {
  ipcRenderer: {
    invoke: ipcRenderer.invoke.bind(ipcRenderer),
    send: ipcRenderer.send.bind(ipcRenderer),
    on: ipcRenderer.on.bind(ipcRenderer),
    removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
  },
};

contextBridge.exposeInMainWorld('__ELECTRON__', __ELECTRON_API__);
