import { Grid, Link } from '@arco-design/web-react';
import MenuBar from '../MenuBar';

import usePackageJson from 'src/renderer/hooks/usePackageJson';

import './index.less';
import useDarkMode from 'src/renderer/hooks/useDarkMode';

const Row = Grid.Row;
const Col = Grid.Col;

const Line = ({ label, content, className }: {
  label: string
  content?: string | React.ReactElement
  className?: string
}) => {
  return (
    <Row className={className}>
      <Col span={6}>{label}:</Col>
      <Col span={18}>{content}</Col>
    </Row>
  );
};

export default () => {
  const packageJson = usePackageJson();
  useDarkMode();

  return (
    <div className='about'>
      <MenuBar title='关于' />
      <div className='about__content'>
        <Line
          label='Homepage'
          content={(
            <Link href={packageJson?.homepage} icon>
              {packageJson?.name}
            </Link>
          )}
          className='about__content-item'
        />
        <Line
          label='Description'
          content={packageJson?.description}
          className='about__content-item'
        />
        <Line
          label='Version'
          content={packageJson?.version}
          className='about__content-item'
        />
        <Line
          label='License'
          content={(
            <div>
              <Link href={'https://choosealicense.com/licenses/mit/'} >
                {packageJson?.license}
              </Link>
              <span style={{ margin: '0 2px' }}>©</span>
              <Link href={'https://github.com/RyanProMax/'} >
                {packageJson?.author}
              </Link>
            </div>
          )}
          className='about__content-item'
        />
      </div>
    </div>
  );
};
