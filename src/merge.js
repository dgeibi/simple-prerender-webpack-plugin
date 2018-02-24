/* eslint-disable consistent-return */
import webpackMerge from 'webpack-merge'
import pseries from 'promise.series'

function merge(opts) {
  const configs = []

  function pushSync(x) {
    if (x && typeof x === 'object') {
      configs.push(x)
    }
  }

  function push(x) {
    if (x && typeof x.then === 'function') {
      return Promise.resolve(x).then(pushSync)
    }
    pushSync(x)
  }

  function pushConfig(x) {
    if (!x) return
    if (typeof x === 'function') {
      return push(x())
    }
    return push(x)
  }

  return pseries(opts.map(x => () => pushConfig(x))).then(() =>
    webpackMerge(configs)
  )
}

export default merge
