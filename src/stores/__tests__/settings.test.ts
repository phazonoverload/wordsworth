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
})
