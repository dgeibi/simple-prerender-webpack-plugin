'use strict'

const { resolve, normalize, relative } = require('path')
const webpack = require('webpack')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const { interopRequire } = require('./require')
const requireWithWebpack = require('./requireWithWebpack')
const getFilename = require('./getFilename')

const PLUGIN_NAME = 'simple-prerender-webpack-plugin'

class SimplePrerenderWebpackPlugin {
  constructor({
    routes,
    config,
    entry,
    customizeHtmlWebpackPluginOpts,
    nodeExternalsOptions,
    sourcemap = true,
    filename,
    outputPath,
    writeToDisk = false,
    newContext = true,
    friends = [],
  } = {}) {
    const errorMsgs = []
    if (!Array.isArray(routes) || typeof routes[0] !== 'string') {
      errorMsgs.push('expect `routes` to be array of string')
    }
    if (config !== undefined) {
      try {
        config = interopRequire(config)
      } catch (e) {
        errorMsgs.push(e.message)
      }
      const type = typeof config
      if (!config || !(type === 'object' || type === 'function')) {
        errorMsgs.push('`config` should be a function or a object')
      }
    }
    if (errorMsgs.length > 0) {
      throw Error(errorMsgs.map(x => x.trim()).join('\n'))
    }
    outputPath = resolve(
      typeof outputPath !== 'string' || !outputPath ? '.prerender' : outputPath
    )
    filename =
      typeof filename !== 'string' || !filename
        ? 'prerender.js'
        : normalize(filename)

    const fullFilename = resolve(outputPath, filename)
    if (fullFilename === filename) {
      filename = relative(outputPath, filename)
    }

    this.opts = {
      routes,
      config,
      entry,
      nodeExternalsOptions,
      sourcemap,
      outputPath,
      filename,
      fullFilename,
      writeToDisk,
      newContext,
      friends,
      customizeHtmlWebpackPluginOpts:
        typeof customizeHtmlWebpackPluginOpts !== 'function'
          ? () => customizeHtmlWebpackPluginOpts
          : customizeHtmlWebpackPluginOpts,
    }
  }

  apply(compiler) {
    const { routes, customizeHtmlWebpackPluginOpts } = this.opts
    const htmlWebpackPlugins = {}
    routes
      .map(pathname => {
        const filename = getFilename(pathname)
        const plugin = new HtmlWebpackPlugin(
          Object.assign(
            {},
            customizeHtmlWebpackPluginOpts({ pathname, filename }),
            {
              filename,
            }
          )
        )
        htmlWebpackPlugins[pathname] = plugin
        return plugin
      })
      .concat(this.opts.friends)
      .forEach(x => x.apply(compiler))

    new webpack.DefinePlugin({
      'process.env.PRERENDER': 'false',
    }).apply(compiler)

    compiler.hooks.make.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.additionalAssets.tapPromise(PLUGIN_NAME, () => {
        return requireWithWebpack(this.opts, config => {
          const plugins =
            (config.plugins &&
              config.plugins.filter(
                x =>
                  !(
                    x instanceof SimplePrerenderWebpackPlugin ||
                    x instanceof HtmlWebpackPlugin
                  )
              )) ||
            []
          plugins.push(
            new webpack.DefinePlugin({
              'process.env.PRERENDER': 'true',
            })
          )
          config.plugins = plugins
        }).then(render => {
          if (typeof render !== 'function') {
            throw Error('entry should be function: (pathname) => any')
          }
          return Promise.all(
            routes.map(pathname => {
              return Promise.resolve(render(pathname)).then(x => {
                htmlWebpackPlugins[pathname].options.prerendered = x
              })
            })
          )
        })
      })
    })
  }
}

module.exports = SimplePrerenderWebpackPlugin
