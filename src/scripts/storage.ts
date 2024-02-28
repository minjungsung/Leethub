// Assuming the existence of helper functions like isNull and getVersion, which are not defined in the provided code.
// These would need to be implemented or imported for the TypeScript version to work as expected.

import { GitHub } from './github'
import { getVersion, isNull } from './util'

interface Stats {
  version?: string
  branches?: any
  submission?: any
  problems?: any
}

/* Sync to local storage */
chrome.storage.local.get('isSync', (data: { isSync?: boolean }) => {
  const keys = [
    'leethub_token',
    'leethub_username',
    'pipe_baekjoonhub',
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
      console.log('leethub Synced to local values')
    })
  } else {
    console.log('leethub Local storage already synced!')
  }
})

/* stats 초기값이 없는 경우, 기본값을 생성하고 stats를 업데이트한다. */
getStats().then(async (stats: Stats | null) => {
  stats = stats ?? {} // Use nullish coalescing operator to ensure stats is an object
  if (isNull(stats.version)) stats.version = '0.0.0'
  const currentVersion = getVersion() // Await the result of getVersion
  if (isNull(stats.branches) || stats.version !== currentVersion)
    stats.branches = {}
  if (isNull(stats.submission) || stats.version !== currentVersion)
    stats.submission = {}
  if (isNull(stats.problems) || stats.version !== currentVersion)
    stats.problems = {}
  saveStats(stats)
})

/**
 * Chrome의 Local StorageArea에서 개체 가져오기
 * @param {string} key
 */
async function getObjectFromLocalStorage(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, (value: { [key: string]: any }) => {
        resolve(value[key])
      })
    } catch (ex) {
      reject(ex)
    }
  })
}

/**
 * Chrome의 Local StorageArea에 개체 저장
 * @param {*} obj
 */
async function saveObjectInLocalStorage(obj: object): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(obj, () => {
        resolve()
      })
    } catch (ex) {
      reject(ex)
    }
  })
}

/**
 * Chrome Local StorageArea에서 개체 제거
 * @param {string | string[]} keys
 */
async function removeObjectFromLocalStorage(
  keys: string | string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(keys, () => {
        resolve()
      })
    } catch (ex) {
      reject(ex)
    }
  })
}

/**
 * Chrome의 Sync StorageArea에서 개체 가져오기
 * @param {string} key
 */
async function getObjectFromSyncStorage(key: string): Promise<any> {
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

/**
 * Chrome의 Sync StorageArea에 개체 저장
 * @param {*} obj
 */
async function saveObjectInSyncStorage(obj: object): Promise<void> {
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

/**
 * Chrome Sync StorageArea에서 개체 제거
 * @param {string | string[]} keys
 */
async function removeObjectFromSyncStorage(
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

async function getToken(): Promise<string> {
  return await getObjectFromLocalStorage('leethub_token')
}

async function getGithubUsername(): Promise<string> {
  return await getObjectFromLocalStorage('leethub_username')
}

async function getStats(): Promise<Stats> {
  return await getObjectFromLocalStorage('stats')
}

async function getHook(): Promise<string> {
  return await getObjectFromLocalStorage('leethub_hook')
}

async function getOrgOption(): Promise<string> {
  try {
    return await getObjectFromLocalStorage('leethub_OrgOption')
  } catch (ex) {
    console.log(
      'The way it works has changed with updates. Update your storage.'
    )
    await saveObjectInLocalStorage({ leethub_OrgOption: 'platform' })
    return 'platform'
  }
}

async function getModeType(): Promise<string | null> {
  return await getObjectFromLocalStorage('mode_type')
}

async function saveToken(token: string): Promise<void> {
  return await saveObjectInLocalStorage({ leethub_token: token })
}

async function saveStats(stats: Stats): Promise<void> {
  return await saveObjectInLocalStorage({ stats })
}

async function updateStatsSHAfromPath(
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

function updateObjectDatafromPath(
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

async function getStatsSHAfromPath(path: string): Promise<string | null> {
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

async function updateLocalStorageStats(): Promise<Stats> {
  const hook = await getHook()
  const token = await getToken()
  // Assuming GitHub is a class that has been defined elsewhere
  const git = new GitHub(hook, token)
  const stats = await getStats()
  const tree_items: any[] = []
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
    console.log('update stats', stats)
  } else {
    console.error('Failed to update stats: stats is null')
    throw new Error('Stats is null')
  }
  return stats
}

async function getDirNameByOrgOption(
  dirName: string,
  language: string
): Promise<string> {
  if ((await getOrgOption()) === 'language') dirName = `${language}/${dirName}`
  return dirName
}
