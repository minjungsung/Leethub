import browser from 'webextension-polyfill'
import { Stats } from '../types/Stats'

export const emptyStats = (): Stats => ({ version: '1.0.5', problems: {} })

// Only the service worker calls this. Importing helpers never mutates storage.
export async function initializeStorage(): Promise<void> {
  await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })
  const local = await browser.storage.local.get(null)
  if (!local.isSync) {
    const legacy = await browser.storage.sync.get([
      'leethub_token', 'leethub_username', 'leethub_hook', 'mode_type', 'stats'
    ])
    const missing: Record<string, unknown> = {}
    for (const key of Object.keys(legacy)) {
      if (local[key] == null && legacy[key] != null) missing[key] = legacy[key]
    }
    await browser.storage.local.set(missing)
    await browser.storage.local.set({ isSync: true })
  }
  // Also clean profiles whose old migration had already completed.
  await browser.storage.sync.remove(['leethub_token'])
}

export async function getStats(): Promise<Stats> {
  const { stats } = await browser.storage.local.get('stats')
  return { version: '1.0.5', problems: (stats as Stats | undefined)?.problems ?? {} }
}
export async function getHook(): Promise<string> {
  const { leethub_hook } = await browser.storage.local.get('leethub_hook')
  return typeof leethub_hook === 'string' ? leethub_hook : ''
}
export async function getIsEnabled(): Promise<boolean> {
  return (await browser.storage.local.get('bjhEnable')).bjhEnable === true
}
export async function saveIsEnabled(enabled: boolean): Promise<void> {
  await browser.storage.local.set({ bjhEnable: enabled })
}
