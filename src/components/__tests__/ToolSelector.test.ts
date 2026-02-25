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

  it('renders all 5 tools as buttons', () => {
    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(5)
  })

  it('displays tool labels', () => {
    const wrapper = mount(ToolSelector)
    expect(wrapper.text()).toContain('Readability')
    expect(wrapper.text()).toContain('Style Check')
    expect(wrapper.text()).toContain('Pronouns')
    expect(wrapper.text()).toContain('Cut 20%')
    expect(wrapper.text()).toContain('Promises')
  })

  it('calls setActiveTool and runTool when a tool is clicked', async () => {
    const wrapper = mount(ToolSelector)
    const store = useToolStore()
    const spy = vi.spyOn(store, 'setActiveTool')

    const buttons = wrapper.findAll('button')
    const readabilityBtn = buttons.find((b) => b.text().includes('Readability'))
    await readabilityBtn!.trigger('click')

    expect(spy).toHaveBeenCalledWith('readability')
    expect(runTool).toHaveBeenCalled()
  })

  it('highlights the active tool', () => {
    const store = useToolStore()
    store.setActiveTool('style-check')

    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')
    const styleBtn = buttons.find((b) => b.text().includes('Style Check'))

    expect(styleBtn!.classes()).toContain('active')
  })

  it('disables all buttons when a tool is running', () => {
    const store = useToolStore()
    store.setRunning(true)

    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')

    for (const btn of buttons) {
      expect(btn.attributes('disabled')).toBeDefined()
    }
  })

  it('disables AI tools when no key for current provider', () => {
    // Default provider is openai, no key set
    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')

    const cutBtn = buttons.find((b) => b.text().includes('Cut 20%'))
    const promisesBtn = buttons.find((b) => b.text().includes('Promises'))

    expect(cutBtn!.attributes('disabled')).toBeDefined()
    expect(promisesBtn!.attributes('disabled')).toBeDefined()
  })

  it('enables AI tools when key is set for current provider', () => {
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test-key')

    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')

    const cutBtn = buttons.find((b) => b.text().includes('Cut 20%'))
    const promisesBtn = buttons.find((b) => b.text().includes('Promises'))

    expect(cutBtn!.attributes('disabled')).toBeUndefined()
    expect(promisesBtn!.attributes('disabled')).toBeUndefined()
  })

  it('analysis tools are always enabled (when not running)', () => {
    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')

    const readabilityBtn = buttons.find((b) => b.text().includes('Readability'))
    const styleBtn = buttons.find((b) => b.text().includes('Style Check'))
    const pronounsBtn = buttons.find((b) => b.text().includes('Pronouns'))

    expect(readabilityBtn!.attributes('disabled')).toBeUndefined()
    expect(styleBtn!.attributes('disabled')).toBeUndefined()
    expect(pronounsBtn!.attributes('disabled')).toBeUndefined()
  })
})
