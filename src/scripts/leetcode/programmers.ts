import { sha1 } from 'js-sha1'
import {
  getHook,
  getStats,
  getStatsSHAfromPath,
  saveStats,
  updateLocalStorageStats,
  getIsEnabled
} from '../storage'
import { getVersion, isNull } from '../util'
import { parseData } from './parsing'
import { uploadOneSolveProblemOnGit } from './uploadfunctions'
import { isNotEmpty, markUploadedCSS, startUpload } from './util'
import { LeetcodeData } from '../../types/LeetcodeData'

let uploadObserver: MutationObserver | null = null
let isUploading: boolean = false; // Flag to prevent concurrent uploads

// Check if extension context is valid
function isExtensionContextValid(): boolean {
  // Ensure chrome and runtime are defined before accessing id
  return typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.id !== 'undefined';
}

// Wait for extension context to be valid
async function waitForValidContext(): Promise<void> {
  return new Promise((resolve) => {
    const checkContext = () => {
      if (isExtensionContextValid()) {
        resolve();
      } else {
        // Add a small delay to prevent tight loop if context is initially invalid
        setTimeout(checkContext, 100);
      }
    };
    checkContext();
  });
}

// Function to handle submission result detection and trigger upload
function handleSubmissionResult(mutationsList: MutationRecord[], observer: MutationObserver) {
  if (isUploading) {
    // console.log('[Observer] Upload already in progress, ignoring mutations.');
    return;
  }

  let successDetected = false;
  for (const mutation of mutationsList) {
    if (mutation.type !== 'childList') continue; // Only interested in node additions/removals

    // Check added nodes for the success message more robustly
    for (const node of Array.from(mutation.addedNodes)) {
      if (!(node instanceof HTMLElement)) continue;

      // Define selectors known to indicate success
      const successSelectors = [
        '.text-success',                             // LeetCode older UI?
        '[data-e2e-locator="submission-result"]',    // LeetCode newer UI?
        '.success__3Ai7',                            // Potential LeetCode classes
        '.success__1x4n',                            // Potential LeetCode classes
        '.success'                                   // General success class (Programmers?)
      ];

      // Check if the added node itself or its descendants match selectors AND contain success text
      let potentialSuccessNode: Element | null = null;
      if (successSelectors.some(selector => node.matches(selector))) {
        potentialSuccessNode = node;
      } else {
        potentialSuccessNode = successSelectors.reduce<Element | null>((found, selector) => found || node.querySelector(selector), null);
      }

      if (potentialSuccessNode) {
        const textContent = potentialSuccessNode.textContent || '';
        if (textContent.includes('Accepted') || textContent.includes('Success') || textContent.includes('성공') /* Korean for Programmers */) {
          console.log('[Observer] Success message detected via node:', potentialSuccessNode);
          successDetected = true;
          break; // Found success in this node, break inner loop
        }
      }
    }
    if (successDetected) break; // Found success in this mutation, break outer loop
  }

  if (successDetected) {
    console.log('[Observer] Success detected flag is true. Starting upload process.');
    isUploading = true; // Prevent further triggers for this submission

    // Optional: Disconnect observer here if desired
    // observer.disconnect();
    // console.log('[Observer] Disconnected after detecting success.');

    (async () => {
      try {
        const leetcodeData = await parseData();
        if (isNotEmpty(leetcodeData)) {
          console.log('[Observer] Leetcode data parsed, calling beginUpload...');
          startUpload(); // Mark upload start (visual feedback)
          await beginUpload(leetcodeData);
          console.log('[Observer] beginUpload call finished.');
        } else {
          console.log('[Observer] Parsed data is empty, skipping upload.');
          // Reset flag early if no upload happens
          isUploading = false;
        }
      } catch (error) {
        console.error('[Observer] Error during data parsing or upload initiation:', error);
        // Ensure flag is reset even if parseData or isNotEmpty fails
        isUploading = false;
      } finally {
        // Reset the flag after attempt, regardless of outcome
        // Ensure it happens only if the process was started by this detection
        if (isUploading) { // Double check if it was set to true
          console.log('[Observer] Resetting isUploading flag in finally block.');
          isUploading = false;
        }
        // If observer was disconnected, maybe reconnect it here or rely on page navigation to re-init
      }
    })(); // Immediately invoke the async function
  }
}

// Function to initialize and start the MutationObserver
function startSubmissionObserver(): void {
  // Disconnect existing observer first to prevent duplicates during SPA navigation
  if (uploadObserver) {
    console.log('[Observer] Disconnecting existing observer before starting a new one.');
    uploadObserver.disconnect();
    uploadObserver = null; // Clear the reference
  }

  // Select a target node that reliably exists and contains the submission results area
  // document.body is broad; a more specific container is better if stable.
  // Example: Find a common container for LeetCode/Programmers results.
  // Let's stick with body for now, but this might need refinement.
  const targetNode = document.body;
  if (!targetNode) {
    console.error('[Observer] Target node (document.body) not found.');
    // Maybe retry finding the target after a short delay?
    setTimeout(startSubmissionObserver, 500);
    return;
  }

  const config: MutationObserverInit = {
    childList: true, // Observe direct children additions/removals
    subtree: true,   // Observe all descendants
  };

  uploadObserver = new MutationObserver(handleSubmissionResult);

  console.log('[Observer] Starting MutationObserver to watch for submission results on target:', targetNode);
  uploadObserver.observe(targetNode, config);

  // Add a listener to disconnect the observer when navigating away
  // Using 'beforeunload' might not be reliable for SPAs.
  // A better approach might be needed if state persists across navigations.
  // For now, keep 'beforeunload' but acknowledge its limitation.
  const disconnectObserver = () => {
    if (uploadObserver) {
      console.log('[Observer] Disconnecting observer due to unload/navigation.');
      uploadObserver.disconnect();
      uploadObserver = null;
    }
  };
  window.addEventListener('beforeunload', disconnectObserver);

  // We might also need to handle history API changes for SPAs
  // Example (needs testing):
  // window.addEventListener('popstate', disconnectObserver);
  // You might also need to wrap pushState/replaceState if LeetCode uses them extensively
}

// --- Initialization Logic ---
async function initialize(): Promise<void> {
  console.log('[Initializer] Starting initialization...');
  try {
    console.log('[Initializer] Waiting for valid context...');
    await waitForValidContext();
    console.log('[Initializer] Context valid. Checking if extension is enabled...');
    const isEnabled = await getIsEnabled(); // Use exported function
    console.log(`[Initializer] getIsEnabled returned: ${isEnabled}`);

    if (!isEnabled) {
      console.log('[Initializer] Extension is explicitly disabled. Initialization stopped.');
      // Also ensure any existing observer is disconnected if the user disables the extension
      if (uploadObserver) {
        uploadObserver.disconnect();
        uploadObserver = null;
      }
      return;
    }

    console.log('[Initializer] Extension is enabled. Starting submission observer.');
    startSubmissionObserver();

  } catch (error) {
    console.error('[Initializer] Error during initialization:', error);
  }
}

// --- Start Point ---
// Use a flag to prevent multiple initializations on rapid SPA navigations
let isInitializing = false;

function handlePotentialInitialization() {
  // Only attempt initialization if on the correct host and not already initializing
  if (!isInitializing && (window.location.hostname.includes('leetcode.com') || window.location.hostname.includes('programmers.co.kr'))) {
    isInitializing = true;
    console.log('[Initializer] URL matches. Calling initialize...');
    initialize().finally(() => {
      isInitializing = false; // Reset flag after initialization attempt completes
    });
  } else {
    console.log('[Initializer] Skipping initialization: Already initializing or wrong hostname.');
  }
}

// Initial call for the first page load
handlePotentialInitialization();

// Attempt re-initialization on history changes (for SPA behavior)
// Note: LeetCode might use pushState/replaceState which don't trigger popstate directly.
// More advanced SPA handling might involve wrapping history functions or using webNavigation API.
window.addEventListener('popstate', handlePotentialInitialization);

// REMOVED history pushState/replaceState wrapping to fix linter error
/*
const originalPushState = history.pushState;
history.pushState = function() {
    //@ts-ignore
    originalPushState.apply(this, arguments);
    handlePotentialInitialization();
};
const originalReplaceState = history.replaceState;
history.replaceState = function() {
    //@ts-ignore
    originalReplaceState.apply(this, arguments);
    handlePotentialInitialization();
};
*/

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
    if (error.message?.includes('Extension context invalidated')) {
      console.error('[beginUpload] CRITICAL: Context invalidated error reached final catch block despite retries in storage.ts.');
    }
    console.error('[beginUpload] Error message:', error.message);
    console.error('[beginUpload] Error stack:', error.stack);
  }
}

async function versionUpdate(): Promise<void> {
  console.log('[versionUpdate] Starting update...');
  try {
    const stats = await updateLocalStorageStats(); // Uses storage fns
    stats.version = getVersion();
    await saveStats(stats); // Uses storage fns
    console.log('[versionUpdate] Finished successfully.');
  } catch (error) {
    console.error('[versionUpdate] Failed:', error);
    // Decide if throwing is necessary or just log
  }
}

function calculateBlobSHA(content: string): string {
  return sha1(`blob ${new Blob([content]).size}\0${content}`)
}
