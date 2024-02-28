// Assuming the existence of a `sha1` function and a `debug` variable not defined in the provided code.
// These would need to be implemented or imported for the TypeScript version to work as expected.
export {}
declare var __DEV__: boolean | undefined
declare var debug: boolean

/**
 *현재 익스텐션의 버전정보를 반환합니다.
 * @returns 현재 익스텐션의 버전정보
 */
export function getVersion(): string {
  return chrome.runtime.getManifest().version
}

/**
 * element가 존재하는지 반환합니다.
 * @param element - 존재하는지 확인할 element
 * @returns 존재하면 true, 존재하지 않으면 false
 */
function elementExists(element: Element | null | undefined): boolean {
  if (element instanceof HTMLElement) {
    return element.children.length > 0
  }
  return false
}

/**
 * 해당 값이 null 또는 undefined인지 체크합니다.
 * @param value - 체크할 값
 * @returns null이면 true, null이 아니면 false
 */
export function isNull(value: any): boolean {
  return value === null || value === undefined
}

/**
 * 해당 값이 비어있거나 빈 문자열인지 체크합니다.
 * @param value - 체크할 값
 * @returns 비어있으면 true, 비어있지 않으면 false
 */
function isEmpty(value: any): boolean {
  return isNull(value) || ('length' in value && value.length === 0)
}

/**
 * 객체 또는 배열의 모든 요소를 재귀적으로 순회하여 값이 비어있지 않은지 체크합니다.
 * @param obj - 체크할 객체 또는 배열
 * @returns 비어있지 않으면 true, 비어있으면 false
 */
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

/**
 * 문자열을 escape 하여 반환합니다.
 * @param text - escape 할 문자열
 * @returns escape된 문자열
 */
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

/**
 * escape된 문자열을 unescape하여 반환합니다.
 * @param text - unescape할 문자열
 * @returns unescape된 문자열
 */
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

/**
 * 일반 특수문자를 전각문자로 변환하는 함수
 * @param text - 변환할 문자열
 * @returns 전각문자로 변환된 문자열
 */
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
    ' ': ' ' // 공백만 전각문자가 아닌 FOUR-PER-EM SPACE로 변환
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

  /**
   * key 값을 기준으로 array를 그룹핑하여 map으로 반환합니다.
   * @param array - array to be sorted
   * @param key - key to sort
   * @returns key 기준으로 그룹핑된 객체들 배열을 value로 갖는 map
   */
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
  /**
   * arr에서 같은 key 그룹 내의 요소 중 최고의 값을 리스트화하여 반환합니다.
   * @param arr - 비교할 요소가 있는 배열
   * @param key - 같은 그룹으로 묶을 키 값
   * @param compare - 비교할 함수
   * @returns 같은 key 그룹 내의 요소 중 최고의 값을 반환합니다.
   */
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

  /**
   * 배열 내의 key에 val 값을 포함하고 있는 요소만을 반환합니다.
   * @param arr - array to be filtered
   * @param conditions - object of key, values to be used in filter
   * @returns filtered array
   */
  function filter<T>(arr: T[], conditions: { [key: string]: any }): T[] {
    return arr.filter((item: any) => {
      for (const [key, value] of Object.entries(conditions)) {
        if (!item[key] || !item[key].includes(value)) return false
      }
      return true
    })
  }
