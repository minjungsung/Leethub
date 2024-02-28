// Define the request and sender types for better type checking
export {}
interface Request {
  closeWebPage?: boolean
  isSuccess?: boolean
  username?: string
  token?: string
  sender?: string
  task?: string
  problemId?: number
}

interface Sender {
  // Define any properties used from the sender object here
}

// Define the response type, if needed
type SendResponse = (response?: any) => void

/**
 * Fetches problem data from solved.ac.
 * @param problemId The ID of the problem to fetch.
 */
async function SolvedApiCall(problemId: number): Promise<any> {
  return fetch(`https://solved.ac/api/v3/problem/show?problemId=${problemId}`, {
    method: 'GET'
  }).then((query) => query.json())
}

/**
 * Handles messages sent to the background script.
 * @param request The request object sent by the sender.
 * @param sender The sender of the message.
 * @param sendResponse The callback function to send a response back to the sender.
 */
function handleMessage(
  request: Request,
  sender: Sender,
  sendResponse: SendResponse
): boolean {
  if (request && request.closeWebPage === true && request.isSuccess === true) {
    /* Set username */
    chrome.storage.local.set({ leethub_username: request.username })

    /* Set token */
    chrome.storage.local.set({ leethub_token: request.token })

    /* Close pipe */
    chrome.storage.local.set({ pipe_leethub: false }, () => {
      console.info('Closed pipe.')
    })

    /* Go to onboarding for UX */
    const urlOnboarding = `chrome-extension://${chrome.runtime.id}/index.html#/welcome`
    chrome.tabs.create({ url: urlOnboarding, selected: true }) // creates new tab
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
  return true // Indicates you wish to send a response asynchronously
}

chrome.runtime.onMessage.addListener(handleMessage)
