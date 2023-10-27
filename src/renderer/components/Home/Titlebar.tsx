import { upperFirst } from 'lodash-es';
import { IconMinus, IconClose } from '@arco-design/web-react/icon';
import IconMaximize from 'src/renderer/images/maximize.svg';
import IconUnmaximize from 'src/renderer/images/unmaximize.svg';

import { Channels } from 'src/common/constant';
import { ipcRenderer } from 'src/renderer/utils';

import logo from 'assets/icons/32x32.png';
import { useState } from 'react';

interface Props {
  packageJson?: PackageJson
}

export default ({ packageJson }: Props) => {
  const [isMaximize, setIsMaximize] = useState(false);

  const onMinimize = () => {
    return ipcRenderer.send(Channels.Minimize);
  };

  const onMaximize = () => {
    setIsMaximize(v => !v);
    return ipcRenderer.send(Channels.Maximize);
  };

  const onClose = () => {
    return ipcRenderer.send(Channels.Quit);
  };

  return (
    <div className='titlebar'>
      <div className='titlebar-left'>
        <img src={logo} className='titlebar__logo' />
        {packageJson ? (
          <>
            <span>{packageJson.name.split('-').map(upperFirst).join('')}</span>
            <span>Ver: {packageJson.version}</span>
          </>
        ) : null}
      </div>
      <div className='titlebar-right' >
        <IconMinus onClick={onMinimize} className='titlebar__icon' />
        {isMaximize ? (
          <IconUnmaximize onClick={onMaximize} className='titlebar__icon--svg' />
        ) : (
          <IconMaximize onClick={onMaximize} className='titlebar__icon--svg' />
        )}
        <IconClose onClick={onClose} className='titlebar__icon' />
      </div>
    </div>
  );
};
