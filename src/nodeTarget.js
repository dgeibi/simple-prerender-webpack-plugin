import { nodeExternals } from './peers'

export default ({ nodeExternalsOptions } = {}) => ({
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
