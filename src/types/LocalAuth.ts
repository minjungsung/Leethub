export interface LocalAuth {
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
