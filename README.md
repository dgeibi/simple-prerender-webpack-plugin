# simple-prerender-webpack-plugin

[![version][version-badge]][package]

## Features

* Based on Promise
* Support dynamic import
* Sourcemap: to enable sourcemap just configure webpack with `devtool: source-map`
* Inject rendering result into html-webpack-plugin as `htmlWebpackPlugin.options.prerendered`

由于 html-webpack-plugin 是动态加入的插件，所有依赖 html-webpack-plugin 的其它 webpack 插件需要放在 friends 数组中。

## Install

```sh
$ npm install webpack html-webpack-plugin
$ npm install simple-prerender-webpack-plugin
```

## Examples

* [dgeibi/yarb](https://github.com/dgeibi/yarb)
* [dgeibi/the-little-cipher](https://github.com/dgeibi/the-little-cipher)

## Usage

`webpack.config.js`:

```js
const SimplePrerenderWebpackPlugin = require('simple-prerender-webpack-plugin')

module.exports = {
  plugins: [
    new SimplePrerenderWebpackPlugin({
      // (required) routes to render
      // generate index.html, about/index.html:
      routes: ['/', '/about'],

      // (optional) entry point:
      // <string>: path to file which exports render function
      // render function should be `(pathname) => content (anything you like)`. the content will be assigned to `htmlWebpackPlugin.prerendered`
      entry: './src/ssr/render.js',

      // (optional)
      // <string>: path to base webpack config
      // <function | object>: webpack config
      config: './config/webpack.base.config.js',

      // (optional):
      // <object> HtmlWebpackPluginOpts
      // <function> ({ pathname, filename }) => HtmlWebpackPluginOpts
      // see also https://www.npmjs.com/package/html-webpack-plugin
      customizeHtmlWebpackPluginOpts: {},

      // (optional): <Array> webpack plugins that should be configured after HtmlWebpackPlugin
      friends: [new (require('preload-webpack-plugin'))()],

      // (optional): <string> filename of output
      // note: filename will be resolved with `outputPath` below,
      //       should be unique between plugin instances
      filename: 'prerender.js',

      // (optional): <boolean> whether write output to disk
      writeToDisk: false,

      // when debug is `true`, plugin will not throw errors when evaluating.
      debug: false,

      // (optional): <object> opts passed to webpack-node-externals
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
