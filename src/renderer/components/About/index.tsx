import { Link } from '@arco-design/web-react';
import { upperFirst } from 'lodash-es';
import logo from 'assets/icons/256x256.png';
import MenuBar from '../MenuBar';

import usePackageJson from 'src/renderer/hooks/usePackageJson';
import useDarkMode from 'src/renderer/hooks/useDarkMode';

import './index.less';

export default () => {
  const packageJson = usePackageJson();
  const appName = packageJson?.name.split('-').map(upperFirst).join(' ');
  useDarkMode();

  return (
    <div className='about'>
      <MenuBar title='关于' />
      <div className='about__content'>
        <div className='about__intro'>
          <div className='about__heading'>
            <img src={logo} alt='' className='about__logo' />
            <h1>{appName}</h1>
          </div>
          <p className='about__description'>{packageJson?.description}</p>
        </div>
        <dl className='about__versions'>
          <div>
            <dt>应用版本</dt>
            <dd>{packageJson?.version}</dd>
          </div>
          <div>
            <dt>Electron</dt>
            <dd>{window.__ELECTRON__.electronVersion}</dd>
          </div>
        </dl>
        <div className='about__footer'>
          <Link href={packageJson?.homepage} icon>
            项目主页
          </Link>
          <div className='about__license'>
            <Link href='https://choosealicense.com/licenses/mit/'>{packageJson?.license}</Link>
            <span>©</span>
            <Link href='https://github.com/RyanProMax/'>{packageJson?.author}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
