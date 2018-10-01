'use strict'

const path = require('path')
const importFromMemory = require('./importFromMemory')
const {
  createSourceMapConsumers,
  rewriteErrorTrace,
  withSourceMap,
} = require('./source-map-support')

function evaluate({ entryFilename, context, outputPath, assets }) {
  const mapMeta = {}
  Object.keys(assets).forEach(filename => {
    const mapFilename = `${filename}.map`
    if (assets.hasOwnProperty(mapFilename)) {
      mapMeta[path.join(outputPath, filename)] = assets[mapFilename].source()
    }
  })
  const maps = createSourceMapConsumers(mapMeta)

  let result
  try {
    result = importFromMemory(entryFilename, outputPath, assets, context)
  } catch (err) {
    rewriteErrorTrace(err, maps, context)
    throw err
  }
  let fn = 'default' in result ? result.default : result
  if (typeof fn === 'function') {
    fn = withSourceMap(fn, maps, context)
  }
  return fn
}

module.exports = evaluate
