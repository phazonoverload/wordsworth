import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock CodeMirror modules since they don't work in happy-dom
const mockDestroy = vi.fn()
const mockDispatch = vi.fn()
const mockView = {
  destroy: mockDestroy,
  dispatch: mockDispatch,
  state: { doc: { toString: () => '', length: 0 } },
}

vi.mock('@codemirror/state', () => ({
  EditorState: {
    create: vi.fn(() => ({})),
  },
}))

vi.mock('@codemirror/view', () => ({
  EditorView: Object.assign(
    vi.fn(() => mockView),
    {
      theme: vi.fn(() => []),
      updateListener: { of: vi.fn(() => []) },
      lineWrapping: [],
    },
  ),
  keymap: { of: vi.fn(() => []) },
  lineWrapping: [],
}))

vi.mock('@codemirror/lang-markdown', () => ({
  markdown: vi.fn(() => []),
}))

import EditorPane from '../EditorPane.vue'
import { useDocumentStore } from '@/stores/document'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'

describe('EditorPane', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('mounts without error', () => {
    const wrapper = mount(EditorPane)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the editor-pane container', () => {
    const wrapper = mount(EditorPane)
    expect(wrapper.find('.editor-pane').exists()).toBe(true)
  })

  it('creates a CodeMirror EditorState on mount', () => {
    mount(EditorPane)
    expect(EditorState.create).toHaveBeenCalledOnce()
  })

  it('creates a CodeMirror EditorView on mount', () => {
    mount(EditorPane)
    expect(EditorView).toHaveBeenCalledOnce()
  })

  it('initializes editor with document store content', () => {
    const store = useDocumentStore()
    store.setContent('hello world')

    mount(EditorPane)

    expect(EditorState.create).toHaveBeenCalledWith(
      expect.objectContaining({ doc: 'hello world' }),
    )
  })

  it('destroys the editor view on unmount', () => {
    const wrapper = mount(EditorPane)
    wrapper.unmount()
    expect(mockDestroy).toHaveBeenCalledOnce()
  })
})
