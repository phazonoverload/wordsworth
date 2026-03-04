import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AcronymCheckerResult from '../../results/AcronymCheckerResult.vue'
import { useToolStore } from '@/stores/tools'
import type { AcronymCheckerResult as AcronymCheckerResultType, AcronymIssue } from '@/tools/types'

function makeIssue(overrides: Partial<AcronymIssue> = {}): AcronymIssue {
  return {
    acronym: 'API',
    line: 3,
    absoluteOffset: 20,
    length: 3,
    count: 2,
    firstExpanded: false,
    dismissed: false,
    ...overrides,
  }
}

function makeResult(overrides: Partial<AcronymCheckerResultType> = {}): AcronymCheckerResultType {
  return {
    type: 'acronym-checker',
    acronyms: [],
    totalAcronymsFound: 0,
    allExpanded: true,
    ...overrides,
  }
}

describe('AcronymCheckerResult', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows success message when all acronyms are expanded', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: { result: makeResult({ totalAcronymsFound: 3, allExpanded: true }) },
    })
    expect(wrapper.text()).toContain('All 3 acronyms are properly expanded')
  })

  it('shows issue count and total when there are unexpanded acronyms', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue()],
          totalAcronymsFound: 3,
          allExpanded: false,
        }),
      },
    })
    expect(wrapper.find('[data-testid="issue-summary"]').text()).toContain('1 unexpanded acronym')
    expect(wrapper.find('[data-testid="issue-summary"]').text()).toContain('3 total')
  })

  it('displays acronym name in badge', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue({ acronym: 'SDK' })],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
    })
    const badge = wrapper.find('[data-testid="acronym-badge"]')
    expect(badge.text()).toBe('SDK')
  })

  it('displays usage count for each issue', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue({ count: 5 })],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
    })
    expect(wrapper.text()).toContain('5 uses')
  })

  it('displays line number for each issue', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue({ line: 42 })],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
    })
    expect(wrapper.text()).toContain('Line 42')
  })

  it('uses violet color for acronym badges', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue()],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
    })
    const badge = wrapper.find('[data-testid="acronym-badge"]')
    expect(badge.classes()).toContain('bg-violet-100')
  })

  it('calls setHighlightRange when an issue is clicked', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue({ absoluteOffset: 20, length: 3 })],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    const spy = vi.spyOn(store, 'setHighlightRange')

    await wrapper.find('[data-testid="acronym-issue"] .cursor-pointer').trigger('click')

    expect(spy).toHaveBeenCalledWith({ from: 20, to: 23 })
  })

  it('has cursor-pointer class on issue cards', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue()],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
    })
    expect(wrapper.find('[data-testid="acronym-issue"] .cursor-pointer').exists()).toBe(true)
  })

  it('shows heuristics panel when toggle is clicked', async () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: { result: makeResult() },
    })

    expect(wrapper.find('[data-testid="heuristics-panel"]').exists()).toBe(false)

    await wrapper.find('[data-testid="heuristics-toggle"]').trigger('click')

    expect(wrapper.find('[data-testid="heuristics-panel"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('How this check works')
  })

  it('hides heuristics panel when toggle is clicked again', async () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: { result: makeResult() },
    })

    await wrapper.find('[data-testid="heuristics-toggle"]').trigger('click')
    expect(wrapper.find('[data-testid="heuristics-panel"]').exists()).toBe(true)

    await wrapper.find('[data-testid="heuristics-toggle"]').trigger('click')
    expect(wrapper.find('[data-testid="heuristics-panel"]').exists()).toBe(false)
  })

  it('heuristics panel describes the detection patterns', async () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: { result: makeResult() },
    })

    await wrapper.find('[data-testid="heuristics-toggle"]').trigger('click')

    const panel = wrapper.find('[data-testid="heuristics-panel"]')
    expect(panel.text()).toContain('Acronym detection')
    expect(panel.text()).toContain('parenthetical definition')
    expect(panel.text()).toContain('reverse parenthetical')
    expect(panel.text()).toContain('inline definition')
    expect(panel.text()).toContain('Common abbreviations skipped')
  })

  it('displays suggestion message for each issue', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue({ acronym: 'HTML' })],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
    })
    expect(wrapper.text()).toContain('Full Phrase (HTML)')
  })

  it('pluralizes correctly for singular acronym count', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          totalAcronymsFound: 1,
          allExpanded: true,
        }),
      },
    })
    expect(wrapper.text()).toContain('1 acronym')
    expect(wrapper.text()).not.toContain('1 acronyms')
  })

  it('pluralizes correctly for singular usage count', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue({ count: 1 })],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
    })
    expect(wrapper.text()).toContain('1 use')
    expect(wrapper.text()).not.toContain('1 uses')
  })

  it('shows a dismiss button on each issue', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue()],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
    })
    expect(wrapper.find('[data-testid="dismiss-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="dismiss-btn"]').text()).toBe('Dismiss')
  })

  it('hides an issue when dismiss is clicked', async () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [
            makeIssue({ acronym: 'API' }),
            makeIssue({ acronym: 'SDK', absoluteOffset: 40 }),
          ],
          totalAcronymsFound: 2,
          allExpanded: false,
        }),
      },
    })
    expect(wrapper.findAll('[data-testid="acronym-issue"]')).toHaveLength(2)

    await wrapper.find('[data-testid="dismiss-btn"]').trigger('click')

    expect(wrapper.findAll('[data-testid="acronym-issue"]')).toHaveLength(1)
    expect(wrapper.find('[data-testid="acronym-badge"]').text()).toBe('SDK')
  })

  it('shows dismissed count after dismissing', async () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [
            makeIssue({ acronym: 'API' }),
            makeIssue({ acronym: 'SDK', absoluteOffset: 40 }),
          ],
          totalAcronymsFound: 2,
          allExpanded: false,
        }),
      },
    })

    await wrapper.find('[data-testid="dismiss-btn"]').trigger('click')

    expect(wrapper.find('[data-testid="dismissed-count"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="dismissed-count"]').text()).toContain('1 dismissed')
  })

  it('shows "All issues dismissed" when all are dismissed', async () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue()],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
    })

    await wrapper.find('[data-testid="dismiss-btn"]').trigger('click')

    expect(wrapper.find('[data-testid="issue-summary"]').text()).toContain('All issues dismissed')
  })

  it('does not show dismissed count when none are dismissed', () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue()],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
    })
    expect(wrapper.find('[data-testid="dismissed-count"]').exists()).toBe(false)
  })

  it('updates the visible issue count in summary after dismissing', async () => {
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [
            makeIssue({ acronym: 'API' }),
            makeIssue({ acronym: 'SDK', absoluteOffset: 40 }),
            makeIssue({ acronym: 'CLI', absoluteOffset: 60 }),
          ],
          totalAcronymsFound: 3,
          allExpanded: false,
        }),
      },
    })
    expect(wrapper.find('[data-testid="issue-summary"]').text()).toContain('3 unexpanded acronyms')

    await wrapper.find('[data-testid="dismiss-btn"]').trigger('click')

    expect(wrapper.find('[data-testid="issue-summary"]').text()).toContain('2 unexpanded acronyms')
  })

  it('dismiss click does not trigger highlight', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(AcronymCheckerResult, {
      props: {
        result: makeResult({
          acronyms: [makeIssue()],
          totalAcronymsFound: 1,
          allExpanded: false,
        }),
      },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    const spy = vi.spyOn(store, 'setHighlightRange')

    await wrapper.find('[data-testid="dismiss-btn"]').trigger('click')

    expect(spy).not.toHaveBeenCalled()
  })
})
