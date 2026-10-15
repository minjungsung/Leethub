import React, { useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { WELCOME_URL } from '../constants/Url'
import { Stats } from '../types/Stats'
import { emptyStats } from '../scripts/storage'

const Popup: React.FC = () => {
  const [data, setData] = useState<Record<string, any>>({})
  const [submission, setSubmission] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const refresh = () => { void browser.storage.local.get(null).then(setData) }
    const change = (_changes: unknown, area: string) => { if (area === 'local') refresh() }
    refresh(); browser.storage.onChanged.addListener(change)
    return () => browser.storage.onChanged.removeListener(change)
  }, [])
  const stats: Stats = data.stats ?? emptyStats()
  const problems = Object.entries(stats.problems ?? {}).filter(([key]) => key.startsWith(`${data.leethub_hook}/`)).map(([, value]) => value)
  const upload = async () => {
    const id = submission.trim().match(/^(?:https:\/\/leetcode\.com\/(?:problems\/[^/]+\/)?submissions\/(?:detail\/)?)?(\d+)\/?$/)?.[1]
    if (!id) { setMessage('Enter a LeetCode submission ID or detail URL.'); return }
    setBusy(true); setMessage('Checking accepted submission and uploading…')
    try {
      const result = await browser.runtime.sendMessage({ task: 'uploadSubmission', submissionId: id }) as { error?: string; skipped?: boolean; duplicate?: boolean }
      if (result.error) throw new Error(result.error)
      setMessage(result.skipped ? 'Upload skipped. Enable auto upload and use an accepted submission.' : result.duplicate ? 'This solution is already uploaded.' : 'Solution uploaded.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed') }
    finally { setBusy(false) }
  }
  const enabled = data.bjhEnable === true
  return <main className='popup'>
    <header className='brand-row'>
      <div className='brand'><span className='brand-mark' aria-hidden='true'>&lt;/&gt;</span><div><h1>LeetHub</h1><span className='eyebrow'>YOUR CODE, COLLECTED.</span></div></div>
      <a className='icon-button' href={WELCOME_URL} aria-label='Repository settings / reconnect' title='Settings' target='_blank' rel='noopener noreferrer'>⚙</a>
    </header>
    {data.leethub_hook ? <>
      <section className='repository-card'>
        <div className='section-top'><span className='eyebrow'>CONNECTED REPOSITORY</span><span className={`status-badge ${enabled ? 'active' : ''}`}><span className='status-dot' />{enabled ? 'Active' : 'Paused'}</span></div>
        <a className='repository-name' href={`https://github.com/${data.leethub_hook}`} target='_blank' rel='noopener noreferrer'>{data.leethub_hook}</a>
        <div className='sync-control'><div><strong>Auto upload</strong><p>Save your next accepted solution.</p></div>
          <label className='switch'><input type='checkbox' aria-label='Enable auto upload' checked={enabled} onChange={async event => {
            try { await browser.storage.local.set({ bjhEnable: event.target.checked }) }
            catch { setMessage('Could not save auto-upload setting.') }
          }} /><span className='switch-track' /></label>
        </div>
      </section>
      <section className='progress-card'>
        <div className='section-top'><span className='eyebrow'>YOUR COLLECTION</span><span className='small-muted'>This repository</span></div>
        <div className='total'><strong>{problems.length}</strong><span>problems synced</span></div>
        <div className='difficulty-grid'>{['Easy', 'Medium', 'Hard'].map(level => <div className={`difficulty ${level.toLowerCase()}`} key={level}><span>{level}</span><strong>{problems.filter(problem => problem.difficulty === level).length}</strong></div>)}</div>
      </section>
      <section className='manual-card'>
        <h2>Add to your collection</h2><p className='muted'>Bring an older accepted solution with you.</p>
        <label htmlFor='submission'>Upload an accepted submission</label>
        <input id='submission' placeholder='Submission ID or URL' value={submission} onChange={event => setSubmission(event.target.value)} />
        <button className='primary full-width' disabled={busy || !enabled || !submission.trim()} onClick={upload}>{busy ? 'Uploading…' : 'Upload submission'}<span aria-hidden='true'>↗</span></button>
        {!enabled && <p className='field-hint'>Turn on auto upload to upload a submission.</p>}
      </section>
      {data.lastUpload && <a className='latest-link' href={data.lastUpload.url} target='_blank' rel='noopener noreferrer'><span><span className='success-icon' aria-hidden='true'>✓</span>View latest solution</span><span aria-hidden='true'>↗</span></a>}
    </> : <section className='empty-state'>
      <div className='code-art' aria-hidden='true'><span>&lt;/&gt;</span><div className='art-line' /><div className='art-line short' /><div className='art-line' /></div>
      <span className='eyebrow'>SOLVE. SYNC. KEEP GOING.</span>
      <h2>A home for every<br />accepted solution.</h2><p>Connect a repository once.<br />Let your LeetCode work find its way to GitHub.</p>
      <a className='primary button-link' href={WELCOME_URL} target='_blank' rel='noopener noreferrer'>{data.leethub_token ? 'Choose a repository' : 'Connect GitHub'}<span aria-hidden='true'>→</span></a>
      <span className='small-muted'>Your repository. Your code.</span>
    </section>}
    {data.lastError && <p className='feedback error' role='alert'>{data.lastError}</p>}
    <p className={`feedback ${message ? 'visible' : ''}`} role='status'>{message}</p>
    <footer className='popup-footer'><span className='status-dot' />Made for the next Accepted.</footer>
  </main>
}
export default Popup
