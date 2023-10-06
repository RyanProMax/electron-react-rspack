import { Configuration } from '@rspack/cli';
import path from 'path';
import fse from 'fs-extra';
import { keyBy } from 'lodash';

import { Pages } from '../common/constant';
import { removeFileExtname } from '../common/utils';

const htmlTemplate = path.join(__dirname, 'template.html');
const entryDir = path.join(__dirname, 'entry');
const files = fse.readdirSync(entryDir);
const entry = keyBy(
  files.map(f => path.join(entryDir, f)),
  filePath => removeFileExtname(filePath)
);

const baseConfiguration: Configuration = {
  entry,
  builtins: {
    html: [
      {
        template: htmlTemplate,
        filename: Pages.Home,
        chunks: ['home'],
      },
      {
        template: htmlTemplate,
        filename: Pages.Sub,
        chunks: ['sub'],
      }
    ],
  },
  module: {
    rules: [
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.s?(c|a)ss$/,
        use: ['sass-loader'],
        type: 'css',
      },
    ],
  }
};

export default baseConfiguration;
