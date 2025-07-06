declare global {
  interface Window {
    __ELECTRON__: {
      ipcRenderer: Electron.IpcRenderer;
    };
  }

  interface PackageJson {
    name: string;
    author: string;
    version: string;
    description: string;
    homepage: string;
    repository: {
      type: string;
      url: string;
    };
    license: string;
  }
}

export {};
