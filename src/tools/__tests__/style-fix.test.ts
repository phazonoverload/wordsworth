import { describe, it, expect } from 'vitest'
import { extractParagraph } from '@/tools/style-fix'

describe('extractParagraph', () => {
  it('extracts a single-line paragraph', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'
    const result = extractParagraph(text, 3)
    expect(result.paragraph).toBe('Second paragraph.')
    expect(text.slice(result.startIndex, result.endIndex)).toBe('Second paragraph.')
  })

  it('extracts a multi-line paragraph', () => {
    const text = 'First line.\n\nPara line one.\nPara line two.\nPara line three.\n\nLast.'
    const result = extractParagraph(text, 4)
    expect(result.paragraph).toBe('Para line one.\nPara line two.\nPara line three.')
    expect(text.slice(result.startIndex, result.endIndex)).toBe('Para line one.\nPara line two.\nPara line three.')
  })

  it('extracts first paragraph', () => {
    const text = 'Hello world.\n\nSecond para.'
    const result = extractParagraph(text, 1)
    expect(result.paragraph).toBe('Hello world.')
    expect(result.startIndex).toBe(0)
  })

  it('extracts last paragraph', () => {
    const text = 'First.\n\nLast paragraph here.'
    const result = extractParagraph(text, 3)
    expect(result.paragraph).toBe('Last paragraph here.')
  })

  it('handles single paragraph document', () => {
    const text = 'Just one line.'
    const result = extractParagraph(text, 1)
    expect(result.paragraph).toBe('Just one line.')
    expect(result.startIndex).toBe(0)
    expect(result.endIndex).toBe(text.length)
  })
})
