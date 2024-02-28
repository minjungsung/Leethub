import React from 'react'
import '../css/welcome.css' // Adjust the path as necessary
import 'semantic-ui-css/semantic.min.css'

const Welcome = () => {
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
        style={{ display: 'none' }}
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
              <select id='type'>
                <option value=''>Pick an Option</option>
                <option value='new'>Create a new Private Repository</option>
                <option value='link'>Link an Existing Repository</option>
              </select>
            </div>

            <div className='field'>
              <select id='org_option'>
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
                placeholder='Repository Name'
                type='text'
              />
            </div>
          </div>
        </div>

        <div className='sixteen wide right aligned column'>
          <br />
          <button
            id='hook_button'
            disabled
            className='positive ui button'
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Show stats */}
      <div
        style={{ display: 'none' }}
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
