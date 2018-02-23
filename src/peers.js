import { requireCwd } from './require'

const HtmlWebpackPlugin = requireCwd('html-webpack-plugin')
const webpack = requireCwd('webpack')

export { webpack, HtmlWebpackPlugin }
