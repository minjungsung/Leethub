import { Request } from '../types/Request'
interface Sender {
  id?: string
  url?: string
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
  // Authentication belongs to extension-owned pages, never content scripts.
  if (request && request.closeWebPage) {
    sendResponse({ error: 'Content-script authentication is disabled' })
    return false
  }
  let senderOrigin: string
  try { senderOrigin = new URL(sender.url ?? '').origin } catch { return false }
  if (
    sender.id !== chrome.runtime.id ||
    !sender.url ||
    !['https://leetcode.com', 'https://practice.geeksforgeeks.org',
      'https://www.acmicpc.net', 'https://school.programmers.co.kr',
      'https://swexpertacademy.com', 'https://level.goorm.io'].includes(senderOrigin)
  ) {
    return false
  }
  if (
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
