const tap = require('tap')
const HtmlWebackPlugin = require('html-webpack-plugin')
const SP = require('../..')
const runWebpack = require('../runWebpack')

const plugin = [
  new HtmlWebackPlugin({
    template: `${__dirname}/../resources/index.ejs`,
    filename: 'index.html',
  }),
  new SP({
    entry: `${__dirname}/entry.js`,
  }),
]

runWebpack(plugin).catch(errors => {
  tap.match(errors[0], /entry.js:2:0/)
})
