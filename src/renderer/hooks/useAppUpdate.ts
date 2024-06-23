import { useEffect, useState } from 'react';
import { UpdateInfo, ProgressInfo } from 'electron-updater';

import { Channels } from 'src/common/constant';
import { ipcRenderer } from 'src/renderer/utils';

export enum Status {
  Confirm = 'Confirm',
  Waiting = 'Waiting',
  Downloading = 'Downloading',
  Done = 'Done',
}

export default () => {
  const [status, setStatus] = useState(Status.Confirm);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();
  const [progress, setProgress] = useState<ProgressInfo>();

  const confirmCallback = (option: boolean) => {
    if (option) {
      setStatus(Status.Waiting);
    }
    ipcRenderer.send(Channels.AppUpdaterConfirm, option);
  };

  const abort = () => {
    ipcRenderer.send(Channels.AppUpdaterAbort);
  };

  useEffect(() => {
    const handleUpdate = (_: Electron.IpcRendererEvent, data: UpdateInfo) => {
      setUpdateInfo(data);
    };
    const handleProgress = (_: Electron.IpcRendererEvent, data: ProgressInfo) => {
      if (status === Status.Waiting) {
        setStatus(Status.Downloading);
      }
      if (data.percent === 100) {
        setStatus(Status.Done);
      }
      setProgress(data);
    };

    ipcRenderer.on(Channels.Render, handleUpdate);
    ipcRenderer.on(Channels.AppUpdaterProgress, handleProgress);

    return () => {
      ipcRenderer.removeListener(Channels.Render, handleUpdate);
      ipcRenderer.removeListener(Channels.AppUpdaterProgress, handleProgress);
    };
  }, []);

  return { status, updateInfo, progress, confirmCallback, abort };
};
