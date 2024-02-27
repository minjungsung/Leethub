const CDP = require('chrome-remote-interface')
const extensionId = 'your_extension_id_here'

CDP((client) => {
  // Extract domains
  const { Runtime } = client
  // Reload the extension
  Runtime.evaluate({
    expression: `chrome.runtime.reload('${extensionId}')`
  }).then(() => {
    client.close()
  })
}).on('error', (err) => {
  console.error('Cannot connect to browser:', err)
})
