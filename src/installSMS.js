export default ({ map, url }) => {
  require('source-map-support').install({
    environment: 'node',
    retrieveSourceMap(source) {
      if (source === 'evalmachine.<anonymous>') {
        return {
          url,
          map,
        }
      }
      return null
    },
  })
}
