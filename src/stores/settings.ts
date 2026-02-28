import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/lib/storage'

export type ProviderId = 'openai' | 'anthropic' | 'google' | 'ollama'

export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434'
export const DEFAULT_OLLAMA_MODEL = 'llama3.1:8b'
export const OLLAMA_DISABLED = !!import.meta.env.VITE_DISABLE_OLLAMA

export interface ApiKeys {
  openai?: string
  anthropic?: string
  google?: string
}

export const useSettingsStore = defineStore('settings', () => {
  const savedKeys = storage.get<ApiKeys>('wordsworth:keys')
  const savedSettings = storage.get<{ provider: string; model: string; ollamaBaseUrl?: string }>('wordsworth:settings')

  const keys = ref<ApiKeys>(savedKeys ?? {})
  const provider = ref(savedSettings?.provider ?? 'openai')
  const model = ref(savedSettings?.model ?? 'gpt-5-nano')
  const ollamaBaseUrl = ref(savedSettings?.ollamaBaseUrl ?? DEFAULT_OLLAMA_BASE_URL)

  const hasAnyKey = computed(() =>
    Object.values(keys.value).some((k) => k && k.length > 0)
  )

  const isConfigured = computed(() => {
    if (provider.value === 'ollama') return !OLLAMA_DISABLED
    const k = keys.value[provider.value as keyof ApiKeys]
    return !!k && k.length > 0
  })

  /** @deprecated Use isConfigured instead */
  const hasKeyForCurrentProvider = isConfigured

  function setKey(providerId: ProviderId, key: string) {
    if (providerId === 'ollama') return
    keys.value[providerId] = key
    storage.set('wordsworth:keys', keys.value)
  }

  function setProvider(p: string) {
    provider.value = p
    persistSettings()
  }

  function setModel(m: string) {
    model.value = m
    persistSettings()
  }

  function setOllamaBaseUrl(url: string) {
    ollamaBaseUrl.value = url
    persistSettings()
  }

  function persistSettings() {
    storage.set('wordsworth:settings', {
      provider: provider.value,
      model: model.value,
      ollamaBaseUrl: ollamaBaseUrl.value,
    })
  }

  return {
    keys,
    provider,
    model,
    ollamaBaseUrl,
    hasAnyKey,
    hasKeyForCurrentProvider,
    isConfigured,
    setKey,
    setProvider,
    setModel,
    setOllamaBaseUrl,
  }
})
