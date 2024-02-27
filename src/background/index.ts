import browser, { runtime, storage, tabs } from 'webextension-polyfill'
import { Request } from '../types/Request'
import { handleContentMessage } from '../content'

async function handleBackgroundMessage(request: Request) {
  if (request && request.target !== 'background') return
  console.log('handleMessage', request)
  if (request && request.closeWebPage === true && request.isSuccess === true) {
    // Set username
    await browser.storage.local.set({ leethub_username: request.username })
    window.localStorage.setItem('leethub_username', request.username || '')

    // Set token
    await browser.storage.local.set({ leethub_token: request.token })
    if (request.KEY) {
      window.localStorage.setItem(request.KEY, request.token || '')
    }

    // Close pipe
    await browser.storage.local.set({ pipe_leethub: false })
    console.log('Closed pipe.')

    // Close current tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (tabs[0] && tabs[0].id !== undefined) {
      await browser.tabs.remove(tabs[0].id)
    }

    // Go to onboarding for UX
    const urlOnboarding = browser.runtime.getURL('welcome.html')
    browser.tabs.create({ url: urlOnboarding, active: true }) // creates new tab
  } else if (
    request &&
    request.closeWebPage === true &&
    request.isSuccess === true
  ) {
    // This condition seems to be the same as the first one. You might want to check the logic.
    window.alert(
      'Something went wrong while trying to authenticate your profile!'
    )
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (tabs[0] && tabs[0].id !== undefined) {
      await browser.tabs.remove(tabs[0].id)
    }
  }
}

export async function init() {
  await storage.local.clear()
  
  runtime.onMessage.addListener(handleBackgroundMessage)
}

runtime.onInstalled.addListener(() => {
  init().then(() => {
    console.log('[background] loaded ')
  })
})
