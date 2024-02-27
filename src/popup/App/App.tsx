import React, { useState, useEffect } from 'react'
import browser from 'webextension-polyfill' 
import './App.css'

const Popup: React.FC = () => {
  const [mode, setMode] = useState<'auth' | 'hook' | 'commit' | 'none'>('none')
  const [leethubHook, setLeethubHook] = useState<string>('')
  const [stats, setStats] = useState({ solved: 0, easy: 0, medium: 0, hard: 0 })

  useEffect(() => {
    // Simulate fetching data from storage and setting the mode accordingly
    browser.storage.local
      .get(['leethub_token', 'mode_type', 'stats', 'leethub_hook'])
      .then((data) => {
        const { leethub_token, mode_type, stats, leethub_hook } = data
        if (!leethub_token) {
          setMode('auth')
        } else {
          setMode(mode_type) // Assuming 'mode_type' is either 'hook' or 'commit'
          setStats(stats)
          setLeethubHook(leethub_hook)
        }
      })
  }, [])

  const authenticate = () => {
    console.log('Authenticating...')
    browser.runtime.sendMessage({
      target: 'content',
      action: 'authenticate'
    })
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
              href={`https://github.com/${leethubHook}`}
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
                href={`https://github.com/${leethubHook}`}
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
