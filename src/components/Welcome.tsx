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
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    void browser.storage.local.get(['leethub_hook', 'leethub_OrgOption', 'leethub_token']).then(data => {
      setConnected(typeof data.leethub_token === 'string' && !!data.leethub_token)
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
      setConnected(true)
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
    <aside className='welcome-story'>
      <div className='brand'><span className='brand-mark' aria-hidden='true'>&lt;/&gt;</span><strong>LeetHub</strong></div>
      <div className='story-content'><span className='eyebrow'>SMALL WINS. LASTING PROGRESS.</span><h1>Your practice,<br />in one place.</h1><p>Turn accepted solutions into a collection you can come back to. Pick a repository. We’ll take it from there.</p>
        <div className='flow-preview' aria-hidden='true'><div className='flow-source'><span>&lt;/&gt;</span>Accepted</div><span className='flow-arrow'>→</span><div className='flow-destination'><span>⌘</span>Your repository</div></div>
      </div><span className='story-footnote'>Built for LeetCode. Stored on GitHub.</span>
    </aside>
    <div className='setup-panel'>
      <header className='setup-header'><span className='eyebrow'>LET’S GET YOU CONNECTED</span><h2>LeetHub setup</h2><p className='muted'>Two steps. Then back to solving.</p></header>
      <section className='setup-step'>
        <div className='step-heading'><span className={`step-number ${connected ? 'complete' : ''}`}>{connected ? '✓' : '1'}</span><div><h3>Connect GitHub</h3><p>{connected ? 'Connected. You can replace your token here.' : 'Give your solutions a place to land.'}</p></div>{connected && <span className='status-badge active'>Connected</span>}</div>
        <label htmlFor='access-token'>Repository-scoped GitHub token</label>
        <input id='access-token' type='password' autoComplete='off' placeholder='Paste your GitHub token' value={accessToken} onChange={event => setAccessToken(event.target.value)} />
        <p className='field-hint'>Choose one repository, allow Contents read and write, and set an expiration date.</p>
        <div className='auth-actions'><button className='secondary' disabled={busy} onClick={authenticate}>Connect GitHub</button><a href='https://github.com/settings/personal-access-tokens/new' target='_blank' rel='noopener noreferrer'>Create a token ↗</a></div>
      </section>
      <section className='setup-step'>
        <div className='step-heading'><span className='step-number'>2</span><div><h3>Choose your repository</h3><p>Keep all your accepted solutions together.</p></div></div>
        <div className='setup-fields'><div><label htmlFor='type'>Repository action</label><select id='type' value={repOption} onChange={event => setRepOption(event.target.value)}><option value=''>Pick an Option</option><option value='link'>Link an Existing Repository</option><option value='new'>Create a new Private Repository</option></select></div>
          <div><label htmlFor='organization'>Organize solutions</label><select id='organization' value={orgOption} onChange={event => setOrgOption(event.target.value)}><option value='platform'>Organize by Platform</option><option value='language'>Organize by Language</option></select></div></div>
        <label htmlFor='repository'>Repository</label><input id='repository' placeholder='Repository Name or owner/repository' value={repository} onChange={event => setRepository(event.target.value)} />
        <p className='field-hint'>{repOption === 'new' ? 'Creating a repository requires additional GitHub permission. Linking an existing initialized repository is recommended.' : 'Use a repository with a README and write access.'}</p>
        <button className='primary full-width' disabled={busy || !repository.trim() || !repOption} onClick={connectRepository}>Get Started<span aria-hidden='true'>→</span></button>
      </section>
      <p className={`feedback ${message ? 'visible' : ''}`} role='status'>{message}</p>
      <div className='setup-footer'><span>Your token stays in this browser’s extension storage.</span><button className='text-button' disabled={busy} onClick={unlink}>Unlink repository</button></div>
    </div>
  </main>
}
export default Welcome
