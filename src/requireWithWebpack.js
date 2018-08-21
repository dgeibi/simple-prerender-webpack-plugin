import webpack from 'webpack'
import MemoryFS from 'memory-fs' // eslint-disable-line

import nodeTarget from './nodeTarget'
import merge from './merge'
import outputFile from './outputFile'
import importFromMemory from './importFromMemory'
import runCompiler from './runCompiler'
import {
  createSourceMapConsumers,
  rewriteErrorTrace,
  withSourceMap,
} from './source-map-support'

function requireWithWebpack(
  {
    entry,
    config,
    nodeExternalsOptions,
    sourcemap,
    outputPath,
    filename,
    fullFilename,
    writeToDisk,
    newContext,
  },
  handleWebpackConfig
) {
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
    handleWebpackConfig(webpackConfig)
    const fs = new MemoryFS()
    const compiler = webpack(webpackConfig)
    compiler.outputFileSystem = fs
    return runCompiler(compiler).then(() => {
      const fileRaw = fs.readFileSync(fullFilename, 'utf8')
      const mapFilename = `${fullFilename}.map`
      const mapRaw = sourcemap && fs.readFileSync(mapFilename, 'utf8')
      let maps
      if (sourcemap && mapRaw) {
        maps = createSourceMapConsumers({
          [fullFilename]: mapRaw,
        })
      } else {
        maps = {}
      }

      return Promise.resolve(
        writeToDisk &&
          Promise.all([
            outputFile(fullFilename, fileRaw),
            mapRaw && outputFile(mapFilename, mapRaw),
          ])
      ).then(() => {
        let result
        try {
          result = importFromMemory(fileRaw, fullFilename, newContext)
        } catch (e) {
          rewriteErrorTrace(e, maps)
          throw e
        }
        let fn = 'default' in result ? result.default : result
        if (typeof fn === 'function') {
          fn = withSourceMap(fn, maps)
        }
        return fn
      })
    })
  })
}

export default requireWithWebpack
