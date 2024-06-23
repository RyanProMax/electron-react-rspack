import { contextBridge, ipcRenderer } from 'electron';

const __ELECTRON_API__ = {
  ipcRenderer: {
    ...ipcRenderer,
    // https://stackoverflow.com/questions/66913598/ipcrenderer-on-is-not-a-function
    on: ipcRenderer.on.bind(ipcRenderer),
    removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
  },
};

contextBridge.exposeInMainWorld('__ELECTRON__', __ELECTRON_API__);
