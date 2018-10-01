# simple-prerender-webpack-plugin

[![version][version-badge]][package]

## Features

* Based on Promise
* Support dynamic import
* Sourcemap: to enable sourcemap just configure webpack with `devtool: source-map`
* Inject rendering result into html-webpack-plugin as `htmlWebpackPlugin.options.prerendered`

## Install

```sh
$ npm install webpack html-webpack-plugin
$ npm install simple-prerender-webpack-plugin
```

## Examples

* [examples](examples)
* [dgeibi/yarb](https://github.com/dgeibi/yarb)

## Usage

`webpack.config.js`:

```js
const SimplePrerenderWebpackPlugin = require('simple-prerender-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './src/index.js',

  plugins: [
    new HtmlWebpackPlugin({
      filename: 'page1.html',
      template: './src/template.ejs',
    }),
    new HtmlWebpackPlugin({
      filename: 'page2.html',
      template: './src/template.ejs',
    }),
    new SimplePrerenderWebpackPlugin({
      // (optional) path to file which exports a prerender function
      // <string|string[]>
      // defaults to './src/index.js'
      entry: './src/ssr.js',

      // (optional)
      // <string>: path to partial webpack config
      // <object>: partial webpack config
      config: {
        plugins: [],
        node: {},
        externals: [],
        entry: './src/ssr.js',
      },

      // (optional): <string> filename of output
      filename: 'prerender.js',

      // (optional): <string>
      chunkFilename: 'prerender.[id].js',

      // (optional): <any>, see `examples/multi-instance`
      id: '',

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

`./src/template.ejs`:

```ejs
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
  <title><%= htmlWebpackPlugin.options.title %></title>
</head>
<body><div id="root"><%= htmlWebpackPlugin.options.prerendered %></div>
</body>
</html>
```

`./src/ssr.js`:

```js
export default ({
  outputName, // html filename
  plugin, // html-webpack-plugin instance
  assets, // html-webpack-plugin assets
  compilation,
  compiler,
}) => {
  return `<div>${outputName}</div>`
}
```

## LICENSE

[MIT](LICENSE)

[version-badge]: https://img.shields.io/npm/v/simple-prerender-webpack-plugin.svg
[package]: https://www.npmjs.com/package/simple-prerender-webpack-plugin
