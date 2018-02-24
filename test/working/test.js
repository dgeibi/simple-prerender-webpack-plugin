const SP = require('../..')
const runWebpack = require('../runWebpack')
const tap = require('tap')
const fs = require('fs')

const plugin = new SP({
  routes: ['/'],
  entry: `${__dirname}/entry.js`,
  outputPath: __dirname,
  getHtmlWebpackPluginOpts: content => ({
    template: `${__dirname}/../resources/index.ejs`,
    content,
  }),
  writeToDisk: true,
})

runWebpack(plugin).then(({ html }) => {
  tap.matchSnapshot(html)
  tap.ok(fs.existsSync(plugin.opts.fullFilename))
  tap.ok(fs.existsSync(`${plugin.opts.fullFilename}.map`))
})
