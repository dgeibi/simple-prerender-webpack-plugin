const tap = require('tap')
const fs = require('fs-extra')
const SP = require('../..')
const runWebpack = require('../runWebpack')

const filename = `${__dirname}/prerender.js`

const plugin = new SP({
  routes: ['/'],
  entry: `${__dirname}/entry.js`,
  customizeHtmlWebpackPluginOpts: {
    template: `${__dirname}/../resources/index.ejs`,
  },
  writeToDisk: true,
  filename,
})

Promise.all([fs.remove(filename), fs.remove(`${filename}.map`)]).then(() =>
  runWebpack(plugin).then(({ html }) => {
    tap.matchSnapshot(html)
    tap.ok(fs.existsSync(filename))
    tap.ok(fs.existsSync(`${filename}.map`))
  })
)
