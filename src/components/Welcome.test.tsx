import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Welcome from './Welcome'
import browser from 'webextension-polyfill'
import { createRepo } from '../scripts/welcome'

jest.mock('webextension-polyfill', () => ({
  __esModule: true,
  default: { storage: { local: { get: jest.fn().mockResolvedValue({ leethub_token: { invalid: true } }), set: jest.fn().mockResolvedValue(undefined) } } },
}))
jest.mock('../scripts/welcome', () => ({ createRepo: jest.fn(), linkRepo: jest.fn() }))

test('rejects non-string stored authorization instead of creating a repository', async () => {
  (browser.storage.local.get as jest.Mock).mockResolvedValue({ leethub_token: { invalid: true } })
  render(<Welcome />)
  fireEvent.change(screen.getByPlaceholderText(/repository/i), { target: { value: 'solutions' } })
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'new' } })
  const button = screen.getByRole('button', { name: /get started/i })
  fireEvent.click(button)
  await waitFor(() => expect(screen.getByText(/Authorization error - Grant/)).toBeTruthy())
  expect(createRepo).not.toHaveBeenCalled()
})


test('does not persist a rejected token', async () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: false })
  global.fetch = fetchMock
  ;(browser.storage.local.set as jest.Mock).mockClear()
  render(<Welcome />)
  fireEvent.change(screen.getByLabelText(/repository-scoped github token/i), { target: { value: 'invalid-test-token' } })
  fireEvent.click(screen.getByRole('button', { name: /connect github/i }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/failed/i))
  expect(browser.storage.local.set).not.toHaveBeenCalled()
})

test('stores verified authentication and clears the input', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ login: 'test-account' }) })
  ;(browser.storage.local.set as jest.Mock).mockClear()
  render(<Welcome />)
  fireEvent.change(screen.getByLabelText(/repository-scoped github token/i), { target: { value: 'test-only-token' } })
  fireEvent.click(screen.getByRole('button', { name: /connect github/i }))
  await waitFor(() => expect(browser.storage.local.set).toHaveBeenCalledWith({ leethub_token: 'test-only-token', leethub_username: 'test-account' }))
  expect((screen.getByLabelText(/repository-scoped github token/i) as HTMLInputElement).value).toBe('')
})
