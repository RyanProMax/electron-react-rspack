import { __ELECTRON__, __ENV__ } from '../preload/index';

declare global {
  interface Window {
    __ELECTRON__: __ELECTRON__;
    __ENV__: __ENV__;
  }
}

export { };
