<template>
  <div class="flex h-full flex-col">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2">
      <span class="text-sm font-medium text-gray-700">Review AI Changes</span>
      <div class="flex-1" />
      <button
        data-testid="merge-reject"
        class="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        @click="onReject"
      >
        Reject
      </button>
      <button
        data-testid="merge-accept"
        class="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 transition-colors"
        @click="onAccept"
      >
        Accept
      </button>
    </div>
    <!-- Unified merge editor -->
    <div ref="mergeRef" class="flex-1 overflow-hidden"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { unifiedMergeView, getChunks } from '@codemirror/merge'
import { markdown } from '@codemirror/lang-markdown'
import { useToolStore } from '@/stores/tools'
import { useDocumentStore } from '@/stores/document'

const toolStore = useToolStore()
const documentStore = useDocumentStore()

const mergeRef = ref<HTMLDivElement>()
let editorView: EditorView | null = null

const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px' },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  '.cm-content': { padding: '16px' },
  '&.cm-focused': { outline: 'none' },
})

function createEditor() {
  destroyEditor()
  if (!mergeRef.value) return
  if (!toolStore.mergeOriginal || !toolStore.mergeModified) return

  editorView = new EditorView({
    state: EditorState.create({
      doc: toolStore.mergeModified,
      extensions: [
        markdown(),
        EditorState.readOnly.of(true),
        theme,
        EditorView.lineWrapping,
        unifiedMergeView({
          original: toolStore.mergeOriginal,
          highlightChanges: true,
          gutter: true,
          mergeControls: false,
        }),
      ],
    }),
    parent: mergeRef.value,
  })

  // Snap scroll to the first changed chunk so the diff is immediately visible
  const result = getChunks(editorView.state)
  if (result && result.chunks.length > 0) {
    editorView.dispatch({
      effects: EditorView.scrollIntoView(result.chunks[0]!.fromB, { y: 'center' }),
    })
  }
}

function destroyEditor() {
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
}

onMounted(() => {
  createEditor()
})

// Watch merge state so back-to-back fixes work: whenever new merge data
// arrives we tear down the old editor and create a fresh one.
watch(
  () => [toolStore.mergeOriginal, toolStore.mergeModified] as const,
  ([original, modified]) => {
    if (original && modified) {
      createEditor()
    } else {
      destroyEditor()
    }
  },
)

onUnmounted(() => {
  destroyEditor()
})

function onAccept() {
  if (toolStore.mergeModified) {
    documentStore.setContent(toolStore.mergeModified)
  }
  toolStore.clearMergeState()
}

function onReject() {
  toolStore.clearMergeState()
}
</script>
