const { spawnSync } = require('node:child_process')
// Preserve the existing CI command while selecting noninteractive Vitest runs.
const args = process.argv.slice(2).filter(arg => arg !== '--watchAll=false' && arg !== '--runInBand')
const result = spawnSync(process.execPath, [require('node:path').join(require('node:path').dirname(require.resolve('vitest/package.json')), 'vitest.mjs'), 'run', ...args], { stdio: 'inherit' })
if (result.error) throw result.error
process.exit(result.status ?? 1)
