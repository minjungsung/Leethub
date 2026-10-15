export class GitHubError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export async function githubRequest<T = any>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json()
  if (!response.ok) throw new GitHubError(response.status, `GitHub ${response.status}: ${data.message || 'Request failed'}`)
  return data
}

export class GitHub {
  constructor(private hook: string, private token: string) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(hook)) throw new Error('Invalid repository name')
  }
  request(path: string, method = 'GET', body?: object): Promise<any> {
    return githubRequest(this.token, `/repos/${this.hook}${path}`, {
      method, ...(body ? { body: JSON.stringify(body) } : {})
    })
  }
  async repository(): Promise<any> { return this.request('') }
  async head(branch: string): Promise<{ commit: string; tree: string }> {
    let ref
    try { ref = await this.request(`/git/ref/heads/${encodeURIComponent(branch)}`) }
    catch (error) {
      if (error instanceof GitHubError && [404, 409].includes(error.status)) throw new Error('Initialize the repository with a README on GitHub before uploading')
      throw error
    }
    const commit = await this.request(`/git/commits/${ref.object.sha}`)
    return { commit: ref.object.sha, tree: commit.tree.sha }
  }
  async fileSha(path: string, branch: string): Promise<string | null> {
    try {
      const file = await this.request(`/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`)
      return file.sha ?? null
    } catch (error) {
      if (error instanceof GitHubError && error.status === 404) return null
      throw error
    }
  }
  async blob(content: string): Promise<string> {
    const bytes = new TextEncoder().encode(content)
    let binary = ''
    bytes.forEach(byte => { binary += String.fromCharCode(byte) })
    return (await this.request('/git/blobs', 'POST', { content: btoa(binary), encoding: 'base64' })).sha
  }
  async commit(branch: string, parent: { commit: string; tree: string }, files: { path: string; sha: string }[], message: string): Promise<string> {
    const tree = await this.request('/git/trees', 'POST', {
      base_tree: parent.tree, tree: files.map(file => ({ ...file, mode: '100644', type: 'blob' }))
    })
    const commit = await this.request('/git/commits', 'POST', { message, tree: tree.sha, parents: [parent.commit] })
    const ref = await this.request(`/git/refs/heads/${encodeURIComponent(branch)}`, 'PATCH', { sha: commit.sha, force: false })
    if (ref.object?.sha !== commit.sha) throw new Error('GitHub did not confirm the uploaded commit')
    return commit.sha
  }
}
