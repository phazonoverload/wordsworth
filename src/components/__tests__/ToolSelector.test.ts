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

	it('renders all 9 tools as buttons in a grid', () => {
		const wrapper = mount(ToolSelector)
		const grid = wrapper.find('.grid')
		expect(grid.exists()).toBe(true)
		expect(grid.classes()).toContain('grid-cols-3')
		const buttons = grid.findAll('button')
		expect(buttons).toHaveLength(9)
	})

	it('displays tool labels on the buttons', () => {
		const wrapper = mount(ToolSelector)
		const grid = wrapper.find('.grid')
		const text = grid.text()
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

		const grid = wrapper.find('.grid')
		const readabilityBtn = grid.findAll('button').find(b => b.text() === 'Readability')!
		await readabilityBtn.trigger('click')

		expect(spy).toHaveBeenCalledWith('readability')
		expect(runTool).toHaveBeenCalled()
	})

	it('highlights the active tool button', () => {
		const store = useToolStore()
		store.setActiveTool('style-check')

		const wrapper = mount(ToolSelector)
		const grid = wrapper.find('.grid')
		const styleBtn = grid.findAll('button').find(b => b.text() === 'Style Check')!
		expect(styleBtn.classes()).toContain('border-orange-400')
	})

	it('disables all buttons when a tool is running', () => {
		const store = useToolStore()
		store.setRunning(true)

		const wrapper = mount(ToolSelector)
		const grid = wrapper.find('.grid')
		const buttons = grid.findAll('button')
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
