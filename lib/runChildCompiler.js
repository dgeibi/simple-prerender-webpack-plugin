'use strict'

module.exports = function runChildCompiler(compiler) {
  return new Promise((resolve, reject) => {
    compiler.runAsChild((err, entries, childCompilation) => {
      // compiler.parentCompilation.children.push(compilation)
      if (err) return reject(err)

      if (childCompilation.errors && childCompilation.errors.length) {
        const errorDetails = childCompilation.errors
          .map(error => error.details)
          .join('\n')
        return reject(Error(`Child compilation failed:\n${errorDetails}`))
      }

      resolve(childCompilation)
    })
  })
}
