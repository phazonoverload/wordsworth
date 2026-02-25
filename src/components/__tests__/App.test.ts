import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '@/App.vue'

function mountApp() {
  return shallowMount(App, {
    global: {
      plugins: [createPinia()],
      stubs: {
        Teleport: true,
      },
    },
  })
}

describe('App', () => {
  it('renders the header with "Wordsworth"', () => {
    const wrapper = mountApp()
    const header = wrapper.find('header')
    expect(header.exists()).toBe(true)
    expect(header.text()).toContain('Wordsworth')
  })

  it('does not render ToolSelector directly (it is inside ResultsPane)', () => {
    const wrapper = mountApp()
    expect(wrapper.findComponent({ name: 'ToolSelector' }).exists()).toBe(false)
  })

  it('renders the EditorPane component', () => {
    const wrapper = mountApp()
    expect(wrapper.findComponent({ name: 'EditorPane' }).exists()).toBe(true)
  })

  it('renders the ReaderContext component', () => {
    const wrapper = mountApp()
    expect(wrapper.findComponent({ name: 'ReaderContext' }).exists()).toBe(true)
  })

  it('renders the ResultsPane component', () => {
    const wrapper = mountApp()
    expect(wrapper.findComponent({ name: 'ResultsPane' }).exists()).toBe(true)
  })

  it('renders a settings button', () => {
    const wrapper = mountApp()
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text().toLowerCase()).toContain('settings')
  })

  it('opens SettingsModal when settings button is clicked', async () => {
    const wrapper = mountApp()
    const settingsModal = wrapper.findComponent({ name: 'SettingsModal' })

    // Initially the modal should not be open (modelValue should be false)
    expect(settingsModal.props('modelValue')).toBe(false)

    // Click the settings button
    await wrapper.find('button').trigger('click')

    // Now the modal should be open (modelValue should be true)
    expect(settingsModal.props('modelValue')).toBe(true)
  })

  it('uses a full-height screen layout', () => {
    const wrapper = mountApp()
    const root = wrapper.find('div')
    expect(root.classes()).toContain('h-screen')
  })
})
