# simple-prerender-webpack-plugin

[![version][version-badge]][package]

这个插件帮你多开一个 webpack 实例构建 node 环境下的 js，并用 vm 模块执行，将执行之后导出的结果放入 html-webpack-plugin 的 options 中（具体怎么放由用户提供的 getHtmlWebpackPluginOpts 决定），使模板能够获取到对应的变量，由用户自己决定怎么使用该变量。

由于 html-webpack-plugin 是动态加入的插件，所有依赖 html-webpack-plugin 的其它 webpack 插件需要放在 friends 数组中。

**注：不支持 webpack 的 watch 模式**

## Install

```sh
$ npm install --save-dev webpack simple-prerender-webpack-plugin html-webpack-plugin
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

      // (required) entry point:
      // <string>: path to file which exports render function
      // render function should be `(pathname) => content (anything you like)`.
      // If `content` is a promise, its resolve result would pass to the
      // "getHtmlWebpackPluginOpts" function below.
      entry: './src/ssr/render.js',

      // (optional)
      // <string>: path to base webpack config
      // <function | object>: webpack config
      config: './config/webpack.base.config.js',

      // (optional): <function> (content, pathname) => HtmlWebpackPluginOpts
      // The returned value will be merged into HtmlWebpackPluginOpts
      // see also https://www.npmjs.com/package/html-webpack-plugin
      getHtmlWebpackPluginOpts: (content, pathname) => ({
        content,
        template: './src/index.ejs',
      }),

      // (optional): <Array> webpack plugins that should be configured after HtmlWebpackPlugin
      friends: [new (require('preload-webpack-plugin'))()],

      // (optional): <boolean> whether enable sourcemap
      sourcemap: true,

      // (optional): <string> filename of output
      // note: filename will be resolved with `outputPath` below,
      //       should be unique between plugin instances
      filename: 'prerender.js',

      // (optional): <boolean> whether write output to disk
      writeToDisk: false,

      // (optional):
      outputPath: '.prerender',

      // (optional): <boolean> whether create a new global object other than sharing
      //             context with plugins.
      // note: when a plugin applying, all route renders share a global object.
      newContext: false,

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
