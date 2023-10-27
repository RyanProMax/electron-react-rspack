import logo from 'assets/icons/32x32.png';
import MenuIcon from './MenuIcon';

import './index.less';

export default ({
  title, minimize = false, maximize = false, closable = true,
}: {
  title?: string
  minimize?: boolean
  maximize?: boolean
  closable?: boolean
}) => {
  return (
    <div className='menu-bar'>
      <div className='menu-bar-left'>
        <img src={logo} className='menu-bar__logo' />
        {title ? <span>{title}</span> : null}
      </div>
      <MenuIcon minimize={minimize} maximize={maximize} closable={closable} />
    </div >
  );
};
