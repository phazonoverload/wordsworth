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
    <!-- Merge editor -->
    <div ref="mergeRef" class="flex-1 overflow-hidden"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { MergeView } from '@codemirror/merge'
import { markdown } from '@codemirror/lang-markdown'
import { useToolStore } from '@/stores/tools'
import { useDocumentStore } from '@/stores/document'

const toolStore = useToolStore()
const documentStore = useDocumentStore()

const mergeRef = ref<HTMLDivElement>()
let mergeView: MergeView | null = null

const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px' },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  '.cm-content': { padding: '16px' },
  '&.cm-focused': { outline: 'none' },
})

onMounted(() => {
  if (!mergeRef.value) return
  if (!toolStore.mergeOriginal || !toolStore.mergeModified) return

  mergeView = new MergeView({
    parent: mergeRef.value,
    a: {
      doc: toolStore.mergeOriginal,
      extensions: [markdown(), EditorState.readOnly.of(true), theme, EditorView.lineWrapping],
    },
    b: {
      doc: toolStore.mergeModified,
      extensions: [markdown(), EditorState.readOnly.of(true), theme, EditorView.lineWrapping],
    },
  })
})

onUnmounted(() => {
  if (mergeView) {
    mergeView.destroy()
    mergeView = null
  }
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
