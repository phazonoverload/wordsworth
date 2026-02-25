import { describe, it, expect } from 'vitest'
import { scanHeaders, promoteHeaders, demoteHeaders } from '@/tools/header-shift'

describe('scanHeaders', () => {
  it('returns type header-shift', () => {
    const result = scanHeaders('# Hello')
    expect(result.type).toBe('header-shift')
  })

  it('counts headers by level', () => {
    const content = '# H1\n## H2\n## H2 again\n### H3'
    const result = scanHeaders(content)
    expect(result.headerCounts).toEqual({ 1: 1, 2: 2, 3: 1, 4: 0, 5: 0, 6: 0 })
  })

  it('returns total header count', () => {
    const content = '# H1\n## H2\n### H3'
    const result = scanHeaders(content)
    expect(result.totalHeaders).toBe(3)
  })

  it('returns zero counts for no headers', () => {
    const result = scanHeaders('Just a paragraph of text.')
    expect(result.totalHeaders).toBe(0)
    expect(result.headerCounts).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 })
  })

  it('only counts ATX-style headers at start of line', () => {
    const content = 'This is not a # header\n## This is a header'
    const result = scanHeaders(content)
    expect(result.totalHeaders).toBe(1)
    expect(result.headerCounts[2]).toBe(1)
  })

  it('handles all six header levels', () => {
    const content = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6'
    const result = scanHeaders(content)
    expect(result.headerCounts).toEqual({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 })
    expect(result.totalHeaders).toBe(6)
  })

  it('does not count lines with more than 6 hashes as headers', () => {
    const content = '####### Not a header\n## Real header'
    const result = scanHeaders(content)
    expect(result.totalHeaders).toBe(1)
  })
})

describe('promoteHeaders', () => {
  it('decreases header level by one', () => {
    const result = promoteHeaders('## Hello\n### World')
    expect(result.ok).toBe(true)
    expect(result.content).toBe('# Hello\n## World')
    expect(result.shifted).toBe(2)
  })

  it('returns error when H1 exists', () => {
    const result = promoteHeaders('# Already H1\n## Another')
    expect(result.ok).toBe(false)
    expect(result.error).toContain('H1')
    expect(result.content).toBeUndefined()
  })

  it('handles mixed levels', () => {
    const result = promoteHeaders('### Deep\n#### Deeper\n###### Deepest')
    expect(result.ok).toBe(true)
    expect(result.content).toBe('## Deep\n### Deeper\n##### Deepest')
  })

  it('preserves non-header lines', () => {
    const result = promoteHeaders('## Title\nSome text\n### Subtitle')
    expect(result.ok).toBe(true)
    expect(result.content).toBe('# Title\nSome text\n## Subtitle')
  })

  it('returns shifted count of 0 when no headers', () => {
    const result = promoteHeaders('No headers here')
    expect(result.ok).toBe(true)
    expect(result.shifted).toBe(0)
    expect(result.content).toBe('No headers here')
  })
})

describe('demoteHeaders', () => {
  it('increases header level by one', () => {
    const result = demoteHeaders('# Hello\n## World')
    expect(result.ok).toBe(true)
    expect(result.content).toBe('## Hello\n### World')
    expect(result.shifted).toBe(2)
  })

  it('returns error when H6 exists', () => {
    const result = demoteHeaders('###### Already H6\n## Another')
    expect(result.ok).toBe(false)
    expect(result.error).toContain('H6')
    expect(result.content).toBeUndefined()
  })

  it('handles mixed levels', () => {
    const result = demoteHeaders('# Top\n### Middle\n##### Low')
    expect(result.ok).toBe(true)
    expect(result.content).toBe('## Top\n#### Middle\n###### Low')
  })

  it('preserves non-header lines', () => {
    const result = demoteHeaders('# Title\nSome text\n## Subtitle')
    expect(result.ok).toBe(true)
    expect(result.content).toBe('## Title\nSome text\n### Subtitle')
  })

  it('returns shifted count of 0 when no headers', () => {
    const result = demoteHeaders('No headers here')
    expect(result.ok).toBe(true)
    expect(result.shifted).toBe(0)
    expect(result.content).toBe('No headers here')
  })
})
