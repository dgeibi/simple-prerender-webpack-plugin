import path from 'path'
import vm from 'vm'
import Module from 'module'
import realFs from 'fs'

import installSMS from './installSMS'
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
  writeFile,
  sourcemap,
}) {
  const fs = new MemoryFS()
  let dirname = process.cwd()
  let basename =
    writeFile && typeof writeFile === 'string' ? writeFile : '.render.js'
  const dist = path.resolve(dirname, basename)
  dirname = path.dirname(dist)
  basename = path.basename(dist)

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

  if (sourcemap) {
    webpackConfig.devtool = 'sourcemap'
  }

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
      let map
      let mapFilename
      const srcCode = fs.readFileSync(dist, 'utf8')

      if (sourcemap) {
        mapFilename = `${dist}.map`
        map = fs.readFileSync(mapFilename, 'utf8')
        installSMS({
          url: basename,
          map,
        })
      }

      if (writeFile) {
        realFs.writeFileSync(dist, srcCode)
        if (sourcemap) {
          realFs.writeFileSync(mapFilename, map)
        }
      }

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
