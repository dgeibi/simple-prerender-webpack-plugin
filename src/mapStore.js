let installed = false
const sourcemaps = {}

function installSourceMapSupport() {
  installed = true
  require('source-map-support').install({
    environment: 'node',
    retrieveSourceMap(source) {
      // eslint-disable-next-line no-prototype-builtins
      if (sourcemaps.hasOwnProperty(source)) {
        return {
          url: null,
          map: sourcemaps[source],
        }
      }
      return null
    },
  })
}

export function add(id, map) {
  if (!installed) installSourceMapSupport()
  sourcemaps[id] = map
}

export function remove(id) {
  delete sourcemaps[id]
}
