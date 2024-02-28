import { LocalAuth } from "../constants/LocalAuth"

interface LocalAuth {
  KEY: string
  ACCESS_TOKEN_URL: string
  AUTHORIZATION_URL: string
  CLIENT_ID: string
  CLIENT_SECRET: string
  REDIRECT_URL: string
  SCOPES: string[]
  init: () => void
  parseAccessCode: (url: string) => void
  requestToken: (code: string) => void
  finish: (token: string) => void
}

const localAuth: LocalAuth = {
  KEY: '',
  ACCESS_TOKEN_URL: '',
  AUTHORIZATION_URL: '',
  CLIENT_ID: '',
  CLIENT_SECRET: '',
  REDIRECT_URL: '',
  SCOPES: [],

  /**
   * Initialize
   */
  init() {
    this.KEY = LocalAuth.KEY
    this.ACCESS_TOKEN_URL = LocalAuth.ACCESS_TOKEN_URL
    this.AUTHORIZATION_URL = LocalAuth.AUTHORIZATION_URL
    this.CLIENT_ID = LocalAuth.CLIENT_ID
    this.CLIENT_SECRET = LocalAuth.CLIENT_SECRET
    this.REDIRECT_URL = LocalAuth.REDIRECT_URL
    this.SCOPES = LocalAuth.SCOPES
  },

  /**
   * Parses Access Code
   *
   * @param url The url containing the access code.
   */
  parseAccessCode(url: string) {
    if (url.match(/\?error=(.+)/)) {
      chrome.tabs.getCurrent((tab?: chrome.tabs.Tab) => {
        if (tab?.id) chrome.tabs.remove(tab.id)
      })
    } else {
      const accessCode = url.match(/\?code=([\w\/\-]+)/)
      if (accessCode) {
        this.requestToken(accessCode[1])
      }
    }
  },

  /**
   * Request Token
   *
   * @param code The access code returned by provider.
   */
  requestToken(code: string) {
    const data = new FormData()
    data.append('client_id', this.CLIENT_ID)
    data.append('client_secret', this.CLIENT_SECRET)
    data.append('code', code)

    const xhr = new XMLHttpRequest()
    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this.finish(xhr.responseText.match(/access_token=([^&]*)/)?.[1] ?? '')
        } else {
          chrome.runtime.sendMessage({
            closeWebPage: true,
            isSuccess: false
          })
        }
      }
    })
    xhr.open('POST', this.ACCESS_TOKEN_URL, true)
    xhr.send(data)
  },

  /**
   * Finish
   *
   * @param token The OAuth2 token given to the application from the provider.
   */
  finish(token: string) {
    const AUTHENTICATION_URL = 'https://api.github.com/user'

    const xhr = new XMLHttpRequest()
    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const username = JSON.parse(xhr.responseText).login
          chrome.runtime.sendMessage({
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

localAuth.init() // load params.
const link = window.location.href

/* Check for open pipe */
if (window.location.host === 'github.com') {
  chrome.storage.local.get(
    'pipe_leethub',
    (data: { pipe_leethub?: boolean }) => {
      if (data && data.pipe_leethub) {
        localAuth.parseAccessCode(link)
      }
    }
  )
}
