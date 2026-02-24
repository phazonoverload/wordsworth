import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

vi.mock('@ai-sdk/openai', () => {
  const mockModel = { modelId: 'gpt-4o-mini', provider: 'openai' }
  const mockProvider = (id: string) => ({ ...mockModel, modelId: id })
  mockProvider.chat = (id: string) => ({ ...mockModel, modelId: id })
  mockProvider.languageModel = (id: string) => ({ ...mockModel, modelId: id })
  return { createOpenAI: vi.fn(() => mockProvider) }
})

vi.mock('@ai-sdk/anthropic', () => {
  const mockModel = { modelId: 'claude-sonnet', provider: 'anthropic' }
  const mockProvider = (id: string) => ({ ...mockModel, modelId: id })
  mockProvider.languageModel = (id: string) => ({ ...mockModel, modelId: id })
  return { createAnthropic: vi.fn(() => mockProvider) }
})

vi.mock('@ai-sdk/google', () => {
  const mockModel = { modelId: 'gemini-flash', provider: 'google' }
  const mockProvider = (id: string) => ({ ...mockModel, modelId: id })
  mockProvider.languageModel = (id: string) => ({ ...mockModel, modelId: id })
  return { createGoogleGenerativeAI: vi.fn(() => mockProvider) }
})

import { getModel } from '@/ai/client'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

describe('getModel', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('throws when no API key is set for the selected provider', () => {
    const store = useSettingsStore()
    store.setProvider('openai')
    // No key set

    expect(() => getModel()).toThrow('No API key configured for openai')
  })

  it('throws when key is empty string for the selected provider', () => {
    const store = useSettingsStore()
    store.setProvider('anthropic')
    store.setKey('anthropic', '')

    expect(() => getModel()).toThrow('No API key configured for anthropic')
  })

  it('returns a model instance when OpenAI key is set', () => {
    const store = useSettingsStore()
    store.setProvider('openai')
    store.setModel('gpt-4o-mini')
    store.setKey('openai', 'sk-test-123')

    const model = getModel()

    expect(model).toBeDefined()
    expect(model.modelId).toBe('gpt-4o-mini')
  })

  it('calls createOpenAI with the correct API key', () => {
    const store = useSettingsStore()
    store.setProvider('openai')
    store.setModel('gpt-4o-mini')
    store.setKey('openai', 'sk-openai-key')

    getModel()

    expect(createOpenAI).toHaveBeenCalledWith({ apiKey: 'sk-openai-key' })
  })

  it('returns a model instance for Anthropic provider', () => {
    const store = useSettingsStore()
    store.setProvider('anthropic')
    store.setModel('claude-sonnet')
    store.setKey('anthropic', 'sk-ant-key')

    const model = getModel()

    expect(model).toBeDefined()
    expect(model.modelId).toBe('claude-sonnet')
  })

  it('calls createAnthropic with the correct API key', () => {
    const store = useSettingsStore()
    store.setProvider('anthropic')
    store.setModel('claude-sonnet')
    store.setKey('anthropic', 'sk-ant-key')

    getModel()

    expect(createAnthropic).toHaveBeenCalledWith({ apiKey: 'sk-ant-key' })
  })

  it('returns a model instance for Google provider', () => {
    const store = useSettingsStore()
    store.setProvider('google')
    store.setModel('gemini-flash')
    store.setKey('google', 'goog-key')

    const model = getModel()

    expect(model).toBeDefined()
    expect(model.modelId).toBe('gemini-flash')
  })

  it('calls createGoogleGenerativeAI with the correct API key', () => {
    const store = useSettingsStore()
    store.setProvider('google')
    store.setModel('gemini-flash')
    store.setKey('google', 'goog-key')

    getModel()

    expect(createGoogleGenerativeAI).toHaveBeenCalledWith({ apiKey: 'goog-key' })
  })

  it('uses the model name from the settings store', () => {
    const store = useSettingsStore()
    store.setProvider('openai')
    store.setModel('gpt-4o')
    store.setKey('openai', 'sk-test')

    const model = getModel()

    expect(model.modelId).toBe('gpt-4o')
  })

  it('uses the correct key when multiple keys are configured', () => {
    const store = useSettingsStore()
    store.setKey('openai', 'sk-openai')
    store.setKey('anthropic', 'sk-anthropic')
    store.setKey('google', 'goog-key')

    store.setProvider('anthropic')
    store.setModel('claude-sonnet')

    getModel()

    expect(createAnthropic).toHaveBeenCalledWith({ apiKey: 'sk-anthropic' })
    expect(createOpenAI).not.toHaveBeenCalled()
    expect(createGoogleGenerativeAI).not.toHaveBeenCalled()
  })

  it('throws for unsupported provider before checking API key', () => {
    const store = useSettingsStore()
    store.setProvider('mistral')

    expect(() => getModel()).toThrow('Unsupported provider: mistral')
  })
})
