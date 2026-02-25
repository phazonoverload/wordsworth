import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PronounResult from '../../results/PronounResult.vue'
import type { PronounResult as PronounResultType } from '@/tools/types'
import { useToolStore } from '@/stores/tools'

function makeResult(overrides: Partial<PronounResultType> = {}): PronounResultType {
  return {
    type: 'pronouns',
    counts: { i: 6, you: 8, we: 5 },
    total: 19,
    percentages: { i: 32, you: 42, we: 26 },
    matches: [
      { from: 0, to: 1, group: 'i' },
      { from: 5, to: 8, group: 'you' },
      { from: 12, to: 14, group: 'we' },
    ],
    toneAssessment: 'Conversational and inclusive',
    ...overrides,
  }
}

describe('PronounResult', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays tone assessment', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('Conversational and inclusive')
  })

  it('displays total pronoun count', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('19')
  })

  it('displays group labels', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('I / me / my / mine')
    expect(wrapper.text()).toContain('you / your / yours')
    expect(wrapper.text()).toContain('we / us / our / ours')
  })

  it('does not display it group', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    expect(wrapper.text()).not.toContain('it / its')
  })

  it('displays individual group counts', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('6')
    expect(wrapper.text()).toContain('8')
    expect(wrapper.text()).toContain('5')
  })

  it('displays percentages', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('32%')
    expect(wrapper.text()).toContain('42%')
  })

  it('renders cards for each pronoun group', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    const cards = wrapper.findAll('[data-testid="pronoun-card"]')
    expect(cards.length).toBe(3)
  })

  it('renders progress bars for pronoun distribution', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    const bars = wrapper.findAll('[data-testid="pronoun-bar"]')
    expect(bars.length).toBe(3)
  })

  it('sets pronoun highlights in tool store on mount', () => {
    const toolStore = useToolStore()
    const spy = vi.spyOn(toolStore, 'setPronounHighlights')
    mount(PronounResult, { props: { result: makeResult() } })
    expect(spy).toHaveBeenCalledWith(makeResult().matches)
  })

  it('does not set highlights when there are no matches', () => {
    const toolStore = useToolStore()
    const spy = vi.spyOn(toolStore, 'setPronounHighlights')
    mount(PronounResult, { props: { result: makeResult({ matches: [] }) } })
    expect(spy).not.toHaveBeenCalled()
  })

  it('renders cards with distinct background colors', () => {
    const wrapper = mount(PronounResult, { props: { result: makeResult() } })
    const cards = wrapper.findAll('[data-testid="pronoun-card"]')
    expect(cards[0]!.classes()).toContain('bg-blue-50')
    expect(cards[1]!.classes()).toContain('bg-green-50')
    expect(cards[2]!.classes()).toContain('bg-amber-50')
  })
})
