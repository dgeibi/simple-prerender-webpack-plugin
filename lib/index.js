'use strict'

const { resolve, normalize, relative } = require('path')
const nodeExternals = require('webpack-node-externals')

const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin')
const ExternalsPlugin = require('webpack/lib/ExternalsPlugin')
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin')
const NodeStuffPlugin = require('webpack/lib/NodeStuffPlugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const LoaderTargetPlugin = require('webpack/lib/LoaderTargetPlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin')

const merge = require('webpack-merge')
const runChildCompiler = require('./runChildCompiler')
const { interopRequire } = require('./require')
const evaluate = require('./evaluate')

const PLUGIN_NAME = 'simple-prerender-webpack-plugin'

const addEntry = (compiler, context, entry) => {
  if (typeof entry === 'string') {
    new SingleEntryPlugin(context, entry, 'main').apply(compiler)
  } else if (Array.isArray(entry)) {
    new MultiEntryPlugin(context, entry, 'main').apply(compiler)
  } else {
    throw Error('`entry` should be an `array` or a `string`')
  }
}

const getOutputOptions = (outputPath, filename, chunkFilename, id) => {
  const defaultId = typeof id === 'string' && id ? `.${id}` : ''
  filename =
    typeof filename !== 'string' || !filename
      ? `prerender${defaultId}.js`
      : normalize(filename)
  const fullFilename = resolve(outputPath, filename)
  if (filename === fullFilename) {
    filename = relative(outputPath, filename)
  }

  chunkFilename =
    typeof chunkFilename !== 'string' || !chunkFilename
      ? `prerender${defaultId}.[id].js`
      : chunkFilename

  return {
    path: outputPath,
    filename,
    chunkFilename,
  }
}

const getConfig = ({ entry, config, nodeExternalsOptions }, context) => {
  const errorMsgs = []
  if (config !== undefined) {
    try {
      config = interopRequire(config, context)
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
      plugins: [],
    },
  ])
}

class SimplePrerenderWebpackPlugin {
  constructor({
    config,
    entry,
    id,
    nodeExternalsOptions,
    debug,
    filename,
    chunkFilename,
    writeToDisk = false,
  } = {}) {
    this.opts = {
      config,
      entry,
      id,
      nodeExternalsOptions,
      filename,
      chunkFilename,
      debug,
      writeToDisk,
    }
  }

  static filterPlugins(x) {
    return !/MiniCssExtractPlugin|HtmlWebpackPlugin|SimplePrerenderWebpackPlugin/i.test(
      x.constructor.name
    )
  }

  apply(compiler) {
    const context = compiler.options.context || process.cwd()
    const config = getConfig(this.opts, context)
    config.entry = config.entry || compiler.options.entry
    const plugins = config.plugins.filter(
      SimplePrerenderWebpackPlugin.filterPlugins
    )
    const outputOptions = getOutputOptions(
      compiler.options.output.path,
      this.opts.filename,
      this.opts.chunkFilename,
      this.opts.id
    )

    let result
    compiler.hooks.make.tapPromise(PLUGIN_NAME, compilation => {
      const childCompiler = compilation.createChildCompiler(
        PLUGIN_NAME,
        outputOptions,
        plugins
      )
      childCompiler.context = compiler.context
      new NodeTemplatePlugin().apply(childCompiler)
      new NodeTargetPlugin().apply(childCompiler)
      new LoaderTargetPlugin('node').apply(compiler)
      new LibraryTemplatePlugin('', 'commonjs2').apply(childCompiler)
      new ExternalsPlugin('commonjs2', config.externals).apply(childCompiler)
      new NodeStuffPlugin(config.node).apply(childCompiler)
      addEntry(childCompiler, context, config.entry)
      result = runChildCompiler(childCompiler, this.opts.writeToDisk).then(
        childCompilation => {
          const entryFilename = compilation.mainTemplate.hooks.assetPath.call(
            outputOptions.filename,
            {
              hash: childCompilation.hash,
              chunk: childCompilation.entrypoints.get('main').chunks,
            }
          )

          return evaluate({
            context,
            entryFilename,
            outputPath: outputOptions.path,
            assets: childCompilation.assets,
          })
        }
      )

      return result
    })

    const noop = Promise.resolve()

    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapPromise(
        PLUGIN_NAME,
        ({ assets, plugin, outputName }) => {
          if (this.opts.id && plugin.options.prerenderId !== this.opts.id)
            return noop
          const rendering = result.then(render => {
            if (typeof render !== 'function') {
              throw Error('entry should be function: (pathname) => any')
            }
            return noop
              .then(() =>
                render({ outputName, plugin, assets, compilation, compiler })
              )
              .then(x => {
                if (x) {
                  plugin.options.prerendered = x
                }
              })
              .catch(
                this.opts.debug
                  ? err => {
                      console.error(
                        `${PLUGIN_NAME} threw Error when rendering "${
                          plugin.options.filename
                        }" :\n`,
                        err
                      )
                    }
                  : undefined
              )
          })
          if (this.opts.debug) {
            return rendering.catch(e => {
              console.error(`${PLUGIN_NAME} Error:\n`, e)
            })
          } else {
            return rendering
          }
        }
      )
    })
  }
}

module.exports = SimplePrerenderWebpackPlugin
