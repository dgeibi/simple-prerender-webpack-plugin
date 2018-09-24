'use strict'

const outputFile = require('./outputFile')
const importFromMemory = require('./importFromMemory')

const {
  createSourceMapConsumers,
  rewriteErrorTrace,
  withSourceMap,
} = require('./source-map-support')

function exe(
  assets,
  { sourcemap, filename, writeToDisk, newContext, fullFilename }
) {
  const fileRaw = assets[filename].source()
  const mapFilename = `${filename}.map`
  const mapRaw =
    sourcemap && assets[mapFilename] && assets[mapFilename].source()
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
    } catch (err) {
      rewriteErrorTrace(err, maps)
      throw err
    }
    let fn = 'default' in result ? result.default : result
    if (typeof fn === 'function') {
      fn = withSourceMap(fn, maps)
    }
    return fn
  })
}

module.exports = exe
