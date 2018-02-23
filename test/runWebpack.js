const webpack = require('webpack')
const path = require('path')
// eslint-disable-next-line
const MemoryFS = require('memory-fs')
const fse = require('fs-extra')

const outputPath = `${__dirname}/output`

const config = {
  entry: `${__dirname}/resources/entry.js`,
  output: {
    path: outputPath,
  },
}

module.exports = plugin => {
  fse.removeSync(plugin.opts.fullFilename)
  fse.removeSync(`${plugin.opts.fullFilename}.map`)

  const compiler = webpack(
    Object.assign(
      {
        plugins: [plugin],
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
      resolve({
        fs,
        outputPath,
        html: fs.readFileSync(path.join(outputPath, 'index.html'), 'utf8'),
      })
    })
  })
}
