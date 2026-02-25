import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HeaderShiftResult from '../../results/HeaderShiftResult.vue'
import type { HeaderShiftResult as HeaderShiftResultType } from '@/tools/types'
import { useDocumentStore } from '@/stores/document'
import { useToolStore } from '@/stores/tools'

function makeResult(overrides: Partial<HeaderShiftResultType> = {}): HeaderShiftResultType {
  return {
    type: 'header-shift',
    headerCounts: { 1: 1, 2: 3, 3: 1, 4: 0, 5: 0, 6: 0 },
    totalHeaders: 5,
    ...overrides,
  }
}

describe('HeaderShiftResult', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('displays total header count', () => {
    const wrapper = mount(HeaderShiftResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('5 headers')
  })

  it('displays header counts by level', () => {
    const wrapper = mount(HeaderShiftResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('H1')
    expect(wrapper.text()).toContain('H2')
    expect(wrapper.text()).toContain('H3')
  })

  it('only displays levels that have headers', () => {
    const wrapper = mount(HeaderShiftResult, {
      props: { result: makeResult({ headerCounts: { 1: 0, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0 }, totalHeaders: 2 }) },
    })
    const badges = wrapper.findAll('[data-testid="header-level-badge"]')
    expect(badges.length).toBe(1)
    expect(badges[0]!.text()).toContain('H2')
  })

  it('shows Promote and Demote buttons', () => {
    const wrapper = mount(HeaderShiftResult, { props: { result: makeResult() } })
    expect(wrapper.find('[data-testid="promote-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="demote-btn"]').exists()).toBe(true)
  })

  it('promotes headers and updates document content', async () => {
    const docStore = useDocumentStore()
    docStore.setContent('## Title\n### Subtitle\nSome text')

    const toolStore = useToolStore()
    toolStore.setActiveTool('header-shift')

    const result = makeResult({ headerCounts: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0 }, totalHeaders: 2 })
    const wrapper = mount(HeaderShiftResult, { props: { result } })

    await wrapper.find('[data-testid="promote-btn"]').trigger('click')
    expect(docStore.content).toBe('# Title\n## Subtitle\nSome text')
  })

  it('demotes headers and updates document content', async () => {
    const docStore = useDocumentStore()
    docStore.setContent('# Title\n## Subtitle\nSome text')

    const toolStore = useToolStore()
    toolStore.setActiveTool('header-shift')

    const result = makeResult({ headerCounts: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0 }, totalHeaders: 2 })
    const wrapper = mount(HeaderShiftResult, { props: { result } })

    await wrapper.find('[data-testid="demote-btn"]').trigger('click')
    expect(docStore.content).toBe('## Title\n### Subtitle\nSome text')
  })

  it('shows error message when promote fails (H1 exists)', async () => {
    const docStore = useDocumentStore()
    docStore.setContent('# Already H1\n## Another')

    const toolStore = useToolStore()
    toolStore.setActiveTool('header-shift')

    const result = makeResult()
    const wrapper = mount(HeaderShiftResult, { props: { result } })

    await wrapper.find('[data-testid="promote-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('H1')
  })

  it('shows error message when demote fails (H6 exists)', async () => {
    const docStore = useDocumentStore()
    docStore.setContent('###### Already H6\n## Another')

    const toolStore = useToolStore()
    toolStore.setActiveTool('header-shift')

    const result = makeResult({ headerCounts: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 1 }, totalHeaders: 2 })
    const wrapper = mount(HeaderShiftResult, { props: { result } })

    await wrapper.find('[data-testid="demote-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('H6')
  })

  it('shows Undo button after a shift', async () => {
    const docStore = useDocumentStore()
    docStore.setContent('## Title\n### Subtitle')

    const toolStore = useToolStore()
    toolStore.setActiveTool('header-shift')

    const result = makeResult({ headerCounts: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0 }, totalHeaders: 2 })
    const wrapper = mount(HeaderShiftResult, { props: { result } })

    expect(wrapper.find('[data-testid="undo-btn"]').exists()).toBe(false)
    await wrapper.find('[data-testid="promote-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="undo-btn"]').exists()).toBe(true)
  })

  it('undo restores original content', async () => {
    const docStore = useDocumentStore()
    docStore.setContent('## Title\n### Subtitle')

    const toolStore = useToolStore()
    toolStore.setActiveTool('header-shift')

    const result = makeResult({ headerCounts: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0 }, totalHeaders: 2 })
    const wrapper = mount(HeaderShiftResult, { props: { result } })

    await wrapper.find('[data-testid="promote-btn"]').trigger('click')
    expect(docStore.content).toBe('# Title\n## Subtitle')

    await wrapper.find('[data-testid="undo-btn"]').trigger('click')
    expect(docStore.content).toBe('## Title\n### Subtitle')
  })

  it('shows shifted count message after applying', async () => {
    const docStore = useDocumentStore()
    docStore.setContent('## Title\n### Subtitle')

    const toolStore = useToolStore()
    toolStore.setActiveTool('header-shift')

    const result = makeResult({ headerCounts: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0 }, totalHeaders: 2 })
    const wrapper = mount(HeaderShiftResult, { props: { result } })

    await wrapper.find('[data-testid="promote-btn"]').trigger('click')
    expect(wrapper.text()).toContain('2 headers promoted')
  })

  it('shows no-headers message when document has no headers', () => {
    const wrapper = mount(HeaderShiftResult, {
      props: { result: makeResult({ headerCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }, totalHeaders: 0 }) },
    })
    expect(wrapper.text()).toContain('No headers found')
  })
})
