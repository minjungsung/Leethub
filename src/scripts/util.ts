export {}
declare var __DEV__: boolean | undefined
declare var debug: boolean

export function getVersion(): string {
  return chrome.runtime.getManifest().version
}

function elementExists(element: Element | null | undefined): boolean {
  if (element instanceof HTMLElement) {
    return element.children.length > 0
  }
  return false
}

export function isNull(value: any): boolean {
  return value === null || value === undefined
}

function isEmpty(value: any): boolean {
  return isNull(value) || ('length' in value && value.length === 0)
}

function isNotEmpty(obj: any): boolean {
  if (isEmpty(obj)) return false
  if (typeof obj !== 'object') return true
  if ('length' in obj && obj.length === 0) return false
  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      if (!isNotEmpty(obj[key])) return false
    }
  }
  return true
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }

  return text.replace(/[&<>"']/g, (m) => map[m])
}

function unescapeHtml(text: string): string {
  const unescaped: { [key: string]: string } = {
    '&amp;': '&',
    '&#38;': '&',
    '&lt;': '<',
    '&#60;': '<',
    '&gt;': '>',
    '&#62;': '>',
    '&apos;': "'",
    '&#39;': "'",
    '&quot;': '"',
    '&#34;': '"',
    '&nbsp;': ' ',
    '&#160;': ' '
  }
  return text.replace(
    /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160);/g,
    (m) => unescaped[m]
  )
}

export function convertSingleCharToDoubleChar(text: string): string {
  const map = {
    '!': '！',
    '%': '％',
    '&': '＆',
    '(': '（',
    ')': '）',
    '*': '＊',
    '+': '＋',
    ',': '，',
    '-': '－',
    '.': '．',
    '/': '／',
    ':': '：',
    ';': '；',
    '<': '＜',
    '=': '＝',
    '>': '＞',
    '?': '？',
    '@': '＠',
    '[': '［',
    '\\': '＼',
    ']': '］',
    '^': '＾',
    _: '＿',
    '`': '｀',
    '{': '｛',
    '|': '｜',
    '}': '｝',
    '~': '～',
    ' ': ' '
  }
  return text.replace(/[!%&()*+,\-./:;<=>?@\[\\\]^_`{|}~ ]/g, (m) => {
    return map[m as keyof typeof map]
  })}


  function parseNumberFromString(str: string): number {
    const numbers = str.match(/\d+/g) || ''
    if (isNotEmpty(numbers) && numbers.length > 0) {
      return Number(numbers[0])
    }
    return NaN
  }

  function groupBy<T, K extends keyof T>(
    array: T[],
    key: K
  ): Record<string, T[]> {
    return array.reduce((rv: Record<string, T[]>, x: T) => {
      const keyValue = String(x[key])
      ;(rv[keyValue] = rv[keyValue] || []).push(x)
      return rv
    }, {} as Record<string, T[]>)
  }

  function maxValuesGroupBykey<T, K extends keyof T>(
    arr: T[],
    key: K,
    compare: (a: T, b: T) => number
  ): T[] {
    const map = groupBy(arr, key)
    const result: T[] = []
    for (const group of Object.values(map)) {
      const maxValue = group.reduce((max, current) =>
        compare(max, current) > 0 ? max : current
      )
      result.push(maxValue)
    }
    return result
  }

  function filter<T>(arr: T[], conditions: { [key: string]: any }): T[] {
    return arr.filter((item: any) => {
      for (const [key, value] of Object.entries(conditions)) {
        if (!item[key] || !item[key].includes(value)) return false
      }
      return true
    })
  }
