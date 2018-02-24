export default script =>
  `(function (exports, require, module, __filename, __dirname) { var global = this;${script}\n});`
