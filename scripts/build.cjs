const fs = require('node:fs')
const path = require('node:path')
const esbuild = require('esbuild')
const root = path.resolve(__dirname, '..')
async function build() {
  fs.rmSync(path.join(root, 'build'), { recursive: true, force: true })
  fs.cpSync(path.join(root, 'public'), path.join(root, 'build'), { recursive: true })
  const options = {
    absWorkingDir: root,
    entryPoints: { main: 'src/popup/index.tsx', background: 'src/scripts/background.ts', content: 'src/scripts/leetcode/programmers.ts' },
    outdir: 'build', bundle: true, splitting: false, format: 'iife', platform: 'browser',
    target: ['chrome110'], minify: true, sourcemap: false,
    define: { 'process.env.NODE_ENV': '"production"' },
    loader: { '.png': 'file', '.jpg': 'file', '.svg': 'file', '.woff': 'file', '.woff2': 'file', '.ttf': 'file', '.eot': 'file' },
    assetNames: 'assets/[name]-[hash]'
  }
  const html = path.join(root, 'build/index.html')
  fs.writeFileSync(html, fs.readFileSync(html, 'utf8').replace('</head>', '<link rel="stylesheet" href="main.css"></head>').replace('</body>', '<script src="main.js"></script></body>'))
  if (process.argv.includes('--watch')) {
    const context = await esbuild.context(options)
    await context.watch()
    console.log('Watching extension sources; reload the unpacked extension after changes.')
  } else { await esbuild.build(options) }
}
build().catch(error => { console.error(error); process.exitCode = 1 })
