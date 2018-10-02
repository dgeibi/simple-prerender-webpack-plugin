const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const PrerenderPlugin = require('simple-prerender-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const getRules = forNode => [
  {
    test: /\.css$/,
    use: forNode
      ? ['css-loader/locals']
      : [MiniCssExtractPlugin.loader, 'css-loader'],
  },
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
              '@dgeibi/babel-preset-react-app',
              {
                targets: forNode
                  ? {
                      node: 'current',
                    }
                  : {
                      browsers: 'last 2 versions',
                    },
                useBuiltIns: 'usage',
              },
            ],
          ],
          plugins: ['react-loadable/babel'],
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
                targets: forNode
                  ? {
                      node: 'current',
                    }
                  : {
                      browsers: 'last 2 versions',
                    },
                modules: false,
              },
            ],
          ],
        },
      },
    ],
  },
]

module.exports = (env, args) => {
  const hash = args.mode === 'development' ? '' : '.[contenthash:8]'
  return {
    devtool: 'source-map',
    output: {
      chunkFilename: `[id]${hash}.js`,
      filename: `[name]${hash}.js`,
    },
    entry: path.join(__dirname, 'src/index.js'),
    plugins: [
      new MiniCssExtractPlugin(),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: './src/index.ejs',
        title: 'React Prerender Demo',
      }),
      new HtmlWebpackPlugin({
        filename: 'about/index.html',
        template: './src/index.ejs',
        title: 'React Prerender Demo',
      }),
      new PrerenderPlugin({
        entry: './src/ssr.js',
        config: {
          module: {
            rules: getRules(true),
          },
        },
      }),
    ],
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
    },
    module: {
      rules: getRules(false),
    },
  }
}
