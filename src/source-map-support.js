// copy from https://github.com/vuejs/vue/blob/dev/src/server/bundle-renderer/source-map-support.js
import { SourceMapConsumer } from 'source-map/lib/source-map-consumer'

const filenameRE = /\(([^)]+\.js):(\d+):(\d+)\)$/
export function createSourceMapConsumers(rawMaps) {
  const maps = {}
  Object.keys(rawMaps).forEach(file => {
    maps[file] = new SourceMapConsumer(rawMaps[file])
  })
  return maps
}

function rewriteTraceLine(trace, mapConsumers) {
  const m = trace.match(filenameRE)
  const map = m && mapConsumers[m[1]]
  if (m != null && map) {
    const originalPosition = map.originalPositionFor({
      line: Number(m[2]),
      column: Number(m[3]),
    })
    if (originalPosition.source != null) {
      const { source, line, column } = originalPosition
      const mappedPosition = `(${source.replace(
        /^webpack:\/\/\//,
        ''
      )}:${String(line)}:${String(column)})`
      return trace.replace(filenameRE, mappedPosition)
    } else {
      return trace
    }
  } else {
    return trace
  }
}

export function rewriteErrorTrace(e, mapConsumers) {
  if (e && typeof e.stack === 'string') {
    e.stack = e.stack
      .split('\n')
      .map(line => {
        return rewriteTraceLine(line, mapConsumers)
      })
      .join('\n')
  }
}

export const withSourceMap = (fn, maps) => {
  if (maps) {
    return function fnWithMap(...args) {
      let ret
      try {
        ret = fn(...args)
      } catch (e) {
        rewriteErrorTrace(e, maps)
        throw e
      }
      if (ret && typeof ret.then === 'function' && ret.catch === 'function') {
        return ret.catch(e => {
          rewriteErrorTrace(e, maps)
          return Promise.reject(e)
        })
      } else {
        return ret
      }
    }
  } else {
    return fn
  }
}
