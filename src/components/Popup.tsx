import '../css/popup.css'

import React, { useState, useEffect } from 'react'
import browser from 'webextension-polyfill'
import { oAuth2 } from '../scripts/oauth2'
import { WELCOME_URL } from '../constants/Url'

const Popup: React.FC = () => {
  const [mode, setMode] = useState<'auth' | 'hook' | 'commit'>('auth')
  const [leethubHook, setLeethubHook] = useState<string>(WELCOME_URL)
  const [stats, setStats] = useState({ solved: 0, easy: 0, medium: 0, hard: 0 })

  useEffect(() => {
    browser.storage.local
      .get(['leethub_token', 'mode_type', 'stats', 'leethub_hook'])
      .then((data: Record<string, any>) => {
        const { leethub_token, mode_type, stats, leethub_hook } = data
        if (!leethub_token) {
          setMode('auth')
        } else if (leethub_token && !leethub_hook) {
          setMode('hook')
        } else {
          setMode('commit')
          setStats(stats)
        }
      })
  }, [])

  const authenticate = () => {
    oAuth2.begin()
  }

  return (
    <div className='ui grid container'>
      <div className='sixteen wide center aligned column'>
        <h1 id='title'>
          Leet<span style={{ color: '#f18500' }}>Hub</span>
        </h1>
        <p id='caption'>Sync your code from LeetCode to GitHub</p>
        <br />
        {mode === 'auth' && (
          <div id='auth_mode'>
            <button
              className='ui secondary button'
              onClick={authenticate}
            >
              <i className='icon github'></i> Authenticate
            </button>
          </div>
        )}
        {mode === 'hook' && (
          <div id='hook_mode'>
            <a
              className='ui secondary button'
              href={leethubHook}
              target='_blank'
              rel='noopener noreferrer'
            >
              <i className='icon github'></i> Set up Hook
            </a>
          </div>
        )}
        {mode === 'commit' && (
          <div id='commit_mode'>
            <p>
              Repository URL:{' '}
              <a
                href={leethubHook}
                target='_blank'
                rel='noopener noreferrer'
              >
                {leethubHook}
              </a>
            </p>
            <p>Problems Solved: {stats.solved}</p>
            {/* Display more stats as needed */}
          </div>
        )}
      </div>
    </div>
  )
}

export default Popup
