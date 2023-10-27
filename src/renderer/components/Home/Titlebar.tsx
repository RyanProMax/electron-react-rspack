import { upperFirst } from 'lodash-es';

import logo from 'assets/icons/32x32.png';
import MenuIcon from '../CommonMenu/MenuIcon';

interface Props {
  packageJson?: PackageJson
}

export default ({ packageJson }: Props) => {
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
      <MenuIcon />
    </div >
  );
};
