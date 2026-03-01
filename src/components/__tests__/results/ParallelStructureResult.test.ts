import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ParallelStructureResult from '../../results/ParallelStructureResult.vue'
import { useToolStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import type {
  ParallelStructureResult as ParallelStructureResultType,
  ParallelStructureIssue,
  ParallelStructureList,
} from '@/tools/types'

function makeIssue(overrides: Partial<ParallelStructureIssue> = {}): ParallelStructureIssue {
  return {
    listIndex: 0,
    itemIndex: 1,
    itemLine: 5,
    itemAbsoluteOffset: 50,
    itemLength: 20,
    kind: 'pattern',
    message: 'Item uses a gerund instead of imperative',
    ...overrides,
  }
}

function makeList(overrides: Partial<ParallelStructureList> = {}): ParallelStructureList {
  return {
    startLine: 3,
    items: [
      { line: 3, text: 'Install the package', pattern: 'imperative', capitalized: true, trailingPunctuation: '' },
      { line: 4, text: 'Running the tests', pattern: 'gerund', capitalized: true, trailingPunctuation: '' },
    ],
    dominantPattern: 'imperative',
    dominantCapitalization: true,
    dominantPunctuation: '',
    isConsistent: false,
    ...overrides,
  }
}

function makeResult(
  issues: ParallelStructureIssue[] = [],
  lists: ParallelStructureList[] = [],
): ParallelStructureResultType {
  return {
    type: 'parallel-structure',
    issues,
    lists,
  }
}

describe('ParallelStructureResult', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows "No issues found" when issues list is empty', () => {
    const wrapper = mount(ParallelStructureResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('No issues found')
  })

  it('shows issue count when there are issues', () => {
    const issues = [
      makeIssue(),
      makeIssue({ itemIndex: 2, itemLine: 6, itemAbsoluteOffset: 80, kind: 'capitalization', message: 'Inconsistent capitalization' }),
    ]
    const wrapper = mount(ParallelStructureResult, { props: { result: makeResult(issues, [makeList()]) } })
    expect(wrapper.text()).toContain('2 issues found across 1 list')
  })

  it('displays issue message', () => {
    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult([makeIssue({ message: 'Item uses a gerund instead of imperative' })], [makeList()]) },
    })
    expect(wrapper.text()).toContain('Item uses a gerund instead of imperative')
  })

  it('displays kind badge with correct text', () => {
    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult([makeIssue({ kind: 'punctuation' })], [makeList()]) },
    })
    const badge = wrapper.find('[data-testid="kind-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('punctuation')
  })

  it('displays line number', () => {
    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult([makeIssue({ itemLine: 42 })], [makeList()]) },
    })
    expect(wrapper.text()).toContain('Line 42')
  })

  it('shows Fix All button when more than 1 issue and API key configured', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore(pinia)
    settings.setKey('openai', 'test-key')

    const issues = [
      makeIssue(),
      makeIssue({ itemIndex: 2, itemLine: 6, itemAbsoluteOffset: 80, message: 'Another issue' }),
    ]
    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult(issues, [makeList()]) },
      global: { plugins: [pinia] },
    })

    expect(wrapper.find('[data-testid="fix-all-btn"]').exists()).toBe(true)
  })

  it('hides Fix All button when only 1 issue', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore(pinia)
    settings.setKey('openai', 'test-key')

    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult([makeIssue()], [makeList()]) },
      global: { plugins: [pinia] },
    })

    expect(wrapper.find('[data-testid="fix-all-btn"]').exists()).toBe(false)
  })

  it('shows Fix with AI button when API key configured', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore(pinia)
    settings.setKey('openai', 'test-key')

    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult([makeIssue()], [makeList()]) },
      global: { plugins: [pinia] },
    })

    expect(wrapper.find('[data-testid="fix-single-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="fix-single-btn"]').text()).toBe('Fix with AI')
  })

  it('hides Fix buttons when no API key', () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const issues = [
      makeIssue(),
      makeIssue({ itemIndex: 2, itemLine: 6, itemAbsoluteOffset: 80, message: 'Another' }),
    ]
    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult(issues, [makeList()]) },
      global: { plugins: [pinia] },
    })

    expect(wrapper.find('[data-testid="fix-all-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="fix-single-btn"]').exists()).toBe(false)
  })

  it('calls setHighlightRange when an issue is clicked', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult([makeIssue({ itemAbsoluteOffset: 50, itemLength: 20 })], [makeList()]) },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    const spy = vi.spyOn(store, 'setHighlightRange')

    await wrapper.find('[data-testid="parallel-issue"] .cursor-pointer').trigger('click')

    expect(spy).toHaveBeenCalledWith({ from: 50, to: 70 })
  })

  it('does not call setHighlightRange when merge is active', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const toolStore = useToolStore(pinia)
    toolStore.setMergeState('original', 'modified')

    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult([makeIssue({ itemAbsoluteOffset: 50, itemLength: 20 })], [makeList()]) },
      global: { plugins: [pinia] },
    })
    const spy = vi.spyOn(toolStore, 'setHighlightRange')

    await wrapper.find('[data-testid="parallel-issue"] div').trigger('click')

    expect(spy).not.toHaveBeenCalled()
  })

  it('disables Fix with AI button when merge is active', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore(pinia)
    settings.setKey('openai', 'test-key')
    const toolStore = useToolStore(pinia)
    toolStore.setMergeState('original', 'modified')

    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult([makeIssue()], [makeList()]) },
      global: { plugins: [pinia] },
    })

    const btn = wrapper.find('[data-testid="fix-single-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('disables Fix All button when merge is active', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore(pinia)
    settings.setKey('openai', 'test-key')
    const toolStore = useToolStore(pinia)
    toolStore.setMergeState('original', 'modified')

    const issues = [
      makeIssue(),
      makeIssue({ itemIndex: 2, itemLine: 6, itemAbsoluteOffset: 80, message: 'Another' }),
    ]
    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult(issues, [makeList()]) },
      global: { plugins: [pinia] },
    })

    const btn = wrapper.find('[data-testid="fix-all-btn"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('shows review message when merge is active', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const toolStore = useToolStore(pinia)
    toolStore.setMergeState('original', 'modified')

    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult([makeIssue()], [makeList()]) },
      global: { plugins: [pinia] },
    })

    expect(wrapper.text()).toContain('Review the pending suggestion')
  })

  it('removes cursor-pointer class when merge is active', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const toolStore = useToolStore(pinia)
    toolStore.setMergeState('original', 'modified')

    const wrapper = mount(ParallelStructureResult, {
      props: { result: makeResult([makeIssue()], [makeList()]) },
      global: { plugins: [pinia] },
    })

    const clickableEl = wrapper.find('[data-testid="parallel-issue"] .cursor-pointer')
    expect(clickableEl.exists()).toBe(false)
  })
})
