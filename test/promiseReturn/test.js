const tap = require('tap')
const SP = require('../..')
const runWebpack = require('../runWebpack')

const plugin = new SP({
  routes: ['/'],
  entry: `${__dirname}/entry.js`,
  outputPath: __dirname,
  customizeHtmlWebpackPluginOpts: () => ({
    template: `${__dirname}/../resources/index.ejs`,
  }),
})

runWebpack(plugin).then(({ html }) => {
  tap.matchSnapshot(html)
})
