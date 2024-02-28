const CDP = require('chrome-remote-interface')
const extensionId = 'your_extension_id_here'

CDP((client) => {
  const { Runtime } = client
  Runtime.evaluate({
    expression: `chrome.runtime.reload('${extensionId}')`
  }).then(() => {
    client.close()
  })
}).on('error', (error) => {
  console.error('Cannot connect to browser:', error)
})
