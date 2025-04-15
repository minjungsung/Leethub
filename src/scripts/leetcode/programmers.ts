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

// Check if extension context is valid
function isExtensionContextValid(): boolean {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id !== undefined;
}

// Wait for extension context to be valid
async function waitForValidContext(): Promise<void> {
  return new Promise((resolve) => {
    const checkContext = () => {
      if (isExtensionContextValid()) {
        resolve();
      } else {
        setTimeout(checkContext, 100);
      }
    };
    checkContext();
  });
}

// Initialize loader after DOM is loaded and extension context is valid
async function initializeLoader(): Promise<void> {
  try {
    await waitForValidContext();

    // Check if extension is enabled
    const isEnabled = await checkEnable();
    if (!isEnabled) {
      console.log('Extension is not enabled');
      return;
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, starting loader');
        startLoader();
      });
    } else {
      console.log('DOM already loaded, starting loader');
      startLoader();
    }
  } catch (error) {
    console.error('Error initializing loader:', error);
  }
}

// Only initialize if we're on a LeetCode or Programmers page
if (window.location.hostname.includes('leetcode.com') || window.location.hostname.includes('programmers.co.kr')) {
  console.log('Initializing loader for', window.location.hostname);
  initializeLoader();
}

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
