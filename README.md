# simple-prerender-webpack-plugin

[![version][version-badge]][package]

## Install

```sh
$ npm install --save-dev simple-prerender-webpack-plugin
# install peer dependencies
$ npm install --save-dev webpack html-webpack-plugin
```

## Usage

`webpack.config.js`:

```js
const SimplePrerenderWebpackPlugin = require('simple-prerender-webpack-plugin')

module.exports = {
  plugins: [
    new SimplePrerenderWebpackPlugin({
      // generate index.html, about/index.html
      routes: ['/', '/about'],

      // entry point, provide render function: (pathname) => content
      entry: './src/ssr/render.js',

      // (optional)
      // string: path to base webpack config
      // function | object: webpack config
      config: './config/webpack.base.config.js',

      // (optional): (content, pathname) => HtmlWebpackPluginOpts
      // The returned value will be merged into HtmlWebpackPluginOpts
      // see also https://www.npmjs.com/package/html-webpack-plugin
      getHtmlWebpackPluginOpts: (content, pathname) => ({
        content,
        template: './src/index.ejs',
      }),

      // (optional): whether enable sourcemap
      sourcemap: true,

      // (optional): filename of output
      // note: filename will be resolved with `outputPath` below
      filename: 'prerender.js',

      // (optional):
      outputPath: '.prerender'

      // (optional): opts passed to webpack-node-externals
      // see also https://www.npmjs.com/package/webpack-node-externals
      nodeExternalsOptions: {},
    }),
  ],
}
```

## LICENSE

[MIT](LICENSE)

[version-badge]: https://img.shields.io/npm/v/simple-prerender-webpack-plugin.svg
[package]: https://www.npmjs.com/package/simple-prerender-webpack-plugin
