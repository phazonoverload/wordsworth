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

  it('renders a single API key input (not three)', () => {
    const wrapper = mountModal()
    const inputs = wrapper.findAll('[data-testid="key-input"]')
    expect(inputs).toHaveLength(1)
    // Old per-provider inputs should not exist
    expect(wrapper.find('[data-testid="key-input-openai"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="key-input-anthropic"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="key-input-google"]').exists()).toBe(false)
  })

  it('renders a provider selection dropdown', () => {
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
    const modelSelect = wrapper.find('[data-testid="model-select"]')
    expect(modelSelect.exists()).toBe(true)
    let options = modelSelect.findAll('option')
    let values = options.map((o) => o.element.value)
    expect(values).toContain('gpt-4o')
    const providerSelect = wrapper.find('[data-testid="provider-select"]')
    await providerSelect.setValue('anthropic')
    const updatedOptions = wrapper.find('[data-testid="model-select"]').findAll('option')
    const updatedValues = updatedOptions.map((o) => o.element.value)
    expect(updatedValues).toContain('claude-sonnet-4-20250514')
  })

  it('calls settingsStore.setKey with current provider when entering an API key', async () => {
    const wrapper = mountModal()
    const store = useSettingsStore()
    const spy = vi.spyOn(store, 'setKey')
    const input = wrapper.find('[data-testid="key-input"]')
    await input.setValue('sk-test-key-123')
    expect(spy).toHaveBeenCalledWith('openai', 'sk-test-key-123')
  })

  it('key input shows the key for the selected provider', async () => {
    const store = useSettingsStore()
    store.setKey('anthropic', 'sk-ant-key')
    const wrapper = mountModal()

    // Switch to anthropic
    const providerSelect = wrapper.find('[data-testid="provider-select"]')
    await providerSelect.setValue('anthropic')

    const input = wrapper.find('[data-testid="key-input"]')
    expect((input.element as HTMLInputElement).value).toBe('sk-ant-key')
  })

  it('emits update:modelValue with false when close button is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="close-button"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('emits update:modelValue with false when overlay is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="modal-overlay"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('API key input defaults to password type with show/hide toggle', async () => {
    const wrapper = mountModal()
    const input = wrapper.find('[data-testid="key-input"]')
    expect(input.attributes('type')).toBe('password')

    const toggle = wrapper.find('[data-testid="key-toggle"]')
    expect(toggle.exists()).toBe(true)
    await toggle.trigger('click')
    expect(wrapper.find('[data-testid="key-input"]').attributes('type')).toBe('text')
    await toggle.trigger('click')
    expect(wrapper.find('[data-testid="key-input"]').attributes('type')).toBe('password')
  })

  it('shows green indicator when current provider has key', () => {
    const store = useSettingsStore()
    store.setKey('openai', 'sk-test')
    const wrapper = mountModal()
    const indicator = wrapper.find('[data-testid="key-indicator"]')
    expect(indicator.classes()).toContain('bg-green-500')
  })

  it('shows gray indicator when current provider has no key', () => {
    const wrapper = mountModal()
    const indicator = wrapper.find('[data-testid="key-indicator"]')
    expect(indicator.classes()).toContain('bg-gray-300')
  })

  it('calls settingsStore.setModel when model is changed', async () => {
    const wrapper = mountModal()
    const store = useSettingsStore()
    const spy = vi.spyOn(store, 'setModel')
    const modelSelect = wrapper.find('[data-testid="model-select"]')
    await modelSelect.setValue('gpt-4o')
    expect(spy).toHaveBeenCalledWith('gpt-4o')
  })

  it('displays current provider label near key input', () => {
    const wrapper = mountModal()
    // Default is OpenAI
    expect(wrapper.text()).toContain('OpenAI')
  })
})
