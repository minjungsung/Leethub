export class GitHub {
  private hook: string
  private token: string

  constructor(hook: string, token: string) {
    this.hook = hook
    this.token = token
  }

  update(hook: string, token: string): void {
    this.hook = hook
    this.token = token
  }

  async getReference(
    branch: string = 'main'
  ): Promise<{ refSHA: string; ref: string }> {
    return getReference(this.hook, this.token, branch)
  }

  async getDefaultBranchOnRepo(): Promise<string> {
    return getDefaultBranchOnRepo(this.hook, this.token)
  }

  async createBlob(
    content: string,
    path: string
  ): Promise<{ path: string; sha: string; mode: string; type: string }> {
    return createBlob(this.hook, this.token, content, path)
  }

  async createTree(refSHA: string, tree_items: any[]): Promise<string> {
    return createTree(this.hook, this.token, refSHA, tree_items)
  }

  async createCommit(
    message: string,
    treeSHA: string,
    refSHA: string
  ): Promise<string> {
    return createCommit(this.hook, this.token, message, treeSHA, refSHA)
  }

  async updateHead(
    ref: string,
    commitSHA: string,
    force: boolean = true
  ): Promise<string> {
    return updateHead(this.hook, this.token, ref, commitSHA, force)
  }

  async getTree(): Promise<any[]> {
    return getTree(this.hook, this.token)
  }
}

// The helper functions below are assumed to be similar to their JavaScript counterparts,
// with added TypeScript annotations for parameters and return types.

async function getDefaultBranchOnRepo(
  hook: string,
  token: string
): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${hook}`, {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  })
  const data = await response.json()
  return data.default_branch
}

async function getReference(
  hook: string,
  token: string,
  branch: string = 'main'
): Promise<{ refSHA: string; ref: string }> {
  const response = await fetch(
    `https://api.github.com/repos/${hook}/git/refs/heads/${branch}`,
    {
      method: 'GET',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    }
  )
  const data = await response.json()
  return { refSHA: data.object.sha, ref: data.ref }
}

async function createBlob(
  hook: string,
  token: string,
  content: string,
  path: string
): Promise<{ path: string; sha: string; mode: string; type: string }> {
  const response = await fetch(
    `https://api.github.com/repos/${hook}/git/blobs`,
    {
      method: 'POST',
      body: JSON.stringify({
        content: b64EncodeUnicode(content),
        encoding: 'base64'
      }),
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'content-type': 'application/json'
      }
    }
  )
  const data = await response.json()
  return { path, sha: data.sha, mode: '100644', type: 'blob' }
}

async function createTree(
  hook: string,
  token: string,
  refSHA: string,
  tree_items: any[]
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${hook}/git/trees`,
    {
      method: 'POST',
      body: JSON.stringify({ tree: tree_items, base_tree: refSHA }),
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'content-type': 'application/json'
      }
    }
  )
  const data = await response.json()
  return data.sha
}

async function createCommit(
  hook: string,
  token: string,
  message: string,
  treeSHA: string,
  refSHA: string
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${hook}/git/commits`,
    {
      method: 'POST',
      body: JSON.stringify({ message, tree: treeSHA, parents: [refSHA] }),
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'content-type': 'application/json'
      }
    }
  )
  const data = await response.json()
  return data.sha
}

async function updateHead(
  hook: string,
  token: string,
  ref: string,
  commitSHA: string,
  force: boolean = true
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${hook}/git/${ref}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ sha: commitSHA, force }),
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'content-type': 'application/json'
      }
    }
  )
  const data = await response.json()
  return data.sha
}

async function getTree(hook: string, token: string): Promise<any[]> {
  const response = await fetch(
    `https://api.github.com/repos/${hook}/git/trees/HEAD?recursive=1`,
    {
      method: 'GET',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    }
  )
  const data = await response.json()
  return data.tree
}

// Helper function for base64 encoding
function b64EncodeUnicode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  )
}
