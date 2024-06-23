import BaseWindow from './base';
import Main from './main';
import About from './about';

import { Pages } from '../../common/constant';

export default class Windows {
  private windowInstances = new Map<Pages, BaseWindow>();
  private RegisterWindows = [
    Main,
    About,
  ];

  getWindowInstance(page: Pages) {
    return this.windowInstances.get(page);
  }

  getBrowserWindow(page: Pages) {
    const windowInstance = this.getWindowInstance(page);
    return windowInstance?.browserWindow;
  }

  getAllWindows() {
    return Array.from(this.windowInstances.values())
      .map(instance => instance.browserWindow)
      .filter(v => Boolean(v)) as Electron.BrowserWindow[];
  }

  constructor() {
    this.RegisterWindows.forEach(WindowClass => {
      const instance = new WindowClass();
      this.windowInstances.set(instance.page, instance);
    });
  }
}
