// Assuming the existence of these functions and classes. You might need to adjust these based on your actual implementation.

import { GitHub } from "../github"
import { getHook, getStats, getToken, saveStats, updateObjectDatafromPath } from "../storage"
import { isNull } from "../util"

export interface BojData {
  code: string;
  readme: string;
  directory: string;
  fileName: string;
  message: string;
}

// Callback type definition
type CallbackFunction = (branches: any, directory: string) => void;

export async function uploadOneSolveProblemOnGit(bojData: BojData, cb: CallbackFunction): Promise<void> {
  const token: string = await getToken();
  const hook: string = await getHook();
  if (isNull(token) || isNull(hook)) {
    console.error('token or hook is null', token, hook);
    return;
  }
  return upload(token, hook, bojData.code, bojData.readme, bojData.directory, bojData.fileName, bojData.message, cb);
}

async function upload(
  token: string,
  hook: string,
  sourceText: string,
  readmeText: string,
  directory: string,
  filename: string,
  commitMessage: string,
  cb: CallbackFunction
): Promise<void> {
  const git: GitHub = new GitHub(hook, token);
  const stats: any = await getStats(); // Consider defining a more specific type for the stats object
  let default_branch: string = stats.branches[hook];
  if (isNull(default_branch)) {
    default_branch = await git.getDefaultBranchOnRepo();
    stats.branches[hook] = default_branch;
  }
  const { refSHA, ref } = await git.getReference(default_branch);
  const source = await git.createBlob(sourceText, `${directory}/${filename}`); // 소스코드 파일
  const readme = await git.createBlob(readmeText, `${directory}/README.md`); // readme 파일
  const treeSHA: string = await git.createTree(refSHA, [source, readme]);
  const commitSHA: string = await git.createCommit(commitMessage, treeSHA, refSHA);
  await git.updateHead(ref, commitSHA);

  // Update stats values
  updateObjectDatafromPath(stats.submission, `${hook}/${source.path}`, source.sha);
  updateObjectDatafromPath(stats.submission, `${hook}/${readme.path}`, readme.sha);
  await saveStats(stats);

  // Execute callback function
  if (typeof cb === 'function') {
    cb(stats.branches, directory);
  }
}