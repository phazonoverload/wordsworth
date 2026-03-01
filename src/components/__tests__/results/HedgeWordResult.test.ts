import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HedgeWordResult from '../../results/HedgeWordResult.vue'
import { useToolStore } from '@/stores/tools'
import type { HedgeWordResult as HedgeWordResultType, HedgeMatch } from '@/tools/types'

function makeMatch(overrides: Partial<HedgeMatch> = {}): HedgeMatch {
  return {
    from: 0,
    to: 5,
    word: 'might',
    group: 'uncertainty',
    line: 1,
    dismissed: false,
    ...overrides,
  }
}

function makeResult(overrides: Partial<HedgeWordResultType> = {}): HedgeWordResultType {
  return {
    type: 'hedge-words',
    matches: [],
    counts: { uncertainty: 0, frequency: 0, softener: 0 },
    total: 0,
    wordCount: 100,
    percentages: { uncertainty: 0, frequency: 0, softener: 0 },
    density: 0,
    toneAssessment: 'Fully assertive — no hedging language detected.',
    ...overrides,
  }
}

describe('HedgeWordResult', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows tone assessment banner', () => {
    const wrapper = mount(HedgeWordResult, {
      props: { result: makeResult({ toneAssessment: 'Cautious tone — noticeable hedging throughout.' }) },
    })
    expect(wrapper.text()).toContain('Cautious tone')
  })

  it('shows total hedge word count', () => {
    const wrapper = mount(HedgeWordResult, {
      props: { result: makeResult({ total: 7, matches: [makeMatch()], counts: { uncertainty: 7, frequency: 0, softener: 0 } }) },
    })
    expect(wrapper.text()).toContain('7')
  })

  it('shows density percentage', () => {
    const wrapper = mount(HedgeWordResult, {
      props: { result: makeResult({ density: 3.5, total: 1, matches: [makeMatch()], counts: { uncertainty: 1, frequency: 0, softener: 0 } }) },
    })
    expect(wrapper.text()).toContain('3.5%')
  })

  it('renders a card for each group', () => {
    const wrapper = mount(HedgeWordResult, {
      props: { result: makeResult({ total: 1, matches: [makeMatch()], counts: { uncertainty: 1, frequency: 0, softener: 0 } }) },
    })
    const cards = wrapper.findAll('[data-testid="hedge-card"]')
    expect(cards).toHaveLength(3)
  })

  it('shows count per group', () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          counts: { uncertainty: 5, frequency: 3, softener: 2 },
          total: 10,
          matches: [makeMatch()],
        }),
      },
    })
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('2')
  })

  it('shows percentage bars', () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          percentages: { uncertainty: 50, frequency: 30, softener: 20 },
          total: 10,
          matches: [makeMatch()],
          counts: { uncertainty: 5, frequency: 3, softener: 2 },
        }),
      },
    })
    const bars = wrapper.findAll('[data-testid="hedge-bar"]')
    expect(bars).toHaveLength(3)
  })

  it('renders individual match items for visible matches', () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [
            makeMatch({ word: 'might', from: 0 }),
            makeMatch({ word: 'could', from: 10 }),
          ],
          total: 2,
          counts: { uncertainty: 2, frequency: 0, softener: 0 },
        }),
      },
    })
    const items = wrapper.findAll('[data-testid="hedge-match"]')
    expect(items).toHaveLength(2)
  })

  it('shows word and line number for each match', () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [makeMatch({ word: 'might', line: 5 })],
          total: 1,
          counts: { uncertainty: 1, frequency: 0, softener: 0 },
        }),
      },
    })
    expect(wrapper.text()).toContain('might')
    expect(wrapper.text()).toContain('Line 5')
  })

  it('calls setHighlightRange when a match is clicked', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [makeMatch({ from: 10, to: 15 })],
          total: 1,
          counts: { uncertainty: 1, frequency: 0, softener: 0 },
        }),
      },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    const spy = vi.spyOn(store, 'setHighlightRange')

    await wrapper.find('[data-testid="hedge-match"] .cursor-pointer').trigger('click')

    expect(spy).toHaveBeenCalledWith({ from: 10, to: 15 })
  })

  it('shows dismiss button on each match', () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [makeMatch()],
          total: 1,
          counts: { uncertainty: 1, frequency: 0, softener: 0 },
        }),
      },
    })
    expect(wrapper.find('[data-testid="dismiss-btn"]').exists()).toBe(true)
  })

  it('hides match when dismiss is clicked', async () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [
            makeMatch({ word: 'might', from: 0 }),
            makeMatch({ word: 'could', from: 10 }),
          ],
          total: 2,
          counts: { uncertainty: 2, frequency: 0, softener: 0 },
        }),
      },
    })
    expect(wrapper.findAll('[data-testid="hedge-match"]')).toHaveLength(2)

    await wrapper.find('[data-testid="dismiss-btn"]').trigger('click')

    expect(wrapper.findAll('[data-testid="hedge-match"]')).toHaveLength(1)
  })

  it('shows dismissed count after dismissing', async () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [makeMatch(), makeMatch({ from: 10 })],
          total: 2,
          counts: { uncertainty: 2, frequency: 0, softener: 0 },
        }),
      },
    })

    await wrapper.find('[data-testid="dismiss-btn"]').trigger('click')

    expect(wrapper.find('[data-testid="dismissed-count"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="dismissed-count"]').text()).toContain('1 dismissed')
  })

  it('dismiss click does not trigger highlight', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [makeMatch()],
          total: 1,
          counts: { uncertainty: 1, frequency: 0, softener: 0 },
        }),
      },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    const spy = vi.spyOn(store, 'setHighlightRange')

    await wrapper.find('[data-testid="dismiss-btn"]').trigger('click')

    expect(spy).not.toHaveBeenCalled()
  })

  it('pushes highlights to store on mount', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const matches = [makeMatch({ from: 0, to: 5 })]
    mount(HedgeWordResult, {
      props: {
        result: makeResult({ matches, total: 1, counts: { uncertainty: 1, frequency: 0, softener: 0 } }),
      },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    expect(store.hedgeHighlights).toHaveLength(1)
  })

  it('does not push highlights when matches are empty', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    mount(HedgeWordResult, {
      props: { result: makeResult() },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    expect(store.hedgeHighlights).toHaveLength(0)
  })

  it('shows success message when no hedge words found', () => {
    const wrapper = mount(HedgeWordResult, {
      props: { result: makeResult({ total: 0 }) },
    })
    expect(wrapper.text()).toContain('No hedge words detected')
  })
})
