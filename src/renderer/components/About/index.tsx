import MenuBar from '../MenuBar';
import './index.less';

export default () => {
  return (
    <div className='about'>
      <MenuBar title='关于' />
      <h1>Electron</h1>
    </div>
  );
};
