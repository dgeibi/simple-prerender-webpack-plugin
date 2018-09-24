'use strict'

const { resolve, normalize, relative } = require('path')
// const webpack = require('webpack')
const MemoryFs = require('memory-fs') // eslint-disable-line
const nodeExternals = require('webpack-node-externals')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin')
const ExternalsPlugin = require('webpack/lib/ExternalsPlugin')
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin')
const NodeStuffPlugin = require('webpack/lib/NodeStuffPlugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
// const SourceMapDevToolPlugin = require('webpack/lib/SourceMapDevToolPlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const DynamicEntryPlugin = require('webpack/lib/DynamicEntryPlugin')
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin')

const merge = require('webpack-merge')
// const outputFile = require('./outputFile')
// const importFromMemory = require('./importFromMemory')
const runChildCompiler = require('./runChildCompiler')

const { interopRequire } = require('./require')
const exe = require('./eval')
const getFilename = require('./getFilename')

const PLUGIN_NAME = 'simple-prerender-webpack-plugin'

const addEntry = (compiler, context, entry) => {
  const itemToPlugin = (item, name) => {
    if (Array.isArray(item)) {
      return new MultiEntryPlugin(context, item, name)
    }
    return new SingleEntryPlugin(context, item, name)
  }
  if (typeof entry === 'string' || Array.isArray(entry)) {
    itemToPlugin(entry, 'main').apply(compiler)
  } else if (typeof entry === 'object') {
    Object.keys(entry).forEach(name => {
      itemToPlugin(entry[name], name).apply(compiler)
    })
  } else if (typeof entry === 'function') {
    new DynamicEntryPlugin(context, entry).apply(compiler)
  }
}
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
      if (!config || type !== 'object') {
        errorMsgs.push('`config` should be a object')
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

  static filterPlugins(x) {
    return !(
      x instanceof SimplePrerenderWebpackPlugin ||
      x instanceof HtmlWebpackPlugin ||
      /MiniCssExtractPlugin/i.test(x.constructor.name)
    )
  }

  getConfig() {
    const {
      entry,
      config,
      nodeExternalsOptions,
      sourcemap,
      outputPath,
      filename,
    } = this.opts
    return merge([
      {
        node: {
          console: false,
          global: false,
          process: false,
          __filename: false,
          __dirname: false,
          Buffer: false,
          setImmediate: false,
        },
        externals: [nodeExternals(nodeExternalsOptions)],
      },
      config,
      {
        entry,
        target: 'node',
        mode: 'none',
        plugins: [],
        output: {
          path: outputPath,
          filename,
        },
      },
      sourcemap && {
        devtool: 'sourcemap',
      },
    ])
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

    const context = compiler.options.context || process.cwd()
    compiler.hooks.make.tapPromise(PLUGIN_NAME, compilation => {
      const config = this.getConfig()
      config.entry = config.entry || compiler.options.entry
      const plugins = (compiler.options.plugins || [])
        .concat(config.plugins)
        .filter(SimplePrerenderWebpackPlugin.filterPlugins)
      const outputOptions = {
        path: config.output.path,
        filename: config.output.filename,
        chunkFilename: config.output.filename,
      }

      const childCompiler = compilation.createChildCompiler(
        PLUGIN_NAME,
        outputOptions,
        plugins
      )

      childCompiler.context = compiler.context
      childCompiler.outputFileSystem = new MemoryFs()
      new NodeTemplatePlugin().apply(childCompiler)
      new NodeTargetPlugin().apply(childCompiler)
      new LibraryTemplatePlugin('', 'commonjs2').apply(childCompiler)
      new ExternalsPlugin('commonjs2', config.externals).apply(childCompiler)
      new NodeStuffPlugin(config.node).apply(childCompiler)
      addEntry(childCompiler, context, config.entry)

      return runChildCompiler(childCompiler)
        .then(ccc => exe(ccc.assets, this.opts))
        .then(render => {
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
  }
}

module.exports = SimplePrerenderWebpackPlugin
