import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/tools/runner', () => ({
  runTool: vi.fn(),
}))

import ToolSelector from '../ToolSelector.vue'
import { useToolStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import { runTool } from '@/tools/runner'

describe('ToolSelector', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders a select with all 4 tools as options', () => {
    const wrapper = mount(ToolSelector)
    const options = wrapper.findAll('option').filter(o => o.text() !== 'Select a tool...')
    expect(options).toHaveLength(4)
  })

  it('displays tool labels in select options', () => {
    const wrapper = mount(ToolSelector)
    const text = wrapper.find('select').text()
    expect(text).toContain('Readability')
    expect(text).toContain('Style Check')
    expect(text).toContain('Pronouns')
    expect(text).toContain('Promises')
  })

  it('calls setActiveTool and runTool when an analysis tool is selected', async () => {
    const wrapper = mount(ToolSelector)
    const store = useToolStore()
    const spy = vi.spyOn(store, 'setActiveTool')

    await wrapper.find('select').setValue('readability')

    expect(spy).toHaveBeenCalledWith('readability')
    expect(runTool).toHaveBeenCalled()
  })

  it('sets the select value to the active tool', () => {
    const store = useToolStore()
    store.setActiveTool('style-check')

    const wrapper = mount(ToolSelector)
    const select = wrapper.find('select').element as HTMLSelectElement
    expect(select.value).toBe('style-check')
  })

  it('disables select when a tool is running', () => {
    const store = useToolStore()
    store.setRunning(true)

    const wrapper = mount(ToolSelector)
    expect(wrapper.find('select').attributes('disabled')).toBeDefined()
  })

  it('disables AI tool options when no key for current provider', () => {
    const wrapper = mount(ToolSelector)
    const promisesOption = wrapper.findAll('option').find(o => o.text() === 'Promises')
    expect(promisesOption!.attributes('disabled')).toBeDefined()
  })

  it('enables AI tool options when key is set for current provider', () => {
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test-key')

    const wrapper = mount(ToolSelector)
    const promisesOption = wrapper.findAll('option').find(o => o.text() === 'Promises')
    expect(promisesOption!.attributes('disabled')).toBeUndefined()
  })

  it('shows Analyze with AI button when AI tool is selected', async () => {
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test-key')
    const store = useToolStore()
    store.setActiveTool('promise-tracker')

    const wrapper = mount(ToolSelector)
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Analyze with AI')
  })

  it('does not show Analyze with AI button for analysis tools', () => {
    const store = useToolStore()
    store.setActiveTool('readability')

    const wrapper = mount(ToolSelector)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('calls runTool when Analyze with AI button is clicked', async () => {
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test-key')
    const store = useToolStore()
    store.setActiveTool('promise-tracker')

    const wrapper = mount(ToolSelector)
    await wrapper.find('button').trigger('click')
    expect(runTool).toHaveBeenCalled()
  })

  it('does not call runTool when AI tool is selected from dropdown', async () => {
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test-key')

    const wrapper = mount(ToolSelector)
    await wrapper.find('select').setValue('promise-tracker')

    expect(runTool).not.toHaveBeenCalled()
  })
})
