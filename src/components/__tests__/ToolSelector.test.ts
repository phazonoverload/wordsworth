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

	it('renders a select with all 6 tools as options', () => {
		const wrapper = mount(ToolSelector)
		const options = wrapper.findAll('option').filter(o => o.text() !== 'Select a tool...')
		expect(options).toHaveLength(6)
	})

	it('displays tool labels in select options', () => {
		const wrapper = mount(ToolSelector)
		const text = wrapper.find('select').text()
		expect(text).toContain('Readability')
		expect(text).toContain('Style Check')
		expect(text).toContain('Pronouns')
		expect(text).toContain('Header Shift')
		expect(text).toContain('Cut 20%')
		expect(text).toContain('Promises')
	})

	it('renders options without optgroups', () => {
		const wrapper = mount(ToolSelector)
		expect(wrapper.findAll('optgroup')).toHaveLength(0)
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

	it('does not show Analyze with AI button for analysis tools', () => {
		const store = useToolStore()
		store.setActiveTool('readability')

		const wrapper = mount(ToolSelector)
		expect(wrapper.find('button').exists()).toBe(false)
	})
})
