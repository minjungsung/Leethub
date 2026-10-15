import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Welcome from './Welcome'
import browser from 'webextension-polyfill'
import { createRepo, linkRepo } from '../scripts/welcome'

jest.mock('webextension-polyfill', () => ({
  __esModule: true,
  default: { storage: { local: { get: jest.fn().mockResolvedValue({ leethub_token: { invalid: true } }), set: jest.fn().mockResolvedValue(undefined) } } },
}))
jest.mock('../scripts/welcome', () => ({ createRepo: jest.fn(), linkRepo: jest.fn() }))

beforeEach(() => {
  jest.clearAllMocks()
  ;(browser.storage.local.get as jest.Mock).mockResolvedValue({ leethub_token: { invalid: true } })
  ;(browser.storage.local.set as jest.Mock).mockResolvedValue(undefined)
})

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
  await waitFor(() => expect(browser.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({ leethub_token: 'test-only-token', leethub_username: 'test-account', bjhEnable: false, leethub_hook: null })))
  expect((screen.getByLabelText(/repository-scoped github token/i) as HTMLInputElement).value).toBe('')
})

test('links an organization repository and persists language organization and enablement', async () => {
  ;(browser.storage.local.get as jest.Mock).mockResolvedValue({ leethub_token: 'fixture-token', leethub_username: 'fixture-account' })
  ;(linkRepo as jest.Mock).mockResolvedValue({ full_name: 'example/solutions' })
  render(<Welcome />)
  fireEvent.change(screen.getByPlaceholderText(/repository/i), { target: { value: 'example/solutions' } })
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'link' } })
  fireEvent.change(screen.getByLabelText(/organize solutions/i), { target: { value: 'language' } })
  fireEvent.click(screen.getByRole('button', { name: /get started/i }))
  await waitFor(() => expect(browser.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({ leethub_hook: 'example/solutions', leethub_OrgOption: 'language', bjhEnable: true })))
  expect(linkRepo).toHaveBeenCalledWith('fixture-token', 'example/solutions')
})

test('shows repository API failure without persisting a connection', async () => {
  ;(browser.storage.local.get as jest.Mock).mockResolvedValue({ leethub_token: 'fixture-token', leethub_username: 'fixture-account' })
  ;(linkRepo as jest.Mock).mockRejectedValue(new Error('GitHub 403'))
  render(<Welcome />)
  fireEvent.change(screen.getByPlaceholderText(/repository/i), { target: { value: 'solutions' } })
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'link' } })
  fireEvent.click(screen.getByRole('button', { name: /get started/i }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('GitHub 403'))
  expect(browser.storage.local.set).not.toHaveBeenCalled()
})
