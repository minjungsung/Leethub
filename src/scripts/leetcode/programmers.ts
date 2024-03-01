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
import { BojData } from '../../types/BoJData'
import { checkEnable } from '../enable'

// Set to true to enable console log
let loader: number | undefined

startLoader()

function startLoader(): void {
  loader = window.setInterval(async () => {
    const enable: boolean = await checkEnable()
    if (!enable) stopLoader()
    else if (getSolvedResult()) {
      stopLoader()
      try {
        const bojData = await parseData()
        await beginUpload(bojData)
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

async function beginUpload(bojData: BojData): Promise<void> {
  if (isNotEmpty(bojData)) {
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
      `${hook}/${bojData.directory}/${bojData.fileName}`
    )
    let calcSHA: string = calculateBlobSHA(bojData.code)
    if (cachedSHA === calcSHA) {
      markUploadedCSS(stats.branches, bojData.directory)
      return
    }
    await uploadOneSolveProblemOnGit(bojData, markUploadedCSS)
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
