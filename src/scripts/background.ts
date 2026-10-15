import browser from 'webextension-polyfill'
import { initializeStorage } from './storage'
import { parseData } from './leetcode/parsing'
import { uploadOneSolveProblemOnGit } from './leetcode/uploadfunctions'

let ready: Promise<void> | undefined
function initialize(): Promise<void> {
  if (!ready) ready = initializeStorage().catch(error => { ready = undefined; throw error })
  return ready
}
void initialize().catch(() => {})
let queue: Promise<unknown> = Promise.resolve()
const pending = new Map<string, Promise<any>>()

export function enqueueSubmission(id: string): Promise<any> {
  if (!/^\d+$/.test(id)) return Promise.reject(new Error('Invalid submission ID'))
  const existing = pending.get(id)
  if (existing) return existing
  const job = queue.then(async () => {
    await initialize()
    const { bjhEnable } = await browser.storage.local.get('bjhEnable')
    if (bjhEnable !== true) return { skipped: true }
    const submission = await parseData(id)
    if (!submission) return { skipped: true }
    return uploadOneSolveProblemOnGit(submission)
  })
  queue = job.catch(() => {})
  pending.set(id, job)
  void job.finally(() => pending.delete(id)).catch(() => {})
  return job
}

function reportError(error: unknown): Promise<void> {
  return browser.storage.local.set({ lastError: error instanceof Error ? error.message : 'Upload failed' })
}

chrome.webRequest.onCompleted.addListener(details => {
  if (details.tabId < 0 || details.statusCode !== 200) return
  const id = new URL(details.url).pathname.match(/^\/submissions\/(?:detail\/)?(\d+)\/check\/?$/)?.[1]
  if (id) void enqueueSubmission(id).catch(reportError)
}, { urls: ['https://leetcode.com/submissions/*/check/'] })

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !sender.url) return false
  const url = new URL(sender.url)
  const extensionPage = url.protocol === 'chrome-extension:' && url.host === chrome.runtime.id
  const leetcodePage = url.origin === 'https://leetcode.com'
  if (!extensionPage && !leetcodePage) return false
  if (request?.task === 'status') {
    void initialize().then(async () => {
      const data = await browser.storage.local.get(['bjhEnable', 'lastUpload', 'lastError'])
      sendResponse({ enabled: data.bjhEnable === true, lastUpload: data.lastUpload, error: data.lastError })
    }).catch(error => sendResponse({ error: String(error) }))
    return true
  }
  if (request?.task !== 'uploadSubmission' || typeof request.submissionId !== 'string') return false
  void enqueueSubmission(request.submissionId).then(sendResponse).catch(async error => {
    await reportError(error)
    sendResponse({ error: error.message || 'Upload failed' })
  })
  return true
})
