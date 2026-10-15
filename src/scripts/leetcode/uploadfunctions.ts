import browser from 'webextension-polyfill'
import { sha1 } from 'js-sha1'
import { GitHub, GitHubError } from '../github'
import { LeetcodeData } from '../../types/LeetcodeData'
import { getStats } from '../storage'

export function languageExtension(language: string): string {
  const key = language.toLowerCase().replace(/\s+/g, '')
  const extensions: Record<string, string> = {
    python: 'py', python3: 'py', java: 'java', cpp: 'cpp', 'c++': 'cpp', c: 'c', csharp: 'cs', 'c#': 'cs',
    javascript: 'js', typescript: 'ts', ruby: 'rb', swift: 'swift', golang: 'go', go: 'go', scala: 'scala',
    kotlin: 'kt', rust: 'rs', php: 'php', r: 'r', erlang: 'erl', elixir: 'ex', dart: 'dart',
    mysql: 'sql', mssql: 'sql', mssqlserver: 'sql', oraclesql: 'sql', oracle: 'sql', postgresql: 'sql',
    bash: 'sh', racket: 'rkt', javascriptnode: 'js'
  }
  const extension = extensions[key]
  if (!extension) throw new Error(`Unsupported submission language: ${language}`)
  return extension
}
export function sourcePath(data: LeetcodeData, organization: string): string {
  const directory = `${data.problemId.padStart(4, '0')}-${data.slug}`
  const extension = languageExtension(data.language)
  return `${organization === 'language' ? extension : 'LeetCode'}/${directory}/Solution.${extension}`
}
export function blobSha(content: string): string {
  const bytes = new TextEncoder().encode(content)
  const header = new TextEncoder().encode(`blob ${bytes.length}\0`)
  const blob = new Uint8Array(header.length + bytes.length)
  blob.set(header); blob.set(bytes, header.length)
  return sha1(blob)
}

export async function uploadOneSolveProblemOnGit(data: LeetcodeData): Promise<{ url: string; duplicate: boolean }> {
  const config = await browser.storage.local.get(['leethub_token', 'leethub_hook', 'leethub_OrgOption', 'bjhEnable'])
  if (config.bjhEnable !== true) throw new Error('Auto upload is disabled')
  if (typeof config.leethub_token !== 'string' || !config.leethub_token || !config.leethub_hook) throw new Error('Connect GitHub and select a repository first')
  if (!data.codeSnippet.trim()) throw new Error('Submission source is empty')
  const hook = config.leethub_hook as string
  const git = new GitHub(hook, config.leethub_token)
  const repo = await git.repository()
  if (!repo.default_branch) throw new Error('Initialize the repository with a README on GitHub before uploading')
  const branch = repo.default_branch
  const path = sourcePath(data, config.leethub_OrgOption === 'language' ? 'language' : 'platform')
  const directory = path.substring(0, path.lastIndexOf('/'))
  const url = `https://github.com/${hook}/tree/${encodeURIComponent(branch)}/${directory}`
  const expectedSha = blobSha(data.codeSnippet)
  const readme = `# ${data.title}\n\n[Problem](https://leetcode.com/problems/${data.slug}/)\n\nDifficulty: ${data.difficulty}\n\n${data.description}\n`
  let duplicate = false
  for (let attempt = 0; attempt < 3; attempt++) {
    const parent = await git.head(branch)
    const existing = await git.fileSha(path, branch)
    const existingReadme = await git.fileSha(`${directory}/README.md`, branch)
    if (existing === expectedSha && existingReadme === blobSha(readme)) { duplicate = true; break }
    const source = await git.blob(data.codeSnippet)
    const description = await git.blob(readme)
    // Honor toggling off while the upload is being prepared.
    const latest = await browser.storage.local.get(['bjhEnable', 'leethub_hook', 'leethub_token'])
    if (latest.bjhEnable !== true || latest.leethub_hook !== hook || latest.leethub_token !== config.leethub_token) throw new Error('Upload cancelled because integration settings changed')
    try {
      await git.commit(branch, parent, [{ path, sha: source }, { path: `${directory}/README.md`, sha: description }], `Add solution for ${data.title}`)
      break
    } catch (error) {
      if (!(error instanceof GitHubError) || ![409, 422].includes(error.status) || attempt === 2) throw error
      // Rebuild on the new head; never force a ref update.
    }
  }
  const latest = await browser.storage.local.get(['leethub_hook', 'leethub_token'])
  if (latest.leethub_hook !== hook || latest.leethub_token !== config.leethub_token) return { url, duplicate }
  const stats = await getStats()
  stats.problems[`${hook}/${data.problemId}`] = {
    title: data.title, difficulty: data.difficulty, language: data.language,
    runtime: data.runtime, memory: data.memory, submissionId: data.submissionId
  }
  await browser.storage.local.set({ stats, lastUpload: { submissionId: data.submissionId, url, duplicate }, lastError: null })
  return { url, duplicate }
}
