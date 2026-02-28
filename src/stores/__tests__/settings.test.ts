import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('settingsStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with no API keys', () => {
    const store = useSettingsStore()
    expect(store.keys).toEqual({})
  })

  it('sets an API key', () => {
    const store = useSettingsStore()
    store.setKey('openai', 'sk-test-123')
    expect(store.keys.openai).toBe('sk-test-123')
  })

  it('removes an API key by setting empty string', () => {
    const store = useSettingsStore()
    store.setKey('openai', 'sk-test-123')
    store.setKey('openai', '')
    expect(store.keys.openai).toBe('')
  })

  it('reports whether any key is configured', () => {
    const store = useSettingsStore()
    expect(store.hasAnyKey).toBe(false)
    store.setKey('anthropic', 'sk-ant-test')
    expect(store.hasAnyKey).toBe(true)
  })

  it('persists keys to localStorage', () => {
    const store = useSettingsStore()
    store.setKey('google', 'goog-key')
    const raw = JSON.parse(localStorage.getItem('wordsworth:keys')!)
    expect(raw.google).toBe('goog-key')
  })

  it('loads keys from localStorage on init', () => {
    localStorage.setItem('wordsworth:keys', JSON.stringify({ openai: 'sk-saved' }))
    const store = useSettingsStore()
    expect(store.keys.openai).toBe('sk-saved')
  })

  it('sets and persists provider and model', () => {
    const store = useSettingsStore()
    store.setProvider('anthropic')
    store.setModel('claude-sonnet')
    expect(store.provider).toBe('anthropic')
    expect(store.model).toBe('claude-sonnet')
    const raw = JSON.parse(localStorage.getItem('wordsworth:settings')!)
    expect(raw.provider).toBe('anthropic')
    expect(raw.model).toBe('claude-sonnet')
  })

  it('loads provider and model from localStorage', () => {
    localStorage.setItem(
      'wordsworth:settings',
      JSON.stringify({ provider: 'google', model: 'gemini-flash' })
    )
    const store = useSettingsStore()
    expect(store.provider).toBe('google')
    expect(store.model).toBe('gemini-flash')
  })

  it('reports hasKeyForCurrentProvider as false when no key set', () => {
    const store = useSettingsStore()
    expect(store.hasKeyForCurrentProvider).toBe(false)
  })

  it('reports hasKeyForCurrentProvider as true when key set for current provider', () => {
    const store = useSettingsStore()
    store.setKey('openai', 'sk-test')
    expect(store.hasKeyForCurrentProvider).toBe(true)
  })

  it('reports hasKeyForCurrentProvider as false when key set for different provider', () => {
    const store = useSettingsStore()
    store.setKey('anthropic', 'sk-ant-test')
    // Default provider is openai
    expect(store.hasKeyForCurrentProvider).toBe(false)
  })

  it('updates hasKeyForCurrentProvider when provider changes', () => {
    const store = useSettingsStore()
    store.setKey('anthropic', 'sk-ant-test')
    store.setProvider('anthropic')
    expect(store.hasKeyForCurrentProvider).toBe(true)
  })

  // Ollama-specific tests
  it('reports isConfigured as true when provider is ollama (no key needed)', () => {
    const store = useSettingsStore()
    store.setProvider('ollama')
    expect(store.isConfigured).toBe(true)
    expect(store.hasKeyForCurrentProvider).toBe(true) // alias
  })

  it('defaults ollamaBaseUrl to localhost:11434', () => {
    const store = useSettingsStore()
    expect(store.ollamaBaseUrl).toBe('http://localhost:11434')
  })

  it('sets and persists ollamaBaseUrl', () => {
    const store = useSettingsStore()
    store.setOllamaBaseUrl('http://localhost:9999')
    expect(store.ollamaBaseUrl).toBe('http://localhost:9999')
    const raw = JSON.parse(localStorage.getItem('wordsworth:settings')!)
    expect(raw.ollamaBaseUrl).toBe('http://localhost:9999')
  })

  it('loads ollamaBaseUrl from localStorage', () => {
    localStorage.setItem(
      'wordsworth:settings',
      JSON.stringify({ provider: 'ollama', model: 'llama3.1:8b', ollamaBaseUrl: 'http://myhost:11434' })
    )
    const store = useSettingsStore()
    expect(store.ollamaBaseUrl).toBe('http://myhost:11434')
  })

  it('ignores setKey calls for ollama provider', () => {
    const store = useSettingsStore()
    store.setKey('ollama', 'should-not-be-stored')
    expect(store.keys).toEqual({})
  })

  describe('OLLAMA_DISABLED', () => {
    it('exports OLLAMA_DISABLED constant', async () => {
      const { OLLAMA_DISABLED } = await import('@/stores/settings')
      expect(typeof OLLAMA_DISABLED).toBe('boolean')
    })

    it('isConfigured respects OLLAMA_DISABLED for ollama provider', async () => {
      const { OLLAMA_DISABLED } = await import('@/stores/settings')
      const store = useSettingsStore()
      store.setProvider('ollama')
      if (OLLAMA_DISABLED) {
        expect(store.isConfigured).toBe(false)
      } else {
        expect(store.isConfigured).toBe(true)
      }
    })
  })
})
