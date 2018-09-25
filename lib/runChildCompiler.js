'use strict'

module.exports = function runChildCompiler(compiler, writeToDisk) {
  return new Promise((resolve, reject) => {
    compiler.compile((err, compilation) => {
      if (err) return reject(err)
      compiler.parentCompilation.children.push(compilation)
      if (writeToDisk) {
        Object.assign(compiler.parentCompilation.assets, compilation.assets)
      }

      if (compilation.errors && compilation.errors.length) {
        const errorDetails = compilation.errors
          .map(error => error.details)
          .join('\n')
        return reject(Error(`Child compilation failed:\n${errorDetails}`))
      }

      return resolve(compilation)
    })
  })
}
