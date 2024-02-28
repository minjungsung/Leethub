const { override } = require('customize-cra')

const overrideEntry = (config) => {
  config.entry = {
    main: './src/popup',
    authorize: './src/scripts/authorize',
    background: './src/scripts/background',
    enable: './src/scripts/enable',
    github: './src/scripts/github',
    storage: './src/scripts/storage',
    oauth2: './src/scripts/oauth2',
    toast: './src/scripts/toast',
    util: './src/scripts/util'
  }

  return config
}

const overrideOutput = (config) => {
  config.output = {
    ...config.output,
    filename: '[name].js',
    chunkFilename: '[name].js'
  }

  return config
}

module.exports = {
  webpack: (config) => override(overrideEntry, overrideOutput)(config)
}
