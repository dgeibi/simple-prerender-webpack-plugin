const SP = require('../..')
const runWebpack = require('../runWebpack')
const tap = require('tap')

const plugin = new SP({
  routes: ['/'],
  entry: `${__dirname}/entry.js`,
  getHtmlWebpackPluginOpts: content => ({
    template: `${__dirname}/../resources/index.ejs`,
    content,
  }),
})

tap.rejects(
  runWebpack(plugin).catch(error => {
    tap.match(error.stack, /\\entry.js:2:1)/)
    throw error
  })
)
