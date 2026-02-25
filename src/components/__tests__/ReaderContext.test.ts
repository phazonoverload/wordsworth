import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ReaderContext from '../ReaderContext.vue'
import { useDocumentStore } from '@/stores/document'

describe('ReaderContext', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders all preset options in the select', () => {
    const wrapper = mount(ReaderContext)
    const options = wrapper.find('select').findAll('option')
    const labels = options.map((o) => o.text())

    expect(labels).toContain('Senior developers')
    expect(labels).toContain('Junior developers')
    expect(labels).toContain('Non-technical stakeholders')
    expect(labels).toContain('General audience')
    expect(labels).toContain('Custom...')
    expect(options).toHaveLength(5)
  })

  it('renders a description text input', () => {
    const wrapper = mount(ReaderContext)
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
  })

  it('populates description when a preset is selected', async () => {
    const wrapper = mount(ReaderContext)
    const select = wrapper.find('select')

    await select.setValue('senior-devs')

    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toBe(
      'Senior developers who are familiar with the tech stack and comfortable with technical jargon, acronyms, and advanced concepts',
    )
  })

  it('syncs preset selection with the document store', async () => {
    const wrapper = mount(ReaderContext)
    const store = useDocumentStore()
    const select = wrapper.find('select')

    await select.setValue('junior-devs')

    expect(store.readerContext.preset).toBe('junior-devs')
    expect(store.readerContext.description).toBe(
      'Junior developers who are still learning the basics and benefit from clear explanations, defined terms, and step-by-step reasoning',
    )
  })

  it('shows empty description when Custom is selected', async () => {
    const wrapper = mount(ReaderContext)
    const select = wrapper.find('select')

    await select.setValue('custom')

    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toBe('')
  })

  it('allows custom description input and syncs with store', async () => {
    const wrapper = mount(ReaderContext)
    const store = useDocumentStore()
    const select = wrapper.find('select')

    await select.setValue('custom')

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Data scientists with ML experience')

    expect(store.readerContext.description).toBe(
      'Data scientists with ML experience',
    )
    expect(store.readerContext.preset).toBe('custom')
  })

  it('allows editing the description after selecting a preset', async () => {
    const wrapper = mount(ReaderContext)
    const store = useDocumentStore()
    const select = wrapper.find('select')

    await select.setValue('general')

    const textarea = wrapper.find('textarea')
    expect(textarea.element.value).toBe('A general technical audience with mixed experience levels who appreciate clear writing without assuming deep domain expertise')

    await textarea.setValue('A general technical audience with mixed experience levels who appreciate clear writing without assuming deep domain expertise, plus some domain knowledge')

    expect(store.readerContext.description).toBe(
      'A general technical audience with mixed experience levels who appreciate clear writing without assuming deep domain expertise, plus some domain knowledge',
    )
  })

  it('has a label containing Target Audience or Reader Context', () => {
    const wrapper = mount(ReaderContext)
    const text = wrapper.text()
    const hasLabel =
      text.includes('Target Audience') || text.includes('Reader Context')
    expect(hasLabel).toBe(true)
  })
})
