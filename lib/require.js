'use strict'

/* eslint-disable import/no-dynamic-require */
const resolveFrom = require('resolve-from')

const requireCwd = (id, context) =>
  require(resolveFrom(context || process.cwd(), id))

const interopRequire = (id, context) =>
  typeof id === 'string' && id ? requireCwd(id, context) : id

module.exports = { requireCwd, interopRequire }
