'use strict'

const vm = require('vm')
const NativeModule = require('module')
const { dirname, resolve, relative } = require('path')
const { requireCwd } = require('./require')

module.exports = function importFromMemory(
  entryFilename,
  outputPath,
  assets,
  context
) {
  const prepareRequire = parentCtx => moduleId => {
    if (typeof moduleId !== 'string') throw Error('moduleId should be string')
    if (moduleId[0] === '.' || moduleId[0] === '/' || moduleId[1] === ':') {
      const filename = resolve(parentCtx, moduleId)
      const assetFilename = relative(outputPath, filename)
      const asset = assets[assetFilename]
      if (!asset) {
        return requireCwd(moduleId, context)
      } else {
        const module = { exports: {} }
        const _dirname = dirname(filename)
        new vm.Script(NativeModule.wrap(asset.source()), {
          filename,
          displayErrors: true,
        }).runInThisContext()(
          module.exports,
          prepareRequire(_dirname),
          module,
          filename,
          _dirname
        )
        return module.exports
      }
    } else {
      return requireCwd(moduleId, context)
    }
  }

  return prepareRequire(outputPath)(`./${entryFilename}`)
}
