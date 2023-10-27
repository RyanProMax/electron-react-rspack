import { Configuration } from '@rspack/cli';
import path from 'path';
import merge from 'lodash/merge';

import baseConfiguration from './rspack.config.base';

const rootPath = process.cwd();

const prodConfiguration: Configuration = {
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    path: path.join(rootPath, 'build/renderer'),
  },
};

export default merge(baseConfiguration, prodConfiguration);
