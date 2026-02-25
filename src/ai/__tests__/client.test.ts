import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { callAI } from '@/ai/client'

describe('callAI', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('throws when no API key is set for the selected provider', async () => {
    const store = useSettingsStore()
    store.setProvider('openai')
    // No key set

    await expect(callAI({ action: 'cut-twenty', system: 'test', prompt: 'test' }))
      .rejects.toThrow('No API key configured for openai')
  })

  it('throws when key is empty string for the selected provider', async () => {
    const store = useSettingsStore()
    store.setProvider('anthropic')
    store.setKey('anthropic', '')

    await expect(callAI({ action: 'cut-twenty', system: 'test', prompt: 'test' }))
      .rejects.toThrow('No API key configured for anthropic')
  })

  it('POSTs to /api/ai with correct body', async () => {
    const store = useSettingsStore()
    store.setProvider('openai')
    store.setModel('gpt-5-nano')
    store.setKey('openai', 'sk-test-123')

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'test' }),
    })

    await callAI({ action: 'cut-twenty', system: 'Be concise', prompt: 'Hello world' })

    expect(mockFetch).toHaveBeenCalledWith('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cut-twenty',
        provider: 'openai',
        model: 'gpt-5-nano',
        apiKey: 'sk-test-123',
        system: 'Be concise',
        prompt: 'Hello world',
      }),
    })
  })

  it('returns the parsed JSON response on success', async () => {
    const store = useSettingsStore()
    store.setProvider('openai')
    store.setModel('gpt-5-nano')
    store.setKey('openai', 'sk-test-123')

    const mockResponse = { chunks: [{ original: 'a', edited: 'b', reason: 'shorter' }] }
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await callAI({ action: 'cut-twenty', system: 'test', prompt: 'test' })
    expect(result).toEqual(mockResponse)
  })

  it('throws with server error message on non-ok response', async () => {
    const store = useSettingsStore()
    store.setProvider('openai')
    store.setModel('gpt-5-nano')
    store.setKey('openai', 'sk-test-123')

    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.resolve({ error: 'Provider timeout' }),
    })

    await expect(callAI({ action: 'cut-twenty', system: 'test', prompt: 'test' }))
      .rejects.toThrow('Provider timeout')
  })

  it('throws generic message when error response is not JSON', async () => {
    const store = useSettingsStore()
    store.setProvider('openai')
    store.setModel('gpt-5-nano')
    store.setKey('openai', 'sk-test-123')

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    })

    await expect(callAI({ action: 'cut-twenty', system: 'test', prompt: 'test' }))
      .rejects.toThrow('Unknown error')
  })

  it('sends the correct provider and model for Anthropic', async () => {
    const store = useSettingsStore()
    store.setProvider('anthropic')
    store.setModel('claude-haiku-4-5')
    store.setKey('anthropic', 'sk-ant-key')

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await callAI({ action: 'fix-single', system: 'test', prompt: 'test' })

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body)
    expect(body.provider).toBe('anthropic')
    expect(body.model).toBe('claude-haiku-4-5')
    expect(body.apiKey).toBe('sk-ant-key')
  })

  it('sends the correct provider and model for Google', async () => {
    const store = useSettingsStore()
    store.setProvider('google')
    store.setModel('gemini-2.5-flash')
    store.setKey('google', 'goog-key')

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await callAI({ action: 'promise-tracker', system: 'test', prompt: 'test' })

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body)
    expect(body.provider).toBe('google')
    expect(body.model).toBe('gemini-2.5-flash')
    expect(body.apiKey).toBe('goog-key')
  })

  it('uses the correct key when multiple keys are configured', async () => {
    const store = useSettingsStore()
    store.setKey('openai', 'sk-openai')
    store.setKey('anthropic', 'sk-anthropic')
    store.setKey('google', 'goog-key')

    store.setProvider('anthropic')
    store.setModel('claude-haiku-4-5')

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await callAI({ action: 'cut-twenty', system: 'test', prompt: 'test' })

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body)
    expect(body.apiKey).toBe('sk-anthropic')
    expect(body.provider).toBe('anthropic')
  })
})
