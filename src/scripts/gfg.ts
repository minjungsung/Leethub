import { languages } from "../constants/Languages"

let START_MONITOR: boolean = true

const toKebabCase = (string: string): string => {
  return string
    .replace(/[^a-zA-Z0-9\. ]/g, '') // remove special chars
    .replace(/([a-z])([A-Z])/g, '$1-$2') // get all lowercase letters that are near to uppercase ones
    .replace(/[\s_]+/g, '-') // replace all spaces and low dash
    .toLowerCase() // convert to lower case
}

function findGfgLanguage(): string | null {
  const ele = document.getElementsByClassName('divider text')[0] as HTMLElement
  const lang = ele.innerText.split('(')[0].trim()
  if (lang.length > 0 && languages[lang]) {
    return languages[lang]
  }
  return null
}

function findTitle(): string {
  const ele = document.querySelector(
    '[class^="problems_header_content__title"] > h3'
  ) as HTMLElement
  return ele ? ele.innerText : ''
}

function findDifficulty(): string {
  const ele = document.querySelectorAll(
    '[class^="problems_header_description"]'
  )[0].children[0] as HTMLElement
  if (ele) {
    if (ele.innerText.trim() == 'Basic' || ele.innerText.trim() === 'School') {
      return 'Easy'
    }
    return ele.innerText
  }
  return ''
}

function getProblemStatement(): string {
  const ele = document.querySelector(
    '[class^="problems_problem_content"]'
  ) as HTMLElement
  return ele ? `${ele.outerHTML}` : ''
}

function getCode(): string {
  // This function involves DOM manipulation and script injection, which remains largely the same in TypeScript.
  // However, TypeScript does not inherently improve or modify DOM manipulation logic.
  // Ensure your script injection and manipulation is secure and necessary.
  // The logic here remains unchanged from JavaScript to TypeScript.
  // ...
  return '' // Placeholder return to match function signature
}

const gfgLoader = setInterval(() => {
  let code: string | null = null
  let problemStatement: string | null = null
  let title: string | null = null
  let language: string | null = null
  let difficulty: string | null = null

  if (window.location.href.includes('practice.geeksforgeeks.org/problems')) {
    const submitBtn = document
      .evaluate(
        ".//button[text()='Submit']",
        document.body,
        null,
        XPathResult.ANY_TYPE,
        null
      )
      .iterateNext() as HTMLButtonElement

    submitBtn.addEventListener('click', function () {
      START_MONITOR = true
      const submission = setInterval(() => {
        const output = document.querySelectorAll(
          '[class^="problems_content"]'
        )[0] as HTMLElement
        if (
          output &&
          output.innerText.includes('Problem Solved Successfully') &&
          START_MONITOR
        ) {
          // Logic to handle successful submission
          // TypeScript-specific improvements or type checks can be added here if necessary
          // ...
        } else if (output && output.innerText.includes('Compilation Error')) {
          // Handle compilation error
          clearInterval(submission)
        }
        // Additional conditions and logic...
      }, 1000)
    })
  }
}, 1000)
