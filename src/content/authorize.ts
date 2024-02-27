import { LocalAuth } from '../types/LocalAuth'
import { LocalAuth as LocalAuthConstants } from '../constants/LocalAuth'

export const Authorization: LocalAuth = {
  KEY: LocalAuthConstants.KEY,
  ACCESS_TOKEN_URL: LocalAuthConstants.ACCESS_TOKEN_URL,
  AUTHORIZATION_URL: LocalAuthConstants.AUTHORIZATION_URL,
  CLIENT_ID: LocalAuthConstants.CLIENT_ID,
  CLIENT_SECRET: LocalAuthConstants.CLIENT_SECRET,
  REDIRECT_URL: LocalAuthConstants.REDIRECT_URL,
  SCOPES: LocalAuthConstants.SCOPES,
  init() {},

  parseAccessCode(url: string) {
    if (url.match(/\?error=(.+)/)) {
      chrome.tabs.getCurrent((tab) => {
        if (tab?.id) chrome.tabs.remove(tab.id)
      })
    } else {
      const match = url.match(/\?code=([\w\/\-]+)/)
      if (match) {
        this.requestToken(match[1])
      }
    }
  },

  requestToken(code: string) {
    const data = new FormData()
    data.append('client_id', this.CLIENT_ID)
    data.append('client_secret', this.CLIENT_SECRET)
    data.append('code', code)

    const xhr = new XMLHttpRequest()
    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const match = xhr.responseText.match(/access_token=([^&]*)/)
          if (match) {
            this.finish(match[1])
          }
        } else {
          chrome.runtime.sendMessage({
            target: 'background',
            closeWebPage: true,
            isSuccess: false
          })
        }
      }
    })
    xhr.open('POST', this.ACCESS_TOKEN_URL, true)
    xhr.send(data)
  },

  finish(token: string) {
    const AUTHENTICATION_URL = 'https://api.github.com/user'

    const xhr = new XMLHttpRequest()
    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          const username = response.login
          chrome.runtime.sendMessage({
            target: 'background',
            closeWebPage: true,
            isSuccess: true,
            token,
            username,
            KEY: this.KEY
          })
        }
      }
    })
    xhr.open('GET', AUTHENTICATION_URL, true)
    xhr.setRequestHeader('Authorization', `token ${token}`)
    xhr.send()
  }
}

Authorization.init()
const link: string = window.location.href

if (window.location.host === 'github.com') {
  chrome.storage.local.get(
    'pipe_leethub',
    (data: { pipe_leethub?: boolean }) => {
      if (data && data.pipe_leethub) {
        Authorization.parseAccessCode(link)
      }
    }
  )
}
