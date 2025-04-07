const CDP = require('chrome-remote-interface')

async function reloadExtension() {
  try {
    // Connect to Chrome's debugging protocol
    const client = await CDP({
      target: (targets) => targets.find((target) => target.type === 'page')
    })

    const { Runtime, Page } = client

    // Enable necessary domains
    await Promise.all([
      Runtime.enable(),
      Page.enable()
    ])

    // Get all extensions
    const result = await Runtime.evaluate({
      expression: `
        new Promise((resolve) => {
          chrome.management.getAll((extensions) => {
            resolve(JSON.stringify(extensions.map(ext => ({ id: ext.id, name: ext.name }))))
          })
        })
      `,
      awaitPromise: true
    })

    const extensions = JSON.parse(result.result.value)
    const leethub = extensions.find(ext => ext.name === 'LeetHub')

    if (leethub) {
      await Runtime.evaluate({
        expression: `
          new Promise((resolve) => {
            chrome.runtime.reload('${leethub.id}', () => {
              resolve('Extension reloaded')
            })
          })
        `,
        awaitPromise: true
      })
      console.log('LeetHub extension reloaded successfully')
    } else {
      console.log('LeetHub extension not found')
    }

    await client.close()
  } catch (error) {
    console.error('Cannot connect to browser:', error)
    process.exit(1)
  }
}

reloadExtension()
