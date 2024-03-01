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
    // const enable: boolean = await checkEnable()
    const enable: boolean = true
    if (!enable) stopLoader()
    else if (getSolvedResult()) {
      stopLoader()
      try {
        const leetcodeData = await parseData()
        await beginUpload(leetcodeData)
      } catch (error) {
        console.error(error)
      }
    }
  }, 2000)
}

function stopLoader(): void {
  if (loader !== undefined) {
    clearInterval(loader)
  }
}

function getSolvedResult(): boolean {
  const result: HTMLElement | null = document.querySelector(
    '[data-e2e-locator="submission-result"]'
  )
  return result?.innerText === 'Accepted'
}

async function beginUpload(leetcodeData: LeetcodeData): Promise<void> {
  if (isNotEmpty(leetcodeData)) {
    startUpload()

    const stats = await getStats()
    const hook: string = await getHook()
    const currentVersion: string = stats.version as string
    if (
      isNull(currentVersion) ||
      currentVersion !== getVersion() ||
      isNull(await getStatsSHAfromPath(hook))
    ) {
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
