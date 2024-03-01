import { map } from "../../constants/Map"
import { BojData } from "../../types/BoJData"
import { getDateString } from "./util"

export async function parseData(): Promise<BojData> {
  // const linkElement = document.querySelector(
  //   'head > meta[name$="url"]'
  // ) as HTMLMetaElement
  // const link: string = linkElement
  //   ? linkElement.content.replace(/\?.*/g, '').trim()
  //   : ''
  // const problemIdElement = document.querySelector(
  //   'div.main > div.lesson-content'
  // )
  // const problemId: string = problemIdElement
  //   ? problemIdElement.getAttribute('data-lesson-id')!
  //   : ''
  // const levelElement = document.querySelector(
  //   'body > div.main > div.lesson-content'
  // )
  // const level: string = levelElement
  //   ? levelElement.getAttribute('data-challenge-level')!
  //   : ''
  // const breadcrumbElements = document.querySelectorAll(
  //   'ol.breadcrumb > li:not(.active)'
  // )
  // const division: string = Array.from(breadcrumbElements)
  //   .map((element: Element) =>
  //     element.textContent
  //       ? convertSingleCharToDoubleChar(element.textContent)
  //       : ''
  //   )
  //   .join('/')
  // const titleElement = document.querySelector(
  //   '.algorithm-title .challenge-title'
  // ) as HTMLElement
  // const title: string = titleElement
  //   ? titleElement.textContent!.replace(/\\n/g, '').trim()
  //   : ''
  // const problemDescriptionElement = document.querySelector(
  //   'div.guide-section-description > div.markdown'
  // ) as HTMLElement
  // const problem_description: string = problemDescriptionElement
  //   ? problemDescriptionElement.innerHTML
  //   : ''
  // const languageExtensionElement = document.querySelector(
  //   'div.editor > ul > li.nav-item > a'
  // ) as HTMLElement
  // const language_extension: string = languageExtensionElement
  //   ? languageExtensionElement.innerText.split('.')[1]
  //   : ''
  // const codeElement = document.querySelector(
  //   'textarea#code'
  // ) as HTMLTextAreaElement
  // const code: string = codeElement ? codeElement.value : ''
  // const resultMessageElements = document.querySelectorAll(
  //   '#output .console-message'
  // )
  // const result_message: string =
  //   Array.from(resultMessageElements)
  //     .map((node: Element) => (node as HTMLElement).textContent!)
  //     .filter((text) => text.includes(':'))
  //     .reduce((cur, next) => (cur ? `${cur}<br/>${next}` : next), '') || 'Empty'
  // const resultPassedElements = Array.from(
  //   document.querySelectorAll('td.result.passed')
  // )
  // let runtime = '0.00ms',
  //   memory = '0.0MB'
  // resultPassedElements
  //   .map((x) => x.textContent!.trim())
  //   .map((x) => x.replace(/[^., 0-9a-zA-Z]/g, '').trim())
  //   .map((x) => x.split(', '))
  //   .forEach(([currentRuntime, currentMemory]) => {
  //     if (
  //       Number(currentRuntime.replace(/[^0-9.]/g, '')) >
  //       Number(runtime.replace(/[^0-9.]/g, ''))
  //     ) {
  //       runtime = currentRuntime
  //       memory = currentMemory
  //     }
  //   })

  // const language: string = document
  //   .querySelector('div#tour7 > button')!
  //   .textContent!.trim()

  return makeData({
    // link,
    // problemId,
    // level,
    // title,
    // problem_description,
    // division,
    // language_extension,
    // code,
    // result_message,
    // runtime,
    // memory,
    // language
  })
}

async function makeData(origin: any): Promise<BojData> {
  // const {
  //   problem_description,
  //   problemId,
  //   level,
  //   result_message,
  //   division,
  //   language_extension,
  //   title,
  //   runtime,
  //   memory,
  //   code,
  //   language
  // } = origin




  // const directory: string = await getDirNameByOrgOption(
  //   `프로그래머스/${level}/${problemId}. ${convertSingleCharToDoubleChar(
  //     title
  //   )}`,
  //   language
  // )
  // const levelWithLv: string = `${level}`.includes('lv')
  //   ? level
  //   : `lv${level}`.replace('lv', 'level ')




  const directory: string = 'leetcode/Easy/123_Sample_Problem'
  const levelWithLv: string = 'Easy'
  const title: string = 'Sample Problem'
  const runtime: string = '0.01ms'
  const memory: string = '10.2MB'
  const language_extension: string = 'py'
  const problemId: string = '123'
  const division: string = 'Sample Division/Category'
  const result_message: string = 'Success: Executed without errors'
  const problem_description: string =
    '<p>This is a sample problem description.</p>'
  const code: string = "print('Hello, world!')"







  const message: string = `[${levelWithLv}] Title: ${title}, Time: ${runtime}, Memory: ${memory} -BaekjoonHub`
  const fileName: string = `${convertSingleCharToDoubleChar(
    title
  )}.${language_extension}`
  const dateInfo: string = getDateString(new Date(Date.now()))
  const readme: string =
    `# [${levelWithLv}] ${title} - ${problemId} \n\n` +
    // Assuming 'link' variable needs to be defined or passed in. If 'link' is a variable that should be included, ensure it is defined or passed to this function.
    // If 'link' is not available, consider removing or commenting out the following line.
    // `[문제 링크](${link}) \n\n` +
    `### 성능 요약\n\n` +
    `메모리: ${memory}, ` +
    `시간: ${runtime}\n\n` +
    `### 구분\n\n` +
    `${division.replace('/', ' > ')}\n\n` +
    `### 채점결과\n\n` +
    `${result_message}\n\n` +
    `### 제출 일자\n\n` +
    `${dateInfo}\n\n` +
    `### 문제 설명\n\n` +
    `${problem_description}\n\n` +
    `> 출처: 프로그래머스 코딩 테스트 연습, https://school.programmers.co.kr/learn/challenges`
  return { directory, message, fileName, readme, code }
}

export function convertSingleCharToDoubleChar(text: string): string { 
  return text.replace(/[!%&()*+,\-./:;<=>?@\[\\\]^_`{|}~ ]/g, function (m) {
    return map[m as keyof typeof map]
  })
}
