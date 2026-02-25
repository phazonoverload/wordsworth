import { useSettingsStore } from '@/stores/settings'

export type ActionId = 'cut-twenty' | 'fix-single' | 'fix-all' | 'promise-tracker'

export interface CallAIParams {
  action: ActionId
  system: string
  prompt: string
}

/**
 * Call the AI proxy function.
 * Reads provider/model/apiKey from the settings store,
 * then POSTs to /api/ai and returns the parsed JSON response.
 */
export async function callAI<T>(params: CallAIParams): Promise<T> {
  const store = useSettingsStore()
  const providerId = store.provider
  const modelId = store.model
  const apiKey = store.keys[providerId as keyof typeof store.keys]

  if (!apiKey) {
    throw new Error(`No API key configured for ${providerId}`)
  }

  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: params.action,
      provider: providerId,
      model: modelId,
      apiKey,
      system: params.system,
      prompt: params.prompt,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorBody.error ?? `AI proxy returned ${response.status}`)
  }

  return response.json() as Promise<T>
}
