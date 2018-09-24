'use strict'

const { resolve, normalize, relative } = require('path')
const MemoryFs = require('memory-fs') // eslint-disable-line
const nodeExternals = require('webpack-node-externals')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin')
const ExternalsPlugin = require('webpack/lib/ExternalsPlugin')
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin')
const NodeStuffPlugin = require('webpack/lib/NodeStuffPlugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const DynamicEntryPlugin = require('webpack/lib/DynamicEntryPlugin')
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin')

const merge = require('webpack-merge')
const runChildCompiler = require('./runChildCompiler')
const { interopRequire } = require('./require')
const evaluate = require('./evaluate')

const PLUGIN_NAME = 'simple-prerender-webpack-plugin'

function getFilename(path) {
  let filename = path.replace(/^\/+/, '')
  if (/\.html?$/.test(filename)) {
    return filename
  }
  if (filename === '') return 'index.html'
  filename = filename.replace(/\/*$/, '')
  filename += '/index.html'
  return filename
}

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

const getOutputOptions = (outputPath, filename) => {
  const fullFilename = resolve(outputPath, filename)
  if (filename === fullFilename) {
    filename = relative(outputPath, filename)
  }
  return {
    path: outputPath,
    filename,
    fullFilename,
  }
}

const getConfig = ({ entry, config, nodeExternalsOptions }) =>
  merge([
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
      plugins: [],
    },
  ])

class SimplePrerenderWebpackPlugin {
  constructor({
    routes,
    config,
    entry,
    customizeHtmlWebpackPluginOpts,
    nodeExternalsOptions,
    filename,
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

    filename =
      typeof filename !== 'string' || !filename
        ? 'prerender.js'
        : normalize(filename)

    this.opts = {
      routes,
      config,
      entry,
      nodeExternalsOptions,
      filename,
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
    return !/MiniCssExtractPlugin|HtmlWebpackPlugin|SimplePrerenderWebpackPlugin/i.test(
      x.constructor.name
    )
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

    const config = getConfig(this.opts)
    config.entry = config.entry || compiler.options.entry
    const plugins = config.plugins.filter(
      SimplePrerenderWebpackPlugin.filterPlugins
    )
    const outputOptions = getOutputOptions(
      compiler.options.output.path,
      this.opts.filename
    )

    const context = compiler.options.context || process.cwd()
    compiler.hooks.make.tapPromise(PLUGIN_NAME, compilation => {
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
        .then(({ assets }) => {
          const { writeToDisk, newContext } = this.opts
          return evaluate(
            assets,
            Object.assign(
              {
                writeToDisk,
                newContext,
              },
              outputOptions
            )
          )
        })
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
