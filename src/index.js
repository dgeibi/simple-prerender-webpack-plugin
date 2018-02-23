import { statSync } from 'fs'
import { resolve, normalize, relative } from 'path'

import { HtmlWebpackPlugin } from './peers'
import { interopRequire } from './require'
import requireWithWebpack from './requireWithWebpack'
import getFilename from './getFilename'

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
  sourcemap = true,
  filename,
  outputPath,
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
    getHtmlWebpackPluginOpts:
      typeof getHtmlWebpackPluginOpts === 'function'
        ? getHtmlWebpackPluginOpts
        : content => ({
            content,
          }),
  }
}

SimplePrerenderWebpackPlugin.prototype.apply = function apply(compiler) {
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
      .then(({ result, error }) => {
        if (error) throw error
        const { getHtmlWebpackPluginOpts, routes } = this.opts
        const render = 'default' in result ? result.default : result

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

export default SimplePrerenderWebpackPlugin
