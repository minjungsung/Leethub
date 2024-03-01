async function getObjectFromLocalStorage(key: string): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key])
    })
  })
}

export async function checkEnable(): Promise<boolean> {
  const enable: boolean = await getObjectFromLocalStorage('bjhEnable')
  return enable
}

export {}
