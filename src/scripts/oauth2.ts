import { LocalAuth } from '../constants/LocalAuth'
import { OAuth2 } from '../types/OAuth2'

export const oAuth2: OAuth2 = {
  KEY: '',
  ACCESS_TOKEN_URL: '',
  AUTHORIZATION_URL: '',
  CLIENT_ID: '',
  CLIENT_SECRET: '',
  REDIRECT_URL: '',
  SCOPES: [],

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
   * Begin
   */
  begin() {
    this.init()
    let url: string = `${this.AUTHORIZATION_URL}?client_id=${this.CLIENT_ID}&redirect_uri=${this.REDIRECT_URL}&scope=`
    this.SCOPES.forEach((scope) => {
      url += scope
    })

    chrome.storage.local.set({ pipe_leethub: true }, () => {
      chrome.tabs.create({ url, selected: true }, () => {
        window.close()
        chrome.tabs.getCurrent((tab: chrome.tabs.Tab | undefined) => {
          // chrome.tabs.remove(tab?.id ?? 0, () => {});
        })
      })
    })
  }
}
