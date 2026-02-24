import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDocumentStore } from '@/stores/document'

describe('documentStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with empty content', () => {
    const store = useDocumentStore()
    expect(store.content).toBe('')
  })

  it('updates content', () => {
    const store = useDocumentStore()
    store.setContent('hello world')
    expect(store.content).toBe('hello world')
  })

  it('loads content from localStorage on init', () => {
    localStorage.setItem(
      'wordsworth:document',
      JSON.stringify({ content: 'saved text', updatedAt: Date.now() })
    )
    const store = useDocumentStore()
    expect(store.content).toBe('saved text')
  })

  it('has default reader context', () => {
    const store = useDocumentStore()
    expect(store.readerContext.description).toBe('')
  })

  it('updates reader context', () => {
    const store = useDocumentStore()
    store.setReaderContext({ description: 'Junior dev', preset: 'junior-dev' })
    expect(store.readerContext.description).toBe('Junior dev')
    expect(store.readerContext.preset).toBe('junior-dev')
  })

  it('loads reader context from localStorage on init', () => {
    localStorage.setItem(
      'wordsworth:reader',
      JSON.stringify({ description: 'Expert', preset: 'expert' })
    )
    const store = useDocumentStore()
    expect(store.readerContext.description).toBe('Expert')
  })
})
