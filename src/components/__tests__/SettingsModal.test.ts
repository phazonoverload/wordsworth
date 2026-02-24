import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsModal from '../SettingsModal.vue'
import { useSettingsStore } from '@/stores/settings'

const mountModal = (props: { modelValue: boolean } = { modelValue: true }) =>
  mount(SettingsModal, {
    props,
    global: {
      stubs: { Teleport: true },
    },
  })

describe('SettingsModal', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the modal when modelValue is true', () => {
    const wrapper = mountModal({ modelValue: true })
    expect(wrapper.find('[data-testid="settings-modal"]').exists()).toBe(true)
  })

  it('does not render the modal when modelValue is false', () => {
    const wrapper = mountModal({ modelValue: false })
    expect(wrapper.find('[data-testid="settings-modal"]').exists()).toBe(false)
  })

  it('renders API key inputs for each provider', () => {
    const wrapper = mountModal()
    expect(wrapper.find('[data-testid="key-input-openai"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="key-input-anthropic"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="key-input-google"]').exists()).toBe(true)
  })

  it('renders a provider selection dropdown', async () => {
    const wrapper = mountModal()
    const select = wrapper.find('[data-testid="provider-select"]')
    expect(select.exists()).toBe(true)

    const options = select.findAll('option')
    const values = options.map((o) => o.element.value)
    expect(values).toContain('openai')
    expect(values).toContain('anthropic')
    expect(values).toContain('google')
  })

  it('updates the store when provider is changed', async () => {
    const wrapper = mountModal()
    const store = useSettingsStore()
    const spy = vi.spyOn(store, 'setProvider')

    const select = wrapper.find('[data-testid="provider-select"]')
    await select.setValue('anthropic')

    expect(spy).toHaveBeenCalledWith('anthropic')
  })

  it('renders a model selection dropdown that updates with provider', async () => {
    const wrapper = mountModal()

    // Default provider is openai, so model dropdown should have openai models
    const modelSelect = wrapper.find('[data-testid="model-select"]')
    expect(modelSelect.exists()).toBe(true)

    let options = modelSelect.findAll('option')
    let values = options.map((o) => o.element.value)
    expect(values).toContain('gpt-4o')
    expect(values).toContain('gpt-4o-mini')

    // Change provider to anthropic
    const providerSelect = wrapper.find('[data-testid="provider-select"]')
    await providerSelect.setValue('anthropic')

    const updatedOptions = wrapper.find('[data-testid="model-select"]').findAll('option')
    const updatedValues = updatedOptions.map((o) => o.element.value)
    expect(updatedValues).toContain('claude-sonnet-4-20250514')
    expect(updatedValues).toContain('claude-haiku-4-20250514')
  })

  it('calls settingsStore.setKey when entering an API key', async () => {
    const wrapper = mountModal()
    const store = useSettingsStore()
    const spy = vi.spyOn(store, 'setKey')

    const input = wrapper.find('[data-testid="key-input-openai"]')
    await input.setValue('sk-test-key-123')

    expect(spy).toHaveBeenCalledWith('openai', 'sk-test-key-123')
  })

  it('emits update:modelValue with false when close button is clicked', async () => {
    const wrapper = mountModal()

    const closeBtn = wrapper.find('[data-testid="close-button"]')
    await closeBtn.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('emits update:modelValue with false when overlay is clicked', async () => {
    const wrapper = mountModal()

    const overlay = wrapper.find('[data-testid="modal-overlay"]')
    await overlay.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('API key inputs default to password type with show/hide toggle', async () => {
    const wrapper = mountModal()

    const input = wrapper.find('[data-testid="key-input-openai"]')
    expect(input.attributes('type')).toBe('password')

    const toggle = wrapper.find('[data-testid="key-toggle-openai"]')
    expect(toggle.exists()).toBe(true)
    await toggle.trigger('click')

    expect(wrapper.find('[data-testid="key-input-openai"]').attributes('type')).toBe('text')

    // Toggle back
    await toggle.trigger('click')
    expect(wrapper.find('[data-testid="key-input-openai"]').attributes('type')).toBe('password')
  })

  it('shows a green dot indicator when a key is configured', async () => {
    const store = useSettingsStore()
    store.setKey('openai', 'sk-test-key')

    const wrapper = mountModal()

    const indicator = wrapper.find('[data-testid="key-indicator-openai"]')
    expect(indicator.exists()).toBe(true)
    expect(indicator.classes()).toContain('bg-green-500')
  })

  it('does not show a green dot when key is not configured', () => {
    const wrapper = mountModal()

    const indicator = wrapper.find('[data-testid="key-indicator-openai"]')
    // Either doesn't exist or doesn't have green class
    if (indicator.exists()) {
      expect(indicator.classes()).not.toContain('bg-green-500')
    }
  })

  it('calls settingsStore.setModel when model is changed', async () => {
    const wrapper = mountModal()
    const store = useSettingsStore()
    const spy = vi.spyOn(store, 'setModel')

    const modelSelect = wrapper.find('[data-testid="model-select"]')
    await modelSelect.setValue('gpt-4o')

    expect(spy).toHaveBeenCalledWith('gpt-4o')
  })
})
