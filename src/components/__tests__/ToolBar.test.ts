import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/tools/runner', () => ({
  runTool: vi.fn(),
}))

import ToolBar from '../ToolBar.vue'
import { useToolStore } from '@/stores/tools'
import { runTool } from '@/tools/runner'

describe('ToolBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders all 5 tools', () => {
    const wrapper = mount(ToolBar)
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(5)
  })

  it('shows category headers for Analysis and AI', () => {
    const wrapper = mount(ToolBar)
    const headers = wrapper.findAll('h3')
    const headerTexts = headers.map((h) => h.text())
    expect(headerTexts).toContain('Analysis')
    expect(headerTexts).toContain('AI')
  })

  it('displays tool label and description on each button', () => {
    const wrapper = mount(ToolBar)
    const buttons = wrapper.findAll('button')

    const readabilityBtn = buttons.find((b) => b.text().includes('Readability'))
    expect(readabilityBtn).toBeDefined()
    expect(readabilityBtn!.text()).toContain('Flesch-Kincaid')

    const cutBtn = buttons.find((b) => b.text().includes('Cut 20%'))
    expect(cutBtn).toBeDefined()
    expect(cutBtn!.text()).toContain('Trim text')
  })

  it('calls setActiveTool and runTool when a tool is clicked', async () => {
    const wrapper = mount(ToolBar)
    const store = useToolStore()
    const spy = vi.spyOn(store, 'setActiveTool')

    const buttons = wrapper.findAll('button')
    const readabilityBtn = buttons.find((b) => b.text().includes('Readability'))
    await readabilityBtn!.trigger('click')

    expect(spy).toHaveBeenCalledWith('readability')
    expect(runTool).toHaveBeenCalled()
  })

  it('highlights the active tool with an active class', () => {
    const store = useToolStore()
    store.setActiveTool('style-check')

    const wrapper = mount(ToolBar)
    const buttons = wrapper.findAll('button')
    const styleBtn = buttons.find((b) => b.text().includes('Style Check'))

    expect(styleBtn!.classes()).toContain('active')
  })

  it('disables buttons when a tool is running', () => {
    const store = useToolStore()
    store.setRunning(true)

    const wrapper = mount(ToolBar)
    const buttons = wrapper.findAll('button')

    for (const btn of buttons) {
      expect(btn.attributes('disabled')).toBeDefined()
    }
  })

  it('shows a running indicator when isRunning is true', () => {
    const store = useToolStore()
    store.setRunning(true)

    const wrapper = mount(ToolBar)
    expect(wrapper.text()).toContain('Running...')
  })

  it('does not show running indicator when not running', () => {
    const wrapper = mount(ToolBar)
    expect(wrapper.text()).not.toContain('Running...')
  })
})
