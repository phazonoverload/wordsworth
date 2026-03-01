import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToolStore } from '@/stores/tools'
import { useDocumentStore } from '@/stores/document'

vi.mock('@/tools/readability', () => ({
  analyzeReadability: vi.fn(() => ({
    type: 'readability',
    fleschKincaid: 70,
    gunningFog: 8,
    gradeLevel: 6,
    wordCount: 50,
    sentenceCount: 3,
    readingTimeMinutes: 0.2,
  })),
}))

vi.mock('@/tools/style-check', () => ({
  checkStyle: vi.fn(() => ({
    type: 'style-check',
    issues: [],
  })),
}))

vi.mock('@/tools/pronouns', () => ({
  analyzePronouns: vi.fn(() => ({
    type: 'pronouns',
    counts: { i: 0, you: 0, we: 0 },
    total: 0,
    percentages: { i: 0, you: 0, we: 0 },
    matches: [],
    toneAssessment: 'Neutral',
  })),
}))

vi.mock('@/tools/cut-twenty', () => ({
  cutTwenty: vi.fn(async () => ({
    type: 'cut-twenty',
    chunks: [],
    originalWordCount: 100,
    editedWordCount: 80,
    reductionPercent: 20,
  })),
}))

vi.mock('@/tools/promise-tracker', () => ({
  trackPromises: vi.fn(async () => ({
    type: 'promise-tracker',
    promises: [],
    verdicts: [],
  })),
}))

vi.mock('@/tools/parallel-structure', () => ({
  checkParallelStructure: vi.fn(() => ({
    type: 'parallel-structure',
    lists: [],
    issues: [],
  })),
}))

import { runTool } from '@/tools/runner'
import { analyzeReadability } from '@/tools/readability'
import { checkStyle } from '@/tools/style-check'
import { analyzePronouns } from '@/tools/pronouns'
import { cutTwenty } from '@/tools/cut-twenty'
import { trackPromises } from '@/tools/promise-tracker'
import { checkParallelStructure } from '@/tools/parallel-structure'

describe('runTool', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('bails out when no active tool is selected', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('Some content here.')

    await runTool()

    expect(toolStore.isRunning).toBe(false)
    expect(toolStore.result).toBeNull()
    expect(analyzeReadability).not.toHaveBeenCalled()
  })

  it('bails out when content is empty', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('')
    toolStore.setActiveTool('readability')

    await runTool()

    expect(toolStore.isRunning).toBe(false)
    expect(analyzeReadability).not.toHaveBeenCalled()
  })

  it('dispatches to analyzeReadability', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('The cat sat on the mat.')
    docStore.setReaderContext({ description: 'general audience' })
    toolStore.setActiveTool('readability')

    await runTool()

    expect(analyzeReadability).toHaveBeenCalledWith('The cat sat on the mat.')
    expect(toolStore.result).not.toBeNull()
    expect(toolStore.result!.type).toBe('readability')
  })

  it('dispatches to checkStyle with readerContext description', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('The report was written quickly.')
    docStore.setReaderContext({ description: 'non-technical manager' })
    toolStore.setActiveTool('style-check')

    await runTool()

    expect(checkStyle).toHaveBeenCalledWith('The report was written quickly.', 'non-technical manager')
    expect(toolStore.result).not.toBeNull()
    expect(toolStore.result!.type).toBe('style-check')
  })

  it('dispatches to analyzePronouns', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('We believe you should try it.')
    toolStore.setActiveTool('pronouns')

    await runTool()

    expect(analyzePronouns).toHaveBeenCalledWith('We believe you should try it.')
    expect(toolStore.result).not.toBeNull()
    expect(toolStore.result!.type).toBe('pronouns')
  })

  it('dispatches to cutTwenty with readerContext description', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('A long document that needs trimming.')
    docStore.setReaderContext({ description: 'busy executive' })
    toolStore.setActiveTool('cut-twenty')

    await runTool()

    expect(cutTwenty).toHaveBeenCalledWith('A long document that needs trimming.', 'busy executive')
    expect(toolStore.result).not.toBeNull()
    expect(toolStore.result!.type).toBe('cut-twenty')
  })

  it('dispatches to trackPromises', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('This article will cover three topics.')
    toolStore.setActiveTool('promise-tracker')

    await runTool()

    expect(trackPromises).toHaveBeenCalledWith('This article will cover three topics.')
    expect(toolStore.result).not.toBeNull()
    expect(toolStore.result!.type).toBe('promise-tracker')
  })

  it('dispatches to checkParallelStructure', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('- Install the package\n- Running the tests')
    toolStore.setActiveTool('parallel-structure')

    await runTool()

    expect(checkParallelStructure).toHaveBeenCalledWith('- Install the package\n- Running the tests')
    expect(toolStore.result).not.toBeNull()
    expect(toolStore.result!.type).toBe('parallel-structure')
  })

  it('sets isRunning to true before execution and false after', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('Some text.')
    toolStore.setActiveTool('readability')

    // Capture isRunning during execution
    let wasRunningDuringExec = false
    vi.mocked(analyzeReadability).mockImplementation(() => {
      wasRunningDuringExec = toolStore.isRunning
      return {
        type: 'readability',
        fleschKincaid: 70,
        gunningFog: 8,
        gradeLevel: 6,
        wordCount: 50,
        sentenceCount: 3,
        readingTimeMinutes: 0.2,
      }
    })

    await runTool()

    expect(wasRunningDuringExec).toBe(true)
    expect(toolStore.isRunning).toBe(false)
  })

  it('sets isRunning to false even when tool throws', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('Some text.')
    toolStore.setActiveTool('readability')

    vi.mocked(analyzeReadability).mockImplementation(() => {
      throw new Error('Tool exploded')
    })

    await runTool()

    expect(toolStore.isRunning).toBe(false)
  })

  it('does not crash when tool throws', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('Some text.')
    toolStore.setActiveTool('pronouns')

    vi.mocked(analyzePronouns).mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    // Should not throw
    await expect(runTool()).resolves.toBeUndefined()
  })

  it('does not set result when tool throws', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('Some text.')
    toolStore.setActiveTool('readability')

    vi.mocked(analyzeReadability).mockImplementation(() => {
      throw new Error('Boom')
    })

    await runTool()

    expect(toolStore.result).toBeNull()
  })
})
