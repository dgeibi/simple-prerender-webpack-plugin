const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const PrerenderPlugin = require('simple-prerender-webpack-plugin')

const forSSR = {
  compiler: 'simple-prerender-webpack-plugin',
  parser: {
    node: {
      console: false,
      global: false,
      process: false,
      __filename: false,
      __dirname: false,
      Buffer: false,
      setImmediate: false,
    },
  },
}

const sourceDir = path.join(__dirname, 'src')

module.exports = {
  devtool: 'source-map',
  output: {
    chunkFilename: '[id].[contenthash:8].js',
    filename: '[name].[contenthash:8].js',
  },
  entry: path.join(__dirname, 'src/index.js'),
  plugins: [
    ...['index.html', 'xxx/about.html'].map(
      filename =>
        new HtmlWebpackPlugin({
          filename,
          template: './src/index.ejs',
          title: 'Preact Prerender Demo',
        })
    ),
    new PrerenderPlugin({
      entry: './src/ssr.js',
      debug: true,
      writeToDisk: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        oneOf: [
          {
            ...forSSR,
            include: sourceDir,
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              babelrc: false,
              presets: [
                [
                  require('@dgeibi/babel-preset-react-app'),
                  {
                    targets: {
                      node: 'current',
                    },
                    pragma: 'h',
                  },
                ],
              ],
            },
          },
          {
            ...forSSR,
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              babelrc: false,
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      node: 'current',
                    },
                    modules: false,
                  },
                ],
              ],
            },
          },
          {
            loader: 'babel-loader',
            include: sourceDir,
            options: {
              cacheDirectory: true,
              babelrc: false,
              presets: [
                [
                  require('@dgeibi/babel-preset-react-app'),
                  {
                    targets: {
                      browsers: 'last 2 versions',
                    },
                    useBuiltIns: 'usage',
                    pragma: 'h',
                  },
                ],
              ],
            },
          },
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              babelrc: false,
              presets: [
                [
                  '@babel/preset-env',
                  {
                    modules: false,
                    targets: {
                      browsers: 'last 2 versions',
                    },
                  },
                ],
              ],
            },
          },
        ],
      },
    ],
  },
}
