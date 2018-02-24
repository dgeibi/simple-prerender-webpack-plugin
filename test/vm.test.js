const vm = require('vm')
const t = require('tap')

vm.runInNewContext(`() => {
    a = 'ha'
  }
  `)()

t.ok(global.a !== 'ha')

vm.runInThisContext(`() => {
    a = 'ha'
  }
`)()
t.ok(global.a === 'ha')

vm.runInThisContext(`() => {
    var global = this
    global.a = 'xha'
  }
`)()
t.ok(global.a === 'xha')
