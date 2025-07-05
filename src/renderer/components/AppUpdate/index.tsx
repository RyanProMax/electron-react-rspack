import { round } from 'lodash-es';
import { Button, Progress } from '@arco-design/web-react';
import MenuIcon from '../MenuBar/MenuIcon';
import TextLine from '../TextLine';

import usePackageJson from 'src/renderer/hooks/usePackageJson';
import useDarkMode from 'src/renderer/hooks/useDarkMode';
import useAppUpdate, { Status } from 'src/renderer/hooks/useAppUpdate';

import './index.less';

export default () => {
  useDarkMode();
  const packageJson = usePackageJson();
  const { status, updateInfo, progress, confirmCallback, abort } = useAppUpdate();

  return (
    <div className='app-updater'>
      <div className='app-updater__header'>
        <span>New Version: {updateInfo?.version}</span>
        <MenuIcon className='app-updater__menu' />
      </div>
      <div className='app-updater__content'>
        <TextLine
          label='current version'
          labelAlign='right'
          content={packageJson?.version}
          className='app-updater__content-item'
        />
        <TextLine
          label='latest version'
          labelAlign='right'
          content={updateInfo?.version}
          className='app-updater__content-item'
        />
        {status !== Status.Confirm ? (
          <Progress percent={round(progress?.percent || 0)} className='app-updater__progress' />
        ) : null}
      </div>
      <div className='app-updater__footer'>
        {status === Status.Confirm ? (
          <>
            <Button onClick={() => confirmCallback(false)} className='app-updater__footer-button'>
              Cancel
            </Button>
            <Button
              type='primary'
              onClick={() => confirmCallback(true)}
              className='app-updater__footer-button'
            >
              Update Now
            </Button>
          </>
        ) : (
          <Button onClick={abort} className='app-updater__footer-button'>
            Abort Update
          </Button>
        )}
      </div>
    </div>
  );
};
