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
    util: './src/scripts/util',
    'leetcode/parsing': './src/scripts/leetcode/parsing',
    'leetcode/programmers': './src/scripts/leetcode/programmers',
    'leetcode/uploadfunctions': './src/scripts/leetcode/uploadfunctions',
    'leetcode/util': './src/scripts/leetcode/util',
    'leetcode/variables': './src/scripts/leetcode/variables'
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
  webpack: (config) =>
    override(overrideEntry, overrideOutput)(config)
}
