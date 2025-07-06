import { Configuration, HtmlRspackPlugin } from '@rspack/core';
import { ArcoDesignPlugin } from '@arco-plugins/unplugin-react';
import path from 'path';
import fse from 'fs-extra';
import keyBy from 'lodash/keyBy';
import upperFirst from 'lodash/upperFirst';

import { removeFileExtname } from '../main/utils';
import { port } from '../common/env';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

const htmlTemplate = path.join(__dirname, 'template.html');
const entryDir = path.join(__dirname, 'entry');
const files = fse.readdirSync(entryDir);
const entry = keyBy(
  files.map((f) => path.join(entryDir, f)),
  (filePath) => removeFileExtname(filePath)
);

const configuration: Configuration = {
  target: 'web',
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
  entry,
  output: {
    path: path.join(process.cwd(), '../../build/renderer'),
    publicPath: 'auto',
    filename: isProduction ? '[name].[contenthash:8].js' : '[name].js',
    chunkFilename: isProduction ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, './'),
      src: path.resolve(__dirname, '../'),
      assets: path.resolve(__dirname, '../../assets'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: isDevelopment,
                  },
                },
              },
            },
          },
        ],
        exclude: /node_modules/, // 排除 node_modules 提高性能
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                modifyVars: {
                  // 'arcoblue-6': '#37D4CF',
                },
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        oneOf: [
          {
            // 当使用 ?react 查询参数时，转换为 React 组件
            resourceQuery: /react/,
            use: [
              {
                loader: '@svgr/webpack',
                options: {
                  icon: true, // 优化为图标使用
                  svgoConfig: {
                    plugins: [
                      {
                        name: 'removeViewBox',
                        active: false, // 保留 viewBox 以支持响应式
                      },
                    ],
                  },
                },
              },
            ],
          },
          {
            type: 'asset/resource',
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|webp)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 小于 8KB 的图片内联为 base64
          },
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    ...Object.keys(entry).map((entryName) => {
      return new HtmlRspackPlugin({
        template: htmlTemplate,
        filename: `${entryName}.html`,
        chunks: [entryName], // 只包含对应的入口点
        title: `${upperFirst(entryName)} - Electron React App`,
        minify: isProduction,
      });
    }),
    new ArcoDesignPlugin({
      // theme: '@arco-themes/react-asuka',
      // iconBox: '@arco-iconbox/react-partial-bits',
      removeFontFace: true,
    }),
  ],
  devServer: {
    port,
    hot: true,
    open: false,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          chunks: 'all',
        },
        arco: {
          name: 'arco-design',
          test: /[\\/]node_modules[\\/]@arco-design[\\/]/,
          priority: 20, // 优先级高于 vendor
          chunks: 'all',
        },
      },
    },
    ...(isProduction && {
      minimize: true,
      sideEffects: false,
    }),
  },
  performance: {
    // 资源大小警告阈值
    maxAssetSize: 500 * 1000, // 500KB
    maxEntrypointSize: 2 * 1024 * 1000, // 2MB
    // 过滤掉字体文件的警告
    assetFilter: (assetFilename) => {
      return !assetFilename.endsWith('.woff') && !assetFilename.endsWith('.woff2');
    },
  },
};

export default configuration;
