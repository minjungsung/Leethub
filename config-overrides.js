module.exports = {
  webpack: (config) => {
    config.entry = {
      main: './src/popup',
      background: './src/scripts/background',
      content: './src/scripts/leetcode/programmers'
    }
    config.output.filename = '[name].js'
    config.output.chunkFilename = '[name].chunk.js'
    // Each browser context must be independently executable.
    config.optimization.splitChunks = false
    config.optimization.runtimeChunk = false
    for (const plugin of config.plugins) {
      if (plugin.constructor.name === 'HtmlWebpackPlugin') {
        plugin.userOptions.chunks = ['main']
        plugin.options.chunks = ['main']
      }
    }
    return config
  }
}
