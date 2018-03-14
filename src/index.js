import { statSync } from 'fs'
import { resolve, normalize, relative } from 'path'

import HtmlWebpackPlugin from 'html-webpack-plugin'
import { interopRequire } from './require'
import requireWithWebpack from './requireWithWebpack'
import getFilename from './getFilename'
import * as mapStore from './mapStore'

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
  writeToDisk = false,
  newContext = false,
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
    writeToDisk,
    newContext,
    friends,
    getHtmlWebpackPluginOpts:
      typeof getHtmlWebpackPluginOpts === 'function'
        ? getHtmlWebpackPluginOpts
        : content => ({
            content,
          }),
  }
  this.KEY = 'simple-prerender-webpack-plugin'
}

/**
 * @param {object} maybeTapable
 * @param {string} lifename
 * @param {string} [legacyLifeName]
 * @param {() => Promise} miss
 */
SimplePrerenderWebpackPlugin.prototype.tapPromise = function tapPromise(
  maybeTapable,
  lifename,
  legacyLifeName,
  miss
) {
  if (typeof legacyLifeName === 'function') {
    miss = legacyLifeName
    legacyLifeName = lifename
  }
  if (maybeTapable.hooks) {
    maybeTapable.hooks[lifename].tapPromise(this.KEY, miss)
  } else {
    maybeTapable.plugin(legacyLifeName, (_, callback) => {
      miss(_)
        .then(() => {
          callback()
        })
        .catch(callback)
    })
  }
}

SimplePrerenderWebpackPlugin.prototype.apply = function apply(compiler) {
  this.tapPromise(compiler, 'run', () =>
    requireWithWebpack(this.opts)
      .then(result => {
        const { getHtmlWebpackPluginOpts, routes } = this.opts
        const render = 'default' in result ? result.default : result
        if (typeof render !== 'function') {
          throw Error('entry should be function: (pathname) => any')
        }
        return Promise.all(
          routes.map(pathname => {
            const filename = getFilename(pathname)
            return Promise.resolve(render(pathname)).then(
              content =>
                new HtmlWebpackPlugin(
                  Object.assign(
                    {
                      filename,
                    },
                    getHtmlWebpackPluginOpts(content, pathname)
                  )
                )
            )
          })
        )
      })
      .then(plugins => {
        plugins.concat(this.opts.friends).forEach(x => x.apply(compiler))
        mapStore.remove(this.opts.fullFilename)
      })
  )
}

export default SimplePrerenderWebpackPlugin
