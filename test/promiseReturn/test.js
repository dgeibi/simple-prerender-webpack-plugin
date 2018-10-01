const tap = require('tap')
const HtmlWebackPlugin = require('html-webpack-plugin')

const SP = require('../..')
const runWebpack = require('../runWebpack')

const plugin = [
  new HtmlWebackPlugin({
    filename: 'index.html',
    template: `${__dirname}/../resources/index.ejs`,
  }),
  new SP({
    entry: `${__dirname}/entry.js`,
  }),
]

runWebpack(plugin).then(({ html }) => {
  tap.matchSnapshot(html)
})
