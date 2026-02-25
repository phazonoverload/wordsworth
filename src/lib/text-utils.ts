/**
 * Replace fenced code blocks and inline code with spaces of equal length.
 * Preserves string length so that character positions remain valid.
 */
export function maskCodeBlocks(text: string): string {
  // Fenced code blocks: ```...``` (with optional language tag)
  let result = text.replace(/^```[^\n]*\n[\s\S]*?^```/gm, (match) => {
    return match.replace(/[^\n]/g, ' ')
  })
  // Inline code: `...` (single backtick, not inside fenced blocks — already masked above)
  result = result.replace(/`([^`]+)`/g, (match) => {
    return match.replace(/[^\n]/g, ' ')
  })
  return result
}

/**
 * Strip common markdown syntax for plain-text analysis.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^```[^\n]*\n[\s\S]*?^```/gm, '') // fenced code blocks
    .replace(/^#{1,6}\s+/gm, '')       // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
    .replace(/\*(.+?)\*/g, '$1')       // italic
    .replace(/__(.+?)__/g, '$1')       // bold alt
    .replace(/_(.+?)_/g, '$1')         // italic alt
    .replace(/~~(.+?)~~/g, '$1')       // strikethrough
    .replace(/`(.+?)`/g, '$1')         // inline code
    .replace(/^\s*[-*+]\s+/gm, '')     // list markers
    .replace(/^\s*\d+\.\s+/gm, '')     // ordered list markers
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/!\[.*?\]\(.+?\)/g, '')   // images
    .replace(/^>\s+/gm, '')            // blockquotes
}

export function countWords(text: string): number {
  const plain = stripMarkdown(text).trim()
  if (plain.length === 0) return 0
  return plain.split(/\s+/).filter((w) => w.length > 0).length
}

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st',
  'vs', 'etc', 'inc', 'ltd', 'dept', 'est', 'approx',
  'e.g', 'i.e', 'fig', 'vol', 'no',
])

export function splitIntoSentences(text: string): string[] {
  const plain = stripMarkdown(text).trim()
  if (plain.length === 0) return []

  const sentences: string[] = []
  let current = ''

  const tokens = plain.split(/\s+/)
  for (const token of tokens) {
    current += (current ? ' ' : '') + token
    if (/[.!?]$/.test(token)) {
      const word = token.replace(/[.!?]+$/, '').toLowerCase()
      if (ABBREVIATIONS.has(word)) continue
      sentences.push(current.trim())
      current = ''
    }
  }
  if (current.trim()) {
    sentences.push(current.trim())
  }
  return sentences
}

export function countSentences(text: string): number {
  const sentences = splitIntoSentences(text)
  return Math.max(sentences.length, 1)
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 2) return 1

  let count = 0
  const vowels = 'aeiouy'
  let prevVowel = false

  for (let i = 0; i < w.length; i++) {
    const char = w[i] as string
    const isVowel = vowels.includes(char)
    if (isVowel && !prevVowel) {
      count++
    }
    prevVowel = isVowel
  }

  // Silent e
  if (w.endsWith('e') && count > 1) {
    count--
  }

  // -le ending
  if (w.endsWith('le') && w.length > 2 && !vowels.includes(w[w.length - 3] as string)) {
    count++
  }

  return Math.max(count, 1)
}
