function getFilename(path) {
  let filename = path.replace(/^\/+/, '')
  if (/\.html?$/.test(filename)) {
    return filename
  }
  if (filename === '') return 'index.html'
  filename = filename.replace(/\/*$/, '')
  filename += '/index.html'
  return filename
}

export default getFilename
