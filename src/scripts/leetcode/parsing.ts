import { LeetcodeData } from '../../types/LeetcodeData'

const query = `query SubmissionForLeetHub($submissionId: Int!) {
  submissionDetails(submissionId: $submissionId) {
    id code timestamp statusCode runtimeDisplay memoryDisplay
    lang { name }
    question { questionId title titleSlug content difficulty }
  }
}`

export async function parseData(submissionId: string): Promise<LeetcodeData | null> {
  if (!/^\d+$/.test(submissionId) || !Number.isSafeInteger(Number(submissionId))) throw new Error('Invalid submission ID')
  const response = await fetch('https://leetcode.com/graphql/', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { submissionId: Number(submissionId) } })
  })
  if (!response.ok) throw new Error(`LeetCode ${response.status}: could not read submission. Sign in to LeetCode and try again.`)
  const data = await response.json()
  if (data.errors?.length) throw new Error('LeetCode could not provide submission details. Sign in and verify this is your submission.')
  const detail = data.data?.submissionDetails
  if (!detail) throw new Error('Submission details are unavailable')
  if (detail.statusCode !== 10) return null
  const question = detail.question
  if (String(detail.id) !== submissionId || typeof detail.code !== 'string' || !detail.code.trim() ||
      !question?.title || !/^[-a-z0-9]+$/.test(question.titleSlug ?? '') || !question.questionId ||
      typeof detail.lang?.name !== 'string' || !detail.lang.name) {
    throw new Error('Accepted submission is missing its source, language, or problem details')
  }
  return {
    submissionId, problemId: String(question.questionId), title: question.title,
    slug: question.titleSlug, description: question.content ?? '', codeSnippet: detail.code,
    language: detail.lang.name, difficulty: question.difficulty ?? 'Unknown',
    runtime: detail.runtimeDisplay ?? '', memory: detail.memoryDisplay ?? '', timestamp: Number(detail.timestamp)
  }
}
