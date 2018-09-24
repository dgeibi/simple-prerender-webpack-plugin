'use strict'

const importFromMemory = require('./importFromMemory')
const {
  createSourceMapConsumers,
  rewriteErrorTrace,
  withSourceMap,
} = require('./source-map-support')

function evaluate(assets, { filename, writeToDisk, newContext, fullFilename }) {
  const fileRaw = assets[filename].source()
  const mapFilename = `${filename}.map`
  const mapRaw = assets[mapFilename] && assets[mapFilename].source()
  let maps
  if (mapRaw) {
    maps = createSourceMapConsumers({
      [fullFilename]: mapRaw,
    })
  } else {
    maps = {}
  }

  return Promise.resolve(
    writeToDisk &&
      (() => {
        const outputFile = require('./outputFile')
        return Promise.all([
          outputFile(fullFilename, fileRaw),
          mapRaw && outputFile(`${fullFilename}.map`, mapRaw),
        ])
      })()
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

module.exports = evaluate
