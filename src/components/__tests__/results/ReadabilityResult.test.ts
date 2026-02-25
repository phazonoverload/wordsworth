import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ReadabilityResult from '../../results/ReadabilityResult.vue'
import type { ReadabilityResult as ReadabilityResultType } from '@/tools/types'
import { useSettingsStore } from '@/stores/settings'
import { assessAudience } from '@/tools/audience-assessment'

vi.mock('@/tools/audience-assessment', () => ({
  assessAudience: vi.fn(),
}))

function makeResult(overrides: Partial<ReadabilityResultType> = {}): ReadabilityResultType {
  return {
    type: 'readability',
    fleschKincaid: 65.2,
    gunningFog: 10.4,
    gradeLevel: 8,
    wordCount: 250,
    sentenceCount: 18,
    readingTimeMinutes: 1.2,
    ...overrides,
  }
}

function mountResult(overrides: Partial<ReadabilityResultType> = {}) {
  return mount(ReadabilityResult, {
    props: { result: makeResult(overrides) },
  })
}

describe('ReadabilityResult', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(assessAudience).mockReset()
  })

  it('displays grade level', () => {
    const wrapper = mountResult()
    expect(wrapper.text()).toContain('8')
  })

  it('displays grade level description', () => {
    const wrapper = mountResult({ gradeLevel: 8 })
    expect(wrapper.text()).toContain('middle school')
  })

  it('displays Flesch-Kincaid score', () => {
    const wrapper = mountResult()
    expect(wrapper.text()).toContain('65.2')
  })

  it('displays Gunning Fog index', () => {
    const wrapper = mountResult()
    expect(wrapper.text()).toContain('10.4')
  })

  it('displays word count', () => {
    const wrapper = mountResult()
    expect(wrapper.text()).toContain('250')
  })

  it('displays sentence count', () => {
    const wrapper = mountResult()
    expect(wrapper.text()).toContain('18')
  })

  it('displays reading time', () => {
    const wrapper = mountResult()
    expect(wrapper.text()).toContain('1.2')
  })

  it('shows green indicator for low grade level', () => {
    const wrapper = mountResult({ gradeLevel: 5 })
    const indicator = wrapper.find('[data-testid="grade-indicator"]')
    expect(indicator.classes()).toContain('bg-green-500')
  })

  it('shows yellow indicator for medium grade level', () => {
    const wrapper = mountResult({ gradeLevel: 10 })
    const indicator = wrapper.find('[data-testid="grade-indicator"]')
    expect(indicator.classes()).toContain('bg-yellow-500')
  })

  it('shows red indicator for high grade level', () => {
    const wrapper = mountResult({ gradeLevel: 15 })
    const indicator = wrapper.find('[data-testid="grade-indicator"]')
    expect(indicator.classes()).toContain('bg-red-500')
  })

  it('renders the ReaderContext (target audience) component', () => {
    const wrapper = mountResult()
    expect(wrapper.findComponent({ name: 'ReaderContext' }).exists()).toBe(true)
  })

  it('shows "Assess for audience with AI" button when API key is set', () => {
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test')
    const wrapper = mountResult()
    expect(wrapper.text()).toContain('Assess for audience')
  })

  it('does not show "Assess for audience with AI" button when no API key', () => {
    const wrapper = mountResult()
    expect(wrapper.text()).not.toContain('Assess for audience')
  })

  it('clicking "Assess for audience with AI" calls assessAudience', async () => {
    vi.mocked(assessAudience).mockResolvedValue('Looks great!')
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test')
    const wrapper = mountResult()
    await wrapper.find('button').trigger('click')
    expect(assessAudience).toHaveBeenCalled()
  })

  it('displays assessment text after AI returns', async () => {
    vi.mocked(assessAudience).mockResolvedValue('This text is well-suited for the audience.')
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test')
    const wrapper = mountResult()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('This text is well-suited for the audience.')
  })

  it('hides button after assessment is displayed', async () => {
    vi.mocked(assessAudience).mockResolvedValue('Assessment done.')
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test')
    const wrapper = mountResult()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).not.toContain('Assess for audience')
  })

  it('displays error when assessment fails', async () => {
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test')
    vi.mocked(assessAudience).mockRejectedValue(new Error('API key invalid'))
    const wrapper = mountResult()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('API key invalid')
  })
})
