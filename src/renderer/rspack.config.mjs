// @ts-check
import { HtmlRspackPlugin } from '@rspack/core';
import path from 'node:path';
import { analysisPlugins } from '../../scripts/analysis.mjs';
import dotenv from 'dotenv';
import upperFirst from 'lodash/upperFirst.js';

import { rendererEntries } from '../../scripts/renderer-entries.mjs';
const configDir = import.meta.dirname;
dotenv.config({ path: path.resolve(configDir, '../../.env'), quiet: true });
const port = Number(process.env.PORT) || 9527;

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

const htmlTemplate = path.join(configDir, 'template.html');
const entryDir = path.join(configDir, 'entry');
const entry = rendererEntries(entryDir);

/** @type {import('@rspack/core').Configuration} */
const configuration = {
  context: configDir, // loaders are dependencies of the renderer workspace
  target: 'web',
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
  entry,
  output: {
    path: path.resolve(configDir, '../../build/renderer'),
    publicPath: 'auto',
    filename: isProduction ? '[name].[contenthash:8].js' : '[name].js',
    chunkFilename: isProduction ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
    clean: true,
  },
  resolve: {
    tsConfig: path.resolve(configDir, '../../tsconfig.json'),
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(configDir, './'),
      src: path.resolve(configDir, '../'),
      assets: path.resolve(configDir, '../../assets'),
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
              // Official SWC replacement for the Arco plugin's import transform.
              transformImport: [
                {
                  libraryName: '@arco-design/web-react',
                  libraryDirectory: 'es',
                  style: true,
                  camelToDashComponentName: false,
                },
                {
                  libraryName: '@arco-design/web-react/icon',
                  libraryDirectory: 'react-icon',
                  camelToDashComponentName: false,
                },
              ],
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
                quietDeprecations: true,
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
    ...(await analysisPlugins('renderer')),
  ],
  devServer: {
    host: 'localhost',
    // 2.2.1 vendors launch-editor 2.14.1: a dependency override cannot fix it.
    // The browser-to-editor endpoint is unused by this app; keep it unreachable.
    setupMiddlewares: (middlewares) => {
      // Block before the server's generic assets route as well as removing the
      // editor handler, so this URL cannot fall through to a 200 response.
      middlewares.unshift({
        name: 'disable-browser-editor',
        path: '/rspack-dev-server/open-editor',
        /**
         * @param {import('node:http').IncomingMessage} _request
         * @param {import('node:http').ServerResponse} response
         */
        middleware: (_request, response) => {
          response.statusCode = 404;
          response.end();
        },
      });
      return middlewares.filter(
        (middleware) => middleware.name !== 'rspack-dev-server-open-editor'
      );
    },
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
  performance: isProduction
    ? {
        // 资源大小警告阈值
        maxAssetSize: 800 * 1000, // 800KB
        maxEntrypointSize: 2 * 1024 * 1000, // 2MB
        // 过滤掉字体文件的警告
        assetFilter: (assetFilename) => {
          return (
            !assetFilename.endsWith('.map') &&
            !assetFilename.endsWith('.woff') &&
            !assetFilename.endsWith('.woff2')
          );
        },
      }
    : {
        hints: false,
      },
};

export default configuration;
