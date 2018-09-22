'use strict'

const vm = require('vm')
const { dirname } = require('path')
const { requireCwd } = require('./require')
const moduleWrap = require('./moduleWrap')

module.exports = function importFromMemory(fileRaw, fullpath, newContext) {
  const vmModule = { exports: {} }
  const script = new vm.Script(moduleWrap(fileRaw), {
    filename: fullpath,
  })
  const loadModule = newContext
    ? script.runInNewContext()
    : script.runInThisContext()
  loadModule(
    vmModule.exports,
    requireCwd,
    vmModule,
    fullpath,
    dirname(fullpath)
  )
  return vmModule.exports
}
