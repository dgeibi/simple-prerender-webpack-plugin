const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const PrerenderPlugin = require('simple-prerender-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  devtool: 'source-map',
  output: {
    chunkFilename: '[id].[contenthash:8].js',
    filename: '[name].[contenthash:8].js',
  },
  entry: path.join(__dirname, 'src/index.js'),
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.ejs',
      title: 'Demo',
    }),
    new PrerenderPlugin({
      entry: './src/app.js',
      filename: '[hash].js',
      config: {
        module: {
          rules: [
            {
              test: /\.css$/,
              loader: 'css-loader/locals',
            },
          ],
        },
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
}
