import resolveCwd from 'resolve-cwd'

// eslint-disable-next-line
export default id => require(resolveCwd(id))
