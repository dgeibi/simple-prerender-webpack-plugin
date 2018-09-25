'use strict'

// copy from https://github.com/vuejs/vue/blob/dev/src/server/bundle-renderer/source-map-support.js
const { SourceMapConsumer } = require('source-map/lib/source-map-consumer')

const filenameRE = /\(([^)]+\.js):(\d+):(\d+)\)$/
function createSourceMapConsumers(rawMaps) {
  const maps = {}
  Object.keys(rawMaps).forEach(file => {
    maps[file] = new SourceMapConsumer(rawMaps[file])
  })
  return maps
}

function rewriteContext(pathname, context) {
  if (context && pathname.slice(0, 11) === 'webpack:///') {
    const path = require('path')
    return path.resolve(context, pathname.slice(11))
  } else {
    return pathname
  }
}

function rewriteTraceLine(trace, mapConsumers, context) {
  const m = trace.match(filenameRE)
  const map = m && mapConsumers[m[1]]
  if (m != null && map) {
    const originalPosition = map.originalPositionFor({
      line: Number(m[2]),
      column: Number(m[3]),
    })
    if (originalPosition.source != null) {
      const { source, line, column } = originalPosition
      const mappedPosition = `(${rewriteContext(
        source,
        context
      )}:${line}:${column})`
      return `${trace.replace(filenameRE, mappedPosition)}\n${trace}`
    } else {
      return trace
    }
  } else {
    return trace
  }
}

function rewriteErrorTrace(e, mapConsumers, context) {
  if (e && typeof e.stack === 'string') {
    e.stack = e.stack
      .split('\n')
      .map(line => {
        return rewriteTraceLine(line, mapConsumers, context)
      })
      .join('\n')
  }
}

const withSourceMap = (fn, maps, context) => {
  if (maps) {
    return function fnWithMap(...args) {
      let ret
      try {
        ret = fn(...args)
      } catch (e) {
        rewriteErrorTrace(e, maps, context)
        throw e
      }
      if (
        ret &&
        typeof ret.then === 'function' &&
        typeof ret.catch === 'function'
      ) {
        return ret.catch(e => {
          rewriteErrorTrace(e, maps, context)
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

module.exports = {
  withSourceMap,
  createSourceMapConsumers,
  rewriteErrorTrace,
}
