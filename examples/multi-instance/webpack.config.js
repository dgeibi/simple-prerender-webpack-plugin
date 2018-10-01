const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const PrerenderPlugin = require('../..')

module.exports = {
  devtool: 'source-map',
  output: {
    chunkFilename: '[id].[contenthash:8].js',
    filename: '[name].[contenthash:8].js',
  },
  entry: path.join(__dirname, 'src/index.js'),
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.ejs',
      title: 'Demo',
      prerenderId: 'index',
    }),
    new HtmlWebpackPlugin({
      filename: 'about.html',
      template: './src/index.ejs',
      title: 'Demo',
      prerenderId: 'about',
    }),
    new PrerenderPlugin({
      entry: './src/ssr-index.js',
      filename: '[hash].js',
      id: 'index',
    }),
    new PrerenderPlugin({
      entry: './src/ssr-about.js',
      filename: '[hash].js',
      id: 'about',
    }),
  ],
}
