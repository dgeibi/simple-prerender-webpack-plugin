const SP = require('../..')
const runWebpack = require('../runWebpack')
const tap = require('tap')

const base = {
  getHtmlWebpackPluginOpts: content => ({
    template: `${__dirname}/../resources/index.ejs`,
    content,
  }),
  outputPath: __dirname,
  newContext: true,
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
    tap.notOk('a' in global)
    tap.notOk('b' in global)
  })
  .catch(tap.threw)
