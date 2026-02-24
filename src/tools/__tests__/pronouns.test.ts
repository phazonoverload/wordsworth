import { describe, it, expect } from 'vitest'
import { analyzePronouns } from '@/tools/pronouns'

describe('analyzePronouns', () => {
  it('counts pronoun occurrences', () => {
    const result = analyzePronouns('We built this for you. I think you will like it.')
    expect(result.counts.we).toBe(1)
    expect(result.counts.you).toBe(2)
    expect(result.counts.i).toBe(1)
    expect(result.counts.it).toBe(1)
  })

  it('is case-insensitive', () => {
    const result = analyzePronouns('We did it. WE did it again.')
    expect(result.counts.we).toBe(2)
  })

  it('calculates total', () => {
    const result = analyzePronouns('We built this for you.')
    expect(result.total).toBe(2)
  })

  it('calculates percentages', () => {
    const result = analyzePronouns('you you you we')
    expect(result.percentages.you).toBe(75)
    expect(result.percentages.we).toBe(25)
  })

  it('handles zero pronouns', () => {
    const result = analyzePronouns('The cat sat on the mat.')
    expect(result.total).toBe(0)
    expect(result.percentages.we).toBe(0)
  })

  it('assesses reader-focused tone', () => {
    const result = analyzePronouns('You should try this. You will love it. You can do it.')
    expect(result.toneAssessment).toContain('reader-focused')
  })

  it('assesses author-focused tone', () => {
    const result = analyzePronouns('I built this. I designed it. I think it is great. We shipped it.')
    expect(result.toneAssessment).toContain('author-focused')
  })

  it('returns type pronouns', () => {
    const result = analyzePronouns('Hello world.')
    expect(result.type).toBe('pronouns')
  })
})
