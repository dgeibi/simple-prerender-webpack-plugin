import requireCwd from './requireCwd'

const nodeExternals = requireCwd('webpack-node-externals')
const webpack = requireCwd('webpack')
const MemoryFS = requireCwd('memory-fs')

export { nodeExternals, webpack, MemoryFS }
