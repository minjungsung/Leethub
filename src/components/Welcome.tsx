import React, { useState } from 'react'
import browser from 'webextension-polyfill'

import '../css/welcome.css'
import 'semantic-ui-css/semantic.min.css'
import { createRepo, linkRepo } from '../scripts/welcome'

const Welcome: React.FC = () => {
  const [repository, setRepository] = useState<string>('')
  const [repOption, setRepOption] = useState<string>('')
  const [orgOption, setOrgOption] = useState<string>('')
  const handleGetStartedClick = async () => {
    const data = await browser.storage.local.get('leethub_token')
    const token = data.leethub_token
    if (!token) {
      // Not authorized yet.
      document.getElementById('error')!.textContent =
        'Authorization error - Grant BaekjoonHub access to your GitHub account to continue (launch extension to proceed)'
      document.getElementById('error')!.style.display = 'block'
      document.getElementById('success')!.style.display = 'none'
    } else if (repOption === 'new') {
      // Assuming createRepo is a function defined elsewhere in the codebase.
      createRepo(token, repository)
    } else {
      const data2 = await browser.storage.local.get('leethub_username')
      const username = data2.leethub_username
      if (!username) {
        // Improper authorization.
        document.getElementById('error')!.textContent =
          'Improper Authorization error - Grant LeetHub access to your GitHub account to continue (launch extension to proceed)'
        document.getElementById('error')!.style.display = 'block'
        document.getElementById('success')!.style.display = 'none'
      } else {
        // Assuming linkRepo is a function defined elsewhere in the codebase.
        linkRepo(token, `${username}/${repository}`)
      }
    }
  }

  return (
    <div className='ui grid container'>
      <div className='sixteen wide center aligned column'>
        <br />
        <p
          className='caption'
          style={{ fontSize: '6em' }}
        >
          Leet<span style={{ color: '#ff6c0a' }}>Hub</span>
        </p>
        <p className='caption'>
          Automatically sync your code from LeetCode to GitHub
        </p>
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <p
          hidden
          id='error'
        ></p>
        <p
          hidden
          id='success'
        ></p>
        <p
          hidden
          id='unlink'
        >
          Linked the wrong repo? <a href='#'>Unlink</a>.
        </p>{' '}
        {/* Ensure you replace # with actual link */}
      </div>

      {/* Create Hook */}
      <div
        id='hook_mode'
        className='ui grid container'
      >
        <div className='six wide column'>
          <p className='caption ui large header center aligned'>
            To get started with leethub
          </p>
        </div>
        <div className='four wide left aligned column'>
          <div className='ui form'>
            <div className='field'>
              <select
                id='type'
                value={repOption}
                onChange={(e) => setRepOption(e.target.value)}
              >
                <option value=''>Pick an Option</option>
                <option value='new'>Create a new Private Repository</option>
                <option value='link'>Link an Existing Repository</option>
              </select>
            </div>

            <div className='field'>
              <select
                id='org_option'
                value={orgOption}
                onChange={(e) => setOrgOption(e.target.value)}
              >
                <option value='platform'>Organize by Platform</option>
                <option value='language'>Organize by Language</option>
              </select>
            </div>
          </div>
        </div>

        <div className='six wide column'>
          <div className='ui form'>
            <div className='field'>
              <input
                autoComplete='off'
                id='name'
                type='text'
                placeholder='Repository Name'
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className='sixteen wide right aligned column'>
          <br />
          <button
            id='hook_button'
            className='positive ui button'
            disabled={repository === '' || repOption === ''}
            onClick={handleGetStartedClick}
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Show stats */}
      <div
        id='commit_mode'
        className='ui grid container'
      >
        <div className='wide center aligned column'>
          <br />
          <br />
          <br />
          <div className='ui inverted large header'>
            Want more features?
            <br />
            <a
              style={{ color: 'aqua', fontSize: '0.8em' }}
              target='_blank'
              href='https://github.com/minjungsung/leethub/labels/feature'
            >
              Request a feature!
            </a>
          </div>
        </div>
      </div>

      {/* Rate on GitHub */}
      <div className='sixteen wide center aligned column'>
        <br />
        <br />
        <br />
        <br />
        <br />
        <div className='ui inverted small header'>
          <a
            style={{ color: 'rgb(226, 243, 243)' }}
            target='_blank'
            href='https://github.com/minjungsung/leethub'
          >
            Star leethub on GitHub
          </a>
        </div>
      </div>
    </div>
  )
}

export default Welcome
