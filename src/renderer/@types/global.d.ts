import { __ELECTRON__, __ENV__ } from '../../preload/index';

declare global {
  interface Window {
    __ELECTRON__: __ELECTRON__;
    __ENV__: __ENV__;
  }

  type PackageJson = {
    name: string
    author: string
    version: string
    description: string
    homepage: string
    repository: {
      type: string
      url: string
    }
    license: string
  }
}

export { };
