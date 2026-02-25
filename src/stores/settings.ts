import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/lib/storage'

export type ProviderId = 'openai' | 'anthropic' | 'google'

export interface ApiKeys {
  openai?: string
  anthropic?: string
  google?: string
}

export const useSettingsStore = defineStore('settings', () => {
  const savedKeys = storage.get<ApiKeys>('wordsworth:keys')
  const savedSettings = storage.get<{ provider: string; model: string }>('wordsworth:settings')

  const keys = ref<ApiKeys>(savedKeys ?? {})
  const provider = ref(savedSettings?.provider ?? 'openai')
  const model = ref(savedSettings?.model ?? 'gpt-4o-mini')

  const hasAnyKey = computed(() =>
    Object.values(keys.value).some((k) => k && k.length > 0)
  )

  const hasKeyForCurrentProvider = computed(() => {
    const k = keys.value[provider.value as ProviderId]
    return !!k && k.length > 0
  })

  function setKey(providerId: ProviderId, key: string) {
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

  function persistSettings() {
    storage.set('wordsworth:settings', {
      provider: provider.value,
      model: model.value,
    })
  }

  return { keys, provider, model, hasAnyKey, hasKeyForCurrentProvider, setKey, setProvider, setModel }
})
