const tap = require('tap')
const SP = require('../..')
const runWebpack = require('../runWebpack')

const plugin = new SP({
  routes: ['/'],
  entry: `${__dirname}/entry.js`,
  getHtmlWebpackPluginOpts: content => ({
    template: `${__dirname}/../resources/index.ejs`,
    content,
  }),
  outputPath: __dirname,
})

runWebpack(plugin).catch(error => {
  tap.match(error.stack, /entry.js:2:0/)
})
