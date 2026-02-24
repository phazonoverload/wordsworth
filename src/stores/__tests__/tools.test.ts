import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToolStore } from '@/stores/tools'
import type { ReadabilityResult } from '@/tools/types'

describe('toolStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with no active tool', () => {
    const store = useToolStore()
    expect(store.activeTool).toBeNull()
    expect(store.isRunning).toBe(false)
    expect(store.result).toBeNull()
  })

  it('sets active tool', () => {
    const store = useToolStore()
    store.setActiveTool('readability')
    expect(store.activeTool).toBe('readability')
  })

  it('clears result when switching tools', () => {
    const store = useToolStore()
    const mockResult: ReadabilityResult = {
      type: 'readability',
      fleschKincaid: 60,
      gunningFog: 10,
      gradeLevel: 8,
      wordCount: 100,
      sentenceCount: 5,
      readingTimeMinutes: 0.5,
      audienceNote: 'Good for general audience',
    }
    store.setResult(mockResult)
    store.setActiveTool('pronouns')
    expect(store.result).toBeNull()
  })

  it('sets running state', () => {
    const store = useToolStore()
    store.setRunning(true)
    expect(store.isRunning).toBe(true)
    store.setRunning(false)
    expect(store.isRunning).toBe(false)
  })

  it('sets result and adds to history', () => {
    const store = useToolStore()
    store.setActiveTool('readability')
    const mockResult: ReadabilityResult = {
      type: 'readability',
      fleschKincaid: 60,
      gunningFog: 10,
      gradeLevel: 8,
      wordCount: 100,
      sentenceCount: 5,
      readingTimeMinutes: 0.5,
      audienceNote: 'Good for general audience',
    }
    store.setResult(mockResult)
    expect(store.result).toEqual(mockResult)
    expect(store.history).toHaveLength(1)
    expect(store.history[0].toolId).toBe('readability')
  })

  it('limits history to 20 runs', () => {
    const store = useToolStore()
    store.setActiveTool('readability')
    const mockResult: ReadabilityResult = {
      type: 'readability',
      fleschKincaid: 60,
      gunningFog: 10,
      gradeLevel: 8,
      wordCount: 100,
      sentenceCount: 5,
      readingTimeMinutes: 0.5,
      audienceNote: '',
    }
    for (let i = 0; i < 25; i++) {
      store.setResult(mockResult)
    }
    expect(store.history).toHaveLength(20)
  })
})
