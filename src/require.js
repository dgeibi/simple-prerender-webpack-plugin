/* eslint-disable import/no-dynamic-require */
import resolveCwd from 'resolve-cwd'

const requireCwd = id => require(resolveCwd(id))

const interopRequire = id => (typeof id === 'string' && id ? require(id) : id)

export { requireCwd, interopRequire }
