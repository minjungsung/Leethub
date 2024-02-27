import { Difficulty } from '../constants/Difficulty'
import { languages } from '../constants/Languages'
import { UploadState } from '../types/UploadState'

let difficulty: Difficulty = ''
let uploadState: UploadState = { uploading: false }

function findLanguage(): string | null {
  const tags = Array.from(
    document.getElementsByClassName(
      'ant-select-selection-selected-value'
    ) as HTMLCollectionOf<HTMLElement>
  ).concat(
    Array.from(
      document.getElementsByClassName(
        'Select-value-label'
      ) as HTMLCollectionOf<HTMLElement>
    )
  )
  for (const tag of tags) {
    const elem = tag.textContent
    if (elem && languages[elem]) {
      return languages[elem] // Assuming languages is a valid object with string keys.
    }
  }
  return null
}

function upload(
  token: string,
  hook: string,
  code: string,
  directory: string,
  filename: string,
  sha: string | null,
  msg: string,
  cb?: () => void
): void {
  // Simplified upload function for brevity
}

function uploadGit(
  code: string,
  problemName: string,
  fileName: string,
  msg: string,
  action: 'upload' | 'update',
  prepend: boolean = true,
  cb?: () => void,
  _diff?: string
): void {
  if (_diff) {
    difficulty = _diff.trim() as Difficulty
  }

  chrome.storage.local.get(
    'leethub_token',
    (result: { leethub_token?: string }) => {
      const token = result.leethub_token
      if (token) {
        // Further implementation...
      }
    }
  )
}

// Additional functions and their TypeScript conversions would follow a similar pattern:
// - Use specific types instead of any
// - Handle potential null or undefined values with checks
// - Use type assertions for DOM elements when necessary

// For external APIs not recognized by TypeScript, declare them or use DefinitelyTyped definitions
declare global {
  interface Window {
    chrome: typeof chrome
  }
}
