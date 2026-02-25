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

  it('renders provider toggle buttons', () => {
    const wrapper = mountModal()
    const select = wrapper.find('[data-testid="provider-select"]')
    expect(select.exists()).toBe(true)
    expect(wrapper.find('[data-testid="provider-btn-openai"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="provider-btn-anthropic"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="provider-btn-google"]').exists()).toBe(true)
  })

  it('updates the store when provider button is clicked', async () => {
    const wrapper = mountModal()
    const store = useSettingsStore()
    const providerSpy = vi.spyOn(store, 'setProvider')
    const modelSpy = vi.spyOn(store, 'setModel')
    await wrapper.find('[data-testid="provider-btn-anthropic"]').trigger('click')
    expect(providerSpy).toHaveBeenCalledWith('anthropic')
    expect(modelSpy).toHaveBeenCalledWith('claude-haiku-4-5')
  })

  it('shows model name for selected provider', async () => {
    const wrapper = mountModal()
    // Default is OpenAI -> gpt-5-nano
    expect(wrapper.text()).toContain('gpt-5-nano')
    // Switch to anthropic
    await wrapper.find('[data-testid="provider-btn-anthropic"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('claude-haiku-4-5')
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

    // Switch to anthropic via button click
    await wrapper.find('[data-testid="provider-btn-anthropic"]').trigger('click')
    await wrapper.vm.$nextTick()

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

  it('calls settingsStore.setModel when provider button is clicked', async () => {
    const wrapper = mountModal()
    const store = useSettingsStore()
    const spy = vi.spyOn(store, 'setModel')
    await wrapper.find('[data-testid="provider-btn-google"]').trigger('click')
    expect(spy).toHaveBeenCalledWith('gemini-2.5-flash')
  })

  it('displays current provider label near key input', () => {
    const wrapper = mountModal()
    // Default is OpenAI
    expect(wrapper.text()).toContain('OpenAI')
  })
})
