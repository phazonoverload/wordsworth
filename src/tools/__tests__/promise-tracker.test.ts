import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { mockGenerateObject } = vi.hoisted(() => ({
  mockGenerateObject: vi.fn(),
}))

vi.mock('ai', () => ({
  generateObject: mockGenerateObject,
}))

vi.mock('@/ai/client', () => ({
  getModel: vi.fn(() => ({ modelId: 'test-model', provider: 'openai' })),
}))

import { trackPromises } from '@/tools/promise-tracker'
import { getModel } from '@/ai/client'

const sampleText = `In this article, we will explore three key strategies for improving code quality.
We will also demonstrate how automated testing reduces bugs.

The body of the article goes on to discuss strategy one: code reviews.
Strategy two is pair programming, which has been shown to catch errors early.
Strategy three is continuous integration, which automates build and test processes.

In conclusion, these three strategies—code reviews, pair programming, and continuous integration—form
a solid foundation for any development team looking to ship higher-quality software.
Automated testing was briefly mentioned but not deeply explored.`

const mockAiResponse = {
  promises: [
    { text: 'Explore three key strategies for improving code quality' },
    { text: 'Demonstrate how automated testing reduces bugs' },
  ],
  verdicts: [
    {
      promiseIndex: 0,
      verdict: 'pass' as const,
      evidence: 'The article covers code reviews, pair programming, and CI as the three strategies.',
    },
    {
      promiseIndex: 1,
      verdict: 'partial' as const,
      evidence: 'Automated testing was mentioned but not deeply demonstrated.',
    },
  ],
}

describe('trackPromises', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGenerateObject.mockResolvedValue({ object: mockAiResponse })
  })

  it('returns a PromiseResult with type promise-tracker', async () => {
    const result = await trackPromises(sampleText)
    expect(result.type).toBe('promise-tracker')
  })

  it('returns promises with unique IDs', async () => {
    const result = await trackPromises(sampleText)
    const ids = result.promises.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(2)
    ids.forEach((id) => expect(id).toBeTruthy())
  })

  it('preserves promise text from AI response', async () => {
    const result = await trackPromises(sampleText)
    expect(result.promises[0]!.text).toBe(mockAiResponse.promises[0]!.text)
    expect(result.promises[1]!.text).toBe(mockAiResponse.promises[1]!.text)
  })

  it('maps promiseIndex to promiseId in verdicts', async () => {
    const result = await trackPromises(sampleText)
    // Verdict 0 references promise at index 0
    expect(result.verdicts[0]!.promiseId).toBe(result.promises[0]!.id)
    // Verdict 1 references promise at index 1
    expect(result.verdicts[1]!.promiseId).toBe(result.promises[1]!.id)
  })

  it('verdicts reference valid promise IDs', async () => {
    const result = await trackPromises(sampleText)
    const promiseIds = new Set(result.promises.map((p) => p.id))
    result.verdicts.forEach((v) => {
      expect(promiseIds.has(v.promiseId)).toBe(true)
    })
  })

  it('preserves verdict and evidence from AI response', async () => {
    const result = await trackPromises(sampleText)
    expect(result.verdicts[0]!.verdict).toBe('pass')
    expect(result.verdicts[0]!.evidence).toBe(mockAiResponse.verdicts[0]!.evidence)
    expect(result.verdicts[1]!.verdict).toBe('partial')
    expect(result.verdicts[1]!.evidence).toBe(mockAiResponse.verdicts[1]!.evidence)
  })

  it('calls generateObject with the model from getModel()', async () => {
    await trackPromises(sampleText)
    expect(getModel).toHaveBeenCalled()
    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
    const call = mockGenerateObject.mock.calls[0]![0]
    expect(call.model).toEqual({ modelId: 'test-model', provider: 'openai' })
  })

  it('includes the text in the prompt', async () => {
    await trackPromises(sampleText)
    const call = mockGenerateObject.mock.calls[0]![0]
    expect(call.prompt).toContain(sampleText)
  })

  it('passes a zod schema to generateObject', async () => {
    await trackPromises(sampleText)
    const call = mockGenerateObject.mock.calls[0]![0]
    expect(call.schema).toBeDefined()
  })

  it('includes a system prompt about identifying promises', async () => {
    await trackPromises(sampleText)
    const call = mockGenerateObject.mock.calls[0]![0]
    expect(call.system).toBeDefined()
    const system = call.system.toLowerCase()
    expect(system).toContain('promise')
  })

  it('system prompt instructs about pass/fail/partial verdicts', async () => {
    await trackPromises(sampleText)
    const call = mockGenerateObject.mock.calls[0]![0]
    const system = call.system.toLowerCase()
    expect(system).toContain('pass')
    expect(system).toContain('fail')
    expect(system).toContain('partial')
  })

  it('handles multiple verdicts referencing the same promise', async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        promises: [
          { text: 'Single promise' },
        ],
        verdicts: [
          { promiseIndex: 0, verdict: 'pass', evidence: 'First evidence' },
          { promiseIndex: 0, verdict: 'partial', evidence: 'Second evidence' },
        ],
      },
    })
    const result = await trackPromises(sampleText)
    expect(result.verdicts.length).toBe(2)
    expect(result.verdicts[0]!.promiseId).toBe(result.promises[0]!.id)
    expect(result.verdicts[1]!.promiseId).toBe(result.promises[0]!.id)
  })
})
