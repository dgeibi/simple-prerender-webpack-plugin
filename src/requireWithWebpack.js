import pseries from 'promise.series'
import { webpack, MemoryFS } from './peers'
import nodeTarget from './nodeTarget'
import merge from './merge'
import outputFile from './outputFile'
import importFromMemory from './importFromMemory'
import * as mapStore from './mapStore'

function requireWithWebpack({
  entry,
  config,
  nodeExternalsOptions,
  sourcemap,
  outputPath,
  filename,
  fullFilename,
  writeToDisk,
  newContext,
}) {
  return merge([
    nodeTarget({
      nodeExternalsOptions,
      sourcemap,
    }),
    config,
    {
      entry,
      output: {
        path: outputPath,
        filename,
        libraryTarget: 'commonjs2',
      },
    },
    sourcemap && {
      devtool: 'sourcemap',
    },
  ]).then(webpackConfig => {
    const fs = new MemoryFS()
    const compiler = webpack(webpackConfig)
    compiler.outputFileSystem = fs
    return runCompiler(compiler).then(() => {
      const fileRaw = fs.readFileSync(fullFilename, 'utf8')
      const mapFilename = `${fullFilename}.map`
      const mapRaw = sourcemap && fs.readFileSync(mapFilename, 'utf8')
      if (sourcemap && mapRaw) {
        mapStore.add(fullFilename, mapRaw)
      }
      return pseries([
        writeToDisk &&
          (() =>
            Promise.all([
              outputFile(fullFilename, fileRaw),
              mapRaw && outputFile(mapFilename, mapRaw),
            ])),
        () => importFromMemory(fileRaw, fullFilename, newContext),
      ])
    })
  })
}

function runCompiler(compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        reject(err || stats)
        return
      }
      resolve()
    })
  })
}

export default requireWithWebpack
