import { parseData } from './parsing'
const detail = {
  id: '123', statusCode: 10, code: 'return "안녕";', timestamp: '100', runtimeDisplay: '1 ms', memoryDisplay: '5 MB',
  lang: { name: 'C++' }, question: { questionId: '1', title: 'Two Sum', titleSlug: 'two-sum', content: '<p>Example</p>', difficulty: 'Easy' }
}
beforeEach(() => { global.fetch = jest.fn() })
function respond(value: unknown, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValue({ ok, status, json: async () => value })
}
test('retrieves authoritative accepted source, regardless of editor or statement DOM', async () => {
  document.body.innerHTML = '<pre><code>wrong example</code></pre>'
  respond({ data: { submissionDetails: detail } })
  const result = await parseData('123')
  expect(result?.codeSnippet).toBe(detail.code)
  expect(result?.language).toBe('C++')
  expect(global.fetch).toHaveBeenCalledWith('https://leetcode.com/graphql/', expect.objectContaining({ credentials: 'include' }))
})
test.each([11, 14, null])('does not upload nonaccepted or pending status %s', async statusCode => {
  respond({ data: { submissionDetails: { ...detail, statusCode } } })
  await expect(parseData('123')).resolves.toBeNull()
})
test.each([{ code: '' }, { lang: null }, { id: '456' }, { question: null }])('rejects incomplete or mismatched accepted data %j', async change => {
  respond({ data: { submissionDetails: { ...detail, ...change } } })
  await expect(parseData('123')).rejects.toThrow(/missing/)
})
test('rejects GraphQL failures and authentication failures', async () => {
  respond({ errors: [{ message: 'denied' }] })
  await expect(parseData('123')).rejects.toThrow(/could not provide/)
  respond({}, false, 403)
  await expect(parseData('123')).rejects.toThrow(/403/)
})
test('rejects malformed IDs before making requests', async () => {
  await expect(parseData('../123')).rejects.toThrow(/Invalid/)
  expect(global.fetch).not.toHaveBeenCalled()
})
