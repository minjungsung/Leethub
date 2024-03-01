import { map } from '../../constants/Map'
import { LeetcodeData } from '../../types/LeetcodeData'
import { getDateString } from './util'

export async function parseData(): Promise<LeetcodeData> {
  const title =
    document.querySelector('title')?.textContent?.replace(' - LeetCode', '') ||
    ''

  const metaDescription =
    document
      .querySelector('meta[name="description"]')
      ?.getAttribute('content') || ''
  const descriptionAndConstraints = metaDescription.split('Constraints:')

  const description = descriptionAndConstraints[0].trim()
  let constraints: string[] = []
  if (descriptionAndConstraints.length > 1) {
    constraints = descriptionAndConstraints[1]
      .split(',')
      .map((constraint: string) => constraint.trim())
  }

  const link =
    document
      .querySelector('meta[property="og:url"]')
      ?.getAttribute('content') || ''

  const codeSnippet = 'Extracted code snippet here' // Placeholder
  const language = 'Extracted language here' // Placeholder

  
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
