// The content script sends only submission IDs. Tokens and GitHub writes stay in
// the extension service worker. API completion events detect new submissions;
// this observer also supports navigating to an existing submission detail page.
let lastRoute = ''
let timer: ReturnType<typeof setInterval>
let checking = false
async function inspectRoute(): Promise<void> {
  if (checking) return
  checking = true
  try {
    const match = window.location.pathname.match(/\/submissions\/(?:detail\/)?(\d+)(?:\/|$)/)
    if (!match) { lastRoute = ''; return }
    const route = `${window.location.pathname}:${match[1]}`
    const status = await chrome.runtime.sendMessage({ task: 'status' })
    if (!status?.enabled) { lastRoute = ''; return }
    if (route === lastRoute) return
    const result = await chrome.runtime.sendMessage({ task: 'uploadSubmission', submissionId: match[1] })
    if (result?.error) { lastRoute = route; console.warn('LeetHub:', result.error) }
    else lastRoute = route
  } catch {
    // Extension reload invalidates this context. A page reload installs the new one.
    clearInterval(timer)
  } finally { checking = false }
}
timer = setInterval(() => { void inspectRoute() }, 2000)
void inspectRoute()
window.addEventListener('pagehide', () => clearInterval(timer), { once: true })
export {}
