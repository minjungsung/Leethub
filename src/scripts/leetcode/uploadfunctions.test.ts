import browser from 'webextension-polyfill'
import { TextEncoder } from 'util'
import { uploadOneSolveProblemOnGit, sourcePath, blobSha } from './uploadfunctions'
import { LeetcodeData } from '../../types/LeetcodeData'
import { createHash } from 'crypto'
Object.assign(global, { TextEncoder })
jest.mock('webextension-polyfill', () => ({ __esModule: true, default: { storage: { local: { get: jest.fn(), set: jest.fn() } } } }))
const sample: LeetcodeData = { submissionId: '123', problemId: '1', title: 'Two Sum', slug: 'two-sum',
  codeSnippet: 'return "안녕 😀";', description: '<p>Find numbers</p>', language: 'C++', difficulty: 'Easy', runtime: '1 ms', memory: '5 MB', timestamp: 100 }
let configuration: Record<string, any>
let requests: { url: string; method: string; body: any }[]
let fail: number | undefined
let conflicts: number
let identical: boolean
let sourceExistsOnly: boolean
let disableDuringBlob: boolean
let heads: number
beforeEach(() => {
  configuration = { leethub_token: 'fixture-token', leethub_hook: 'example/solutions', bjhEnable: true, leethub_OrgOption: 'platform', stats: { problems: {} } }
  ;(browser.storage.local.get as jest.Mock).mockImplementation(async () => configuration)
  ;(browser.storage.local.set as jest.Mock).mockReset()
  requests = []; fail = undefined; conflicts = 0; identical = false; heads = 0; sourceExistsOnly = false; disableDuringBlob = false
  global.fetch = jest.fn(async (input, init) => {
    const url = String(input), method = init?.method || 'GET'
    const body = init?.body ? JSON.parse(init.body as string) : undefined
    requests.push({ url, method, body })
    let data: any = { default_branch: 'develop' }, status = 200
    if (url.includes('/git/ref/heads/')) { heads++; data = { object: { sha: `parent-${heads}` } } }
    else if (url.includes('/git/commits/') && method === 'GET') data = { tree: { sha: `tree-${heads}` } }
    else if (url.includes('/contents/')) {
      const readme = `# ${sample.title}\n\n[Problem](https://leetcode.com/problems/${sample.slug}/)\n\nDifficulty: ${sample.difficulty}\n\n${sample.description}\n`
      if (identical || (sourceExistsOnly && !url.includes('README.md'))) data = { sha: blobSha(url.includes('README.md') ? readme : sample.codeSnippet) }
      else { status = 404; data = { message: 'Not Found' } }
    }
    else if (url.endsWith('/git/blobs')) { data = { sha: 'blob' }; if (disableDuringBlob) configuration = { ...configuration, bjhEnable: false } }
    else if (url.endsWith('/git/trees')) data = { sha: 'new-tree' }
    else if (url.endsWith('/git/commits') && method === 'POST') data = { sha: 'new-commit' }
    else if (method === 'PATCH') {
      data = { object: { sha: 'new-commit' } }
      if (conflicts > 0) { conflicts--; status = 422; data = { message: 'Update is not a fast forward' } }
      else if (fail) { status = fail; data = { message: 'Denied' } }
    }
    return { ok: status < 400, status, json: async () => data } as Response
  }) as jest.Mock
})
test('uses UTF-8 byte length for Git blob hashing and preserves source bytes', async () => {
  const bytes = Buffer.from(sample.codeSnippet)
  expect(blobSha(sample.codeSnippet)).toBe(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'))
  await uploadOneSolveProblemOnGit(sample)
  const blob = requests.find(request => request.url.endsWith('/git/blobs'))!
  expect(Buffer.from(blob.body.content, 'base64').toString()).toBe(sample.codeSnippet)
})
test('uploads to the default branch with its actual base tree and confirms success', async () => {
  await expect(uploadOneSolveProblemOnGit(sample)).resolves.toEqual({ duplicate: false, url: 'https://github.com/example/solutions/tree/develop/LeetCode/0001-two-sum' })
  expect(requests.find(request => request.method === 'PATCH')?.body.force).toBe(false)
  expect(requests.find(request => request.url.endsWith('/git/trees'))?.body.base_tree).toBe('tree-1')
  expect(browser.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({ stats: expect.objectContaining({ problems: { 'example/solutions/1': expect.objectContaining({ difficulty: 'Easy', runtime: '1 ms' }) } }) }))
})
test.each([401, 403, 500])('rejects HTTP %s without saving success or statistics', async status => {
  fail = status
  await expect(uploadOneSolveProblemOnGit(sample)).rejects.toThrow(`GitHub ${status}`)
  expect(browser.storage.local.set).not.toHaveBeenCalled()
})
test('retries a concurrent update using a fresh head and preserves concurrent changes', async () => {
  conflicts = 1
  await uploadOneSolveProblemOnGit(sample)
  const commits = requests.filter(request => request.url.endsWith('/git/commits') && request.method === 'POST')
  expect(commits.map(request => request.body.parents)).toEqual([['parent-1'], ['parent-2']])
  expect(requests.filter(request => request.url.endsWith('/git/trees')).map(request => request.body.base_tree)).toEqual(['tree-1', 'tree-2'])
  expect(requests.filter(request => request.method === 'PATCH').every(request => request.body.force === false)).toBe(true)
})
test('stops after repeated conflicts without reporting success', async () => {
  conflicts = 5
  await expect(uploadOneSolveProblemOnGit(sample)).rejects.toThrow('GitHub 422')
  expect(heads).toBe(3)
  expect(browser.storage.local.set).not.toHaveBeenCalled()
})
test('skips duplicate source and README based on remote content', async () => {
  identical = true
  await expect(uploadOneSolveProblemOnGit(sample)).resolves.toMatchObject({ duplicate: true })
  expect(requests.every(request => request.method === 'GET')).toBe(true)
})
test('repairs missing README even when source already exists', async () => {
  sourceExistsOnly = true
  await expect(uploadOneSolveProblemOnGit(sample)).resolves.toMatchObject({ duplicate: false })
  expect(requests.some(request => request.method === 'PATCH')).toBe(true)
})
test('cancels when disabled during preparation without moving the branch', async () => {
  disableDuringBlob = true
  await expect(uploadOneSolveProblemOnGit(sample)).rejects.toThrow(/cancelled/)
  expect(requests.some(request => request.method === 'PATCH')).toBe(false)
  expect(browser.storage.local.set).not.toHaveBeenCalled()
})
test('requires enablement and nonempty source', async () => {
  configuration.bjhEnable = false
  await expect(uploadOneSolveProblemOnGit(sample)).rejects.toThrow(/disabled/)
  expect(global.fetch).not.toHaveBeenCalled()
  configuration.bjhEnable = true
  await expect(uploadOneSolveProblemOnGit({ ...sample, codeSnippet: '' })).rejects.toThrow(/empty/)
})
test('normalizes display languages and shares organization paths', () => {
  expect(sourcePath(sample, 'platform')).toBe('LeetCode/0001-two-sum/Solution.cpp')
  expect(sourcePath({ ...sample, language: 'C#' }, 'language')).toBe('cs/0001-two-sum/Solution.cs')
  expect(sourcePath({ ...sample, language: 'MS SQL Server' }, 'language')).toBe('sql/0001-two-sum/Solution.sql')
  expect(() => sourcePath({ ...sample, language: 'unknown' }, 'platform')).toThrow(/Unsupported/)
})

test('rejects an empty repository with an actionable message', async () => {
  ;(global.fetch as jest.Mock).mockImplementation(async (input) => ({
    ok: !String(input).includes('/git/ref/'), status: 409,
    json: async () => String(input).includes('/git/ref/') ? { message: 'Git Repository is empty.' } : { default_branch: 'main' }
  }))
  await expect(uploadOneSolveProblemOnGit(sample)).rejects.toThrow(/Initialize the repository/)
  expect(browser.storage.local.set).not.toHaveBeenCalled()
})
