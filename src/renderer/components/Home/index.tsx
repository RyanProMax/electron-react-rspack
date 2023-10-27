import { Button } from '@arco-design/web-react';
import log from 'electron-log/renderer';

import { Channels } from 'src/common/constant';
import { ipcRenderer } from 'src/renderer/utils';
import usePackageJson from 'src/renderer/hooks/usePackageJson';

import Titlebar from './Titlebar';
import logo from 'assets/icons/256x256.png';

import './index.less';

const homeLogger = log.scope('home');

export default () => {
  const packageJson = usePackageJson();

  const openAboutMe = () => {
    homeLogger.info('open about me');
    ipcRenderer.send(Channels.AboutMe);
  };

  return (
    <div className='home'>
      <Titlebar packageJson={packageJson} />
      <div className='home__content'>
        <div className='home__logo-container'>
          <img src={logo} className='home__logo' />
        </div>
        <p className='home__title'>{packageJson?.name}</p>
        <Button type='primary' size='large' onClick={openAboutMe}>
          About me
        </Button>
      </div>
    </div>
  );
};
