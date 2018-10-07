'use strict'

module.exports = function runChildCompiler(compiler, writeToDisk) {
  return new Promise((resolve, reject) => {
    compiler.compile((err, compilation) => {
      if (err) return reject(err)
      compiler.parentCompilation.children.push(compilation)
      if (writeToDisk) {
        Object.assign(compiler.parentCompilation.assets, compilation.assets)
      }
      return resolve(compilation)
    })
  })
}
