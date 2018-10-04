'use strict'

// copy from https://github.com/vuejs/vue/blob/dev/src/server/bundle-renderer/source-map-support.js
const { SourceMapConsumer } = require('source-map/lib/source-map-consumer')

const filenameRE = /\(([^)]+\.js):(\d+):(\d+)\)$/

function rewriteContext(pathname, context) {
  if (context && pathname.slice(0, 11) === 'webpack:///') {
    const path = require('path')
    return path.resolve(context, pathname.slice(11))
  } else {
    return pathname
  }
}

function rewriteTraceLine(trace, consumerPromises, consumers, maps, context) {
  const m = trace.match(filenameRE)
  if (!(m && m[1] && maps[m[1]])) return trace
  let consumerPromise = consumerPromises[m[1]]
  if (!consumerPromise) {
    consumerPromise = new SourceMapConsumer(maps[m[1]])
    consumerPromises[m[1]] = consumerPromise
  }

  return consumerPromise.then(consumer => {
    consumers[m[1]] = consumer

    const originalPosition = consumer.originalPositionFor({
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
  })
}

function rewriteErrorTrace(e, maps, context) {
  const consumerPromises = {}
  const consumers = {}
  if (e && typeof e.stack === 'string') {
    return Promise.all(
      e.stack
        .split('\n')
        .map(line =>
          rewriteTraceLine(line, consumerPromises, consumers, maps, context)
        )
    ).then(traces => {
      e.stack = traces.join('\n')
      Object.keys(consumers).forEach(source => {
        consumers[source].destroy()
      })
    })
  }
  return Promise.resolve()
}

module.exports = rewriteErrorTrace
