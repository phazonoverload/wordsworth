import { describe, it, expect, beforeEach } from 'vitest'
import { storage } from '@/lib/storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads a value', () => {
    storage.set('wordsworth:test', { foo: 'bar' })
    expect(storage.get('wordsworth:test')).toEqual({ foo: 'bar' })
  })

  it('returns null for missing key', () => {
    expect(storage.get('wordsworth:missing')).toBeNull()
  })

  it('removes a value', () => {
    storage.set('wordsworth:test', { foo: 'bar' })
    storage.remove('wordsworth:test')
    expect(storage.get('wordsworth:test')).toBeNull()
  })

  it('handles corrupted JSON gracefully', () => {
    localStorage.setItem('wordsworth:test', 'not-json{{{')
    expect(storage.get('wordsworth:test')).toBeNull()
  })
})
