import BaseWindow from './base';
import { Pages } from '../../common/constant';

export default class Main extends BaseWindow {
  page = Pages.Home;

  createWindow() {
    return super.createWindow({
      width: 1024,
      height: 728,
      minWidth: 720,
      minHeight: 480,
    });
  }
}
