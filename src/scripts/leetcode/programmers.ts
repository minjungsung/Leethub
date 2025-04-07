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
  console.log('Starting LeetHub loader...');
  loader = window.setInterval(async () => {
    console.log('Checking submission result...');
    if (getSolvedResult()) {
      console.log('Problem solved! Starting upload process...');
      stopLoader()
      try {
        console.log('Parsing LeetCode data...');
        const leetcodeData = await parseData()
        console.log('Parsed data:', leetcodeData);

        console.log('Beginning upload process...');
        await beginUpload(leetcodeData)
      } catch (error) {
        console.error('Error during upload process:', error)
      }
    }
  }, 2000)
}

function stopLoader(): void {
  console.log('Stopping loader...');
  if (loader !== undefined) {
    clearInterval(loader)
  }
}

function getSolvedResult(): boolean {
  const result: HTMLElement | null = document.querySelector(
    '[data-e2e-locator="submission-result"]'
  )
  console.log('Submission result element:', result?.innerText);
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
    console.log('Cached SHA:', cachedSHA);
    let calcSHA: string = calculateBlobSHA(leetcodeData.codeSnippet)
    console.log('Calculated SHA:', calcSHA);

    if (cachedSHA === calcSHA) {
      console.log('File already exists with same content, marking as uploaded');
      markUploadedCSS(stats.branches, leetcodeData.link)
      return
    }

    console.log('Uploading to GitHub...');
    await uploadOneSolveProblemOnGit(leetcodeData, markUploadedCSS)
    console.log('Upload completed successfully');
  } else {
    console.warn('Invalid or empty LeetCode data:', leetcodeData);
  }
}

async function versionUpdate(): Promise<void> {
  console.log('Updating version...');
  const stats = await updateLocalStorageStats()
  stats.version = getVersion()
  await saveStats(stats)
  console.log('Version updated successfully');
}

function calculateBlobSHA(content: string): string {
  return sha1(`blob ${new Blob([content]).size}\0${content}`)
}
