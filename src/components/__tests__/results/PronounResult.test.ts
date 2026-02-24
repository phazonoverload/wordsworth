import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PronounResult from '../../results/PronounResult.vue'
import type { PronounResult as PronounResultType } from '@/tools/types'

function makeResult(overrides: Partial<PronounResultType> = {}): PronounResultType {
  return {
    type: 'pronouns',
    counts: { we: 5, i: 3, you: 8, they: 2, he: 1, she: 1, it: 4 },
    total: 24,
    percentages: { we: 21, i: 13, you: 33, they: 8, he: 4, she: 4, it: 17 },
    toneAssessment: 'Conversational and inclusive',
    ...overrides,
  }
}

describe('PronounResult', () => {
  it('displays tone assessment', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('Conversational and inclusive')
  })

  it('displays total pronoun count', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('24')
  })

  it('displays individual pronoun counts', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('we')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('you')
    expect(wrapper.text()).toContain('8')
  })

  it('displays percentages', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('21%')
    expect(wrapper.text()).toContain('33%')
  })

  it('renders progress bars for pronoun distribution', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    const bars = wrapper.findAll('[data-testid="pronoun-bar"]')
    expect(bars.length).toBe(7)
  })
})
