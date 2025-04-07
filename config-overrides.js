const { override } = require('customize-cra')

const overrideEntry = (config) => {
  config.entry = {
    main: './src/popup',
    background: './src/scripts/background.ts',
    authorize: './src/scripts/authorize.ts',
    enable: './src/scripts/enable.ts',
    github: './src/scripts/github.ts',
    storage: './src/scripts/storage.ts',
    oauth2: './src/scripts/oauth2.ts',
    toast: './src/scripts/toast.ts',
    util: './src/scripts/util.ts',
    'leetcode/parsing': './src/scripts/leetcode/parsing.ts',
    'leetcode/programmers': './src/scripts/leetcode/programmers.ts',
    'leetcode/uploadfunctions': './src/scripts/leetcode/uploadfunctions.ts',
    'leetcode/util': './src/scripts/leetcode/util.ts',
    'leetcode/variables': './src/scripts/leetcode/variables.ts'
  }
  return config
}

const overrideOutput = (config) => {
  config.output = {
    ...config.output,
    filename: (pathData) => {
      return pathData.chunk.name === 'main' ? 'static/js/[name].[contenthash:8].js' : '[name].js';
    },
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js'
  }
  return config
}

module.exports = {
  webpack: override(overrideEntry, overrideOutput)
}
