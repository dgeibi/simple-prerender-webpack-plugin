import requireCWD from './requireCwd'
import requireWithWebpack from './requireWithWebpack'
import getFilename from './getFilename'

const HtmlWebpackPlugin = requireCWD('html-webpack-plugin')

const interopRequire = id =>
  typeof id === 'string' && id ? requireCWD(id) : id

const interopDefault = obj => (obj && 'default' in obj ? obj.default : obj)

function SimplePrerenderWebpackPlugin({
  entry,
  routes,
  config = 'webpack.config.js',
  getHtmlWebpackPluginOpts,
  nodeExternalsOptions,
  writeFile = false,
  sourcemap = true,
} = {}) {
  if (!Array.isArray(routes) || !routes[0]) {
    throw Error('expect paths to be array of string')
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
  compiler.plugin('run', async (c, callback) => {
    const {
      config,
      entry,
      getHtmlWebpackPluginOpts,
      routes,
      nodeExternalsOptions,
      writeFile,
      sourcemap,
    } = this.opts
    let render
    try {
      render = interopDefault(
        await requireWithWebpack({
          config: interopRequire(config),
          entry,
          nodeExternalsOptions,
          writeFile,
          sourcemap,
        })
      )
    } catch (error) {
      return callback(error)
    }
    if (typeof render !== 'function') {
      return callback(Error('entry should be function: (pathname) => any'))
    }

    for (let i = 0; i < routes.length; i += 1) {
      const pathname = routes[i]
      let rendered
      try {
        rendered = render(pathname)
      } catch (e) {
        return callback(e)
      }

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

    return callback()
  })
}

export default SimplePrerenderWebpackPlugin
