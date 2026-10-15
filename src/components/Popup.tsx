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
  return <main className='popup'>
    <h1>LeetHub</h1><p>Accepted LeetCode solutions → GitHub</p>
    <a href={WELCOME_URL} target='_blank' rel='noopener noreferrer'>{data.leethub_token ? 'Repository settings / reconnect' : 'Connect GitHub'}</a>
    {data.leethub_hook && <>
      <p>Repository: <a href={`https://github.com/${data.leethub_hook}`} target='_blank' rel='noopener noreferrer'>{data.leethub_hook}</a></p>
      <label><input type='checkbox' checked={data.bjhEnable === true} onChange={async event => {
        try { await browser.storage.local.set({ bjhEnable: event.target.checked }) }
        catch { setMessage('Could not save auto-upload setting.') }
      }} /> Enable auto upload</label>
      <p>Synced problems: {problems.length}</p>
      <p>{['Easy', 'Medium', 'Hard'].map(level => `${level}: ${problems.filter(problem => problem.difficulty === level).length}`).join(' · ')}</p>
      <label htmlFor='submission'>Upload an accepted submission</label>
      <input id='submission' placeholder='Submission ID or URL' value={submission} onChange={event => setSubmission(event.target.value)} />
      <button disabled={busy || data.bjhEnable !== true} onClick={upload}>Upload submission</button>
      {data.lastUpload && <p><a href={data.lastUpload.url} target='_blank' rel='noopener noreferrer'>View latest solution</a></p>}
    </>}
    {data.lastError && <p role='alert'>{data.lastError}</p>}
    <p role='status'>{message}</p>
  </main>
}
export default Popup
