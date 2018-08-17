const path = require('path')
const webpack = require('webpack')
const PrerenderPlugin = require('../..')

const define = (opts = {}) => {
  const keys = Object.keys(opts)
  if (keys.length < 1) return null

  const definitions = {}
  keys.forEach(key => {
    const value = JSON.stringify(opts[key])
    definitions[key] = value
  })

  return new webpack.DefinePlugin(definitions)
}

const getConfig = ({ IS_PRERENDER = false } = {}) => {
  const IS_CLIENT = !IS_PRERENDER
  const routes = ['/index.html', '/xxx/about.html']

  return {
    devtool: 'source-map',
    output: {
      chunkFilename: IS_CLIENT ? '[id].[contenthash:8].js' : '[id].js',
      filename: IS_CLIENT ? '[name].[contenthash:8].js' : '[name].js',
    },
    entry: path.join(__dirname, 'src/index.js'),
    plugins: [
      IS_CLIENT &&
        new PrerenderPlugin({
          routes,
          config: getConfig({ IS_PRERENDER: true }),
          getHtmlWebpackPluginOpts: content => ({
            template: './src/index.ejs',
            title: 'YARB',
            content,
          }),
        }),
      define({
        'process.env.isSSR': Boolean(IS_PRERENDER),
        'process.env.routes': routes,
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
  }
}

module.exports = getConfig
