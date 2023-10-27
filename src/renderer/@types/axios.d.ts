import * as AxiosType from 'axios';

declare namespace _AxiosType {
  type IAxiosRequestConfig = AxiosType.AxiosRequestConfig;
}

export = _AxiosType;
export as namespace __AXIOS__;
