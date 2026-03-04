import { describe, it, expect } from 'vitest'
import { checkAcronyms } from '@/tools/acronym-checker'

describe('checkAcronyms', () => {
  it('returns type acronym-checker', () => {
    const result = checkAcronyms('Hello world.')
    expect(result.type).toBe('acronym-checker')
  })

  it('returns allExpanded true when no acronyms are present', () => {
    const result = checkAcronyms('Hello world. This is a simple sentence.')
    expect(result.allExpanded).toBe(true)
    expect(result.acronyms).toHaveLength(0)
    expect(result.totalAcronymsFound).toBe(0)
  })

  it('flags an unexpanded acronym', () => {
    const result = checkAcronyms('The API is fast.')
    expect(result.allExpanded).toBe(false)
    expect(result.acronyms).toHaveLength(1)
    expect(result.acronyms[0]!.acronym).toBe('API')
    expect(result.acronyms[0]!.dismissed).toBe(false)
  })

  it('does not flag an acronym expanded with parenthetical pattern', () => {
    const result = checkAcronyms('The Application Programming Interface (API) is fast. The API works well.')
    expect(result.allExpanded).toBe(true)
    expect(result.acronyms).toHaveLength(0)
    expect(result.totalAcronymsFound).toBe(1)
  })

  it('does not flag an acronym with reverse parenthetical pattern', () => {
    const result = checkAcronyms('The API (Application Programming Interface) is fast.')
    expect(result.allExpanded).toBe(true)
    expect(result.acronyms).toHaveLength(0)
  })

  it('does not flag an acronym with inline "or" pattern', () => {
    const result = checkAcronyms('The API, or Application Programming Interface, is fast.')
    expect(result.allExpanded).toBe(true)
    expect(result.acronyms).toHaveLength(0)
  })

  it('flags multiple unexpanded acronyms', () => {
    const result = checkAcronyms('The API and the SDK are both important.')
    expect(result.acronyms).toHaveLength(2)
    expect(result.acronyms.map(a => a.acronym)).toEqual(['API', 'SDK'])
  })

  it('counts total occurrences of each acronym', () => {
    const result = checkAcronyms('The API is fast. The API is also reliable. The API is great.')
    expect(result.acronyms).toHaveLength(1)
    expect(result.acronyms[0]!.count).toBe(3)
  })

  it('includes correct line number', () => {
    const text = 'First line here.\nThe API is on line two.'
    const result = checkAcronyms(text)
    expect(result.acronyms).toHaveLength(1)
    expect(result.acronyms[0]!.line).toBe(2)
  })

  it('includes correct absoluteOffset', () => {
    const text = 'First line here.\nThe API is on line two.'
    const result = checkAcronyms(text)
    expect(result.acronyms[0]!.absoluteOffset).toBe(text.indexOf('API'))
  })

  it('includes correct length', () => {
    const result = checkAcronyms('The HTML is nice.')
    expect(result.acronyms[0]!.length).toBe(4)
  })

  it('skips common abbreviations like OK, US, AM, PM', () => {
    const result = checkAcronyms('This is OK. The US is large. We arrive at 10 AM.')
    expect(result.allExpanded).toBe(true)
    expect(result.acronyms).toHaveLength(0)
  })

  it('does not skip non-common abbreviations', () => {
    const result = checkAcronyms('The NASA mission launched.')
    expect(result.acronyms).toHaveLength(1)
    expect(result.acronyms[0]!.acronym).toBe('NASA')
  })

  it('does not flag acronyms inside fenced code blocks', () => {
    const text = 'Some prose here.\n```\nconst API_KEY = "abc"\n```\nMore prose.'
    const result = checkAcronyms(text)
    expect(result.allExpanded).toBe(true)
  })

  it('does not flag acronyms inside inline code', () => {
    const text = 'Call `API.get()` to fetch data.'
    const result = checkAcronyms(text)
    expect(result.allExpanded).toBe(true)
  })

  it('still flags acronyms in prose outside code blocks', () => {
    const text = 'The API is fast.\n```\nconst SDK = "test"\n```\nMore prose.'
    const result = checkAcronyms(text)
    expect(result.acronyms).toHaveLength(1)
    expect(result.acronyms[0]!.acronym).toBe('API')
  })

  it('sorts issues by document position', () => {
    const text = 'The SDK is here. The API is there. The HTML is nice.'
    const result = checkAcronyms(text)
    expect(result.acronyms.map(a => a.acronym)).toEqual(['SDK', 'API', 'HTML'])
  })

  it('reports totalAcronymsFound including expanded ones', () => {
    const text = 'The Application Programming Interface (API) is fast. The SDK is cool.'
    const result = checkAcronyms(text)
    expect(result.totalAcronymsFound).toBe(2)
    expect(result.acronyms).toHaveLength(1)
    expect(result.acronyms[0]!.acronym).toBe('SDK')
  })

  it('handles empty text', () => {
    const result = checkAcronyms('')
    expect(result.allExpanded).toBe(true)
    expect(result.acronyms).toHaveLength(0)
    expect(result.totalAcronymsFound).toBe(0)
  })

  it('treats single uppercase letters as non-acronyms', () => {
    const result = checkAcronyms('I went to A place.')
    expect(result.acronyms).toHaveLength(0)
  })

  it('detects mixed expanded and unexpanded acronyms', () => {
    const text = 'The Application Programming Interface (API) is nice. But the SDK and the CLI need work.'
    const result = checkAcronyms(text)
    expect(result.totalAcronymsFound).toBe(3)
    expect(result.acronyms).toHaveLength(2)
    expect(result.acronyms.map(a => a.acronym)).toEqual(['SDK', 'CLI'])
  })
})
