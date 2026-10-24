import BaseWindow from './base';
import { Pages } from '../../common/constant';

export default class About extends BaseWindow {
  page = Pages.About;

  createWindow() {
    return super.createWindow({ width: 520, height: 280, minHeight: 280, resizable: false });
  }
}
