import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StyleCheckResult from '../../results/StyleCheckResult.vue'
import type { StyleCheckResult as StyleCheckResultType, StyleIssue } from '@/tools/types'

function makeIssue(overrides: Partial<StyleIssue> = {}): StyleIssue {
  return {
    severity: 'warning',
    category: 'passive-voice',
    message: 'Passive voice detected',
    line: 5,
    offset: 10,
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
})
