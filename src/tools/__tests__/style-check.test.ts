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

  describe('inconsistency detection — spelling variants', () => {
    it('flags when both US and UK spellings are used', () => {
      const result = checkStyle('The color of the colour was nice.', '')
      const issues = result.issues.filter((i) => i.category === 'inconsistency')
      expect(issues.length).toBeGreaterThan(0)
      expect(issues[0]!.severity).toBe('info')
    })

    it('does not flag when only one spelling variant is used', () => {
      const result = checkStyle('The color was red. Another color was blue.', '')
      const issues = result.issues.filter((i) => i.category === 'inconsistency')
      expect(issues).toHaveLength(0)
    })

    it('suggests the dominant spelling variant', () => {
      const result = checkStyle('The color was red. The color was blue. The colour was green.', '')
      const issues = result.issues.filter((i) => i.category === 'inconsistency')
      expect(issues).toHaveLength(1)
      expect(issues[0]!.suggestion).toBe('color')
    })

    it('flags the minority variant when US is dominant', () => {
      const result = checkStyle('We organize things. We organize more. We organise here.', '')
      const issues = result.issues.filter((i) => i.category === 'inconsistency')
      expect(issues).toHaveLength(1)
      expect(issues[0]!.message).toContain('organise')
      expect(issues[0]!.suggestion).toBe('organize')
    })

    it('flags the minority variant when UK is dominant', () => {
      const result = checkStyle('The centre is nice. The centre is big. Visit the center.', '')
      const issues = result.issues.filter((i) => i.category === 'inconsistency')
      expect(issues).toHaveLength(1)
      expect(issues[0]!.message).toContain('center')
      expect(issues[0]!.suggestion).toBe('centre')
    })
  })

  describe('inconsistency detection — term variants', () => {
    it('flags when multiple terms for the same concept are used', () => {
      const result = checkStyle('The user logged in. The customer was happy.', '')
      const issues = result.issues.filter((i) => i.category === 'inconsistency')
      expect(issues.length).toBeGreaterThan(0)
      expect(issues[0]!.severity).toBe('info')
    })

    it('does not flag when only one term variant is used', () => {
      const result = checkStyle('The user logged in. The user was happy.', '')
      const issues = result.issues.filter((i) => i.category === 'inconsistency')
      expect(issues).toHaveLength(0)
    })

    it('suggests the dominant term', () => {
      const result = checkStyle('The user did this. The user did that. The customer arrived.', '')
      const issues = result.issues.filter((i) => i.category === 'inconsistency')
      expect(issues).toHaveLength(1)
      expect(issues[0]!.suggestion).toBe('user')
    })

    it('includes correct line and offset', () => {
      const text = 'The user is here.\nThe customer is there.'
      const result = checkStyle(text, '')
      const issues = result.issues.filter((i) => i.category === 'inconsistency')
      expect(issues.length).toBeGreaterThan(0)
      const issue = issues.find((i) => i.message.includes('customer'))!
      expect(issue.line).toBe(2)
      expect(issue.absoluteOffset).toBe(text.indexOf('customer'))
    })
  })

  it('returns type style-check', () => {
    const result = checkStyle('Hello world.', '')
    expect(result.type).toBe('style-check')
  })

  it('returns empty issues for clean text', () => {
    const result = checkStyle('The team wrote a clear report.', '')
    expect(result.issues).toHaveLength(0)
  })

  it('includes line numbers for issues', () => {
    const result = checkStyle('The report was written by the team.', '')
    for (const issue of result.issues) {
      expect(issue.line).toBeGreaterThanOrEqual(1)
    }
  })

  it('includes absoluteOffset for issues on later lines', () => {
    const text = 'Line one is fine.\nThe report was written by the team.'
    const result = checkStyle(text, '')
    const passiveIssues = result.issues.filter((i) => i.category === 'passive-voice')
    expect(passiveIssues.length).toBeGreaterThan(0)
    const issue = passiveIssues[0]!
    expect(issue.line).toBe(2)
    expect(issue.absoluteOffset).toBe(text.indexOf('was written'))
  })

  describe('code block skipping', () => {
    it('does not flag passive voice inside fenced code blocks', () => {
      const text = 'Good prose here.\n```\nThe report was written by the team.\n```\nMore prose.'
      const result = checkStyle(text, '')
      const passiveIssues = result.issues.filter((i) => i.category === 'passive-voice')
      expect(passiveIssues).toHaveLength(0)
    })

    it('does not flag wordy phrases inside fenced code blocks', () => {
      const text = 'Good prose.\n```\nIn order to start, utilize this.\n```\nMore prose.'
      const result = checkStyle(text, '')
      const wordyIssues = result.issues.filter((i) => i.category === 'wordiness')
      expect(wordyIssues).toHaveLength(0)
    })

    it('does not flag inconsistencies inside fenced code blocks', () => {
      const text = 'I like the color red.\n```\nconst colour = "blue"\n```\nThe color is nice.'
      const result = checkStyle(text, '')
      const inconsistencyIssues = result.issues.filter((i) => i.category === 'inconsistency')
      expect(inconsistencyIssues).toHaveLength(0)
    })

    it('does not flag passive voice inside inline code', () => {
      const text = 'Call `was written` to check the status.'
      const result = checkStyle(text, '')
      const passiveIssues = result.issues.filter((i) => i.category === 'passive-voice')
      expect(passiveIssues).toHaveLength(0)
    })

    it('still flags issues in prose outside code blocks', () => {
      const text = 'The report was written by the team.\n```\nclean code here\n```\nMore text.'
      const result = checkStyle(text, '')
      const passiveIssues = result.issues.filter((i) => i.category === 'passive-voice')
      expect(passiveIssues.length).toBeGreaterThan(0)
      expect(passiveIssues[0]!.line).toBe(1)
    })
  })
})
