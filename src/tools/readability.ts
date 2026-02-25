import { countWords, countSentences, countSyllables, stripMarkdown } from '@/lib/text-utils'
import type { ReadabilityResult } from './types'

const READING_WPM = 238

export function analyzeReadability(text: string): ReadabilityResult {
  const plain = stripMarkdown(text)
  const words = plain.trim().split(/\s+/).filter((w) => w.length > 0)
  const wordCount = countWords(text)
  const sentenceCount = countSentences(text)
  const readingTimeMinutes = wordCount > 0 ? Math.round((wordCount / READING_WPM) * 100) / 100 : 0

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0)

  const avgWordsPerSentence = wordCount > 0 ? wordCount / sentenceCount : 0
  const avgSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0

  const fleschKincaid = wordCount > 0
    ? Math.round((206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord) * 10) / 10
    : 0

  const complexWords = words.filter((w) => countSyllables(w) >= 3).length
  const complexWordRatio = wordCount > 0 ? complexWords / wordCount : 0
  const gunningFog = wordCount > 0
    ? Math.round(0.4 * (avgWordsPerSentence + 100 * complexWordRatio) * 10) / 10
    : 0

  const gradeLevel = wordCount > 0
    ? Math.max(0, Math.round((0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59) * 10) / 10)
    : 0

  return {
    type: 'readability',
    fleschKincaid,
    gunningFog,
    gradeLevel,
    wordCount,
    sentenceCount,
    readingTimeMinutes,
  }
}
