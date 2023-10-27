import { upperFirst } from 'lodash-es';
import { IconMinus, IconClose } from '@arco-design/web-react/icon';

import { Channels } from 'src/common/constant';
import { ipcRenderer } from 'src/renderer/utils';

import logo from 'assets/icons/32x32.png';

interface Props {
  packageJson?: PackageJson
}

export default ({ packageJson }: Props) => {
  const onMinimize = () => {
    return ipcRenderer.send(Channels.Minimize);
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
        <IconClose onClick={onClose} className='titlebar__icon' />
      </div>
    </div>
  );
};
