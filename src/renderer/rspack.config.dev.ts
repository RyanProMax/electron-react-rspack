import { Configuration } from '@rspack/cli';
import merge from 'lodash/merge';

import { port } from '../common/env';
import baseConfiguration from './rspack.config.base';

const devConfiguration: Configuration = {
  mode: 'development',
  devServer: {
    port,
    hot: true,
  },
};

export default merge(baseConfiguration, devConfiguration);
