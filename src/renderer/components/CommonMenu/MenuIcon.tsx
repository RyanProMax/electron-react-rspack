import { useState } from 'react';
import classnames from 'classnames';
import { Channels } from 'src/common/constant';
import { ipcRenderer } from 'src/renderer/utils';

import { IconMinus, IconClose } from '@arco-design/web-react/icon';
import IconMaximize from 'src/renderer/images/maximize.svg';
import IconUnmaximize from 'src/renderer/images/unmaximize.svg';

import './MenuIcon.less';

export default ({ isDefaultMaximize = false, className }: {
  isDefaultMaximize?: boolean
  className?: string
}) => {
  const [isMaximize, setIsMaximize] = useState(isDefaultMaximize);

  const onMinimize = () => {
    return ipcRenderer.send(Channels.Minimize);
  };

  const onMaximize = () => {
    setIsMaximize(v => !v);
    return ipcRenderer.send(Channels.Maximize);
  };

  const onClose = () => {
    return ipcRenderer.send(Channels.Close);
  };

  return (
    <div className={classnames('menu-icon', className)}>
      <IconMinus onClick={onMinimize} className='menu-icon__item' />
      {isMaximize ? (
        <IconUnmaximize onClick={onMaximize} className='menu-icon__item--svg' />
      ) : (
        <IconMaximize onClick={onMaximize} className='menu-icon__item--svg' />
      )}
      <IconClose onClick={onClose} className='menu-icon__item' />
    </div>
  );
};