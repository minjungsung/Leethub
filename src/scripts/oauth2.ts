import { WELCOME_URL } from '../constants/Url'

// Browser extensions cannot protect an OAuth client secret. Authenticate only
// from an extension-owned page using a user-supplied repository-scoped token.
export const oAuth2 = {
  begin() {
    chrome.tabs.create({ url: WELCOME_URL, selected: true })
  }
}
