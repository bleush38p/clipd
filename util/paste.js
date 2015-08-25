var childProc = require('child_process')

module.exports = function(callback) {
  return childProc.execSync('pbpaste').toString()
}