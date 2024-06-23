import { Configuration } from '@rspack/cli';
import path from 'path';
import merge from 'lodash/merge';

import baseConfiguration from './rspack.config.base';

const outputPath = path.join(__dirname, '../../build/renderer');

const prodConfiguration: Configuration = {
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    path: outputPath,
  },
};

export default merge(baseConfiguration, prodConfiguration);
