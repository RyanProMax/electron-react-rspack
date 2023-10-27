import log from 'electron-log/renderer';
import { Channels, Pages } from '../../common/constant';

import Icon from '../../../assets/icon.svg';
import '../styles/common.less';

const homeLogger = log.scope('home');

export default () => {
  const openWindow = () => {
    homeLogger.info('open sub window');
    window.__ELECTRON__.ipcRenderer.invoke(
      Channels.CreateWindow,
      {
        htmlFileName: Pages.Sub,
      }
    );
  };

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
