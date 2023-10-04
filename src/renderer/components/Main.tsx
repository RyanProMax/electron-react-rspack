import { Channels, Pages } from '../../common/constant';

import Icon from '../../../assets/icon.svg';
import '../styles/common.scss';

export default () => {
  const openWindow = () =>
    window.__ELECTRON__.ipcRenderer.invoke(
      Channels.CreateWindow,
      {
        htmlFileName: Pages.Sub,
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
