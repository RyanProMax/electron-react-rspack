import { Configuration } from '@rspack/cli';
import path from 'path';
import fse from 'fs-extra';
import keyBy from 'lodash/keyBy';

import { Pages } from '../common/constant';
import { removeFileExtname } from '../main/utils';

const htmlTemplate = path.join(__dirname, 'template.html');
const entryDir = path.join(__dirname, 'entry');
const files = fse.readdirSync(entryDir);
const entry = keyBy(
  files.map(f => path.join(entryDir, f)),
  filePath => removeFileExtname(filePath)
);
const html = Object.values(Pages).map(filename => ({
  template: htmlTemplate,
  filename,
  chunks: [removeFileExtname(filename)],
}));

const baseConfiguration: Configuration = {
  target: 'web',
  entry,
  resolve: {
    tsConfigPath: path.resolve(__dirname, '../../tsconfig.json'),
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  builtins: {
    html,
    pluginImport: [
      {
        libraryName: '@arco-design/web-react',
        libraryDirectory: 'es',
        camelToDashComponentName: false,
        style: true,
      },
      {
        libraryName: '@arco-design/web-react/icon',
        libraryDirectory: 'react-icon',
        camelToDashComponentName: false,
      },
    ],
  },
  module: {
    rules: [
      // Images
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.less$/,
        use: [{
          loader: 'less-loader',
          options: {
            lessOptions: {
              modifyVars: {
                // custom your primary color
                // 'arcoblue-6': '#37D4CF',
              },
              javaScriptEnabled: true,
            }
          }
        }],
        type: 'css',
      },
    ],
  }
};

export default baseConfiguration;
