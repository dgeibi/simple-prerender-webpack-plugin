const tap = require('tap')
const SP = require('../..')
const runWebpack = require('../runWebpack')

const plugin = new SP({
  routes: ['/'],
  entry: `${__dirname}/entry.js`,
  customizeHtmlWebpackPluginOpts: () => ({
    template: `${__dirname}/../resources/index.ejs`,
  }),
  outputPath: __dirname,
})

runWebpack(plugin).catch(error => {
  tap.match(error.stack, /entry.js:2:0/)
})
