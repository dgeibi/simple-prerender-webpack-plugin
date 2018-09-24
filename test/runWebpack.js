const webpack = require('webpack')
const path = require('path')
// eslint-disable-next-line
const MemoryFS = require('memory-fs')

module.exports = (plugins, outputPath = `${__dirname}/output`) => {
  const config = {
    devtool: 'source-map',
    entry: `${__dirname}/resources/entry.js`,
    output: {
      path: outputPath,
    },
  }
  if (!Array.isArray(plugins)) plugins = [plugins]
  const compiler = webpack(
    Object.assign(
      {
        plugins,
      },
      config
    )
  )
  const fs = new MemoryFS()
  compiler.outputFileSystem = fs
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        reject(
          Object.assign(err || stats, {
            fs,
            outputPath,
          })
        )
        return
      }
      try {
        resolve({
          fs,
          outputPath,
          html: fs.readFileSync(path.join(outputPath, 'index.html'), 'utf8'),
        })
      } catch (e) {
        reject(e)
      }
    })
  })
}
