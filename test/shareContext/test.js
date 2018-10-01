const tap = require('tap')
const HtmlWebackPlugin = require('html-webpack-plugin')

const SP = require('../..')
const runWebpack = require('../runWebpack')

const base = {
  template: `${__dirname}/../resources/index.ejs`,
}

runWebpack([
  new HtmlWebackPlugin({
    ...base,
    filename: 'index.html',
    prerenderId: '1',
  }),
  new HtmlWebackPlugin({
    ...base,
    filename: 'index2.html',
    prerenderId: '2',
  }),
  new SP({
    entry: `${__dirname}/entry1.js`,
    id: '1',
  }),
  new SP({
    entry: `${__dirname}/entry2.js`,
    id: '2',
  }),
])
  .then(({ fs, outputPath, html }) => {
    tap.matchSnapshot(html)
    tap.matchSnapshot(fs.readFileSync(`${outputPath}/index2.html`, 'utf8'))
    tap.ok((global.a = 1))
    tap.ok((global.b = 2))
  })
  .catch(tap.threw)
