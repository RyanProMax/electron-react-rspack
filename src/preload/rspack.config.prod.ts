import { Configuration } from '@rspack/cli';
import { merge } from 'lodash';

import baseConfiguration from './rspack.config.base';

const devConfiguration: Configuration = {
  mode: 'production',
};

export default merge(baseConfiguration, devConfiguration);
