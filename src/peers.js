import { requireCwd } from './require'

const HtmlWebpackPlugin = requireCwd('html-webpack-plugin')
const webpack = requireCwd('webpack')
const MemoryFS = requireCwd('memory-fs')

export { webpack, HtmlWebpackPlugin, MemoryFS }
