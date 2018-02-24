import path from 'path'
import fs from 'fs'
import { fromCallback as u } from 'universalify'
import mkdirp from 'mkdirp'

function pathExists(filepath, callback) {
  fs.stat(filepath, (error, stats) => {
    if (error) {
      return callback(null, false)
    }
    if (stats.isFile()) {
      return callback(Error(`${filepath} is a file`))
    }
    return callback(null, stats.isDirectory())
  })
}

function outputFile(filename, data, callback) {
  const dir = path.dirname(filename)
  pathExists(dir, (err, yes) => {
    if (err) return callback(err)
    if (yes) return fs.writeFile(filename, data, callback)

    mkdirp(dir, e => {
      if (e) return callback(e)
      fs.writeFile(filename, data, callback)
    })
  })
}

export default u(outputFile)
