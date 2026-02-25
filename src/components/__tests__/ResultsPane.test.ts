import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ResultsPane from '../ResultsPane.vue'
import { useToolStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import type {
  ReadabilityResult,
  StyleCheckResult,
  PronounResult,
  CutResult,
  PromiseResult,
} from '@/tools/types'

vi.mock('@/tools/runner', () => ({
  runTool: vi.fn(),
}))

import ToolSelector from '../ToolSelector.vue'

describe('ResultsPane', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows configure AI message when no API key is set and no tool selected', () => {
    const wrapper = shallowMount(ResultsPane)
    expect(wrapper.text()).toContain('Please configure AI in the settings before using tools')
  })

  it('shows placeholder message when no result but API key is set', () => {
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test')
    const wrapper = shallowMount(ResultsPane)
    expect(wrapper.text()).toContain('Select a tool and run it to see results')
  })

  it('shows loading state when running', () => {
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test')
    const store = useToolStore()
    store.setRunning(true)
    const wrapper = shallowMount(ResultsPane)
    expect(wrapper.text()).toContain('Analyzing...')
  })

  it('renders ReadabilityResult for readability type', () => {
    const store = useToolStore()
    const result: ReadabilityResult = {
      type: 'readability',
      fleschKincaid: 60,
      gunningFog: 10,
      gradeLevel: 8,
      wordCount: 200,
      sentenceCount: 15,
      readingTimeMinutes: 1,
    }
    store.setActiveTool('readability')
    store.setResult(result)
    const wrapper = shallowMount(ResultsPane)
    expect(wrapper.findComponent({ name: 'ReadabilityResult' }).exists()).toBe(true)
  })

  it('renders StyleCheckResult for style-check type', () => {
    const store = useToolStore()
    const result: StyleCheckResult = {
      type: 'style-check',
      issues: [],
    }
    store.setActiveTool('style-check')
    store.setResult(result)
    const wrapper = shallowMount(ResultsPane)
    expect(wrapper.findComponent({ name: 'StyleCheckResult' }).exists()).toBe(true)
  })

  it('renders PronounResult for pronouns type', () => {
    const store = useToolStore()
    const result: PronounResult = {
      type: 'pronouns',
      counts: { we: 1, i: 2, you: 3, they: 0, he: 0, she: 0, it: 1 },
      total: 7,
      percentages: { we: 14, i: 29, you: 43, they: 0, he: 0, she: 0, it: 14 },
      toneAssessment: 'Conversational',
    }
    store.setActiveTool('pronouns')
    store.setResult(result)
    const wrapper = shallowMount(ResultsPane)
    expect(wrapper.findComponent({ name: 'PronounResult' }).exists()).toBe(true)
  })

  it('renders CutResult for cut-twenty type', () => {
    const store = useToolStore()
    const result: CutResult = {
      type: 'cut-twenty',
      chunks: [],
      originalWordCount: 100,
      editedWordCount: 80,
      reductionPercent: 20,
    }
    store.setActiveTool('cut-twenty')
    store.setResult(result)
    const wrapper = shallowMount(ResultsPane)
    expect(wrapper.findComponent({ name: 'CutResult' }).exists()).toBe(true)
  })

  it('renders PromiseResult for promise-tracker type', () => {
    const store = useToolStore()
    const result: PromiseResult = {
      type: 'promise-tracker',
      promises: [],
      verdicts: [],
    }
    store.setActiveTool('promise-tracker')
    store.setResult(result)
    const wrapper = shallowMount(ResultsPane)
    expect(wrapper.findComponent({ name: 'PromiseResult' }).exists()).toBe(true)
  })

  it('renders the ToolSelector component', () => {
    const wrapper = shallowMount(ResultsPane)
    expect(wrapper.findComponent(ToolSelector).exists()).toBe(true)
  })
})
