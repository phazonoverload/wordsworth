import { describe, it, expect } from 'vitest'
import { countWords, countSentences, countSyllables, splitIntoSentences, maskCodeBlocks } from '@/lib/text-utils'

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

describe('maskCodeBlocks', () => {
  it('masks fenced code block content with spaces', () => {
    const text = 'Hello\n```js\nconst x = 1\n```\nWorld'
    const result = maskCodeBlocks(text)
    expect(result.length).toBe(text.length)
    expect(result).toContain('Hello')
    expect(result).toContain('World')
    expect(result).not.toContain('const')
  })

  it('preserves newlines inside fenced code blocks', () => {
    const text = 'A\n```\nline1\nline2\n```\nB'
    const result = maskCodeBlocks(text)
    expect(result.split('\n').length).toBe(text.split('\n').length)
  })

  it('masks inline code', () => {
    const text = 'Use `wasBuilt` in your code.'
    const result = maskCodeBlocks(text)
    expect(result.length).toBe(text.length)
    expect(result).not.toContain('wasBuilt')
  })

  it('returns text unchanged when no code blocks are present', () => {
    const text = 'Just plain prose here.'
    expect(maskCodeBlocks(text)).toBe(text)
  })

  it('handles multiple fenced code blocks', () => {
    const text = 'A\n```\nfoo\n```\nB\n```\nbar\n```\nC'
    const result = maskCodeBlocks(text)
    expect(result.length).toBe(text.length)
    expect(result).toContain('A')
    expect(result).toContain('B')
    expect(result).toContain('C')
    expect(result).not.toContain('foo')
    expect(result).not.toContain('bar')
  })
})

describe('countWords', () => {
  it('excludes fenced code blocks from word count', () => {
    const text = 'Hello world.\n```\nconst x = 1\n```\nGoodbye world.'
    expect(countWords(text)).toBe(4)
  })
})
