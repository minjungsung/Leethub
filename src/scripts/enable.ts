async function getObjectFromLocalStorage(key: string): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key])
    })
  })
}

export async function checkEnable(): Promise<boolean> {
  const enable: boolean = await getObjectFromLocalStorage('bjhEnable')
  if (!enable) writeEnableMsgOnLog()
  return enable
}

function writeEnableMsgOnLog(): void {
  const error: string = '확장이 활성화되지 않았습니다. 확장을 활성화하고 시도해주세요'
  console.error(error)
}

export {}
