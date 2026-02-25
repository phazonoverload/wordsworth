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
      scrollIntoView: vi.fn(() => ({})),
    },
  ),
  keymap: { of: vi.fn(() => []) },
  lineWrapping: [],
  lineNumbers: vi.fn(() => []),
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

  it('dispatches selection when highlightRange changes', async () => {
    // Set doc length so clamping doesn't zero out values
    mockView.state.doc.length = 100
    mount(EditorPane)
    const toolStore = useToolStore()

    mockDispatch.mockClear()
    toolStore.setHighlightRange({ from: 5, to: 15 })
    await nextTick()

    expect(mockDispatch).toHaveBeenCalledWith({
      selection: { anchor: 5, head: 15 },
      scrollIntoView: true,
    })
  })

  it('clamps highlight range to document length', async () => {
    mount(EditorPane)
    const toolStore = useToolStore()

    mockDispatch.mockClear()
    // doc.length is 0 in mock, so both should clamp to 0
    toolStore.setHighlightRange({ from: 100, to: 200 })
    await nextTick()

    expect(mockDispatch).toHaveBeenCalledWith({
      selection: { anchor: 0, head: 0 },
      scrollIntoView: true,
    })
  })

  it('does not dispatch when highlightRange is cleared', async () => {
    mount(EditorPane)
    const toolStore = useToolStore()

    toolStore.setHighlightRange({ from: 5, to: 15 })
    await nextTick()
    mockDispatch.mockClear()

    toolStore.clearHighlightRange()
    await nextTick()

    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
