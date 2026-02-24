import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useDocumentStore } from '@/stores/document'
import { useToolStore } from '@/stores/tools'

vi.mock('@/tools/runner', () => ({
  runTool: vi.fn(),
}))

import { runTool } from '@/tools/runner'
import { useAutoRun } from '@/composables/useAutoRun'

describe('useAutoRun', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs analysis tool when content changes', async () => {
    const documentStore = useDocumentStore()
    const toolStore = useToolStore()

    toolStore.setActiveTool('readability')
    documentStore.setContent('Some initial content.')

    useAutoRun()

    documentStore.setContent('Updated content here.')
    await nextTick()

    vi.advanceTimersByTime(500)

    expect(runTool).toHaveBeenCalledTimes(1)
  })

  it('does NOT run AI tools when content changes', async () => {
    const documentStore = useDocumentStore()
    const toolStore = useToolStore()

    toolStore.setActiveTool('cut-twenty')
    documentStore.setContent('Some initial content.')

    useAutoRun()

    documentStore.setContent('Updated content here.')
    await nextTick()

    vi.advanceTimersByTime(500)

    expect(runTool).not.toHaveBeenCalled()
  })

  it('does NOT run AI tool promise-tracker when content changes', async () => {
    const documentStore = useDocumentStore()
    const toolStore = useToolStore()

    toolStore.setActiveTool('promise-tracker')
    documentStore.setContent('Some initial content.')

    useAutoRun()

    documentStore.setContent('Updated content here.')
    await nextTick()

    vi.advanceTimersByTime(500)

    expect(runTool).not.toHaveBeenCalled()
  })

  it('does nothing when no active tool is set', async () => {
    const documentStore = useDocumentStore()

    documentStore.setContent('Some initial content.')

    useAutoRun()

    documentStore.setContent('Updated content here.')
    await nextTick()

    vi.advanceTimersByTime(500)

    expect(runTool).not.toHaveBeenCalled()
  })

  it('does nothing when content is set to empty', async () => {
    const documentStore = useDocumentStore()
    const toolStore = useToolStore()

    toolStore.setActiveTool('readability')
    documentStore.setContent('Some initial content.')

    useAutoRun()

    documentStore.setContent('')
    await nextTick()

    vi.advanceTimersByTime(500)

    expect(runTool).not.toHaveBeenCalled()
  })

  it('debounces rapid content changes to a single run', async () => {
    const documentStore = useDocumentStore()
    const toolStore = useToolStore()

    toolStore.setActiveTool('style-check')
    documentStore.setContent('Initial.')

    useAutoRun()

    documentStore.setContent('Change one.')
    await nextTick()

    vi.advanceTimersByTime(200)

    documentStore.setContent('Change two.')
    await nextTick()

    vi.advanceTimersByTime(200)

    documentStore.setContent('Change three.')
    await nextTick()

    vi.advanceTimersByTime(500)

    expect(runTool).toHaveBeenCalledTimes(1)
  })

  it('runs for all analysis tool types', async () => {
    const analysisTools = ['readability', 'style-check', 'pronouns'] as const

    for (const toolId of analysisTools) {
      vi.clearAllMocks()
      setActivePinia(createPinia())
      const freshDocStore = useDocumentStore()
      const freshToolStore = useToolStore()

      freshToolStore.setActiveTool(toolId)
      freshDocStore.setContent('Initial content.')

      useAutoRun()

      freshDocStore.setContent('Changed content.')
      await nextTick()

      vi.advanceTimersByTime(500)

      expect(runTool).toHaveBeenCalledTimes(1)
    }
  })
})
