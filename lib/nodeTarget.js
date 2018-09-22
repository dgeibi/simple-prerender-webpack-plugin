'use strict'

const nodeExternals = require('webpack-node-externals')

module.exports = ({ nodeExternalsOptions } = {}) => ({
  node: {
    console: false,
    global: false,
    process: false,
    __filename: false,
    __dirname: false,
    Buffer: false,
    setImmediate: false,
  },
  target: 'node',
  externals: [nodeExternals(nodeExternalsOptions)],
})
