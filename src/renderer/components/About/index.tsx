import { Link } from '@arco-design/web-react';
import MenuBar from '../MenuBar';
import TextLine from '../TextLine';

import usePackageJson from 'src/renderer/hooks/usePackageJson';
import useDarkMode from 'src/renderer/hooks/useDarkMode';

import './index.less';

const colSpan: [number, number] = [6, 18];

export default () => {
  const packageJson = usePackageJson();
  useDarkMode();

  return (
    <div className='about'>
      <MenuBar title='关于' />
      <div className='about__content'>
        <TextLine
          label='Homepage'
          content={
            <Link href={packageJson?.homepage} icon>
              {packageJson?.name}
            </Link>
          }
          colSpan={colSpan}
          className='about__content-item'
        />
        <TextLine
          label='Description'
          content={packageJson?.description}
          colSpan={colSpan}
          className='about__content-item'
        />
        <TextLine
          label='Version'
          content={packageJson?.version}
          colSpan={colSpan}
          className='about__content-item'
        />
        <TextLine
          label='License'
          content={
            <div>
              <Link href={'https://choosealicense.com/licenses/mit/'}>{packageJson?.license}</Link>
              <span style={{ margin: '0 2px' }}>©</span>
              <Link href={'https://github.com/RyanProMax/'}>{packageJson?.author}</Link>
            </div>
          }
          colSpan={colSpan}
          className='about__content-item'
        />
      </div>
    </div>
  );
};
