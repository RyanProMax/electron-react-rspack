import { Link } from '@arco-design/web-react';
import MenuBar from '../MenuBar';

import usePackageJson from 'src/renderer/hooks/usePackageJson';
import useDarkMode from 'src/renderer/hooks/useDarkMode';

import './index.less';

export default () => {
  const packageJson = usePackageJson();
  useDarkMode();

  return (
    <div className='about'>
      <MenuBar title='关于' />
      <div className='about__content'>
        <p className='about__description'>{packageJson?.description}</p>
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
