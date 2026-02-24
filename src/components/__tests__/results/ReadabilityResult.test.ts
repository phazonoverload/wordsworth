import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReadabilityResult from '../../results/ReadabilityResult.vue'
import type { ReadabilityResult as ReadabilityResultType } from '@/tools/types'

function makeResult(overrides: Partial<ReadabilityResultType> = {}): ReadabilityResultType {
  return {
    type: 'readability',
    fleschKincaid: 65.2,
    gunningFog: 10.4,
    gradeLevel: 8,
    wordCount: 250,
    sentenceCount: 18,
    readingTimeMinutes: 1.2,
    audienceNote: 'General audience',
    ...overrides,
  }
}

describe('ReadabilityResult', () => {
  it('displays grade level', () => {
    const wrapper = mount(ReadabilityResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('8')
  })

  it('displays Flesch-Kincaid score', () => {
    const wrapper = mount(ReadabilityResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('65.2')
  })

  it('displays Gunning Fog index', () => {
    const wrapper = mount(ReadabilityResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('10.4')
  })

  it('displays word count', () => {
    const wrapper = mount(ReadabilityResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('250')
  })

  it('displays sentence count', () => {
    const wrapper = mount(ReadabilityResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('18')
  })

  it('displays reading time', () => {
    const wrapper = mount(ReadabilityResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('1.2')
  })

  it('displays audience note', () => {
    const wrapper = mount(ReadabilityResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('General audience')
  })

  it('shows green indicator for low grade level', () => {
    const wrapper = mount(ReadabilityResult, {
      props: { result: makeResult({ gradeLevel: 5 }) },
    })
    const indicator = wrapper.find('[data-testid="grade-indicator"]')
    expect(indicator.classes()).toContain('bg-green-500')
  })

  it('shows yellow indicator for medium grade level', () => {
    const wrapper = mount(ReadabilityResult, {
      props: { result: makeResult({ gradeLevel: 10 }) },
    })
    const indicator = wrapper.find('[data-testid="grade-indicator"]')
    expect(indicator.classes()).toContain('bg-yellow-500')
  })

  it('shows red indicator for high grade level', () => {
    const wrapper = mount(ReadabilityResult, {
      props: { result: makeResult({ gradeLevel: 15 }) },
    })
    const indicator = wrapper.find('[data-testid="grade-indicator"]')
    expect(indicator.classes()).toContain('bg-red-500')
  })
})
