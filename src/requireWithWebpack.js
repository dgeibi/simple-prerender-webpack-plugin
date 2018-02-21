import path from 'path'
import vm from 'vm'
import Module from 'module'

import { MemoryFS, webpack } from './peers'
import nodeTarget from './nodeTarget'
import merge from './merge'
import requireCwd from './requireCwd'

const validateWebpackConfig = conf => {
  const type = typeof conf
  if (!conf || !(type === 'object' || type === 'function')) {
    throw Error('config should be a function or a object')
  }
}

async function requireWithWebpack({
  entry,
  config,
  nodeExternalsOptions,
  sourcemap,
}) {
  const fs = new MemoryFS()

  const dirname = process.cwd()
  const basename = 'anything.js'
  const dist = path.join(dirname, basename)

  if (config) {
    validateWebpackConfig(config)
  }

  const webpackConfig = await merge([
    nodeTarget({
      nodeExternalsOptions,
      sourcemap,
    }),
    config,
    entry && {
      entry,
    },
    {
      output: {
        path: dirname,
        filename: basename,
        libraryTarget: 'commonjs2',
      },
    },
  ])
  const compiler = webpack(webpackConfig)
  compiler.outputFileSystem = fs

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        reject(err || stats)
        // eslint-disable-next-line
        console.log(
          stats.toString({
            chunks: false,
            colors: true,
          })
        )
        return
      }
      const srcCode = fs.readFileSync(dist, 'utf8')
      const vmModule = { exports: {} }
      const script = new vm.Script(Module.wrap(srcCode))

      // exports, require, module, __filename, __dirname
      script.runInThisContext()(
        vmModule.exports,
        requireCwd,
        vmModule,
        dist,
        dirname
      )
      resolve(vmModule.exports)
    })
  })
}

export default requireWithWebpack
