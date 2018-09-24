'use strict'

module.exports = function runChildCompiler(compiler) {
  return new Promise((resolve, reject) => {
    compiler.compile((err, compilation) => {
      if (err) return reject(err)
      compiler.parentCompilation.children.push(compilation)

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
