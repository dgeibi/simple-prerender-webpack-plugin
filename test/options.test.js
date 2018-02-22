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

tap.throws(() => {
  new SP({
    routes: ['/'],
    config: null,
  })
})

tap.throws(() => {
  new SP({
    routes: ['/'],
  })
})

tap.doesNotThrow(() => {
  new SP({
    routes: ['/'],
    entry: `${__dirname}/resources/entry.js`,
  })
})

tap.throws(() => {
  new SP({
    routes: ['/'],
    entry: `${__dirname}/resources/nothing.js`,
  })
})

tap.doesNotThrow(() => {
  new SP({
    routes: ['/'],
    config: {},
    entry: `${__dirname}/resources/entry.js`,
  })
})
