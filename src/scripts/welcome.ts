import { Response } from '../constants/StatusCode'

const option = (): string => {
  return $('#type').val() as string
}

const repositoryName = (): string => {
  return ($('#name').val() as string).trim()
}

const StatusCode = (res: Response, status: number, name: string): void => {
  switch (status) {
    case 304:
      $('#success').hide()
      $('#error').text(
        `Error creating ${name} - Unable to modify repository. Try again later!`
      )
      $('#error').show()
      break

    case 400:
      $('#success').hide()
      $('#error').text(
        `Error creating ${name} - Bad POST request, make sure you're not overriding any existing scripts`
      )
      $('#error').show()
      break

    case 401:
      $('#success').hide()
      $('#error').text(
        `Error creating ${name} - Unauthorized access to repo. Try again later!`
      )
      $('#error').show()
      break

    case 403:
      $('#success').hide()
      $('#error').text(
        `Error creating ${name} - Forbidden access to repository. Try again later!`
      )
      $('#error').show()
      break

    case 422:
      $('#success').hide()
      $('#error').text(
        `Error creating ${name} - Unprocessable Entity. Repository may have already been created. Try Linking instead (select 2nd option).`
      )
      $('#error').show()
      break

    default:
      chrome.storage.local.set({ mode_type: 'commit' }, () => {
        $('#error').hide()
        $('#success').html(
          `Successfully created <a target="blank" href="${res.html_url}">${name}</a>. Start <a href="http://leetcode.com">LeetCoding</a>!`
        )
        $('#success').show()
        $('#unlink').show()
        document.getElementById('hook_mode')!.style.display = 'none'
        document.getElementById('commit_mode')!.style.display = 'inherit'
      })
      chrome.storage.local.set({ leethub_hook: res.full_name }, () => {
        console.log('Successfully set new repo hook')
      })
      break
  }
}

const createRepo = (token: string, name: string): void => {
  const AUTHENTICATION_URL = 'https://api.github.com/user/repos'
  let data = JSON.stringify({
    name,
    private: true,
    auto_init: true,
    description:
      'Collection of LeetCode questions to ace the coding interview! - Created using [LeetHub](https://github.com/minjungsung/LeetHub)'
  })

  const xhr = new XMLHttpRequest()
  xhr.addEventListener('readystatechange', function () {
    if (xhr.readyState === 4) {
      StatusCode(JSON.parse(xhr.responseText), xhr.status, name)
    }
  })

  xhr.open('POST', AUTHENTICATION_URL, true)
  xhr.setRequestHeader('Authorization', `token ${token}`)
  xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json')
  xhr.send(data)
}

const linkStatusCode = (status: number, name: string): boolean => {
  let bool = false
  switch (status) {
    case 301:
      $('#success').hide()
      $('#error').html(
        `Error linking <a target="blank" href="${`https://github.com/${name}`}">${name}</a> to LeetHub. <br> This repository has been moved permanently. Try creating a new one.`
      )
      $('#error').show()
      break

    case 403:
      $('#success').hide()
      $('#error').html(
        `Error linking <a target="blank" href="${`https://github.com/${name}`}">${name}</a> to LeetHub. <br> Forbidden action. Please make sure you have the right access to this repository.`
      )
      $('#error').show()
      break

    case 404:
      $('#success').hide()
      $('#error').html(
        `Error linking <a target="blank" href="${`https://github.com/${name}`}">${name}</a> to LeetHub. <br> Resource not found. Make sure you enter the right repository name.`
      )
      $('#error').show()
      break

    default:
      bool = true
      break
  }
  $('#unlink').show()
  return bool
}

const linkRepo = (token: string, name: string): void => {
  const AUTHENTICATION_URL = `https://api.github.com/repos/${name}`

  const xhr = new XMLHttpRequest()
  xhr.addEventListener('readystatechange', function () {
    if (xhr.readyState === 4) {
      const res: Response = JSON.parse(xhr.responseText)
      const bool = linkStatusCode(xhr.status, name)
      if (xhr.status === 200 && bool) {
        chrome.storage.local.set(
          { mode_type: 'commit', repo: res.html_url },
          () => {
            $('#error').hide()
            $('#success').html(
              `Successfully linked <a target="blank" href="${res.html_url}">${name}</a> to LeetHub. Start <a href="http://leetcode.com">LeetCoding</a> now!`
            )
            $('#success').show()
            $('#unlink').show()
          }
        )
        chrome.storage.local.set({ leethub_hook: res.full_name }, () => {
          console.log('Successfully set new repo hook')
        })
        document.getElementById('hook_mode')!.style.display = 'none'
        document.getElementById('commit_mode')!.style.display = 'inherit'
      } else if (!bool) {
        chrome.storage.local.set({ mode_type: 'hook' }, () => {})
        chrome.storage.local.set({ leethub_hook: null }, () => {})
        document.getElementById('hook_mode')!.style.display = 'inherit'
        document.getElementById('commit_mode')!.style.display = 'none'
      }
    }
  })

  xhr.open('GET', AUTHENTICATION_URL, true)
  xhr.setRequestHeader('Authorization', `token ${token}`)
  xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json')
  xhr.send()
}

const unlinkRepo = (): void => {
  chrome.storage.local.set({ mode_type: 'hook' }, () => {
    console.log(`Unlinking repo`)
  })
  chrome.storage.local.set({ leethub_hook: null }, () => {
    console.log('Defaulted repo hook to NONE')
  })

  document.getElementById('hook_mode')!.style.display = 'inherit'
  document.getElementById('commit_mode')!.style.display = 'none'
}

$('#type').on('change', function () {
  const valueSelected = (this as HTMLSelectElement).value
  $('#hook_button').attr('disabled', valueSelected ? null : 'disabled')
})

$('#hook_button').on('click', () => {
  if (!option()) {
    $('#error').text(
      'No option selected - Pick an option from dropdown menu below that best suits you!'
    )
    $('#error').show()
  } else if (!repositoryName()) {
    $('#error').text(
      'No repository name added - Enter the name of your repository!'
    )
    $('#name').focus()
    $('#error').show()
  } else {
    $('#error').hide()
    $('#success').text('Attempting to create Hook... Please wait.')
    $('#success').show()

    chrome.storage.local.get('leethub_token', (data) => {
      const token = data.leethub_token
      if (!token) {
        $('#error').text(
          'Authorization error - Grant LeetHub access to your GitHub account to continue (launch extension to proceed)'
        )
        $('#error').show()
        $('#success').hide()
      } else if (option() === 'new') {
        createRepo(token, repositoryName())
      } else {
        chrome.storage.local.get('leethub_username', (data2) => {
          const username = data2.leethub_username
          if (!username) {
            $('#error').text(
              'Improper Authorization error - Grant LeetHub access to your GitHub account to continue (launch extension to proceed)'
            )
            $('#error').show()
            $('#success').hide()
          } else {
            linkRepo(token, `${username}/${repositoryName()}`)
          }
        })
      }
    })
  }
})

$('#unlink a').on('click', () => {
  unlinkRepo()
  $('#unlink').hide()
  $('#success').text(
    'Successfully unlinked your current git repo. Please create/link a new hook.'
  )
})

chrome.storage.local.get('mode_type', (data) => {
  const mode = data.mode_type

  if (mode && mode === 'commit') {
    chrome.storage.local.get('leethub_token', (data2) => {
      const token = data2.leethub_token
      if (!token) {
        $('#error').text(
          'Authorization error - Grant LeetHub access to your GitHub account to continue (click LeetHub extension on the top right to proceed)'
        )
        $('#error').show()
        $('#success').hide()
        document.getElementById('hook_mode')!.style.display = 'inherit'
        document.getElementById('commit_mode')!.style.display = 'none'
      } else {
        chrome.storage.local.get('leethub_hook', (repoName) => {
          const hook = repoName.leethub_hook
          if (!hook) {
            $('#error').text(
              'Improper Authorization error - Grant LeetHub access to your GitHub account to continue (click LeetHub extension on the top right to proceed)'
            )
            $('#error').show()
            $('#success').hide()
            document.getElementById('hook_mode')!.style.display = 'inherit'
            document.getElementById('commit_mode')!.style.display = 'none'
          } else {
            linkRepo(token, hook)
          }
        })

        document.getElementById('hook_mode')!.style.display = 'none'
        document.getElementById('commit_mode')!.style.display = 'inherit'
      }
    })
  }
})
