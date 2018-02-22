/* eslint-disable no-param-reassign, consistent-return */
import path from 'path'
import fs from 'fs'
import u from 'universalify'

function pathExists(filepath, xfs, callback) {
  ;(xfs.stat || fs.stat)(filepath, (error, s) => {
    if (error) {
      return callback(null, false)
    }
    if (s.isFile()) {
      return callback(Error(`${filepath} is a file`))
    }
    return callback(null, s.isDirectory())
  })
}

function outputFile(filename, data, xfs, callback) {
  const dir = path.dirname(filename)
  pathExists(dir, xfs, (err, does) => {
    if (err) return callback(err)
    if (does) return xfs.writeFile(filename, data, callback)

    // xfs should have mkdirp
    xfs.mkdirp(dir, e => {
      if (e) return callback(e)
      xfs.writeFile(filename, data, callback)
    })
  })
}

export default u.fromCallback(outputFile)
