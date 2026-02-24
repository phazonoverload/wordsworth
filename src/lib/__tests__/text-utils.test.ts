import { describe, it, expect } from 'vitest'
import { countWords, countSentences, countSyllables, splitIntoSentences } from '@/lib/text-utils'

describe('countWords', () => {
  it('counts words in a simple sentence', () => {
    expect(countWords('The quick brown fox')).toBe(4)
  })

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0)
  })

  it('handles multiple spaces and newlines', () => {
    expect(countWords('hello   world\n\nfoo  bar')).toBe(4)
  })

  it('handles markdown syntax', () => {
    expect(countWords('# Hello World')).toBe(2)
    expect(countWords('**bold** text')).toBe(2)
    expect(countWords('- list item')).toBe(2)
  })
})

describe('countSentences', () => {
  it('counts sentences ending with period', () => {
    expect(countSentences('Hello world. Goodbye world.')).toBe(2)
  })

  it('counts sentences ending with ! and ?', () => {
    expect(countSentences('Hello! How are you? Fine.')).toBe(3)
  })

  it('returns 1 for text without sentence enders', () => {
    expect(countSentences('hello world')).toBe(1)
  })

  it('handles abbreviations like Mr. and Dr.', () => {
    expect(countSentences('Mr. Smith went home. Dr. Jones stayed.')).toBe(2)
  })
})

describe('countSyllables', () => {
  it('counts syllables in simple words', () => {
    expect(countSyllables('cat')).toBe(1)
    expect(countSyllables('water')).toBe(2)
    expect(countSyllables('beautiful')).toBe(3)
  })

  it('returns 1 for very short words', () => {
    expect(countSyllables('a')).toBe(1)
    expect(countSyllables('I')).toBe(1)
  })
})

describe('splitIntoSentences', () => {
  it('splits text into sentences', () => {
    const sentences = splitIntoSentences('Hello world. Goodbye world.')
    expect(sentences).toHaveLength(2)
    expect(sentences[0]).toBe('Hello world.')
    expect(sentences[1]).toBe('Goodbye world.')
  })

  it('returns whole text if no sentence enders', () => {
    const sentences = splitIntoSentences('hello world')
    expect(sentences).toHaveLength(1)
  })
})
