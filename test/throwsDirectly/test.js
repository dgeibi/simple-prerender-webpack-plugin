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

runWebpack(plugin).catch(error => {
  tap.match(error[0], /(test[\\/]throwsDirectly[\\/]entry.js:1:0)/)
})
