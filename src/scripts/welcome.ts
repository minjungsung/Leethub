import { githubRequest } from './github'

export interface Repository { full_name: string; html_url: string; default_branch: string }
function validateRepository(data: any): Repository {
  if (!data.full_name || !data.html_url || !data.default_branch) throw new Error('Invalid repository response')
  if (data.permissions?.push === false) throw new Error('This repository does not allow writes with your account')
  return data
}
export async function createRepo(token: string, name: string): Promise<Repository> {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name)) throw new Error('Enter a valid repository name')
  return validateRepository(await githubRequest(token, '/user/repos', {
    method: 'POST', body: JSON.stringify({ name, private: true, auto_init: true, description: 'Accepted coding solutions' })
  }))
}
export async function linkRepo(token: string, name: string): Promise<Repository> {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name)) throw new Error('Use owner/repository or your repository name')
  return validateRepository(await githubRequest(token, `/repos/${name}`))
}
