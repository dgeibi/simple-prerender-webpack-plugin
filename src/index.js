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
  sourcemap = true,
  nodeExternalsOptions,
} = {}) {
  if (!Array.isArray(routes) || !routes[0]) {
    throw Error('expect paths to be array of string')
  }
  this.opts = {
    routes,
    config,
    entry,
    sourcemap,
    nodeExternalsOptions,
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
      sourcemap,
    } = this.opts
    let render
    try {
      render = interopDefault(
        await requireWithWebpack({
          config: interopRequire(config),
          entry,
          nodeExternalsOptions,
          sourcemap,
        })
      )
    } catch (error) {
      return callback(error)
    }

    if (typeof render !== 'function') {
      return callback(Error('entry should be function: (pathname) => any'))
    }

    routes.forEach(pathname => {
      const rendered = render(pathname)
      const filename = getFilename(pathname)
      const plugin = new HtmlWebpackPlugin(
        Object.assign(
          {
            filename,
          },
          getHtmlWebpackPluginOpts(rendered, pathname)
        )
      )
      plugin.apply(compiler)
    })

    return callback()
  })
}

export default SimplePrerenderWebpackPlugin
