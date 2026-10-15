import { vi, type Mock } from 'vitest'
import browser from 'webextension-polyfill'
import { initializeStorage } from './storage'
vi.mock('webextension-polyfill', () => ({ __esModule: true, default: { storage: {
  local: { get: vi.fn(), set: vi.fn() }, sync: { get: vi.fn(), remove: vi.fn() }
} } }))
beforeEach(() => {
  Object.assign(global, { chrome: { storage: { local: { setAccessLevel: vi.fn().mockResolvedValue(undefined) } } } })
  vi.clearAllMocks()
  ;(browser.storage.local.set as Mock).mockResolvedValue(undefined)
  ;(browser.storage.sync.remove as Mock).mockResolvedValue(undefined)
})
test('preserves current local credentials and imports only missing legacy values', async () => {
  ;(browser.storage.local.get as Mock).mockResolvedValue({ leethub_token: 'current-token', leethub_hook: 'example/current' })
  ;(browser.storage.sync.get as Mock).mockResolvedValue({ leethub_token: 'old-token', leethub_hook: 'example/old', leethub_username: 'fixture-account', stats: undefined })
  await initializeStorage()
  expect(chrome.storage.local.setAccessLevel).toHaveBeenCalledWith({ accessLevel: 'TRUSTED_CONTEXTS' })
  expect(browser.storage.local.set).toHaveBeenNthCalledWith(1, { leethub_username: 'fixture-account' })
  expect(browser.storage.local.set).toHaveBeenNthCalledWith(2, { isSync: true })
  expect(browser.storage.sync.remove).toHaveBeenCalledWith(['leethub_token'])
})
test('does not mark an incomplete migration as completed', async () => {
  ;(browser.storage.local.get as Mock).mockResolvedValue({})
  ;(browser.storage.sync.get as Mock).mockResolvedValue({ leethub_token: 'old-token' })
  ;(browser.storage.local.set as Mock).mockRejectedValueOnce(new Error('write failed'))
  await expect(initializeStorage()).rejects.toThrow('write failed')
  expect(browser.storage.local.set).not.toHaveBeenCalledWith({ isSync: true })
})
test('does not mutate statistics or repeat completed migration', async () => {
  ;(browser.storage.local.get as Mock).mockResolvedValue({ isSync: true, stats: { problems: { preserved: {} } } })
  await initializeStorage()
  expect(browser.storage.local.set).not.toHaveBeenCalled()
  expect(browser.storage.sync.get).not.toHaveBeenCalled()
})
