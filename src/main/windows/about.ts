import { ipcMain } from 'electron';

import BaseWindow from './base';
import { Channels, Pages } from '../../common/constant';

export default class About extends BaseWindow {
  page = Pages.About;

  register() {
    ipcMain.on(Channels.AboutMe, () => {
      this.createWindow();
    });
  }
}
