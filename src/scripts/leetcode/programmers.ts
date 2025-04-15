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
let isUploading: boolean = false; // Flag to prevent concurrent uploads

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
  console.log('[startLoader] Loader interval started.');
  loader = window.setInterval(async () => {
    if (isUploading) {
      // console.log('[startLoader] Upload already in progress, skipping check.');
      return; // Skip if an upload is already happening
    }

    // Check for success message in different locations
    const result = document.querySelector('.text-success') ||
      document.querySelector('[data-e2e-locator="submission-result"]') ||
      document.querySelector('.success__3Ai7') ||
      document.querySelector('.success__1x4n');

    if (result?.textContent?.includes('Accepted') || result?.textContent?.includes('Success')) {
      console.log('[startLoader] Success message detected.');
      isUploading = true; // Set flag before starting upload process
      try {
        const leetcodeData = await parseData();
        if (isNotEmpty(leetcodeData)) {
          console.log('[startLoader] Leetcode data parsed, calling beginUpload...');
          startUpload(); // Mark upload start (visual feedback)
          await beginUpload(leetcodeData);
        } else {
          console.log('[startLoader] Parsed data is empty, skipping upload.');
          isUploading = false; // Reset flag if data is empty
        }
      } catch (error) {
        console.error('[startLoader] Error during data parsing or upload initiation:', error);
        isUploading = false; // Reset flag on error
      } finally {
        // It might be better to reset the flag *after* beginUpload finishes
        // Let's move the reset logic to after the await beginUpload call
        // For now, keep it here, but consider the timing.
        // UPDATE: Moved reset to after await for better control
        // isUploading = false; 
      }
    } else {
      // Optional: Log when success message is not found
      // console.log('[startLoader] Success message not found.');
    }
  }, 2000); // Check every 2 seconds to reduce load
}

// Only stop loader when the page is unloaded
window.addEventListener('beforeunload', () => {
  if (loader !== undefined) {
    clearInterval(loader)
    loader = undefined
  }
})

async function beginUpload(leetcodeData: LeetcodeData): Promise<void> {
  console.log(`[beginUpload] Started for: ${leetcodeData.title}`);
  try {
    console.log('[beginUpload] Getting hook...');
    const hook: string = await getHook();
    if (!hook) {
      console.error('[beginUpload] GitHub hook not found after retries. Check config.');
      return;
    }
    console.log(`[beginUpload] Hook obtained: ${hook}`);

    console.log('[beginUpload] Getting stats...');
    let stats = await getStats();
    let statsSource = 'Initial fetch';
    if (!stats) {
      console.warn('[beginUpload] Stats not found initially. Attempting versionUpdate...');
      statsSource = 'After versionUpdate';
      await versionUpdate();
      stats = await getStats(); // Re-fetch stats
      if (!stats) {
        console.error('[beginUpload] Stats still not found after versionUpdate. Aborting.');
        return;
      }
    }
    console.log(`[beginUpload] Stats obtained (${statsSource}).`);

    const currentVersion: string | undefined = stats?.version;
    const filePath = `${hook}/${leetcodeData.title}.${leetcodeData.language}`;
    console.log(`[beginUpload] Checking initial SHA for hook: ${hook}`);
    const initialHookSHA = await getStatsSHAfromPath(hook); // Check SHA for hook path

    if (!currentVersion || currentVersion !== getVersion() || !initialHookSHA) {
      console.log(`[beginUpload] Version/SHA mismatch. Current: ${currentVersion}, App: ${getVersion()}, Hook SHA: ${initialHookSHA}. Running versionUpdate...`);
      await versionUpdate();
      // Re-fetch stats needed for SHA check below, as versionUpdate modifies them
      stats = await getStats();
      if (!stats) {
        console.error('[beginUpload] Stats became null after versionUpdate during SHA check. Aborting.');
        return;
      }
      console.log('[beginUpload] versionUpdate completed.');
    }

    console.log(`[beginUpload] Checking SHA for file path: ${filePath}`);
    let cachedSHA: string | null = await getStatsSHAfromPath(filePath);
    let calcSHA: string = calculateBlobSHA(leetcodeData.codeSnippet);
    console.log(`[beginUpload] SHA - Cached: ${cachedSHA}, Calculated: ${calcSHA}`);

    if (cachedSHA === calcSHA) {
      console.log('[beginUpload] Content already uploaded (SHA match). Marking CSS.');
      // Re-fetch latest stats specifically for branches if needed for markUploadedCSS
      const latestStats = await getStats();
      markUploadedCSS(latestStats?.branches, leetcodeData.link);
      return;
    }

    console.log('[beginUpload] SHA mismatch. Calling uploadOneSolveProblemOnGit...');
    await uploadOneSolveProblemOnGit(leetcodeData, markUploadedCSS);
    console.log(`[beginUpload] uploadOneSolveProblemOnGit completed for: ${leetcodeData.title}`);

  } catch (error: any) {
    console.error('--- [beginUpload] Final Error Caught ---');
    console.error(`[beginUpload] Failed for: ${leetcodeData.title}`);
    // Check if it's the context error we are tracking
    if (error.message?.includes('Extension context invalidated')) {
      console.error('[beginUpload] CRITICAL: Context invalidated error reached final catch block despite retries in storage.ts.');
    }
    console.error('[beginUpload] Error message:', error.message);
    console.error('[beginUpload] Error stack:', error.stack);
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

// Function to start the loader (Modified try/catch/finally)
function startLoader_revised(): void {
  console.log('[startLoader] Loader interval started.');
  loader = window.setInterval(async () => {
    if (isUploading) {
      return; // Skip if an upload is already happening
    }

    const result = document.querySelector('.text-success') ||
      document.querySelector('[data-e2e-locator="submission-result"]') ||
      document.querySelector('.success__3Ai7') ||
      document.querySelector('.success__1x4n');

    if (result?.textContent?.includes('Accepted') || result?.textContent?.includes('Success')) {
      console.log('[startLoader] Success message detected.');
      isUploading = true; // Set flag: upload is starting
      try {
        const leetcodeData = await parseData();
        if (isNotEmpty(leetcodeData)) {
          console.log('[startLoader] Leetcode data parsed, calling beginUpload...');
          startUpload(); // Mark upload start (visual feedback)
          await beginUpload(leetcodeData);
          console.log('[startLoader] beginUpload call finished.');
        } else {
          console.log('[startLoader] Parsed data is empty, skipping upload.');
          // Reset flag early if no upload happens
          isUploading = false;
        }
      } catch (error) {
        console.error('[startLoader] Error during data parsing or upload initiation:', error);
      } finally {
        // Reset the flag regardless of success or failure of beginUpload
        console.log('[startLoader] Resetting isUploading flag.');
        isUploading = false;
      }
    }
  }, 2000); // Check every 2 seconds
}

// Replace the final initialization call
if (window.location.hostname.includes('leetcode.com') || window.location.hostname.includes('programmers.co.kr')) {
  console.log('Calling initializeLoader_revised for', window.location.hostname);
  initializeLoader_revised(); // Make sure this calls the function defined above
}

async function initializeLoader_revised(): Promise<void> {
  console.log('[initializeLoader] Starting initialization...');
  try {
    console.log('[initializeLoader] Waiting for valid context...');
    await waitForValidContext();
    console.log('[initializeLoader] Context valid. Checking if extension is enabled...');
    const isEnabled = await checkEnable();
    console.log(`[initializeLoader] checkEnable returned: ${isEnabled}`);

    // === Strict Check ===
    if (!isEnabled) {
      console.log('[initializeLoader] Extension is explicitly disabled. Loader will NOT start.');
      // Stop execution here, do not proceed to add event listeners or start the loader.
      return;
    }
    // ====================

    console.log('[initializeLoader] Extension is enabled. Checking DOM state...');
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[initializeLoader] DOM loaded, starting loader.');
        startLoader_revised(); // Start the loader interval
      });
    } else {
      console.log('[initializeLoader] DOM already loaded, starting loader.');
      startLoader_revised(); // Start the loader interval
    }
  } catch (error) {
    console.error('[initializeLoader] Error during initialization:', error);
  }
}
