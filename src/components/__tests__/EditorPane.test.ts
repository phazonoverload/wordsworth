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
  StateField: {
    define: vi.fn(() => []),
  },
  StateEffect: {
    define: vi.fn(() => ({
      of: vi.fn((value: unknown) => ({ type: 'setHighlightEffect', value })),
    })),
  },
  RangeSet: {
    empty: [],
    of: vi.fn(() => []),
  },
}))

vi.mock('@codemirror/view', () => ({
  EditorView: Object.assign(
    vi.fn(() => mockView),
    {
      theme: vi.fn(() => []),
      updateListener: { of: vi.fn(() => []) },
      lineWrapping: [],
      scrollIntoView: vi.fn(() => ({})),
      decorations: { from: vi.fn(() => []) },
    },
  ),
  Decoration: {
    line: vi.fn(() => ({ range: vi.fn(() => ({})) })),
  },
  keymap: { of: vi.fn(() => []) },
  lineWrapping: [],
  lineNumbers: vi.fn(() => []),
  placeholder: vi.fn(() => []),
}))

vi.mock('@codemirror/lang-markdown', () => ({
  markdown: vi.fn(() => []),
}))

import { nextTick } from 'vue'
import EditorPane from '../EditorPane.vue'
import { useDocumentStore } from '@/stores/document'
import { useToolStore } from '@/stores/tools'
import { EditorView, lineNumbers } from '@codemirror/view'
import { EditorState } from '@codemirror/state'

describe('EditorPane', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockView.state.doc.length = 0
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

  it('includes lineNumbers extension', () => {
    mount(EditorPane)
    expect(lineNumbers).toHaveBeenCalled()
  })

  it('dispatches highlight effect when highlightRange changes', async () => {
    // Set doc length so clamping doesn't zero out values
    mockView.state.doc.length = 100
    mount(EditorPane)
    const toolStore = useToolStore()

    mockDispatch.mockClear()
    toolStore.setHighlightRange({ from: 5, to: 15 })
    await nextTick()

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        effects: expect.anything(),
      }),
    )
    // Should use EditorView.scrollIntoView for snap scroll
    expect(EditorView.scrollIntoView).toHaveBeenCalledWith(5, { y: 'center' })
  })

  it('clamps highlight range to document length', async () => {
    mount(EditorPane)
    const toolStore = useToolStore()

    mockDispatch.mockClear()
    // doc.length is 0 in mock, so dispatch still happens with clamped values
    toolStore.setHighlightRange({ from: 100, to: 200 })
    await nextTick()

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        effects: expect.anything(),
      }),
    )
    // Clamped to 0 since doc.length is 0
    expect(EditorView.scrollIntoView).toHaveBeenCalledWith(0, { y: 'center' })
  })

  it('dispatches clear effect when highlightRange is cleared', async () => {
    mount(EditorPane)
    const toolStore = useToolStore()

    toolStore.setHighlightRange({ from: 5, to: 15 })
    await nextTick()
    mockDispatch.mockClear()

    toolStore.clearHighlightRange()
    await nextTick()

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        effects: expect.anything(),
      }),
    )
  })
})
