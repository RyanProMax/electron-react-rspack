import { app } from 'electron';

import BaseWindow from './base';
import { Pages } from '../../common/constant';

export default class Main extends BaseWindow {
  page = Pages.Home;
  browserWindow = this.createWindow();

  constructor() {
    super();
    app.on('activate', () => {
      if (!this.browserWindow) {
        this.browserWindow = this.createWindow();
      }
    });
  }

  createWindow() {
    return super.createWindow({
      width: 1024,
      height: 728,
      minWidth: 720,
      minHeight: 480,
      webPreferences: {
        webSecurity: false,
      },
    });
  }
}
