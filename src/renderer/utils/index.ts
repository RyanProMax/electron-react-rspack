import axios from 'axios';

import { Channels } from 'src/common/constant';

export const ipcRenderer = window.__ELECTRON__.ipcRenderer;

export const callApi = async ({
  raw = false, headers, ...config
}: __AXIOS__.IAxiosRequestConfig & { raw?: boolean }) => {
  const result = await axios({
    headers: {
      Accept: 'application/json',
      ['Content-Type']: config.method?.toLowerCase() === 'post'
        ? 'application/x-www-form-urlencoded'
        : 'application/json',
      ...headers,
    },
    method: 'get',
    ...config,
  });
  return raw ? result : result.data;
};

export const getUserStore = <T>(key: T) => {
  return ipcRenderer.invoke(Channels.GetUserStore, key);
};

export const setUserStore = <T, U>(key: T, value: U) => {
  return ipcRenderer.invoke(Channels.SetUserStore, key, value);
};
