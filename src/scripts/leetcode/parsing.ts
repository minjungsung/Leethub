import { map } from '../../constants/Map'
import { LeetcodeData } from '../../types/LeetcodeData'
import { getDateString } from './util'

export async function parseData(): Promise<LeetcodeData> {
  // Get title
  const title =
    document.querySelector('title')?.textContent?.replace(' - LeetCode', '') ||
    ''

  // Get description and constraints from the problem content
  let description = ''
  let constraints: string[] = []

  // Try to get description from the problem content
  const problemContent = document.querySelector('[data-track-load="description_content"]')
  if (problemContent) {
    // Get the main description
    const descriptionElement = problemContent.querySelector('div[class*="description"]')
    if (descriptionElement) {
      description = descriptionElement.textContent?.trim() || ''
    }

    // Get constraints
    const constraintsElement = problemContent.querySelector('div[class*="constraints"]')
    if (constraintsElement) {
      constraints = Array.from(constraintsElement.querySelectorAll('li'))
        .map(li => li.textContent?.trim() || '')
        .filter(text => text.length > 0)
    }
  }

  // If no description found, try meta description as fallback
  if (!description) {
    const metaDescription =
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content') || ''
    const descriptionAndConstraints = metaDescription.split('Constraints:')
    description = descriptionAndConstraints[0].trim()
    if (descriptionAndConstraints.length > 1) {
      constraints = descriptionAndConstraints[1]
        .split(',')
        .map((constraint: string) => constraint.trim())
    }
  }

  // Get problem URL
  const link =
    document
      .querySelector('meta[property="og:url"]')
      ?.getAttribute('content') || ''

  // Get code from the editor
  let codeSnippet = ''

  // Try to get code from the editor's textarea
  const textarea = document.querySelector('.monaco-editor textarea')
  if (textarea) {
    codeSnippet = (textarea as HTMLTextAreaElement).value
  }

  // If no code from textarea, try to get it from the editor's content
  if (!codeSnippet) {
    const editor = document.querySelector('.monaco-editor')
    if (editor) {
      const lines = editor.querySelectorAll('.view-line')
      if (lines.length > 0) {
        codeSnippet = Array.from(lines)
          .map(line => line.textContent)
          .join('\n')
      }
    }
  }

  // If still no code, try to get it from the submission result
  if (!codeSnippet) {
    const submissionResult = document.querySelector('[data-e2e-locator="submission-result"]')
    if (submissionResult) {
      const codeElement = submissionResult.querySelector('pre')
      if (codeElement) {
        codeSnippet = codeElement.textContent || ''
      }
    }
  }

  // If still no code, try to get it from the code editor's content
  if (!codeSnippet) {
    const codeEditor = document.querySelector('.code-editor')
    if (codeEditor) {
      const lines = codeEditor.querySelectorAll('.view-line')
      if (lines.length > 0) {
        codeSnippet = Array.from(lines)
          .map(line => line.textContent)
          .join('\n')
      }
    }
  }

  // Get language from the language selector
  const languageElement = document.querySelector('[data-mode-id]')
  const language = languageElement
    ? languageElement.getAttribute('data-mode-id') || ''
    : ''

  return {
    title,
    description,
    constraints,
    codeSnippet,
    language,
    link
  }
}

export function convertSingleCharToDoubleChar(text: string): string {
  return text.replace(/[!%&()*+,\-./:;<=>?@\[\\\]^_`{|}~ ]/g, function (m) {
    return map[m as keyof typeof map]
  })
}
