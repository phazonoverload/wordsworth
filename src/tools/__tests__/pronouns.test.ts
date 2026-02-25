import { describe, it, expect } from 'vitest'
import { analyzePronouns } from '@/tools/pronouns'

describe('analyzePronouns', () => {
  it('counts personal pronoun occurrences', () => {
    const result = analyzePronouns('We built this for you. I think you will love this.')
    expect(result.counts.we).toBe(1)
    expect(result.counts.you).toBe(2)
    expect(result.counts.i).toBe(1)
  })

  it('aggregates possessive adjectives and possessive pronouns', () => {
    const result = analyzePronouns('I lost my keys. Those keys are mine.')
    expect(result.counts.i).toBe(3) // I + my + mine
  })

  it('aggregates objective forms for I group', () => {
    const result = analyzePronouns('Give me the book. I want this.')
    expect(result.counts.i).toBe(2) // me + I
  })

  it('aggregates objective forms for we group', () => {
    const result = analyzePronouns('We went to the store. They gave us our order. That table is ours.')
    expect(result.counts.we).toBe(4) // we + us + our + ours
  })

  it('aggregates you group forms', () => {
    const result = analyzePronouns('You left your bag. That bag is yours.')
    expect(result.counts.you).toBe(3) // you + your + yours
  })

  it('is case-insensitive', () => {
    const result = analyzePronouns('We went. WE went again.')
    expect(result.counts.we).toBe(2)
  })

  it('calculates total across all groups', () => {
    const result = analyzePronouns('We built this for you.')
    expect(result.total).toBe(2)
  })

  it('calculates percentages', () => {
    const result = analyzePronouns('you your yours we')
    expect(result.percentages.you).toBe(75)
    expect(result.percentages.we).toBe(25)
  })

  it('handles zero pronouns', () => {
    const result = analyzePronouns('The cat sat on the mat.')
    expect(result.total).toBe(0)
    expect(result.percentages.we).toBe(0)
  })

  it('assesses reader-focused tone', () => {
    const result = analyzePronouns('You should try this. Your results will improve. You can do yours.')
    expect(result.toneAssessment).toContain('reader-focused')
  })

  it('assesses author-focused tone', () => {
    const result = analyzePronouns('I built this. My design is great. I think mine is best. We shipped this.')
    expect(result.toneAssessment).toContain('author-focused')
  })

  it('returns type pronouns', () => {
    const result = analyzePronouns('Hello world.')
    expect(result.type).toBe('pronouns')
  })

  it('does not count gendered pronouns', () => {
    const result = analyzePronouns('He went to his house. She found her keys. They lost their way.')
    expect(result.total).toBe(0)
    expect(result.counts).toEqual({ i: 0, you: 0, we: 0 })
  })

  it('does not track "it" pronouns', () => {
    const result = analyzePronouns('It is great. Its quality is high.')
    expect(result.total).toBe(0)
  })

  it('returns match positions for each pronoun', () => {
    const text = 'I love my work.'
    const result = analyzePronouns(text)
    expect(result.matches).toHaveLength(2)
    expect(result.matches[0]).toEqual({ from: 0, to: 1, group: 'i' })
    expect(result.matches[1]).toEqual({ from: 7, to: 9, group: 'i' })
  })

  it('returns matches sorted by position', () => {
    const text = 'You and I went to your house with me.'
    const result = analyzePronouns(text)
    for (let idx = 1; idx < result.matches.length; idx++) {
      expect(result.matches[idx]!.from).toBeGreaterThanOrEqual(result.matches[idx - 1]!.from)
    }
  })

  it('assigns correct group to each match', () => {
    const text = 'We gave you our help.'
    const result = analyzePronouns(text)
    const groups = result.matches.map(m => m.group)
    expect(groups).toContain('we')
    expect(groups).toContain('you')
  })

  it('match positions correspond to actual text', () => {
    const text = 'I think you should help us.'
    const result = analyzePronouns(text)
    for (const match of result.matches) {
      const word = text.slice(match.from, match.to).toLowerCase()
      if (match.group === 'i') {
        expect(['i', 'me', 'my', 'mine']).toContain(word)
      } else if (match.group === 'you') {
        expect(['you', 'your', 'yours']).toContain(word)
      } else if (match.group === 'we') {
        expect(['we', 'us', 'our', 'ours']).toContain(word)
      }
    }
  })
})
