import log from 'electron-log/renderer';
import { Channels } from 'src/common/constant';

import Titlebar from './Titlebar';
import { Button } from '@arco-design/web-react';
import logo from 'assets/icons/256x256.png';

import './index.less';

const homeLogger = log.scope('home');

export default () => {
  const openWindow = () => {
    homeLogger.info('open sub window');
    window.__ELECTRON__.ipcRenderer.send(Channels.CreateSubWindow);
  };

  return (
    <div className='home'>
      <Titlebar />

      <div className='home__content'>
        <div className='home__logo-container'>
          <img src={logo} className='home__logo' />
        </div>
        <p className='home__title'>electron-react-rspack</p>
        <Button type='primary' size='large' onClick={openWindow}>
          Open Sub Window
        </Button>
      </div>
    </div>
  );
};
