const path = require('path')
const PrerenderPlugin = require('../..')

const getConfig = ({ IS_PRERENDER = false } = {}) => ({
  devtool: 'source-map',
  output: {
    chunkFilename: '[id].[contenthash:8].js',
    filename: '[name].[contenthash:8].js',
  },
  entry: path.join(__dirname, 'src/index.js'),
  plugins: [
    !IS_PRERENDER &&
      new PrerenderPlugin({
        routes: ['/index.html', '/xxx/about.html'],
        config: getConfig({ IS_PRERENDER: true }),
        customizeHtmlWebpackPluginOpts: {
          template: './src/index.ejs',
          title: 'Preact Prerender Demo',
        },
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
