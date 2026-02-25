import { describe, it, expect } from 'vitest'
import { analyzeReadability } from '@/tools/readability'

const simpleText = 'The cat sat on the mat. The dog ran in the park. It was a good day.'

const complexText =
  'The implementation of sophisticated algorithmic methodologies necessitates comprehensive understanding of fundamental computational paradigms. Furthermore, the utilization of advanced data structures facilitates optimized performance characteristics across heterogeneous computing environments.'

describe('analyzeReadability', () => {
  it('returns correct word count', () => {
    const result = analyzeReadability(simpleText)
    expect(result.wordCount).toBe(17)
  })

  it('returns correct sentence count', () => {
    const result = analyzeReadability(simpleText)
    expect(result.sentenceCount).toBe(3)
  })

  it('calculates reading time', () => {
    const result = analyzeReadability(simpleText)
    expect(result.readingTimeMinutes).toBeGreaterThan(0)
    expect(result.readingTimeMinutes).toBeLessThan(1)
  })

  it('calculates Flesch-Kincaid score (simple text scores high)', () => {
    const result = analyzeReadability(simpleText)
    expect(result.fleschKincaid).toBeGreaterThan(60)
  })

  it('calculates lower Flesch-Kincaid for complex text', () => {
    const simple = analyzeReadability(simpleText)
    const complex = analyzeReadability(complexText)
    expect(complex.fleschKincaid).toBeLessThan(simple.fleschKincaid)
  })

  it('calculates Gunning Fog index', () => {
    const result = analyzeReadability(simpleText)
    expect(result.gunningFog).toBeGreaterThan(0)
  })

  it('calculates grade level', () => {
    const result = analyzeReadability(simpleText)
    expect(result.gradeLevel).toBeGreaterThanOrEqual(0)
  })

  it('calculates higher grade level for complex text', () => {
    const simple = analyzeReadability(simpleText)
    const complex = analyzeReadability(complexText)
    expect(complex.gradeLevel).toBeGreaterThan(simple.gradeLevel)
  })

  it('does not include audienceNote in result', () => {
    const result = analyzeReadability(simpleText)
    expect(result).not.toHaveProperty('audienceNote')
  })

  it('has result type readability', () => {
    const result = analyzeReadability(simpleText)
    expect(result.type).toBe('readability')
  })

  it('handles empty text', () => {
    const result = analyzeReadability('')
    expect(result.wordCount).toBe(0)
    expect(result.sentenceCount).toBe(1)
    expect(result.readingTimeMinutes).toBe(0)
  })
})
