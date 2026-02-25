import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StyleCheckResult from '../../results/StyleCheckResult.vue'
import { useToolStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import type { StyleCheckResult as StyleCheckResultType, StyleIssue } from '@/tools/types'

function makeIssue(overrides: Partial<StyleIssue> = {}): StyleIssue {
  return {
    severity: 'warning',
    category: 'passive-voice',
    message: 'Passive voice detected',
    line: 5,
    offset: 10,
    absoluteOffset: 50,
    length: 12,
    ...overrides,
  }
}

function makeResult(issues: StyleIssue[] = []): StyleCheckResultType {
  return {
    type: 'style-check',
    issues,
  }
}

describe('StyleCheckResult', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows "No issues found" when issues list is empty', () => {
    const wrapper = mount(StyleCheckResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('No issues found')
  })

  it('shows issue count', () => {
    const issues = [makeIssue(), makeIssue({ message: 'Jargon detected', category: 'jargon' })]
    const wrapper = mount(StyleCheckResult, { props: { result: makeResult(issues) } })
    expect(wrapper.text()).toContain('2')
  })

  it('displays issue message', () => {
    const wrapper = mount(StyleCheckResult, {
      props: { result: makeResult([makeIssue({ message: 'Avoid passive voice here' })]) },
    })
    expect(wrapper.text()).toContain('Avoid passive voice here')
  })

  it('displays issue category', () => {
    const wrapper = mount(StyleCheckResult, {
      props: { result: makeResult([makeIssue({ category: 'jargon' })]) },
    })
    expect(wrapper.text()).toContain('jargon')
  })

  it('displays line number', () => {
    const wrapper = mount(StyleCheckResult, {
      props: { result: makeResult([makeIssue({ line: 42 })]) },
    })
    expect(wrapper.text()).toContain('42')
  })

  it('displays suggestion when available', () => {
    const wrapper = mount(StyleCheckResult, {
      props: {
        result: makeResult([
          makeIssue({ suggestion: 'Use active voice instead' }),
        ]),
      },
    })
    expect(wrapper.text()).toContain('Use active voice instead')
  })

  it('uses warning color for warning severity', () => {
    const wrapper = mount(StyleCheckResult, {
      props: { result: makeResult([makeIssue({ severity: 'warning' })]) },
    })
    const badge = wrapper.find('[data-testid="severity-badge"]')
    expect(badge.classes()).toContain('bg-yellow-100')
  })

  it('uses info color for info severity', () => {
    const wrapper = mount(StyleCheckResult, {
      props: { result: makeResult([makeIssue({ severity: 'info' })]) },
    })
    const badge = wrapper.find('[data-testid="severity-badge"]')
    expect(badge.classes()).toContain('bg-blue-100')
  })

  it('calls setHighlightRange when an issue is clicked', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(StyleCheckResult, {
      props: { result: makeResult([makeIssue({ absoluteOffset: 50, length: 12 })]) },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    const spy = vi.spyOn(store, 'setHighlightRange')

    await wrapper.find('[data-testid="style-issue"] .cursor-pointer').trigger('click')

    expect(spy).toHaveBeenCalledWith({ from: 50, to: 62 })
  })

  it('issue elements have cursor-pointer for clickability', () => {
    const pinia = createPinia()
    const wrapper = mount(StyleCheckResult, {
      props: { result: makeResult([makeIssue()]) },
      global: { plugins: [pinia] },
    })

    const clickableEl = wrapper.find('[data-testid="style-issue"] .cursor-pointer')
    expect(clickableEl.exists()).toBe(true)
  })

  it('shows Fix All button when more than 1 issue and API key configured', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore(pinia)
    settings.setKey('openai', 'test-key')

    const issues = [makeIssue(), makeIssue({ message: 'Another issue', line: 10, absoluteOffset: 100 })]
    const wrapper = mount(StyleCheckResult, {
      props: { result: makeResult(issues) },
      global: { plugins: [pinia] },
    })

    expect(wrapper.find('[data-testid="fix-all-btn"]').exists()).toBe(true)
  })

  it('hides Fix All button when only 1 issue', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore(pinia)
    settings.setKey('openai', 'test-key')

    const wrapper = mount(StyleCheckResult, {
      props: { result: makeResult([makeIssue()]) },
      global: { plugins: [pinia] },
    })

    expect(wrapper.find('[data-testid="fix-all-btn"]').exists()).toBe(false)
  })

  it('shows Fix with AI button on each issue when API key configured', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settings = useSettingsStore(pinia)
    settings.setKey('openai', 'test-key')

    const wrapper = mount(StyleCheckResult, {
      props: { result: makeResult([makeIssue()]) },
      global: { plugins: [pinia] },
    })

    expect(wrapper.find('[data-testid="fix-single-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="fix-single-btn"]').text()).toBe('Fix with AI')
  })

  it('hides Fix buttons when no API key', () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const issues = [makeIssue(), makeIssue({ message: 'Another', line: 2, absoluteOffset: 20 })]
    const wrapper = mount(StyleCheckResult, {
      props: { result: makeResult(issues) },
      global: { plugins: [pinia] },
    })

    expect(wrapper.find('[data-testid="fix-all-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="fix-single-btn"]').exists()).toBe(false)
  })
})
