import { app } from 'electron';
import path from 'path';
import { URL } from 'url';
import fse from 'fs-extra';

import { port } from '../../common/env';

export function getAssetPath(...paths: string[]): string {
  const resourcePath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  return path.join(resourcePath, ...paths);
}

export function getHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, './renderer/', htmlFileName)}`;
}

export function getPreloadPath(): string {
  return app.isPackaged
    ? path.join(__dirname, 'preload.js')
    : path.join(process.cwd(), '../../build/preload.js');
}

export const removeFileExtname = (fileName: string) => {
  return path.basename(fileName, path.extname(fileName));
};

export const getPackageJson = () => {
  const filePath = app.isPackaged
    ? path.resolve(__dirname, '../package.json')
    : path.join(process.cwd(), '../../package.json');

  return fse.readFile(filePath, 'utf-8');
};
