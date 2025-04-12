import { sha1 } from 'js-sha1'
import {
  getHook,
  getStats,
  getStatsSHAfromPath,
  saveStats,
  updateLocalStorageStats
} from '../storage'
import { getVersion, isNull } from '../util'
import { parseData } from './parsing'
import { uploadOneSolveProblemOnGit } from './uploadfunctions'
import { isNotEmpty, markUploadedCSS, startUpload } from './util'
import { LeetcodeData } from '../../types/LeetcodeData'
import { checkEnable } from '../enable'

let loader: number | undefined

startLoader()

function startLoader(): void {
  loader = window.setInterval(async () => {
    // Check for success message in different locations
    const result = document.querySelector('.text-success') ||
      document.querySelector('[data-e2e-locator="submission-result"]') ||
      document.querySelector('.success__3Ai7') ||
      document.querySelector('.success__1x4n')

    if (result?.textContent?.includes('Accepted') || result?.textContent?.includes('Success')) {
      try {
        const leetcodeData = await parseData()
        if (isNotEmpty(leetcodeData)) {
          startUpload()
          await beginUpload(leetcodeData)
        }
      } catch (error) {
        console.error('Error during upload:', error)
      }
    }
  }, 1000) // Check every second
}

// Only stop loader when the page is unloaded
window.addEventListener('beforeunload', () => {
  if (loader !== undefined) {
    clearInterval(loader)
    loader = undefined
  }
})

async function beginUpload(leetcodeData: LeetcodeData): Promise<void> {
  try {
    const hook: string = await getHook()
    const stats = await getStats()
    const currentVersion: string = stats.version as string

    if (isNull(currentVersion) || currentVersion !== getVersion() || isNull(await getStatsSHAfromPath(hook))) {
      await versionUpdate()
    }

    let cachedSHA: string | null = await getStatsSHAfromPath(
      `${hook}/${leetcodeData.title}.${leetcodeData.language}`
    )
    let calcSHA: string = calculateBlobSHA(leetcodeData.codeSnippet)

    if (cachedSHA === calcSHA) {
      markUploadedCSS(stats.branches, leetcodeData.link)
      return
    }

    await uploadOneSolveProblemOnGit(leetcodeData, markUploadedCSS)
  } catch (error) {
    console.error('Error in beginUpload:', error)
  }
}

async function versionUpdate(): Promise<void> {
  const stats = await updateLocalStorageStats()
  stats.version = getVersion()
  await saveStats(stats)
}

function calculateBlobSHA(content: string): string {
  return sha1(`blob ${new Blob([content]).size}\0${content}`)
}
