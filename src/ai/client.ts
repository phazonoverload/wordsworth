import { useSettingsStore } from '@/stores/settings'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { LanguageModelV3 } from '@ai-sdk/provider'

const SUPPORTED_PROVIDERS = ['openai', 'anthropic', 'google'] as const
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number]

export function getModel(): LanguageModelV3 {
  const store = useSettingsStore()
  const providerId = store.provider
  const modelId = store.model

  if (!SUPPORTED_PROVIDERS.includes(providerId as SupportedProvider)) {
    throw new Error(`Unsupported provider: ${providerId}`)
  }

  const apiKey = store.keys[providerId as SupportedProvider]

  if (!apiKey) {
    throw new Error(`No API key configured for ${providerId}`)
  }

  switch (providerId) {
    case 'openai':
      return createOpenAI({ apiKey })(modelId)
    case 'anthropic':
      return createAnthropic({ apiKey })(modelId)
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(modelId)
    default:
      throw new Error(`Unsupported provider: ${providerId}`)
  }
}
