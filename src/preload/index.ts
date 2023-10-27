import { contextBridge, ipcRenderer } from 'electron';
import { isDev, port } from 'src/common/env';

const __ELECTRON_API__ = {
  ipcRenderer: {
    ...ipcRenderer,
    // https://stackoverflow.com/questions/66913598/ipcrenderer-on-is-not-a-function
    on: ipcRenderer.on.bind(ipcRenderer),
    removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
  },
};
const __ENV__ = {
  env: process.env.NODE_ENV,
  isDev,
  port,
};

contextBridge.exposeInMainWorld('__ELECTRON__', __ELECTRON_API__);
contextBridge.exposeInMainWorld('__ENV__', __ENV__);

export type __ELECTRON__ = typeof __ELECTRON_API__;
export type __ENV__ = typeof __ENV__;
