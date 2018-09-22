'use strict'

module.exports = function runCompiler(compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        reject(err || stats)
        return
      }
      resolve()
    })
  })
}
