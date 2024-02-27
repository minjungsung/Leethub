import React, { useState } from 'react'
import { Button, Dropdown, Input, Form } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'

const Welcome: React.FC = () => {
  const [hookModeVisible, setHookModeVisible] = useState(false)
  const [commitModeVisible, setCommitModeVisible] = useState(false)
  const [repositoryType, setRepositoryType] = useState('')
  const [repositoryName, setRepositoryName] = useState('')
  const [problemsSolved, setProblemsSolved] = useState({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0
  })

  const repositoryOptions = [
    { key: 'new', value: 'new', text: 'Create a new Private Repository' },
    { key: 'link', value: 'link', text: 'Link an Existing Repository' }
  ]

  const handleRepositoryTypeChange = (
    e: React.SyntheticEvent<HTMLElement, Event>,
    data: any
  ) => {
    setRepositoryType(data.value)
  }

  const handleRepositoryNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRepositoryName(e.target.value)
  }

  // Placeholder function for demonstration
  const handleGetStarted = () => {
    console.log('Repository Type:', repositoryType)
    console.log('Repository Name:', repositoryName)
    // Implement your logic here
  }

  return (
    <div className='ui grid container'>
      <div className='sixteen wide center aligned column'>
        <br />
        <p
          className='caption'
          style={{ fontSize: '9em' }}
        >
          Leet<span style={{ color: 'orange' }}>Hub</span>
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
          Linked the wrong repo? <a>Unlink</a>.
        </p>
      </div>

      {hookModeVisible && (
        <div
          id='hook_mode'
          className='ui grid container'
        >
          <div className='six wide column'>
            <p className='caption ui large header center aligned'>
              To get started with LeetHub
            </p>
          </div>
          <div className='four wide left aligned column'>
            <Form>
              <Form.Field>
                <Dropdown
                  placeholder='Pick an Option'
                  fluid
                  selection
                  options={repositoryOptions}
                  onChange={handleRepositoryTypeChange}
                />
              </Form.Field>
            </Form>
          </div>
          <div className='six wide column'>
            <Form>
              <Form.Field>
                <Input
                  autoComplete='off'
                  id='name'
                  placeholder='Repository Name'
                  type='text'
                  value={repositoryName}
                  onChange={handleRepositoryNameChange}
                />
              </Form.Field>
            </Form>
          </div>

          <div className='sixteen wide right aligned column'>
            <br />
            <Button
              positive
              disabled={!repositoryName || !repositoryType}
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>
        </div>
      )}

      {commitModeVisible && (
        <div
          id='commit_mode'
          className='ui grid container'
        >
          <div className='eight wide center aligned column'>
            <br />
            <br />
            <div
              style={{ fontSize: '2.3em' }}
              className='ui inverted large header'
            >
              Problems Solved: <span id='p_solved'>{problemsSolved.total}</span>
            </div>
            <div
              style={{ fontSize: '2.3em' }}
              className='ui inverted large header'
            >
              <span style={{ color: '#5cb85c' }}>Easy:</span>
              <span
                id='p_solved_easy'
                style={{ color: '#5cb85c' }}
              >
                {problemsSolved.easy}{' '}
              </span>
              <span style={{ color: '#f0ad4e' }}>&ensp; &ensp; Medium:</span>
              <span
                id='p_solved_medium'
                style={{ color: '#f0ad4e' }}
              >
                {problemsSolved.medium}
              </span>
              <span style={{ color: '#d9534f' }}>&ensp; &ensp; Hard:</span>
              <span
                id='p_solved_hard'
                style={{ color: '#d9534f' }}
              >
                {problemsSolved.hard}
              </span>
            </div>
          </div>
          <div className='eight wide center aligned column'>
            <br />
            <br />
            <br />
            <div className='ui inverted large header'>
              Want more features? <br />
              <a
                style={{ color: 'aqua', fontSize: '0.8em' }}
                target='_blank'
                href='https://github.com/minjungsung/LeetHub/labels/feature'
              >
                Request a feature!
              </a>
            </div>
          </div>
        </div>
      )}

      <div className='sixteen wide right aligned column'>
        <br />
        <br />
        <br />
        <br />
        <br />
        <div className='ui inverted small header'>
          <a
            style={{ color: 'rgb(143, 202, 202)' }}
            target='_blank'
            href='https://github.com/minjungsung/LeetHub'
          >
            Star <span style={{ color: 'white' }}>Leet</span>
            <span style={{ color: 'orange' }}>Hub</span> on GitHub
          </a>
        </div>
      </div>
    </div>
  )
}

export default Welcome
