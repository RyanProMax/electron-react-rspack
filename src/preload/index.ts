import { contextBridge } from 'electron';

import { BRIDGE_CHANNEL } from '../common/constant';
import { createWindow } from '../common/utils';

contextBridge.exposeInMainWorld('electronAPI', {
  [BRIDGE_CHANNEL.CREATE_WINDOW]: createWindow
});
