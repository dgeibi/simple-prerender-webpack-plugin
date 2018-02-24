import vm from 'vm'
import { dirname } from 'path'
import { requireCwd } from './require'
import moduleWrap from './moduleWrap'

export default function importFromMemory(fileRaw, fullpath, newContext) {
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
