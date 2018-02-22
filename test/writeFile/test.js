const SP = require('../..')
const runWebpack = require('../runWebpack')
const tap = require('tap')
const path = require('path')

const plugin = new SP({
  routes: ['/'],
  entry: `${__dirname}/entry.js`,
  getHtmlWebpackPluginOpts: content => ({
    template: `${__dirname}/../resources/index.ejs`,
    content,
  }),
  writeFile: true,
})

runWebpack(plugin)
  .then(({ html, fs, outputPath }) => {
    tap.matchSnapshot(html)
    tap.ok(fs.existsSync(path.join(outputPath, 'prerender.js')))
    tap.ok(fs.existsSync(path.join(outputPath, 'prerender.js.map')))
  })
  .catch(tap.threw)
