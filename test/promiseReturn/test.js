const tap = require('tap')
const SP = require('../..')
const runWebpack = require('../runWebpack')

const plugin = new SP({
  routes: ['/'],
  entry: `${__dirname}/entry.js`,
  outputPath: __dirname,
  getHtmlWebpackPluginOpts: content => ({
    template: `${__dirname}/../resources/index.ejs`,
    content,
  }),
})

runWebpack(plugin).then(({ html }) => {
  tap.matchSnapshot(html)
})
