import { Grid } from '@arco-design/web-react';
import MenuBar from '../MenuBar';

import usePackageJson from 'src/renderer/hooks/usePackageJson';

import './index.less';

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
  console.log('packageJson', packageJson);

  return (
    <div className='about'>
      <MenuBar title='关于' />
      <div className='about__content'>
        <Line
          label='Homepage'
          content={(
            <a href={packageJson?.homepage} target='__blank'>
              {packageJson?.name}
            </a>
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
              <a href={'https://choosealicense.com/licenses/mit/'} target='__blank'>
                {packageJson?.license}
              </a>
              <span style={{ margin: '0 6px' }}>©</span>
              <a href={'https://github.com/RyanProMax/'} target='__blank'>
                {packageJson?.author}
              </a>
            </div>
          )}
          className='about__content-item'
        />
      </div>
    </div>
  );
};
