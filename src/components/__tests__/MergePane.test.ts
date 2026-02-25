import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

const mockDestroy = vi.fn()
const mockDispatch = vi.fn()
const mockState = {}

vi.mock('@codemirror/view', () => ({
  EditorView: Object.assign(
    vi.fn(() => ({ destroy: mockDestroy, dispatch: mockDispatch, state: mockState })),
    {
      theme: vi.fn(() => []),
      lineWrapping: [],
      scrollIntoView: vi.fn(() => ({})),
    },
  ),
}))

vi.mock('@codemirror/state', () => ({
  EditorState: {
    create: vi.fn(() => mockState),
    readOnly: { of: vi.fn(() => []) },
  },
}))

vi.mock('@codemirror/merge', () => ({
  unifiedMergeView: vi.fn(() => []),
  getChunks: vi.fn(() => ({ chunks: [{ fromB: 42 }], side: null })),
}))

vi.mock('@codemirror/lang-markdown', () => ({
  markdown: vi.fn(() => []),
}))

import MergePane from '../MergePane.vue'
import { useToolStore } from '@/stores/tools'
import { useDocumentStore } from '@/stores/document'
import { EditorView } from '@codemirror/view'

describe('MergePane', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('mounts without error when merge state is set', () => {
    const toolStore = useToolStore()
    toolStore.setMergeState('original text', 'modified text')

    const wrapper = mount(MergePane)
    expect(wrapper.exists()).toBe(true)
  })

  it('creates an EditorView when merge state is available', () => {
    const toolStore = useToolStore()
    toolStore.setMergeState('original text', 'modified text')

    mount(MergePane)
    expect(EditorView).toHaveBeenCalled()
  })

  it('accepts changes and updates document content', async () => {
    const toolStore = useToolStore()
    const documentStore = useDocumentStore()
    toolStore.setMergeState('original text', 'modified text')

    const wrapper = mount(MergePane)
    await wrapper.find('[data-testid="merge-accept"]').trigger('click')

    expect(documentStore.content).toBe('modified text')
    expect(toolStore.mergeOriginal).toBeNull()
    expect(toolStore.mergeModified).toBeNull()
  })

  it('rejects changes without updating document content', async () => {
    const toolStore = useToolStore()
    const documentStore = useDocumentStore()
    documentStore.setContent('original text')
    toolStore.setMergeState('original text', 'modified text')

    const wrapper = mount(MergePane)
    await wrapper.find('[data-testid="merge-reject"]').trigger('click')

    expect(documentStore.content).toBe('original text')
    expect(toolStore.mergeOriginal).toBeNull()
    expect(toolStore.mergeModified).toBeNull()
  })

  it('destroys editor on unmount', () => {
    const toolStore = useToolStore()
    toolStore.setMergeState('original text', 'modified text')

    const wrapper = mount(MergePane)
    wrapper.unmount()
    expect(mockDestroy).toHaveBeenCalled()
  })

  it('recreates editor when merge state changes (back-to-back fixes)', async () => {
    const toolStore = useToolStore()
    toolStore.setMergeState('original text', 'modified text')

    mount(MergePane)
    expect(EditorView).toHaveBeenCalledTimes(1)

    // Simulate accepting then fixing another issue
    toolStore.clearMergeState()
    await nextTick()

    toolStore.setMergeState('original text 2', 'modified text 2')
    await nextTick()

    // Should have destroyed old and created new
    expect(mockDestroy).toHaveBeenCalled()
    expect(EditorView).toHaveBeenCalledTimes(2)
  })

  it('renders accept and reject buttons', () => {
    const toolStore = useToolStore()
    toolStore.setMergeState('original', 'modified')

    const wrapper = mount(MergePane)
    expect(wrapper.find('[data-testid="merge-accept"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="merge-reject"]').exists()).toBe(true)
  })

  it('shows Review AI Changes header', () => {
    const toolStore = useToolStore()
    toolStore.setMergeState('original', 'modified')

    const wrapper = mount(MergePane)
    expect(wrapper.text()).toContain('Review AI Changes')
  })

  it('scrolls to first diff chunk on creation', () => {
    const toolStore = useToolStore()
    toolStore.setMergeState('original', 'modified')

    mount(MergePane)

    expect(EditorView.scrollIntoView).toHaveBeenCalledWith(42, { y: 'center' })
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ effects: expect.anything() }),
    )
  })
})
