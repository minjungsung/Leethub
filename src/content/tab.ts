import browser from 'webextension-polyfill'

let attempt: number = 0

export async function getTabId(): Promise<number> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  if (tabs.length === 0) {
    console.error('No active tab found.')
    return 0
  }
  const tabId = tabs[0].id
  if (tabId === undefined) {
    console.error('Invalid tab ID.')
    return 0
  }
  return tabId
}

export async function sendMessageToActiveTab(message: any) {
  const tabId = await getTabId()
  try {
    const response = await browser.tabs.sendMessage(tabId, message)
    console.log('Response from content script:', response)
  } catch (error) {
    console.error('Error sending message to content script:', error)
    if (attempt < 3) {
      // Retry up to 3 times
      attempt++
      setTimeout(() => sendMessageToActiveTab(message), 1000) // Wait 1 second before retrying
    }
  }
}
