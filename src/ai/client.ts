import { useSettingsStore } from '@/stores/settings'
import { SCHEMAS } from '@/ai/schemas'
import type { ActionId } from '@/ai/schemas'
export type { ActionId }

export interface CallAIParams {
  action: ActionId
  system: string
  prompt: string
}

/**
 * Build a plain-English description of the expected JSON shape from a Zod schema.
 * This is injected into the system prompt for Ollama so the model knows what to return.
 */
function schemaToJsonExample(action: ActionId): string {
  const examples: Record<ActionId, string> = {
    'cut-twenty': JSON.stringify(
      {
        chunks: [
          { original: '...', edited: '...', reason: '...' },
        ],
      },
      null,
      2
    ),
    'fix-single': JSON.stringify({ editedParagraph: '...' }, null, 2),
    'fix-all': JSON.stringify({ editedDocument: '...' }, null, 2),
    'promise-tracker': JSON.stringify(
      {
        promises: [{ text: '...' }],
        verdicts: [
          { promiseIndex: 0, verdict: 'pass|fail|partial', evidence: '...' },
        ],
      },
      null,
      2
    ),
    'audience-assessment': JSON.stringify({ assessment: '...' }, null, 2),
  }
  return examples[action]
}

/**
 * Call Ollama's OpenAI-compatible API directly from the browser.
 * Uses JSON mode and parses the response with the shared Zod schema.
 */
async function callOllama<T>(params: CallAIParams): Promise<T> {
  const store = useSettingsStore()
  const baseUrl = store.ollamaBaseUrl.replace(/\/+$/, '')
  const modelId = store.model

  const jsonExample = schemaToJsonExample(params.action)
  const systemWithSchema = `${params.system}\n\nYou MUST respond with valid JSON matching this exact structure (no markdown, no extra text):\n${jsonExample}`

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemWithSchema },
        { role: 'user', content: params.prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    const message = errorBody?.error?.message ?? `Ollama returned ${response.status}`
    throw new Error(message)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Ollama returned an empty response')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('Ollama returned invalid JSON')
  }

  const schema = SCHEMAS[params.action]
  const result = schema.parse(parsed)
  return result as T
}

/**
 * Call the AI proxy function (for cloud providers) or Ollama directly.
 * Reads provider/model/apiKey from the settings store.
 */
export async function callAI<T>(params: CallAIParams): Promise<T> {
  const store = useSettingsStore()
  const providerId = store.provider

  if (providerId === 'ollama') {
    return callOllama<T>(params)
  }

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
