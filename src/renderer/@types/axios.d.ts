import * as axios from 'axios';

declare global {
  namespace AxiosType {
    type AxiosRequestConfig = axios.AxiosRequestConfig;
  }
}
