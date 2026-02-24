<template>
  <div ref="editorRef" class="editor-pane h-full w-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'

const editorRef = ref<HTMLDivElement>()
const documentStore = useDocumentStore()

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
      EditorView.lineWrapping,
      theme,
      updateListener,
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
</script>

<style scoped>
.editor-pane {
  overflow: hidden;
}
</style>
