import { Stats } from '../types/Stats'
import { GitHub } from './github'
import { getVersion, isNull } from './util'

chrome.storage.local.get('isSync', (data: { isSync?: boolean }) => {
  const keys = [
    'leethub_token',
    'leethub_username',
    'pipe_leethub',
    'stats',
    'leethub_hook',
    'mode_type'
  ]
  if (!data || !data.isSync) {
    keys.forEach((key) => {
      chrome.storage.sync.get(key, (data: { [key: string]: any }) => {
        chrome.storage.local.set({ [key]: data[key] })
      })
    })
    chrome.storage.local.set({ isSync: true }, () => {
      console.info('leethub Synced to local values')
    })
  }
})

getStats().then(async (stats: Stats | null) => {
  stats = stats ?? {}
  if (isNull(stats.version)) stats.version = '0.0.0'
  const currentVersion = getVersion()
  if (isNull(stats.branches) || stats.version !== currentVersion)
    stats.branches = {}
  if (isNull(stats.submission) || stats.version !== currentVersion)
    stats.submission = {}
  if (isNull(stats.problems) || stats.version !== currentVersion)
    stats.problems = {}
  saveStats(stats)
})

// Helper function to check context validity
function isContextValid(): boolean {
  return chrome.runtime && chrome.runtime.id !== undefined;
}

// Helper function to wait for context
async function waitForValidContext(retries = 3, delay = 100): Promise<void> {
  for (let i = 0; i < retries; i++) {
    if (isContextValid()) return;
    console.warn(`Context invalid, retrying (${i + 1}/${retries})...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('Extension context invalidated after multiple retries.');
}

async function getObjectFromLocalStorage(key: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await waitForValidContext(1, 50); // Quick check before attempting
      return await new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (value) => {
          if (chrome.runtime.lastError) {
            // Check for context invalidated error specifically
            if (chrome.runtime.lastError.message?.includes('context invalidated')) {
              console.warn(`getObjectFromLocalStorage: Context invalidated on attempt ${attempt}. Retrying...`);
              reject(new Error('Context Invalidated')); // Reject to trigger retry
            } else {
              console.error('getObjectFromLocalStorage Error:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError); // Reject with the actual error
            }
          } else {
            resolve(value[key]);
          }
        });
      });
    } catch (error: any) {
      if (error.message === 'Context Invalidated' && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
        continue; // Retry the loop
      } else {
        console.error(`getObjectFromLocalStorage failed after ${attempt} attempts for key: ${key}`, error);
        // If it's the last attempt or a different error, throw it
        throw error;
      }
    }
  }
  // Should not be reached if retries are exhausted, as error is thrown
  throw new Error(`getObjectFromLocalStorage failed permanently for key: ${key}`);
}

async function saveObjectInLocalStorage(obj: object, retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await waitForValidContext(1, 50);
      return await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set(obj, () => {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message?.includes('context invalidated')) {
              console.warn(`saveObjectInLocalStorage: Context invalidated on attempt ${attempt}. Retrying...`);
              reject(new Error('Context Invalidated'));
            } else {
              console.error('saveObjectInLocalStorage Error:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            }
          } else {
            resolve();
          }
        });
      });
    } catch (error: any) {
      if (error.message === 'Context Invalidated' && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      } else {
        console.error(`saveObjectInLocalStorage failed after ${attempt} attempts for obj:`, obj, error);
        throw error;
      }
    }
  }
  throw new Error(`saveObjectInLocalStorage failed permanently for obj: ${JSON.stringify(obj)}`);
}

// Apply similar retry logic to removeObjectFromLocalStorage
export async function removeObjectFromLocalStorage(
  keys: string | string[],
  retries = 3
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await waitForValidContext(1, 50);
      return await new Promise<void>((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message?.includes('context invalidated')) {
              console.warn(`removeObjectFromLocalStorage: Context invalidated on attempt ${attempt}. Retrying...`);
              reject(new Error('Context Invalidated'));
            } else {
              console.error('removeObjectFromLocalStorage Error:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            }
          } else {
            resolve();
          }
        });
      });
    } catch (error: any) {
      if (error.message === 'Context Invalidated' && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      } else {
        console.error(`removeObjectFromLocalStorage failed after ${attempt} attempts for keys:`, keys, error);
        throw error;
      }
    }
  }
  throw new Error(`removeObjectFromLocalStorage failed permanently for keys: ${keys}`);
}

export async function getObjectFromSyncStorage(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(key, (value: { [key: string]: any }) => {
        resolve(value[key])
      })
    } catch (ex) {
      reject(ex)
    }
  })
}

export async function saveObjectInSyncStorage(obj: object): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.set(obj, () => {
        resolve()
      })
    } catch (ex) {
      reject(ex)
    }
  })
}

export async function removeObjectFromSyncStorage(
  keys: string | string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.remove(keys, () => {
        resolve()
      })
    } catch (ex) {
      reject(ex)
    }
  })
}

export async function getToken(): Promise<string> {
  return await getObjectFromLocalStorage('leethub_token')
}

export async function getGithubUsername(): Promise<string> {
  return await getObjectFromLocalStorage('leethub_username')
}

export async function getStats(): Promise<Stats> {
  return await getObjectFromLocalStorage('stats')
}

export async function getHook(): Promise<string> {
  return await getObjectFromLocalStorage('leethub_hook')
}

async function getOrgOption(): Promise<string> {
  try {
    return await getObjectFromLocalStorage('leethub_OrgOption')
  } catch (error) {
    console.info(
      'The way it works has changed with updates. Update your storage.'
    )
    await saveObjectInLocalStorage({ leethub_OrgOption: 'platform' })
    return 'platform'
  }
}

export async function getModeType(): Promise<string | null> {
  return await getObjectFromLocalStorage('mode_type')
}

export async function saveToken(token: string): Promise<void> {
  return await saveObjectInLocalStorage({ leethub_token: token })
}

export async function saveStats(stats: Stats): Promise<void> {
  return await saveObjectInLocalStorage({ stats })
}

export async function updateStatsSHAfromPath(
  path: string,
  sha: string
): Promise<void> {
  const stats = await getStats()
  if (stats) {
    updateObjectDatafromPath(stats.submission, path, sha)
    await saveStats(stats)
  } else {
    throw new Error('Stats not found')
  }
}

export function updateObjectDatafromPath(
  obj: Record<string, any>,
  path: string,
  data: string
): void {
  let current = obj
  const pathArray = path.split('/').filter((p) => p !== '')
  for (const pathPart of pathArray.slice(0, -1)) {
    if (!current[pathPart]) {
      current[pathPart] = {}
    }
    current = current[pathPart]
  }
  current[pathArray.pop()!] = data
}

export async function getStatsSHAfromPath(
  path: string
): Promise<string | null> {
  const stats = await getStats()
  if (!stats) {
    return null
  }
  return getObjectDatafromPath(stats.submission, path)
}

function getObjectDatafromPath(
  obj: Record<string, any>,
  path: string
): string | null {
  let current = obj
  const pathArray = path.split('/').filter((p) => p !== '')
  for (const pathPart of pathArray.slice(0, -1)) {
    if (!current[pathPart]) {
      return null
    }
    current = current[pathPart]
  }
  return current[pathArray.pop()!] || null
}

export async function updateLocalStorageStats(): Promise<Stats> {
  const hook = await getHook()
  const token = await getToken()

  const git = new GitHub(hook, token)
  const stats = await getStats()
  const tree_items: {
    path: string
    sha: string
    mode: string
    type: string
  }[] = []
  await git.getTree().then((tree: any[]) => {
    tree.forEach((item) => {
      if (item.type === 'blob') {
        tree_items.push(item)
      }
    })
  })
  if (stats) {
    tree_items.forEach((item) => {
      updateObjectDatafromPath(
        stats.submission,
        `${hook}/${item.path}`,
        item.sha
      )
    })
    const default_branch = await git.getDefaultBranchOnRepo()
    stats.branches[hook!] = default_branch
    await saveStats(stats)
  } else {
    throw new Error('Stats is null')
  }
  return stats
}

export async function getDirNameByOrgOption(
  dirName: string,
  language: string
): Promise<string> {
  if ((await getOrgOption()) === 'language') dirName = `${language}/${dirName}`
  return dirName
}

export async function getBranchName(retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await waitForValidContext(1, 50);
      return await new Promise<string>((resolve, reject) => {
        chrome.storage.local.get('branch', ({ branch }) => {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message?.includes('context invalidated')) {
              console.warn(`getBranchName: Context invalidated on attempt ${attempt}. Retrying...`);
              reject(new Error('Context Invalidated'));
            } else {
              console.error('getBranchName Error:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            }
          } else {
            resolve(branch || 'main');
          }
        });
      });
    } catch (error: any) {
      if (error.message === 'Context Invalidated' && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      } else {
        console.error(`getBranchName failed after ${attempt} attempts`, error);
        throw error;
      }
    }
  }
  throw new Error('getBranchName failed permanently');
}

// Function to get the 'bjhEnable' status
export async function getIsEnabled(): Promise<boolean> {
  const enabled = await getObjectFromLocalStorage('bjhEnable');
  return enabled ?? false; // Default to false if not set
}

// Function to save the 'bjhEnable' status
export async function saveIsEnabled(isEnabled: boolean): Promise<void> {
  await saveObjectInLocalStorage({ bjhEnable: isEnabled });
}
