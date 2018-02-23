import { webpack } from './peers'
import { requireFresh } from './require'
import nodeTarget from './nodeTarget'
import merge from './merge'

function requireWithWebpack({
  entry,
  config,
  nodeExternalsOptions,
  sourcemap,
  outputPath,
  filename,
  fullFilename,
}) {
  return merge([
    nodeTarget({
      nodeExternalsOptions,
      sourcemap,
    }),
    config,
    {
      entry,
      output: {
        path: outputPath,
        filename,
        libraryTarget: 'commonjs2',
      },
    },
    sourcemap && {
      devtool: 'sourcemap',
    },
  ]).then(webpackConfig => {
    const compiler = webpack(webpackConfig)
    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err || stats.hasErrors()) {
          reject(err || stats)
          return
        }

        let object
        try {
          object = requireFresh(fullFilename)
        } catch (e) {
          reject(e)
          return
        }
        resolve(object)
      })
    })
  })
}

export default requireWithWebpack
