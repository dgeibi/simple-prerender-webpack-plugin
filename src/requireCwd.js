import resolveCwd from 'resolve-cwd'

// eslint-disable-next-line
const requireCwd = id => require(resolveCwd(id))

export default requireCwd
