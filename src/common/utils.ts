import { app, BrowserWindow } from 'electron';
import path from 'path';
import { URL } from 'url';

import { port } from './env';

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export function getAssetPath(...paths: string[]): string {
  return path.join(RESOURCES_PATH, ...paths);
}

export function getHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function getPreloadPath(): string {
  return app.isPackaged
    ? path.join(__dirname, 'preload.js')
    : path.join(__dirname, '../preload/dll/preload.js')
}

export const removeFileExtname = (fileName: string) => {
  return path.basename(fileName, path.extname(fileName))
}

export const createWindow = ({ htmlFileName, minimize = false, onClose = () => {} }: {
  htmlFileName: string,
  minimize?: boolean,
  onClose?: () => unknown
}) => {
  const browserWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  browserWindow.loadURL(getHtmlPath(htmlFileName));

  browserWindow.on('ready-to-show', () => {
    if (minimize) {
      browserWindow.minimize();
    } else {
      browserWindow.show();
    }
  });

  browserWindow.on('closed', onClose);

  return browserWindow;
}
