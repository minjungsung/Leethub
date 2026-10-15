const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const root = path.resolve(__dirname, '..')
let building = false, pending = false, timer
function build() {
  if (building) { pending = true; return }
  building = true
  const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
  child.on('exit', () => {
    building = false
    console.log('Reload the unpacked extension in chrome://extensions to apply a successful build.')
    if (pending) { pending = false; build() }
  })
}
for (const directory of ['src', 'public']) {
  fs.watch(path.join(root, directory), { recursive: true }, () => {
    clearTimeout(timer); timer = setTimeout(build, 300)
  })
}
build()
