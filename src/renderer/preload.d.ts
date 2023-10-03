import { ElectronHandler } from '../preload/index';

declare global {
  interface Window {
    __ELECTRON__: ElectronHandler;
  }
}

export {};
