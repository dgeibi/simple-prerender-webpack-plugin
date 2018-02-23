/* eslint-disable import/no-dynamic-require */
import resolveCwd from 'resolve-cwd'

const requireCwd = id => require(resolveCwd(id))

const interopRequire = id =>
  typeof id === 'string' && id ? requireCwd(id) : id

const requireFresh = id => {
  id = require.resolve(id)
  if (id in require.cache) {
    delete require.cache[id]
  }
  return require(id)
}

export { requireCwd, interopRequire, requireFresh }
