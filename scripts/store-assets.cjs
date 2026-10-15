const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')
const CDP = require('chrome-remote-interface')
// Use a configurable Chrome binary and a disposable profile, never a personal profile.
const binary = process.env.LEETHUB_CHROME_BINARY || (process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome')
const root = path.resolve(__dirname, '..')
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
async function main() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'leethub-store-'))
  const child = spawn(binary, ['--headless=new', '--no-first-run', '--no-default-browser-check',
    '--enable-unsafe-extension-debugging', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })
  let browser, page
  try {
    const portFile = path.join(profile, 'DevToolsActivePort')
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await delay(100)
    const [portValue, browserPath] = fs.readFileSync(portFile, 'utf8').split('\n')
    const port = Number(portValue)
    browser = await CDP({ target: `ws://127.0.0.1:${port}${browserPath}` })
    const loaded = await browser.send('Extensions.loadUnpacked', { path: path.join(root, 'build') })
    const url = `chrome-extension://${loaded.id}/index.html`
    await CDP.New({ port, url })
    await delay(500)
    const target = (await CDP.List({ port })).find(item => item.url === url)
    page = await CDP({ port, target })
    await page.Runtime.enable()
    await page.Page.enable()
    await page.Emulation.setDeviceMetricsOverride({ width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
    async function evaluate(expression) {
      const result = await page.Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true })
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
      return result.result.value
    }
    const state = await evaluate("Promise.all([chrome.runtime.sendMessage({task:'status'}),chrome.storage.local.get(null)]).then(([s,d])=>({title:document.querySelector('h1')?.textContent,enabled:s.enabled,migrated:d.isSync,error:s.error||null}))")
    if (state.title !== 'LeetHub' || !state.migrated || state.error) throw new Error('Popup / service worker smoke failed')
    console.log('Popup / worker smoke passed:', JSON.stringify(state))
    fs.mkdirSync(path.join(root, 'store/assets'), { recursive: true })
    // Rasterize the shared vector mark at high resolution for crisp small icons.
    const mark = fs.readFileSync(path.join(root, 'public/assets/leethub-mark.svg'), 'utf8')
    for (const size of [16, 32, 48, 128]) {
      const data = await evaluate(`(async()=>{const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(${JSON.stringify(mark)});await image.decode();const large=document.createElement('canvas');large.width=large.height=${size * 4};large.getContext('2d').drawImage(image,0,0,large.width,large.height);const c=document.createElement('canvas');c.width=c.height=${size};const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(large,0,0,c.width,c.height);return c.toDataURL('image/png').split(',')[1]})()`)
      fs.writeFileSync(path.join(root, `public/assets/icon-${size}.png`), Buffer.from(data, 'base64'))
    }
    fs.copyFileSync(path.join(root, 'public/assets/icon-128.png'), path.join(root, 'store/assets/icon-128.png'))
    const tile = await evaluate("(()=>{const c=document.createElement('canvas');c.width=440;c.height=280;const x=c.getContext('2d');x.fillStyle='#2563eb';x.fillRect(0,0,440,280);x.fillStyle='#ffffff';x.font='bold 54px Arial';x.fillText('LeetHub',30,110);x.fillStyle='white';x.font='23px Arial';x.fillText('Accepted solutions',30,170);x.fillText('LeetCode to GitHub',30,208);return c.toDataURL('image/png').split(',')[1]})()")
    fs.writeFileSync(path.join(root, 'store/assets/promo-440x280.png'), Buffer.from(tile, 'base64'))
    // Fictional local demonstration data: no live account, token, submission or API write.
    await evaluate("chrome.storage.local.set({leethub_hook:'example/solutions',bjhEnable:true,stats:{problems:{'example/solutions/1':{difficulty:'Easy'},'example/solutions/2':{difficulty:'Medium'}}}})")
    await delay(300)
    const screenshot = await page.Page.captureScreenshot({ format: 'png' })
    fs.writeFileSync(path.join(root, 'store/assets/popup-1280x800.png'), Buffer.from(screenshot.data, 'base64'))
    await evaluate("location.hash='/welcome'")
    await delay(300)
    const setup = await page.Page.captureScreenshot({ format: 'png' })
    fs.writeFileSync(path.join(root, 'store/assets/setup-1280x800.png'), Buffer.from(setup.data, 'base64'))
    console.log('Created store graphics and screenshots with fictional local data.')
  } finally {
    if (page) await page.close()
    if (browser) await browser.close()
    child.kill()
    await new Promise(resolve => child.once('exit', resolve))
    fs.rmSync(profile, { recursive: true, force: true })
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
