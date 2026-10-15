import { vi, type Mock } from 'vitest'
import React from 'react'
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import browser from 'webextension-polyfill'
import Popup from './Popup'
vi.mock('../constants/Url', () => ({ WELCOME_URL: 'chrome-extension://fixture-extension/index.html#/welcome' }))
vi.mock('webextension-polyfill', () => ({ __esModule: true, default: { runtime: { sendMessage: vi.fn() }, storage: {
  local: { get: vi.fn(), set: vi.fn() }, onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
} } }))
let data: Record<string, any>
beforeEach(() => {
  vi.clearAllMocks()
  data = { leethub_token: 'fixture-token', leethub_hook: 'example/solutions', bjhEnable: true,
    stats: { problems: { 'example/solutions/1': { difficulty: 'Easy' }, 'other/repo/1': { difficulty: 'Hard' } } } }
  ;(browser.storage.local.get as Mock).mockImplementation(async () => data)
  ;(browser.storage.local.set as Mock).mockResolvedValue(undefined)
  ;(browser.runtime.sendMessage as Mock).mockResolvedValue({ duplicate: true })
})
test('links to GitHub and displays repository-scoped counts', async () => {
  render(<Popup />)
  const link = await screen.findByRole('link', { name: 'example/solutions' })
  expect(link.getAttribute('href')).toBe('https://github.com/example/solutions')
  expect(screen.getByText('problems synced')).toBeTruthy()
  expect(screen.getAllByText('1')).toHaveLength(2)
  expect(screen.getByText('Easy')).toBeTruthy()
  expect(screen.getByText('Medium')).toBeTruthy()
  expect(screen.getByText('Hard')).toBeTruthy()
})
test('reacts to authentication-only changes and unregisters on unmount', async () => {
  const view = render(<Popup />)
  await screen.findByRole('link', { name: 'example/solutions' })
  data = {}
  const listener = (browser.storage.onChanged.addListener as Mock).mock.calls[0][0]
  await act(async () => listener({ leethub_token: { newValue: null } }, 'local'))
  expect(await screen.findByRole('link', { name: 'Connect GitHub' })).toBeTruthy()
  view.unmount()
  expect(browser.storage.onChanged.removeListener).toHaveBeenCalledWith(listener)
})
test('sends only a submission ID and reports duplicate or API failure accurately', async () => {
  render(<Popup />)
  await screen.findByLabelText('Upload an accepted submission')
  fireEvent.change(screen.getByLabelText('Upload an accepted submission'), { target: { value: 'https://leetcode.com/problems/two-sum/submissions/123/' } })
  fireEvent.click(screen.getByRole('button', { name: 'Upload submission' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/already uploaded/))
  expect(browser.runtime.sendMessage).toHaveBeenCalledWith({ task: 'uploadSubmission', submissionId: '123' })
  ;(browser.runtime.sendMessage as Mock).mockResolvedValue({ error: 'GitHub 401' })
  fireEvent.click(screen.getByRole('button', { name: 'Upload submission' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('GitHub 401'))
})
