const url = require('url')
/* copy from https://github.com/7rulnik/react-loadable/blob/scoped-version/src/webpack.js */

/* eslint-disable no-restricted-syntax */
const isStyle = x => x.file.endsWith('.css')
const isScript = x => x.file.endsWith('.js')
const selectUrl = x => x.publicPath

function getBundles(manifest, moduleIds) {
  return moduleIds.reduce(
    (bundles, moduleId) => bundles.concat(manifest[moduleId]),
    []
  )
}

const getAssets = (manifest, moduleIds) => {
  const bundles = getBundles(manifest, moduleIds)
  return {
    css: bundles.filter(isStyle).map(selectUrl),
    js: bundles.filter(isScript).map(selectUrl),
  }
}

function buildManifest(compilation) {
  const manifest = {}

  for (const chunkGroup of compilation.chunkGroups) {
    const files = []
    for (const chunk of chunkGroup.chunks) {
      for (const file of chunk.files) {
        const publicPath = url.resolve(
          compilation.outputOptions.publicPath || '',
          file
        )
        files.push({
          file,
          publicPath,
        })
      }
    }

    for (const block of chunkGroup.blocksIterable) {
      manifest[block.request] = files
    }
  }

  return manifest
}

const getDynamicAssets = (compilation, moduleIds) =>
  getAssets(buildManifest(compilation), moduleIds)

module.exports = getDynamicAssets
