'use strict'

const path = require('path')
const importFromMemory = require('./importFromMemory')
const rewriteErrorTrace = require('./source-map-support')

function evaluate({ entryFilename, context, outputPath, assets }) {
  const createMaps = () => {
    const mapMeta = {}
    let found = false
    Object.keys(assets).forEach(filename => {
      const mapFilename = `${filename}.map`
      if (assets.hasOwnProperty(mapFilename)) {
        found = true
        mapMeta[path.join(outputPath, filename)] = assets[mapFilename].source()
      }
    })
    return found ? mapMeta : null
  }

  const exec = fn =>
    Promise.resolve()
      .then(fn)
      .catch(err => {
        const maps = createMaps()
        if (!maps) throw err
        return rewriteErrorTrace(err, maps, context).then(() => {
          throw err
        })
      })

  return exec(() =>
    importFromMemory(entryFilename, outputPath, assets, context)
  ).then(exports => ({
    exports,
    exec,
  }))
}

module.exports = evaluate
