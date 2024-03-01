import { WELCOME_URL } from '../constants/Url'
import { Request } from '../types/Request'
interface Sender {
  // Define any properties used from the sender object here
}

type SendResponse = (response?: any) => void

async function SolvedApiCall(problemId: number): Promise<any> {
  return fetch(`https://solved.ac/api/v3/problem/show?problemId=${problemId}`, {
    method: 'GET'
  }).then((query) => query.json())
}

function handleMessage(
  request: Request,
  sender: Sender,
  sendResponse: SendResponse
): boolean {
  if (request && request.closeWebPage === true && request.isSuccess === true) {
    chrome.storage.local.set({ leethub_username: request.username })
    chrome.storage.local.set({ leethub_token: request.token })
    chrome.storage.local.set({ pipe_leethub: false }, () => {
      console.info('Closed pipe.')
    })

    chrome.tabs.create({ url: WELCOME_URL, selected: true }) // creates new tab
  } else if (
    request &&
    request.closeWebPage === true &&
    request.isSuccess === false
  ) {
    alert('Something went wrong while trying to authenticate your profile!')
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) chrome.tabs.remove(tabs[0].id)
    })
  } else if (
    request &&
    request.sender === 'leetcode' &&
    request.task === 'SolvedApiCall'
  ) {
    SolvedApiCall(request.problemId ?? 0).then((res) => sendResponse(res))
  }
  return true
}

chrome.runtime.onMessage.addListener(handleMessage)
export {}
