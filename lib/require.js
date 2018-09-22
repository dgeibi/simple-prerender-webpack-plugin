'use strict'

/* eslint-disable import/no-dynamic-require */
const resolveCwd = require('resolve-cwd')

const requireCwd = id => require(resolveCwd(id))

const interopRequire = id =>
  typeof id === 'string' && id ? requireCwd(id) : id

module.exports = { requireCwd, interopRequire }
