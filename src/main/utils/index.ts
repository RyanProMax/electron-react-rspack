import { app } from 'electron';
import path from 'path';
import { URL, pathToFileURL } from 'url';
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
  return pathToFileURL(path.resolve(__dirname, './renderer/', htmlFileName)).href;
}

export function getPreloadPath(): string {
  return path.join(__dirname, 'preload.js');
}

export const getPackageJson = () => {
  const filePath = path.resolve(__dirname, '../package.json');

  return fse.readFile(filePath, 'utf-8');
};
