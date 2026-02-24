import { describe, it, expect } from 'vitest'
import { checkStyle } from '@/tools/style-check'

describe('checkStyle', () => {
  describe('passive voice detection', () => {
    it('flags passive voice', () => {
      const result = checkStyle('The report was written by the team.', '')
      const passiveIssues = result.issues.filter((i) => i.category === 'passive-voice')
      expect(passiveIssues.length).toBeGreaterThan(0)
    })

    it('does not flag active voice', () => {
      const result = checkStyle('The team wrote the report.', '')
      const passiveIssues = result.issues.filter((i) => i.category === 'passive-voice')
      expect(passiveIssues).toHaveLength(0)
    })
  })

  describe('wordiness detection', () => {
    it('flags wordy phrases', () => {
      const result = checkStyle('In order to improve performance, we should utilize this.', '')
      const wordyIssues = result.issues.filter((i) => i.category === 'wordiness')
      expect(wordyIssues.length).toBeGreaterThan(0)
    })

    it('includes suggestions for wordy phrases', () => {
      const result = checkStyle('In order to start, we need a plan.', '')
      const wordyIssues = result.issues.filter((i) => i.category === 'wordiness')
      const inOrderTo = wordyIssues.find((i) => i.message.toLowerCase().includes('in order to'))
      expect(inOrderTo?.suggestion).toBeDefined()
    })
  })

  describe('jargon detection', () => {
    it('flags jargon for non-technical audience', () => {
      const result = checkStyle(
        'We need to refactor the API endpoints and optimize the middleware.',
        'Non-technical stakeholder'
      )
      const jargonIssues = result.issues.filter((i) => i.category === 'jargon')
      expect(jargonIssues.length).toBeGreaterThan(0)
    })

    it('does not flag jargon for technical audience', () => {
      const result = checkStyle(
        'We need to refactor the API endpoints.',
        'Senior backend developer'
      )
      const jargonIssues = result.issues.filter((i) => i.category === 'jargon')
      expect(jargonIssues).toHaveLength(0)
    })
  })

  it('returns type style-check', () => {
    const result = checkStyle('Hello world.', '')
    expect(result.type).toBe('style-check')
  })

  it('returns empty issues for clean text', () => {
    const result = checkStyle('The team wrote a clear report.', 'Senior developer')
    expect(result.issues).toHaveLength(0)
  })

  it('includes line numbers for issues', () => {
    const result = checkStyle('The report was written by the team.', '')
    for (const issue of result.issues) {
      expect(issue.line).toBeGreaterThanOrEqual(1)
    }
  })
})
