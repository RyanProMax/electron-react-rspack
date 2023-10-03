import { CHANNELS, PAGES } from '../../common/constant';

import Icon from '../../../assets/icon.svg';
import './Main.css'

export default () => {
  const openWindow = () =>
    window.__ELECTRON__.ipcRenderer.invoke(
      CHANNELS.CREATE_WINDOW,
      {
        htmlFileName: PAGES.SUB_PAGE,
      }
    );

  return (
    <div>
      <div className="Hello">
        <Icon />
      </div>
      <h1>electron-react-rspack</h1>
      <div className="Hello">
        <button type="button" onClick={openWindow}>
          open sub window
        </button>
      </div>
    </div>

  );
};
