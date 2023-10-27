import { Button } from '@arco-design/web-react';
import { upperFirst } from 'lodash-es';
import { IconBulb, IconGithub } from '@arco-design/web-react/icon';
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

  const openGithub = () => {
    return ipcRenderer.invoke(
      Channels.OpenExternal,
      'https://github.com/RyanProMax/electron-react-rspack'
    );
  };

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
        <p className='home__title'>
          {packageJson?.name
            ? packageJson.name.split('-').map(upperFirst).join(' ')
            : null
          }
        </p>
        <div>
          <Button
            style={{ width: 48, height: 48, fontSize: 20 }}
            shape='circle'
            size='large'
            icon={<IconGithub />}
            onClick={openGithub}
          />
          <Button
            style={{ width: 48, height: 48, fontSize: 20, marginLeft: 16 }}
            shape='circle'
            size='large'
            icon={<IconBulb />}
            onClick={openAboutMe}
          />
        </div>
      </div>
    </div>
  );
};
