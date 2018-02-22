/* eslint-disable no-param-reassign */
import { statSync, outputFile } from 'fs-extra'
import { resolve } from 'path'

import requireCWD from './requireCwd'
import requireWithWebpack from './requireWithWebpack'
import getFilename from './getFilename'

const HtmlWebpackPlugin = requireCWD('html-webpack-plugin')

const interopRequire = id =>
  typeof id === 'string' && id ? requireCWD(id) : id

const isFile = filepath => {
  try {
    return statSync(filepath).isFile()
  } catch (e) {
    return false
  }
}

function SimplePrerenderWebpackPlugin({
  entry,
  routes,
  config,
  getHtmlWebpackPluginOpts,
  nodeExternalsOptions,
  writeFile = false,
  sourcemap = true,
} = {}) {
  const errorMsgs = []
  if (!Array.isArray(routes) || !routes[0]) {
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

  if (!entry) {
    errorMsgs.push('`entry` should be a string')
  } else {
    entry = resolve(entry)
    if (!isFile(entry)) {
      errorMsgs.push(`${entry} should be file`)
    }
  }

  if (errorMsgs.length > 0) {
    throw Error(errorMsgs.map(x => x.trim()).join('\n'))
  }

  this.opts = {
    routes,
    config,
    entry,
    nodeExternalsOptions,
    writeFile,
    sourcemap,
    getHtmlWebpackPluginOpts:
      typeof getHtmlWebpackPluginOpts === 'function'
        ? getHtmlWebpackPluginOpts
        : content => ({
            content,
          }),
  }
}

SimplePrerenderWebpackPlugin.prototype.apply = function apply(compiler) {
  this.opts.outputPath = compiler.options.output.path
  const resultPromise = requireWithWebpack(this.opts)
    .then(result => ({
      result,
      error: result.error,
    }))
    .catch(error => ({
      error,
    }))

  compiler.plugin('run', (compilation, callback) => {
    resultPromise
      .then(r => (this.opts.writeFile && r.result ? this.emitFile(r) : r))
      .then(({ result, error }) => {
        if (error) throw error
        const { getHtmlWebpackPluginOpts, routes } = this.opts
        const render = result.object
        if (typeof render !== 'function') {
          throw Error('entry should be function: (pathname) => any')
        }

        for (let i = 0; i < routes.length; i += 1) {
          const pathname = routes[i]
          const rendered = render(pathname)
          const filename = getFilename(pathname)
          new HtmlWebpackPlugin(
            Object.assign(
              {
                filename,
              },
              getHtmlWebpackPluginOpts(rendered, pathname)
            )
          ).apply(compiler)
        }
        callback()
      })
      .catch(error => {
        callback(error)
      })
  })
}

SimplePrerenderWebpackPlugin.prototype.emitFile = function emitFile(ref) {
  const { filename, fileRaw, mapRaw, mapFilename } = ref.result
  return Promise.all([
    outputFile(filename, fileRaw),
    mapRaw !== undefined && outputFile(mapFilename, mapRaw),
  ])
    .then(() => ref)
    .catch(error => ({
      error: ref.error || error,
    }))
}

export default SimplePrerenderWebpackPlugin
