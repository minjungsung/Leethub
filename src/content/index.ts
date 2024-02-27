import browser, { runtime, storage, tabs } from 'webextension-polyfill'
import { Request } from '../types/Request'
import $ from 'jquery'

declare const oAuth2: { begin: () => void }
let action: boolean = false

// Fetch the leethub_token from Chrome's local storage
browser.storage.local.get('leethub_token').then((data) => {
  const token = data.leethub_token
  if (token === null || token === undefined) {
    action = true
    $('#auth_mode').show()
  } else {
    // To validate the user, load the user object from GitHub.
    const AUTHENTICATION_URL: string = 'https://api.github.com/user'

    const xhr = new XMLHttpRequest()
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // Show MAIN FEATURES
          browser.storage.local.get('mode_type').then((data2) => {
            if (data2 && data2.mode_type === 'commit') {
              $('#commit_mode').show()
              // Get problem stats and repo link
              browser.storage.local
                .get(['stats', 'leethub_hook'])
                .then((data3) => {
                  const { stats, leethub_hook } = data3
                  if (stats && stats.solved) {
                    $('#p_solved').text(stats.solved.toString())
                    $('#p_solved_easy').text(stats.easy.toString())
                    $('#p_solved_medium').text(stats.medium.toString())
                    $('#p_solved_hard').text(stats.hard.toString())
                  }
                  if (leethub_hook) {
                    $('#repo_url').html(
                      `<a target="blank" style="color: cadetblue !important; font-size:0.8em;" href="https://github.com/${leethub_hook}">${leethub_hook}</a>`
                    )
                  }
                })
            } else {
              $('#hook_mode').show()
            }
          })
        } else if (xhr.status === 401) {
          // Bad OAuth, reset token and redirect to authorization process again!
          browser.storage.local.set({ leethub_token: null }).then(() => {
            console.log('BAD oAuth!!! Redirecting back to oAuth process')
            action = true
            $('#auth_mode').show()
          })
        }
      }
    })
    xhr.open('GET', AUTHENTICATION_URL, true)
    xhr.setRequestHeader('Authorization', `token ${token}`)
    xhr.send()
  }
})

export async function handleContentMessage(request: Request) {
  console.log('gotcha')
  if (request.target !== 'content') return
  switch (request.action) {
    case 'authenticate':
      // Trigger the authentication logic
      if (action) {
        oAuth2.begin()
      }
      break
    case 'showWelcome':
      // Logic to show welcome page or mode
      $('#welcome_URL')
        .attr('href', browser.runtime.getURL('welcome.html'))
        .show()
      break
    case 'showHook':
      // Logic to show hook page or mode
      $('#hook_URL').attr('href', browser.runtime.getURL('welcome.html')).show() // Assuming you want to show the same welcome.html, change if different
      break
    default:
      console.log('Received an unknown action:', request.action)
  }
}

export async function init() {
  console.log('[content] loaded ')
  runtime.onMessage.addListener(handleContentMessage)
}

init()
