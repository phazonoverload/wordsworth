import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

const mockCallAI = vi.fn()

vi.mock('@/ai/client', () => ({
  callAI: (...args: unknown[]) => mockCallAI(...args),
}))

import { cutTwenty } from '@/tools/cut-twenty'

const sampleText =
  'The quick brown fox jumps over the lazy dog. This is some additional text that provides more content for the tool to work with. We need enough words here to make the test meaningful and realistic.'

const sampleReaderContext = 'Senior developers'

const mockAiResponse = {
  chunks: [
    {
      original: 'This is some additional text that provides more content for the tool to work with.',
      edited: 'This additional text provides more content.',
      reason: 'Removed redundant words',
    },
    {
      original: 'We need enough words here to make the test meaningful and realistic.',
      edited: 'We need enough words to make this meaningful.',
      reason: 'Condensed for brevity',
    },
  ],
}

describe('cutTwenty', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Set up a valid API key so callAI won't throw before reaching the mock
    const store = useSettingsStore()
    store.setProvider('openai')
    store.setModel('gpt-5-nano')
    store.setKey('openai', 'sk-test')
    vi.clearAllMocks()
    mockCallAI.mockResolvedValue(mockAiResponse)
  })

  it('returns a CutResult with type cut-twenty', async () => {
    const result = await cutTwenty(sampleText, sampleReaderContext)
    expect(result.type).toBe('cut-twenty')
  })

  it('returns chunks with unique IDs', async () => {
    const result = await cutTwenty(sampleText, sampleReaderContext)
    const ids = result.chunks.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(2)
    ids.forEach((id) => expect(id).toBeTruthy())
  })

  it('sets accepted to null on all chunks', async () => {
    const result = await cutTwenty(sampleText, sampleReaderContext)
    result.chunks.forEach((chunk) => {
      expect(chunk.accepted).toBeNull()
    })
  })

  it('preserves original, edited, and reason from AI response', async () => {
    const result = await cutTwenty(sampleText, sampleReaderContext)
    expect(result.chunks[0]!.original).toBe(mockAiResponse.chunks[0]!.original)
    expect(result.chunks[0]!.edited).toBe(mockAiResponse.chunks[0]!.edited)
    expect(result.chunks[0]!.reason).toBe(mockAiResponse.chunks[0]!.reason)
  })

  it('calculates originalWordCount from original text', async () => {
    const result = await cutTwenty(sampleText, sampleReaderContext)
    expect(result.originalWordCount).toBeGreaterThan(0)
    expect(typeof result.originalWordCount).toBe('number')
  })

  it('calculates editedWordCount from applying edits', async () => {
    const result = await cutTwenty(sampleText, sampleReaderContext)
    expect(result.editedWordCount).toBeGreaterThan(0)
    expect(result.editedWordCount).toBeLessThan(result.originalWordCount)
  })

  it('calculates reductionPercent correctly', async () => {
    const result = await cutTwenty(sampleText, sampleReaderContext)
    const expected = ((result.originalWordCount - result.editedWordCount) / result.originalWordCount) * 100
    expect(result.reductionPercent).toBeCloseTo(expected, 1)
  })

  it('calls callAI with action cut-twenty', async () => {
    await cutTwenty(sampleText, sampleReaderContext)
    expect(mockCallAI).toHaveBeenCalledTimes(1)
    const call = mockCallAI.mock.calls[0]![0]
    expect(call.action).toBe('cut-twenty')
  })

  it('includes readerContext in the system prompt', async () => {
    await cutTwenty(sampleText, sampleReaderContext)
    const call = mockCallAI.mock.calls[0]![0]
    expect(call.system).toContain(sampleReaderContext)
  })

  it('includes the text as the prompt', async () => {
    await cutTwenty(sampleText, sampleReaderContext)
    const call = mockCallAI.mock.calls[0]![0]
    expect(call.prompt).toContain(sampleText)
  })

  it('instructs the AI to act as a technical editor in the system prompt', async () => {
    await cutTwenty(sampleText, sampleReaderContext)
    const call = mockCallAI.mock.calls[0]![0]
    expect(call.system).toBeDefined()
    const system = call.system.toLowerCase()
    expect(system).toContain('editor')
  })

  it('instructs the AI to cut by ~20% in the system prompt', async () => {
    await cutTwenty(sampleText, sampleReaderContext)
    const call = mockCallAI.mock.calls[0]![0]
    const system = call.system.toLowerCase()
    expect(system).toContain('20%')
  })
})
