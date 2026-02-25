<template>
  <div ref="editorRef" class="editor-pane h-full w-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { useToolStore } from '@/stores/tools'
import { EditorState, StateField, StateEffect, RangeSet } from '@codemirror/state'
import { EditorView, Decoration, lineNumbers, placeholder } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'

const setHighlightEffect = StateEffect.define<{ from: number; to: number } | null>()

const highlightLineDecoration = Decoration.line({ class: 'cm-highlighted-line' })

const highlightField = StateField.define<RangeSet<Decoration>>({
  create() {
    return RangeSet.empty
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHighlightEffect)) {
        if (!effect.value) return RangeSet.empty
        const { from, to } = effect.value
        const doc = tr.state.doc
        const startLine = doc.lineAt(Math.min(from, doc.length))
        const endLine = doc.lineAt(Math.min(to, doc.length))
        const lineDecos: { from: number }[] = []
        for (let ln = startLine.number; ln <= endLine.number; ln++) {
          lineDecos.push({ from: doc.line(ln).from })
        }
        return RangeSet.of(lineDecos.map(l => highlightLineDecoration.range(l.from)))
      }
    }
    // Clear decorations on any document change (user editing)
    if (tr.docChanged) return RangeSet.empty
    return decorations
  },
  provide: (field) => EditorView.decorations.from(field),
})

const editorRef = ref<HTMLDivElement>()
const documentStore = useDocumentStore()
const toolStore = useToolStore()

let view: EditorView | null = null
let isUpdatingFromStore = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const theme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  '.cm-content': {
    minHeight: '100%',
    padding: '16px',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
  },
  '.cm-highlighted-line': {
    backgroundColor: '#fef9c3',
  },
})

const updateListener = EditorView.updateListener.of((update) => {
  if (update.docChanged && !isUpdatingFromStore) {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      const text = update.state.doc.toString()
      documentStore.setContent(text)
      debounceTimer = null
    }, 300)
  }
})

onMounted(() => {
  if (!editorRef.value) return

  const state = EditorState.create({
    doc: documentStore.content,
    extensions: [
      markdown(),
      lineNumbers(),
      EditorView.lineWrapping,
      theme,
      updateListener,
      highlightField,
      placeholder('Paste markdown here'),
    ],
  })

  view = new EditorView({
    state,
    parent: editorRef.value,
  })
})

onUnmounted(() => {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer)
  }
  if (view) {
    view.destroy()
    view = null
  }
})

watch(
  () => documentStore.content,
  (newContent) => {
    if (!view) return
    const currentContent = view.state.doc.toString()
    if (currentContent === newContent) return

    isUpdatingFromStore = true
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newContent,
      },
    })
    isUpdatingFromStore = false
  },
)

watch(
  () => toolStore.highlightRange,
  (range) => {
    if (!view) return
    if (!range) {
      view.dispatch({ effects: setHighlightEffect.of(null) })
      return
    }
    const from = Math.min(range.from, view.state.doc.length)
    const to = Math.min(range.to, view.state.doc.length)
    view.dispatch({
      effects: [
        setHighlightEffect.of({ from, to }),
        EditorView.scrollIntoView(from, { y: 'center' }),
      ],
    })
  },
)
</script>

<style scoped>
.editor-pane {
  overflow: hidden;
}
</style>
