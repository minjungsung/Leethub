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

export async function removeObjectFromLocalStorage(
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
