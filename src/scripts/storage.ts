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
async function waitForValidContext(retries = 3, delay = 100): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    if (isContextValid()) return true;
    console.warn(`Context invalid, retrying (${i + 1}/${retries})...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.error('Extension context remained invalid after short wait.');
  return false;
}

export async function getObjectFromLocalStorage(key: string): Promise<any> {
  const maxRetries = 3;
  const retryDelay = 1000;

  for (let i = 0; i < maxRetries; i++) {
    const contextIsValid = await waitForValidContext(3, 100);

    if (!contextIsValid) {
      console.warn(`getObjectFromLocalStorage(${key}): Context invalid before attempt ${i + 1}. Will retry after ${retryDelay}ms.`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      continue;
    }

    try {
      if (!chrome?.storage?.local) {
        throw new Error('Chrome storage API not available');
      }

      const result = await new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (value) => {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message?.includes('context invalidated')) {
              console.warn(`getObjectFromLocalStorage(${key}): Context invalidated during storage.local.get (Attempt ${i + 1}).`);
              reject(new Error('Context Invalidated During Call'));
            } else {
              console.error(`getObjectFromLocalStorage(${key}) Error during get:`, chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError.message));
            }
          } else {
            resolve(value[key]);
          }
        });
      });

      return result;

    } catch (error: any) {
      if (error.message === 'Context Invalidated During Call') {
        console.warn(`Retry ${i + 1}/${maxRetries} for getObjectFromLocalStorage(${key}) due to context invalidation during call.`);
      } else {
        console.error(`getObjectFromLocalStorage(${key}) encountered other error on attempt ${i + 1}:`, error);
        if (i === maxRetries - 1) {
          console.error(`getObjectFromLocalStorage failed after ${maxRetries} attempts for key: ${key}`, error);
          throw error;
        }
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  console.error(`getObjectFromLocalStorage failed permanently after ${maxRetries} attempts for key: ${key}.`);
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
  const retryDelay = 1000;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const contextIsValid = await waitForValidContext(3, 100);
    if (!contextIsValid) {
      console.warn(`removeObjectFromLocalStorage: Context invalid before attempt ${attempt}. Retrying after delay...`);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      continue;
    }

    try {
      if (!chrome?.storage?.local) {
        throw new Error('Chrome storage API not available');
      }
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message?.includes('context invalidated')) {
              console.warn(`removeObjectFromLocalStorage: Context invalidated during call (Attempt ${attempt}).`);
              reject(new Error('Context Invalidated During Call'));
            } else {
              console.error('removeObjectFromLocalStorage Error:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            }
          } else {
            resolve();
          }
        });
      });
      return;

    } catch (error: any) {
      if (error.message === 'Context Invalidated During Call') {
        console.warn(`Retry ${attempt}/${retries} for removeObjectFromLocalStorage due to context invalidation during call.`);
      } else {
        console.error(`removeObjectFromLocalStorage encountered other error on attempt ${attempt}:`, error);
        if (attempt === retries) {
          console.error(`removeObjectFromLocalStorage failed after ${retries} attempts for keys:`, keys, error);
          throw error;
        }
      }
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
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
  const retryDelay = 1000;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const contextIsValid = await waitForValidContext(3, 100);
    if (!contextIsValid) {
      console.warn(`getBranchName: Context invalid before attempt ${attempt}. Retrying after delay...`);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      continue;
    }

    try {
      if (!chrome?.storage?.local) {
        throw new Error('Chrome storage API not available');
      }
      const branch = await new Promise<string>((resolve, reject) => {
        chrome.storage.local.get('branch', ({ branch }) => {
          if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message?.includes('context invalidated')) {
              console.warn(`getBranchName: Context invalidated during call (Attempt ${attempt}).`);
              reject(new Error('Context Invalidated During Call'));
            } else {
              console.error('getBranchName Error:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            }
          } else {
            resolve(branch || 'main');
          }
        });
      });
      return branch;

    } catch (error: any) {
      if (error.message === 'Context Invalidated During Call') {
        console.warn(`Retry ${attempt}/${retries} for getBranchName due to context invalidation during call.`);
      } else {
        console.error(`getBranchName encountered other error on attempt ${attempt}:`, error);
        if (attempt === retries) {
          console.error(`getBranchName failed after ${retries} attempts`, error);
          throw error;
        }
      }
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
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
