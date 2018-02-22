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

      // (optional)
      // string: path to base webpack config
      // function | object: webpack config
      config: './config/webpack.base.config.js',

      // entry point, provide render function: (pathname) => content
      entry: './src/ssr/render.js',

      // (optional): (content, pathname) => HtmlWebpackPluginOpts
      // The returned value will be merged into HtmlWebpackPluginOpts
      // see also https://www.npmjs.com/package/html-webpack-plugin
      getHtmlWebpackPluginOpts: (content, pathname) => ({
        content,
        template: './src/index.ejs',
      }),

      // (optional): enable sourcemap
      sourcemap: true,

      // (optional): whether write output into disk for debugging
      // default: false
      // value:
      //    false   : disabled
      //    true    : use default filename(`prerender.js`)
      //    <string>: use custom filename
      // note: filename will be resolved with webpackConfig.output.path
      writeFile: false,

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
