export interface OAuth2 {
  KEY: string
  ACCESS_TOKEN_URL: string
  AUTHORIZATION_URL: string
  CLIENT_ID: string
  CLIENT_SECRET: string
  REDIRECT_URL: string
  SCOPES: string[]
  init(): void
  begin(): void
}
