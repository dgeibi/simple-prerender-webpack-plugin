const SP = require('../..')
const runWebpack = require('../runWebpack')
const tap = require('tap')

const base = {
  getHtmlWebpackPluginOpts: content => ({
    template: `${__dirname}/../resources/index.ejs`,
    content,
  }),
  outputPath: __dirname,
}
runWebpack([
  new SP(
    Object.assign({}, base, {
      entry: `${__dirname}/entry1.js`,
      routes: ['/'],
    })
  ),
  new SP(
    Object.assign({}, base, {
      entry: `${__dirname}/entry2.js`,
      routes: ['/index2.html'],
    })
  ),
])
  .then(({ fs, outputPath, html }) => {
    tap.matchSnapshot(html)
    tap.matchSnapshot(fs.readFileSync(`${outputPath}/index2.html`, 'utf8'))
    tap.ok((global.a = 1))
    tap.ok((global.b = 2))
  })
  .catch(tap.threw)
