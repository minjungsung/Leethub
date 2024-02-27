// Assuming chrome types are available, if not, you might need to install @types/chrome
// npm install --save-dev @types/chrome

import { OAuth2 } from '../types/OAuth2'

const oAuth2: OAuth2 = {
  KEY: '',
  ACCESS_TOKEN_URL: '',
  AUTHORIZATION_URL: '',
  CLIENT_ID: '',
  CLIENT_SECRET: '',
  REDIRECT_URL: '',
  SCOPES: [],

  init() {
    this.KEY = 'leethub_token'
    this.ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token'
    this.AUTHORIZATION_URL = 'https://github.com/login/oauth/authorize'
    this.CLIENT_ID = 'beb4f0aa19ab8faf5004'
    this.CLIENT_SECRET = 'REMOVED_EXPOSED_CREDENTIAL'
    this.REDIRECT_URL = 'https://github.com/'
    this.SCOPES = ['repo']
  },

  begin() {
    this.init() // Initialize with secure token params.

    let url = `${this.AUTHORIZATION_URL}?client_id=${this.CLIENT_ID}&redirect_uri=${this.REDIRECT_URL}&scope=`

    this.SCOPES.forEach((scope) => {
      url += scope
    })

    chrome.storage.local.set({ pipe_leethub: true }, () => {
      chrome.tabs.create({ url, active: true }, () => {
        window.close()
        chrome.tabs.getCurrent((tab) => {
          if (tab?.id) {
            chrome.tabs.remove(tab.id)
          }
        })
      })
    })
  }
}
