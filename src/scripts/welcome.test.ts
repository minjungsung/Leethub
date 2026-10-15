import { createRepo, linkRepo } from './welcome'
beforeEach(() => { global.fetch = jest.fn() })
const repo = { full_name: 'example/solutions', html_url: 'https://github.com/example/solutions', default_branch: 'main', permissions: { push: true } }
test('creates an initialized private repository without jQuery or DOM callbacks', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => repo })
  await expect(createRepo('fixture-token', 'solutions')).resolves.toEqual(repo)
  expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/user/repos', expect.objectContaining({ body: expect.stringContaining('"auto_init":true') }))
})
test('rejects creation errors instead of entering commit mode', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: 'Server error' }) })
  await expect(createRepo('fixture-token', 'solutions')).rejects.toThrow('GitHub 500')
})
test('rejects an explicitly read-only repository', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ...repo, permissions: { push: false } }) })
  await expect(linkRepo('fixture-token', 'example/solutions')).rejects.toThrow(/writes/)
})
test('rejects malformed repository names before requesting an API', async () => {
  await expect(linkRepo('fixture-token', '../wrong')).rejects.toThrow(/owner/)
  expect(global.fetch).not.toHaveBeenCalled()
})
