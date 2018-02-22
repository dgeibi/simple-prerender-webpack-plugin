import path from 'path'
import vm from 'vm'
import Module from 'module'

import installSMS from './installSMS'
import { MemoryFS, webpack } from './peers'
import nodeTarget from './nodeTarget'
import merge from './merge'
import requireCwd from './requireCwd'

async function requireWithWebpack({
  entry,
  config,
  nodeExternalsOptions,
  writeFile,
  sourcemap,
  outputPath,
}) {
  const fs = new MemoryFS()
  let filename = path.normalize(
    writeFile && typeof writeFile === 'string' ? writeFile : 'prerender.js'
  )
  if (path.resolve(filename) === filename) {
    filename = path.relative(outputPath, filename)
  }
  const dist = path.join(outputPath, filename)

  const webpackConfig = await merge([
    nodeTarget({
      nodeExternalsOptions,
      sourcemap,
    }),
    config,
    {
      entry,
    },
    {
      output: {
        path: outputPath,
        filename,
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
        return
      }
      let mapRaw
      const fileRaw = fs.readFileSync(dist, 'utf8')

      if (sourcemap) {
        mapRaw = fs.readFileSync(`${dist}.map`, 'utf8')
        installSMS({
          url: filename,
          map: mapRaw,
        })
      }

      const vmModule = { exports: {} }
      const script = new vm.Script(Module.wrap(fileRaw))

      let error
      // exports, require, module, __filename, __dirname
      try {
        script.runInThisContext()(
          vmModule.exports,
          requireCwd,
          vmModule,
          dist,
          outputPath
        )
      } catch (e) {
        error = e
      }

      resolve({
        object: vmModule.exports.default || vmModule.exports,
        error,
        fileRaw,
        filename: dist,
        mapRaw,
        mapFilename: sourcemap && `${dist}.map`,
      })
    })
  })
}

export default requireWithWebpack
