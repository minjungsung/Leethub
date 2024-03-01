// Assuming the existence of these functions and classes. You might need to adjust these based on your actual implementation.

import { LeetcodeData } from '../../types/LeetcodeData'
import { GitHub } from '../github'
import {
  getHook,
  getStats,
  getToken,
  saveStats,
  updateObjectDatafromPath
} from '../storage'
import { isNull } from '../util'

type CallbackFunction = (branches: any, directory: string) => void

export async function uploadOneSolveProblemOnGit(
  leetcodeData: LeetcodeData,
  cb: CallbackFunction
): Promise<void> {
  try {
    const token: string = await getToken()
    const hook: string = await getHook()
    if (isNull(token) || isNull(hook)) {
      console.error('token or hook is null', token, hook)
      return
    }
    await upload(token, hook, leetcodeData, cb)
  } catch (error) {
    console.error('Failed to upload solve problem on Git', error)
  }
}

async function upload(
  token: string,
  hook: string,
  leetcodeData: LeetcodeData,
  cb: CallbackFunction
): Promise<void> {
  try {
    const git: GitHub = new GitHub(hook, token)
    const stats: any = await getStats()

    const directory = `LeetCode/${leetcodeData.title.replace(/\s+/g, '-')}`
    const filename = 'Solution.ext'
    const sourceText = leetcodeData.codeSnippet
    const readmeText = `# ${leetcodeData.title}\n\n${leetcodeData.description}`
    const commitMessage = `Add solution for ${leetcodeData.title}`

    let default_branch: string = stats.branches[hook]
    if (isNull(default_branch)) {
      default_branch = await git.getDefaultBranchOnRepo()
      stats.branches[hook] = default_branch
    }
    const { refSHA, ref } = await git.getReference(default_branch)
    const source = await git.createBlob(sourceText, `${directory}/${filename}`)
    const readme = await git.createBlob(readmeText, `${directory}/README.md`)
    const treeSHA: string = await git.createTree(refSHA, [source, readme])
    const commitSHA: string = await git.createCommit(
      commitMessage,
      treeSHA,
      refSHA
    )
    await git.updateHead(ref, commitSHA)

    // Update stats values
    updateObjectDatafromPath(
      stats.submission,
      `${hook}/${source.path}`,
      source.sha
    )
    updateObjectDatafromPath(
      stats.submission,
      `${hook}/${readme.path}`,
      readme.sha
    )
    await saveStats(stats)

    // Execute callback function
    if (typeof cb === 'function') {
      cb(stats.branches, directory)
    }
  } catch (error) {
    console.error('Failed to execute upload function', error)
  }
}
