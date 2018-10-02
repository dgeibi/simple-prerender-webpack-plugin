const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const PrerenderPlugin = require('simple-prerender-webpack-plugin')

const getConfig = ({ IS_PRERENDER = false } = {}) => ({
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
  ].filter(Boolean),
  module: {
    rules: [
      {
        test: /\.js$/,
        oneOf: [
          {
            loader: 'babel-loader',
            include: path.join(__dirname, 'src'),
            options: {
              cacheDirectory: true,
              babelrc: false,
              presets: [
                [
                  require('@dgeibi/babel-preset-react-app'),
                  {
                    targets: IS_PRERENDER
                      ? {
                          node: 'current',
                        }
                      : {
                          browsers: 'last 2 versions',
                        },
                    useBuiltIns: IS_PRERENDER ? false : 'usage',
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
                  },
                ],
              ],
            },
          },
        ],
      },
    ].filter(Boolean),
  },
})

module.exports = getConfig
