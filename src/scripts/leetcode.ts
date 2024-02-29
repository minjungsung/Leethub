interface Stats {
  solved: number
  easy: number
  medium: number
  hard: number
  sha: { [key: string]: string | null }
}

interface ChromeStorageData {
  leethub_token?: string
  mode_type?: string
  leethub_hook?: string
  stats?: Stats
  isSync?: boolean
}

interface GitHubContentResponse {
  content: { sha: string }
}

const languages: { [key: string]: string } = {
  Python: '.py',
  Python3: '.py',
  'C++': '.cpp',
  C: '.c',
  Java: '.java',
  'C#': '.cs',
  JavaScript: '.js',
  Javascript: '.js',
  Ruby: '.rb',
  Swift: '.swift',
  Go: '.go',
  Kotlin: '.kt',
  Scala: '.scala',
  Rust: '.rs',
  PHP: '.php',
  TypeScript: '.ts',
  MySQL: '.sql',
  'MS SQL Server': '.sql',
  Oracle: '.sql'
}

const readmeMsg: string = 'Create README - LeetHub'
const discussionMsg: string = 'Prepend discussion post - LeetHub'
const createNotesMsg: string = 'Attach NOTES - LeetHub'

const NORMAL_PROBLEM: number = 0
const EXPLORE_SECTION_PROBLEM: number = 1

let difficulty: string = ''

function findLanguage(): string | null {
  const tag: Element[] = [
    ...Array.from(
      document.getElementsByClassName('ant-select-selection-selected-value')
    ),
    ...Array.from(document.getElementsByClassName('Select-value-label'))
  ]
  if (tag && tag.length > 0) {
    for (let i = 0; i < tag.length; i += 1) {
      const elem: Element = tag[i]
      const textContent: string | null = elem.textContent
      if (textContent !== null && languages[textContent] !== undefined) {
        return languages[textContent]
      }
    }
  }
  return null
}

const upload = (
  token: string,
  hook: string,
  code: string,
  directory: string,
  filename: string,
  sha: string | null,
  msg: string,
  cb?: () => void
): void => {
  const URL: string = `https://api.github.com/repos/${hook}/contents/${directory}/${filename}`

  let data: string = JSON.stringify({
    message: msg,
    content: code,
    sha
  })

  const xhr: XMLHttpRequest = new XMLHttpRequest()
  xhr.addEventListener('readystatechange', function (): void {
    if (xhr.readyState === 4) {
      if (xhr.status === 200 || xhr.status === 201) {
        const updatedSha: string = (
          JSON.parse(xhr.responseText) as GitHubContentResponse
        ).content.sha

        chrome.storage.local.get('stats', (data2: ChromeStorageData): void => {
          let stats: Stats = data2.stats || {
            solved: 0,
            easy: 0,
            medium: 0,
            hard: 0,
            sha: {}
          }
          const filePath: string = directory + filename
          if (filename === 'README.md' && sha === null) {
            stats.solved += 1
            stats.easy += difficulty === 'Easy' ? 1 : 0
            stats.medium += difficulty === 'Medium' ? 1 : 0
            stats.hard += difficulty === 'Hard' ? 1 : 0
          }
          stats.sha[filePath] = updatedSha
          chrome.storage.local.set({ stats }, () => {
            if (cb) {
              cb()
            }
          })
        })
      }
    }
  })
  xhr.open('PUT', URL, true)
  xhr.setRequestHeader('Authorization', `token ${token}`)
  xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json')
  xhr.send(data)
}

/* Main function for updating code on GitHub Repo */
const update = (
  token: string,
  hook: string,
  addition: string,
  directory: string,
  msg: string,
  prepend: boolean,
  cb?: () => void
): void => {
  const URL = `https://api.github.com/repos/${hook}/contents/${directory}/README.md`

  const xhr = new XMLHttpRequest()
  xhr.addEventListener('readystatechange', function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200 || xhr.status === 201) {
        const response = JSON.parse(xhr.responseText)
        const existingContent = decodeURIComponent(
          escape(atob(response.content))
        )
        let newContent = ''

        if (prepend) {
          newContent = btoa(
            unescape(encodeURIComponent(addition + existingContent))
          )
        }

        upload(
          token,
          hook,
          newContent,
          directory,
          'README.md',
          response.sha,
          msg,
          cb
        )
      }
    }
  })
  xhr.open('GET', URL, true)
  xhr.setRequestHeader('Authorization', `token ${token}`)
  xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json')
  xhr.send()
}

function uploadGit(
  code: string,
  problemName: string,
  fileName: string,
  msg: string,
  action: 'upload' | 'update',
  prepend: boolean = true,
  cb?: () => void,
  _diff?: string
): void {
  if (_diff) {
    difficulty = _diff.trim()
  }

  chrome.storage.local.get('leethub_token', (t: { leethub_token?: string }) => {
    const token = t.leethub_token
    if (token) {
      chrome.storage.local.get('mode_type', (m: { mode_type?: string }) => {
        const mode = m.mode_type
        if (mode === 'commit') {
          chrome.storage.local.get(
            'leethub_hook',
            (h: { leethub_hook?: string }) => {
              const hook = h.leethub_hook
              if (hook) {
                const filePath = problemName + fileName
                chrome.storage.local.get('stats', (s: { stats?: Stats }) => {
                  const stats = s.stats
                  let sha: string | null = null

                  if (stats && stats.sha[filePath]) {
                    sha = stats.sha[filePath]
                  }

                  if (action === 'upload') {
                    upload(
                      token,
                      hook,
                      code,
                      problemName,
                      fileName,
                      sha,
                      msg,
                      cb
                    )
                  } else if (action === 'update') {
                    update(token, hook, code, problemName, msg, prepend, cb)
                  }
                })
              }
            }
          )
        }
      })
    }
  })
}

function findCode(
  uploadGitCallback: (
    code: string,
    problemName: string,
    fileName: string,
    msg: string,
    action: 'upload' | 'update',
    cb?: () => void
  ) => void,
  problemName: string,
  fileName: string,
  msg: string,
  action: 'upload' | 'update',
  cb?: () => void
): void {
  let submissionURL: string | undefined
  const e = document.getElementsByClassName('status-column__3SUg')
  if (checkElem(e)) {
    const submissionRef = e[1].innerHTML.split(' ')[1]
    submissionURL =
      'https://leetcode.com' + submissionRef.split('=')[1].slice(1, -1)
  } else {
    const submissionRef = document.getElementById(
      'result-state'
    ) as HTMLAnchorElement
    if (submissionRef) {
      submissionURL = submissionRef.href
    }
  }

  if (submissionURL) {
    const xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        const doc = new DOMParser().parseFromString(
          this.responseText,
          'text/html'
        )
        const scripts = doc.getElementsByTagName('script')
        for (let i = 0; i < scripts.length; i++) {
          const text = scripts[i].innerText
          if (text.includes('pageData')) {
            const firstIndex = text.indexOf('submissionCode')
            const lastIndex = text.indexOf('editCodeUrl')
            const slicedText = text.slice(firstIndex, lastIndex)
            const firstInverted = slicedText.indexOf("'")
            const lastInverted = slicedText.lastIndexOf("'")
            const codeUnicoded = slicedText.slice(
              firstInverted + 1,
              lastInverted
            )
            const code = codeUnicoded.replace(
              /\\u[\dA-F]{4}/gi,
              function (match) {
                return String.fromCharCode(
                  parseInt(match.replace(/\\u/g, ''), 16)
                )
              }
            )

            if (!msg) {
              const runtimeIndex = text.indexOf('runtime')
              const memoryIndex = text.indexOf('memory')
              const resultRuntime = text.slice(
                runtimeIndex + 10,
                text.indexOf(',', runtimeIndex) - 1
              )
              const resultMemory = text.slice(
                memoryIndex + 9,
                text.indexOf(',', memoryIndex) - 1
              )
              msg = `Time: ${resultRuntime}, Memory: ${resultMemory} - LeetHub`
            }

            if (code) {
              setTimeout(() => {
                uploadGitCallback(
                  btoa(unescape(encodeURIComponent(code))),
                  problemName,
                  fileName,
                  msg,
                  action,
                  cb
                )
              }, 2000)
            }
          }
        }
      }
    }
    xhttp.open('GET', submissionURL, true)
    xhttp.send()
  }
}

/* Main parser function for the code */
function parseCode(): string | null {
  const e = document.getElementsByClassName('CodeMirror-code')
  if (e && e.length > 0) {
    const elem = e[0] as HTMLElement
    let parsedCode = ''
    const textArr = elem.innerText.split('\n')
    for (let i = 1; i < textArr.length; i += 2) {
      parsedCode += `${textArr[i]}\n`
    }
    return parsedCode
  }
  return null
}

/* Util function to check if an element exists */
function checkElem(elem: HTMLCollection | null): boolean {
  return elem !== null && elem.length > 0
}

function convertToSlug(string: string): string {
  const a =
    'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b =
    'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(p, (c) => b.charAt(a.indexOf(c)))
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/* Function to get the problem name slug */
function getProblemNameSlug(): string {
  const problemTitleElement = document.querySelector(
    'div[data-cy="question-title"]'
  )
  if (problemTitleElement) {
    return convertToSlug(problemTitleElement.textContent || '')
  }
  return 'unknown-problem'
}

/* Function to parse question details */
function parseQuestion(): string | number | boolean {
  const questionTitleElement = document.querySelector(
    'div[data-cy="question-title"]'
  )
  const questionDescriptionElement = document.getElementsByClassName(
    'content__u3I1 question-content__JfgR'
  )

  if (questionTitleElement && questionDescriptionElement.length > 0) {
    const questionTitle = questionTitleElement.textContent || 'Unknown Problem'
    const questionBody = questionDescriptionElement[0].innerHTML
    const markdown = `<h2>${questionTitle}</h2><hr>${questionBody}`

    return markdown
  }

  return false
}

function parseStats(): string | null {
  const probStats = document.getElementsByClassName('data__HC-i')
  if (!checkElem(probStats)) {
    return null
  }
  const time = probStats[0].textContent
  const timePercentile = probStats[1].textContent
  const space = probStats[2].textContent
  const spacePercentile = probStats[3].textContent
 
  return `Time: ${time} (${timePercentile}), Space: ${space} (${spacePercentile}) - LeetHub`
}

document.addEventListener('click', (event) => {
  return
  const element = event.target as HTMLElement
  const oldPath = window.location.pathname

  if (
    element.classList.contains('icon__3Su4') ||
    element.parentElement?.classList.contains('icon__3Su4') ||
    element.parentElement?.classList.contains('btn-content-container__214G') ||
    element.parentElement?.classList.contains('header-right__2UzF')
  ) {
    setTimeout(function () {
      if (
        oldPath !== window.location.pathname &&
        oldPath === window.location.pathname.substring(0, oldPath.length) &&
        !Number.isNaN(Number(window.location.pathname.charAt(oldPath.length)))
      ) {
        const date = new Date()
        const currentDate = `${date.getDate()}/${
          date.getMonth() + 1
        }/${date.getFullYear()} at ${date.getHours()}:${date.getMinutes()}`
        const addition = `[Discussion Post (created on ${currentDate})](${window.location})  \n`
        const problemName = window.location.pathname.split('/')[2]

        uploadGit(addition, problemName, 'README.md', discussionMsg, 'update')
      }
    }, 1000)
  }
})

function getNotesIfAny(): string {
  if (document.URL.startsWith('https://leetcode.com/explore/')) return ''

  let notes = ''
  const notesWrap = document.getElementsByClassName('notewrap__eHkN')
  if (checkElem(notesWrap)) {
    const notesDiv = notesWrap[0].getElementsByClassName('CodeMirror-code')[0]
    if (notesDiv) {
      for (let i = 0; i < notesDiv.childNodes.length; i++) {
        const childNode = notesDiv.childNodes[i] as HTMLElement
        if (childNode.childNodes.length == 0) continue
        const text = childNode.childNodes[0].textContent
        if (text) {
          notes = `${notes}\n${text.trim()}`.trim()
        }
      }
    }
  }
  return notes.trim()
}

interface UploadState {
  uploading: boolean
  countdown?: NodeJS.Timeout
}

const uploadState: UploadState = {
  uploading: false
}

enum ProblemType {
  NORMAL_PROBLEM,
  EXPLORE_SECTION_PROBLEM
}

const loader = setInterval(() => {
  let code: string | null = null
  let probStatement: string | number | boolean = false
  let probStats: string | null = null
  let probType: ProblemType | undefined
  const successTag = document.getElementsByClassName(
    'success__3Ai7'
  ) as HTMLCollectionOf<HTMLElement>
  const resultState = document.getElementById('result-state')
  let success = false

  if (checkElem(successTag) && successTag[0].innerText.trim() === 'Success') {
    success = true
    probType = ProblemType.NORMAL_PROBLEM
  } else if (
    resultState &&
    resultState.className === 'text-success' &&
    resultState.innerText === 'Accepted'
  ) {
    success = true
    probType = ProblemType.EXPLORE_SECTION_PROBLEM
  }

  if (success) {
    probStatement = parseQuestion()
    probStats = parseStats()
  }

  if (probStatement !== null && probType !== undefined) {
    switch (probType) {
      case ProblemType.NORMAL_PROBLEM:
        successTag[0].classList.add('marked_as_success')
        break
      case ProblemType.EXPLORE_SECTION_PROBLEM:
        resultState!.classList.add('marked_as_success')
        break
      default:
        console.error(`Unknown problem type ${probType}`)
        return
    }

    const problemName = getProblemNameSlug()
    const language = findLanguage()
    if (language !== null) {
      startUpload()
      chrome.storage.local.get('stats', (s: { stats?: Stats }) => {
        const { stats } = s
        const filePath = `${problemName}${language}`
        let sha: string | null = null
        if (stats && stats.sha && stats.sha[filePath] !== undefined) {
          sha = stats.sha[filePath]
        }

        if (sha === null) {
          uploadGit(
            btoa(unescape(encodeURIComponent(probStatement))),
            problemName,
            'README.md',
            'readmeMsg',
            'upload'
          )
        }
      })

      const notes = getNotesIfAny()
      if (notes.length > 0) {
        setTimeout(() => {
          uploadGit(
            btoa(unescape(encodeURIComponent(notes))),
            problemName,
            'NOTES.md',
            'createNotesMsg',
            'upload'
          )
        }, 500)
      }

     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
    }
  }
}, 1000)

function startUploadCountDown(): void {
  uploadState.uploading = true
  uploadState.countdown = setTimeout(() => {
    if (uploadState.uploading) {
      uploadState.uploading = false
      markUploadFailed()
    }
  }, 10000)
}

function insertToAnchorElement(elem: HTMLElement): void {
  let target: HTMLElement | null = null
  if (document.URL.startsWith('https://leetcode.com/explore/')) {
    const action = document.getElementsByClassName('action')[0] as HTMLElement
    if (checkElem(action.getElementsByClassName('row'))) {
      const row = action.getElementsByClassName('row')[0] as HTMLElement
      if (checkElem(row.getElementsByClassName('col-sm-6'))) {
        target = row.getElementsByClassName('col-sm-6')[1] as HTMLElement
        elem.className = 'pull-left'
        if (target.childNodes.length > 0)
          (target.childNodes[0] as HTMLElement).insertBefore(
            elem,
            target.childNodes[0].firstChild
          )
      }
    }
  } else {
    if (checkElem(document.getElementsByClassName('action__38Xc'))) {
      target = document.getElementsByClassName('action__38Xc')[0] as HTMLElement
      elem.className = 'runcode-wrapper__8rXm'
      elem.className = 'runcode-wrapper__8rXm'
      if (target.childNodes.length > 0)
        (target.childNodes[0] as HTMLElement).prepend(elem)
    }
  }
}

function startUpload(): void {
  let elem = document.getElementById('leethub_progress_anchor_element')
  if (!elem) {
    elem = document.createElement('span')
    elem.id = 'leethub_progress_anchor_element'
    elem.style.marginRight = '20px'
    elem.style.paddingTop = '2px'
  }
  elem.innerHTML = `<div id="leethub_progress_elem" class="leethub_progress"></div>`
  insertToAnchorElement(elem)
  startUploadCountDown()
}

function markUploaded(): void {
  const elem = document.getElementById('leethub_progress_elem')
  if (elem) {
    elem.className = ''
    elem.style.cssText =
      'display: inline-block; transform: rotate(45deg); height:24px; width:12px; border-bottom:7px solid #78b13f; border-right:7px solid #78b13f;'
  }
}

function markUploadFailed(): void {
  const elem = document.getElementById('leethub_progress_elem')
  if (elem) {
    elem.className = ''
    elem.style.cssText =
      'display: inline-block; transform: rotate(45deg); height:24px; width:12px; border-bottom:7px solid red; border-right:7px solid red;'
  }
}

chrome.storage.local.get('isSync', (data: { isSync?: boolean }) => {
  const keys = [
    'leethub_token',
    'leethub_username',
    'pipe_leethub',
    'stats',
    'leethub_hook',
    'mode_type'
  ]
  if (!data || !data.isSync) {
    keys.forEach((key) => {
      chrome.storage.sync.get(key, (data: { [key: string]: any }) => {
        chrome.storage.local.set({ [key]: data[key] })
      })
    })
    chrome.storage.local.set({ isSync: true }, () => {
      console.info('LeetHub Synced to local values')
    })
  } else {
    console.info('LeetHub Local storage already synced!')
  }
})

function injectStyle(): void {
  const style = document.createElement('style')
  style.textContent =
    '.leethub_progress {pointer-events: none; width: 2.0em; height: 2.0em; border: 0.4em solid transparent; border-color: #eee; border-top-color: #3E67EC; border-radius: 50%; animation: loadingspin 1s linear infinite;} @keyframes loadingspin { 100% { transform: rotate(360deg); }}'
  document.head.append(style)
}

injectStyle()
export {}
