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

tap.rejects(
  runWebpack(plugin).catch(error => {
    const { fs, outputPath, stack } = error
    tap.match(stack, /\\entry.js:1:1/)
    tap.ok(fs.existsSync(path.join(outputPath, 'prerender.js')))
    tap.ok(fs.existsSync(path.join(outputPath, 'prerender.js.map')))
    throw error
  })
)
