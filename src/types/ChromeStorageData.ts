export interface Stats {
  solved: number
  easy: number
  medium: number
  hard: number
  sha: { [key: string]: string | null }
}

export interface ChromeStorageData {
  leethub_token?: string
  mode_type?: string
  leethub_hook?: string
  stats?: Stats
  isSync?: boolean
}
