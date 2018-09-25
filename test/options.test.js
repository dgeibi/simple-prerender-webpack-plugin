/* eslint-disable no-new */

const SP = require('..')
const tap = require('tap')

tap.throws(() => {
  new SP()
})

tap.throws(() => {
  new SP({
    routes: [],
  })
})

tap.doesNotThrow(() => {
  new SP({
    routes: ['/'],
    entry: `${__dirname}/resources/entry.js`,
  })
})

tap.doesNotThrow(() => {
  new SP({
    routes: ['/'],
    config: {},
    entry: `${__dirname}/resources/entry.js`,
  })
})
