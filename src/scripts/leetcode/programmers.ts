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
import { BojData, uploadOneSolveProblemOnGit } from './uploadfunctions'
import { isNotEmpty, markUploadedCSS, startUpload } from './util'

// Set to true to enable console log
const debug: boolean = false

let loader: number | undefined

const currentUrl: string = window.location.href

startLoader()

function startLoader(): void {
  console.log('startLoader')
  loader = window.setInterval(async () => {
    // const enable: boolean = await checkEnable()
    const enable: boolean = true
    if (!enable) stopLoader()
    else if (getSolvedResult()) {
      console.log('정답이 나왔습니다. 업로드를 시작합니다.')
      stopLoader()
      try {
        const bojData = await parseData()
        await beginUpload(bojData)
      } catch (error) {
        console.log(error)
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
  console.log('bojData', bojData)
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
    console.log('cachedSHA', cachedSHA, 'calcSHA', calcSHA)
    if (cachedSHA === calcSHA) {
      markUploadedCSS(stats.branches, bojData.directory)
      return
    }
    await uploadOneSolveProblemOnGit(bojData, markUploadedCSS)
  }
}

async function versionUpdate(): Promise<void> {
  console.log('start versionUpdate')
  const stats = await updateLocalStorageStats()
  stats.version = getVersion()
  await saveStats(stats)
  console.log('stats updated.', stats)
}

function calculateBlobSHA(content: string): string {
  return sha1(`blob ${new Blob([content]).size}\0${content}`)
}
