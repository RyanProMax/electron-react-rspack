import { Configuration } from '@rspack/cli';
import { merge } from 'lodash';

import { port } from '../common/env';
import baseConfiguration from './rspack.config.base';

const devConfiguration: Configuration = {
  mode: 'development',
  target: 'web',
  devServer: {
    port,
    hot: true,
  },
};

export default merge(baseConfiguration, devConfiguration);
