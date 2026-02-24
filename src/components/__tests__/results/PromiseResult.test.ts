import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PromiseResult from '../../results/PromiseResult.vue'
import type {
  PromiseResult as PromiseResultType,
  Promise as PromiseType,
  PromiseVerdict,
} from '@/tools/types'

function makePromise(overrides: Partial<PromiseType> = {}): PromiseType {
  return {
    id: 'p1',
    text: 'This article will explain testing.',
    ...overrides,
  }
}

function makeVerdict(overrides: Partial<PromiseVerdict> = {}): PromiseVerdict {
  return {
    promiseId: 'p1',
    verdict: 'pass',
    evidence: 'Testing was thoroughly explained in paragraphs 3-5.',
    ...overrides,
  }
}

function makeResult(
  promises: PromiseType[] = [makePromise()],
  verdicts: PromiseVerdict[] = [makeVerdict()],
): PromiseResultType {
  return {
    type: 'promise-tracker',
    promises,
    verdicts,
  }
}

describe('PromiseResult', () => {
  it('displays promise text', () => {
    const wrapper = mount(PromiseResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('This article will explain testing.')
  })

  it('displays evidence text', () => {
    const wrapper = mount(PromiseResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('Testing was thoroughly explained in paragraphs 3-5.')
  })

  it('displays summary of fulfilled promises', () => {
    const promises = [makePromise({ id: 'p1' }), makePromise({ id: 'p2', text: 'Second promise' })]
    const verdicts = [
      makeVerdict({ promiseId: 'p1', verdict: 'pass' }),
      makeVerdict({ promiseId: 'p2', verdict: 'fail' }),
    ]
    const wrapper = mount(PromiseResult, { props: { result: makeResult(promises, verdicts) } })
    expect(wrapper.text()).toContain('1 of 2')
  })

  it('shows green styling for pass verdict', () => {
    const wrapper = mount(PromiseResult, {
      props: { result: makeResult([makePromise()], [makeVerdict({ verdict: 'pass' })]) },
    })
    const verdictEl = wrapper.find('[data-testid="verdict-p1"]')
    expect(verdictEl.classes()).toContain('text-green-600')
  })

  it('shows red styling for fail verdict', () => {
    const wrapper = mount(PromiseResult, {
      props: { result: makeResult([makePromise()], [makeVerdict({ verdict: 'fail' })]) },
    })
    const verdictEl = wrapper.find('[data-testid="verdict-p1"]')
    expect(verdictEl.classes()).toContain('text-red-600')
  })

  it('shows yellow styling for partial verdict', () => {
    const wrapper = mount(PromiseResult, {
      props: { result: makeResult([makePromise()], [makeVerdict({ verdict: 'partial' })]) },
    })
    const verdictEl = wrapper.find('[data-testid="verdict-p1"]')
    expect(verdictEl.classes()).toContain('text-yellow-600')
  })

  it('displays pass icon', () => {
    const wrapper = mount(PromiseResult, {
      props: { result: makeResult([makePromise()], [makeVerdict({ verdict: 'pass' })]) },
    })
    const verdictEl = wrapper.find('[data-testid="verdict-p1"]')
    expect(verdictEl.text()).toContain('\u2713')
  })

  it('displays fail icon', () => {
    const wrapper = mount(PromiseResult, {
      props: { result: makeResult([makePromise()], [makeVerdict({ verdict: 'fail' })]) },
    })
    const verdictEl = wrapper.find('[data-testid="verdict-p1"]')
    expect(verdictEl.text()).toContain('\u2717')
  })

  it('displays partial icon', () => {
    const wrapper = mount(PromiseResult, {
      props: { result: makeResult([makePromise()], [makeVerdict({ verdict: 'partial' })]) },
    })
    const verdictEl = wrapper.find('[data-testid="verdict-p1"]')
    expect(verdictEl.text()).toContain('\u26A0')
  })
})
