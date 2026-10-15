import React from 'react'
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import browser from 'webextension-polyfill'
import Popup from './Popup'
jest.mock('../constants/Url', () => ({ WELCOME_URL: 'chrome-extension://fixture-extension/index.html#/welcome' }))
jest.mock('webextension-polyfill', () => ({ __esModule: true, default: { runtime: { sendMessage: jest.fn() }, storage: {
  local: { get: jest.fn(), set: jest.fn() }, onChanged: { addListener: jest.fn(), removeListener: jest.fn() }
} } }))
let data: Record<string, any>
beforeEach(() => {
  jest.clearAllMocks()
  data = { leethub_token: 'fixture-token', leethub_hook: 'example/solutions', bjhEnable: true,
    stats: { problems: { 'example/solutions/1': { difficulty: 'Easy' }, 'other/repo/1': { difficulty: 'Hard' } } } }
  ;(browser.storage.local.get as jest.Mock).mockImplementation(async () => data)
  ;(browser.storage.local.set as jest.Mock).mockResolvedValue(undefined)
  ;(browser.runtime.sendMessage as jest.Mock).mockResolvedValue({ duplicate: true })
})
test('links to GitHub and displays repository-scoped counts', async () => {
  render(<Popup />)
  const link = await screen.findByRole('link', { name: 'example/solutions' })
  expect(link.getAttribute('href')).toBe('https://github.com/example/solutions')
  expect(screen.getByText('Synced problems: 1')).toBeTruthy()
  expect(screen.getByText('Easy: 1 · Medium: 0 · Hard: 0')).toBeTruthy()
})
test('reacts to authentication-only changes and unregisters on unmount', async () => {
  const view = render(<Popup />)
  await screen.findByRole('link', { name: 'example/solutions' })
  data = {}
  const listener = (browser.storage.onChanged.addListener as jest.Mock).mock.calls[0][0]
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
  ;(browser.runtime.sendMessage as jest.Mock).mockResolvedValue({ error: 'GitHub 401' })
  fireEvent.click(screen.getByRole('button', { name: 'Upload submission' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('GitHub 401'))
})
