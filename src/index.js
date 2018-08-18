import { resolve, normalize, relative } from 'path'

import omit from 'lodash/omit'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { interopRequire } from './require'
import requireWithWebpack from './requireWithWebpack'
import getFilename from './getFilename'

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
    getHtmlWebpackPluginOpts:
      typeof getHtmlWebpackPluginOpts === 'function'
        ? getHtmlWebpackPluginOpts
        : content => ({
            content,
          }),
  }
  this.KEY = 'simple-prerender-webpack-plugin'
  this._inited = false
  this._htmlWebpackPlugins = new Map()
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
  const { getHtmlWebpackPluginOpts, routes } = this.opts

  const run = () => {
    return requireWithWebpack(this.opts).then(render => {
      if (typeof render !== 'function') {
        throw Error('entry should be function: (pathname) => any')
      }

      if (!this._inited) {
        this._inited = true
        return Promise.all(
          routes.map(pathname => {
            const filename = getFilename(pathname)
            return Promise.resolve(render(pathname)).then(content => {
              const plugin = new HtmlWebpackPlugin(
                Object.assign(
                  {
                    filename,
                  },
                  getHtmlWebpackPluginOpts(content, pathname)
                )
              )
              this._htmlWebpackPlugins.set(pathname, plugin)
              return plugin
            })
          })
        ).then(plugins => {
          plugins.concat(this.opts.friends).forEach(x => x.apply(compiler))
        })
      } else {
        return Promise.all(
          routes.map(pathname => {
            return Promise.resolve(render(pathname)).then(content => {
              const plugin = this._htmlWebpackPlugins.get(pathname)
              Object.assign(
                plugin.options,
                omit(getHtmlWebpackPluginOpts(content, pathname), [
                  'template',
                  'filename',
                  'hash',
                  'inject',
                  'compile',
                  'favicon',
                  'minify',
                  'cache',
                  'showErrors',
                  'chunks',
                  'excludeChunks',
                  'chunksSortMode',
                  'meta',
                  'title',
                  'xhtml',
                ])
              )
            })
          })
        )
      }
    })
  }
  this.tapPromise(compiler, 'run', run)
  this.tapPromise(compiler, 'watchRun', 'watch-run', run)
}

export default SimplePrerenderWebpackPlugin
