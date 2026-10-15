import { vi, type Mock } from 'vitest'
import browser from 'webextension-polyfill'
import { parseData } from './leetcode/parsing'
import { uploadOneSolveProblemOnGit } from './leetcode/uploadfunctions'
vi.mock('webextension-polyfill', () => ({ __esModule: true, default: { storage: { local: { get: vi.fn(), set: vi.fn() } } } }))
vi.mock('./storage', () => ({ initializeStorage: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./leetcode/parsing', () => ({ parseData: vi.fn() }))
vi.mock('./leetcode/uploadfunctions', () => ({ uploadOneSolveProblemOnGit: vi.fn() }))
let onMessage: Function, onCompleted: Function, enqueueSubmission: (id: string) => Promise<any>
beforeAll(async () => {
  Object.assign(global, { chrome: { runtime: { id: 'fixture-extension', onMessage: { addListener: (fn: Function) => { onMessage = fn } } },
    webRequest: { onCompleted: { addListener: (fn: Function) => { onCompleted = fn } } } } })
  enqueueSubmission = (await import('./background')).enqueueSubmission
})
beforeEach(() => {
  vi.clearAllMocks()
  ;(browser.storage.local.get as Mock).mockResolvedValue({ bjhEnable: true })
  ;(browser.storage.local.set as Mock).mockResolvedValue(undefined)
  ;(parseData as Mock).mockResolvedValue({ submissionId: '123' })
  ;(uploadOneSolveProblemOnGit as Mock).mockResolvedValue({ url: 'https://github.com/example/solutions', duplicate: false })
})
test('coalesces concurrent requests for one submission', async () => {
  const first = enqueueSubmission('123'), second = enqueueSubmission('123')
  expect(first).toBe(second)
  await first
  expect(uploadOneSolveProblemOnGit).toHaveBeenCalledTimes(1)
})
test('serializes submissions from separate tabs', async () => {
  let finish: () => void = () => {}
  ;(uploadOneSolveProblemOnGit as Mock).mockImplementationOnce(() => new Promise(resolve => { finish = () => resolve({}) }))
  const first = enqueueSubmission('100'), second = enqueueSubmission('101')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(parseData).toHaveBeenCalledTimes(1)
  finish(); await Promise.all([first, second])
  expect(parseData).toHaveBeenCalledTimes(2)
})
test('honors enablement for each queued request without reinitializing page scripts', async () => {
  ;(browser.storage.local.get as Mock).mockResolvedValue({ bjhEnable: false })
  await expect(enqueueSubmission('110')).resolves.toEqual({ skipped: true })
  expect(parseData).not.toHaveBeenCalled()
  ;(browser.storage.local.get as Mock).mockResolvedValue({ bjhEnable: true })
  await enqueueSubmission('110')
  expect(parseData).toHaveBeenCalledTimes(1)
})
test('rejects untrusted messages and former authentication messages', () => {
  const response = vi.fn()
  expect(onMessage({ task: 'uploadSubmission', submissionId: '123' }, { id: 'fixture-extension', url: 'https://example.com/' }, response)).toBe(false)
  expect(onMessage({ closeWebPage: true, token: 'untrusted' }, { id: 'fixture-extension', url: 'https://leetcode.com/' }, response)).toBe(false)
  expect(response).not.toHaveBeenCalled()
})
test('returns only safe status to a LeetCode content script', async () => {
  ;(browser.storage.local.get as Mock).mockResolvedValue({ bjhEnable: true, leethub_token: 'private-fixture-token', lastError: null })
  const response = vi.fn()
  expect(onMessage({ task: 'status' }, { id: 'fixture-extension', url: 'https://leetcode.com/problems/two-sum/' }, response)).toBe(true)
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(response).toHaveBeenCalledWith({ enabled: true, error: null, lastUpload: undefined })
})
test('does not process rejected network responses or nonaccepted submissions', async () => {
  onCompleted({ tabId: 1, statusCode: 403, url: 'https://leetcode.com/submissions/120/check/' })
  expect(parseData).not.toHaveBeenCalled()
  ;(parseData as Mock).mockResolvedValue(null)
  await expect(enqueueSubmission('120')).resolves.toEqual({ skipped: true })
  expect(uploadOneSolveProblemOnGit).not.toHaveBeenCalled()
})
test('propagates failures and releases queue for the next submission', async () => {
  ;(parseData as Mock).mockRejectedValueOnce(new Error('API unavailable'))
  await expect(enqueueSubmission('130')).rejects.toThrow('API unavailable')
  await enqueueSubmission('131')
  expect(uploadOneSolveProblemOnGit).toHaveBeenCalledTimes(1)
})
