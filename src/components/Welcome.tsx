import React, { useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { githubRequest } from '../scripts/github'
import { createRepo, linkRepo } from '../scripts/welcome'

const Welcome: React.FC = () => {
  const [accessToken, setAccessToken] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [repository, setRepository] = useState('')
  const [repOption, setRepOption] = useState('')
  const [orgOption, setOrgOption] = useState('platform')
  useEffect(() => {
    void browser.storage.local.get(['leethub_hook', 'leethub_OrgOption']).then(data => {
      setRepository(typeof data.leethub_hook === 'string' ? data.leethub_hook : '')
      setOrgOption(data.leethub_OrgOption === 'language' ? 'language' : 'platform')
    })
  }, [])
  const authenticate = async () => {
    const token = accessToken.trim()
    if (!token) { setMessage('Enter a repository-scoped GitHub token.'); return }
    setBusy(true)
    try {
      const user = await githubRequest(token, '/user')
      if (typeof user.login !== 'string' || !user.login) throw new Error('Invalid account response')
      // Pause uploads and clear the previous account binding when replacing credentials.
      await browser.storage.local.set({ leethub_token: token, leethub_username: user.login,
        leethub_hook: null, mode_type: 'hook', bjhEnable: false, lastError: null, lastUpload: null })
      setAccessToken('')
      setMessage('GitHub connected. Select your repository below.')
    } catch (error) {
      setMessage(`GitHub authentication failed. ${error instanceof Error ? error.message : 'Check the token.'}`)
    } finally { setBusy(false) }
  }
  const connectRepository = async () => {
    setBusy(true)
    try {
      const data = await browser.storage.local.get(['leethub_token', 'leethub_username'])
      if (typeof data.leethub_token !== 'string' || !data.leethub_token) throw new Error('Authorization error - Grant access by connecting GitHub first')
      const name = repository.trim()
      const repo = repOption === 'new'
        ? await createRepo(data.leethub_token, name)
        : await linkRepo(data.leethub_token, name.includes('/') ? name : `${data.leethub_username}/${name}`)
      await browser.storage.local.set({ leethub_hook: repo.full_name, mode_type: 'commit',
        leethub_OrgOption: orgOption, bjhEnable: true, lastError: null, lastUpload: null })
      setMessage(`Connected ${repo.full_name}. Auto upload is enabled.`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Repository connection failed') }
    finally { setBusy(false) }
  }
  const unlink = async () => {
    await browser.storage.local.set({ leethub_hook: null, bjhEnable: false, mode_type: 'hook', lastUpload: null, lastError: null })
    setMessage('Repository unlinked. Select another repository to resume uploads.')
  }
  return <main className='welcome'>
    <h1>LeetHub setup</h1>
    <p>Sync accepted LeetCode submissions to GitHub.</p>
    <label htmlFor='access-token'>Repository-scoped GitHub token</label>
    <input id='access-token' type='password' autoComplete='off' value={accessToken} onChange={event => setAccessToken(event.target.value)} />
    <p>Use a fine-grained token with Contents read and write for your selected repository and an expiration date.</p>
    <button disabled={busy} onClick={authenticate}>Connect GitHub</button>
    <label htmlFor='type'>Repository action</label>
    <select id='type' value={repOption} onChange={event => setRepOption(event.target.value)}>
      <option value=''>Pick an Option</option><option value='link'>Link an Existing Repository</option>
      <option value='new'>Create a new Private Repository</option>
    </select>
    {repOption === 'new' && <p>Creating a repository requires additional GitHub permission. Linking an existing initialized repository is recommended.</p>}
    <label htmlFor='repository'>Repository</label>
    <input id='repository' placeholder='Repository Name or owner/repository' value={repository} onChange={event => setRepository(event.target.value)} />
    <label htmlFor='organization'>Organize solutions</label>
    <select id='organization' value={orgOption} onChange={event => setOrgOption(event.target.value)}>
      <option value='platform'>Organize by Platform</option><option value='language'>Organize by Language</option>
    </select>
    <button disabled={busy || !repository.trim() || !repOption} onClick={connectRepository}>Get Started</button>
    <button disabled={busy} onClick={unlink}>Unlink repository</button>
    <p role='status'>{message}</p>
  </main>
}
export default Welcome
