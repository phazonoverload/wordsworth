import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/tools/runner', () => ({
	runTool: vi.fn(),
}))

import ToolSelector from '../ToolSelector.vue'
import { useToolStore } from '@/stores/tools'
import { runTool } from '@/tools/runner'

describe('ToolSelector', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
		vi.clearAllMocks()
	})

	it('renders all 9 tools as buttons that become a 3x3 grid on desktop', () => {
		const wrapper = mount(ToolSelector)
		const container = wrapper.find('.tool-selector > div')
		expect(container.exists()).toBe(true)
		expect(container.classes()).toContain('md:grid')
		expect(container.classes()).toContain('md:grid-cols-3')
		const buttons = container.findAll('button')
		expect(buttons).toHaveLength(9)
	})

	it('renders as a horizontally-scrollable row on mobile', () => {
		const wrapper = mount(ToolSelector)
		const container = wrapper.find('.tool-selector > div')
		expect(container.classes()).toContain('flex')
		expect(container.classes()).toContain('overflow-x-auto')
	})

	it('displays tool labels on the buttons', () => {
		const wrapper = mount(ToolSelector)
		const container = wrapper.find('.tool-selector > div')
		const text = container.text()
		expect(text).toContain('Readability')
		expect(text).toContain('Style Check')
		expect(text).toContain('Pronouns')
		expect(text).toContain('Header Shift')
		expect(text).toContain('Cut 20%')
		expect(text).toContain('Promises')
	})

	it('calls setActiveTool and runTool when an analysis tool is clicked', async () => {
		const wrapper = mount(ToolSelector)
		const store = useToolStore()
		const spy = vi.spyOn(store, 'setActiveTool')

		const container = wrapper.find('.tool-selector > div')
		const readabilityBtn = container.findAll('button').find(b => b.text() === 'Readability')!
		await readabilityBtn.trigger('click')

		expect(spy).toHaveBeenCalledWith('readability')
		expect(runTool).toHaveBeenCalled()
	})

	it('highlights the active tool button', () => {
		const store = useToolStore()
		store.setActiveTool('style-check')

		const wrapper = mount(ToolSelector)
		const container = wrapper.find('.tool-selector > div')
		const styleBtn = container.findAll('button').find(b => b.text() === 'Style Check')!
		expect(styleBtn.classes()).toContain('border-orange-400')
	})

	it('disables all buttons when a tool is running', () => {
		const store = useToolStore()
		store.setRunning(true)

		const wrapper = mount(ToolSelector)
		const container = wrapper.find('.tool-selector > div')
		const buttons = container.findAll('button')
		for (const btn of buttons) {
			expect(btn.attributes('disabled')).toBeDefined()
		}
	})

	it('does not show Analyze with AI button for analysis tools', () => {
		const store = useToolStore()
		store.setActiveTool('readability')

		const wrapper = mount(ToolSelector)
		const allButtons = wrapper.findAll('button')
		const aiButton = allButtons.find(b => b.text() === 'Analyze with AI')
		expect(aiButton).toBeUndefined()
	})
})
