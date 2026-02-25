<script setup lang="ts">
import type { CutResult as CutResultType, DiffChunk } from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { useDocumentStore } from '@/stores/document'

const props = defineProps<{
  result: CutResultType
}>()

const emit = defineEmits<{
  accept: [chunkId: string]
  reject: [chunkId: string]
}>()

const toolStore = useToolStore()
const documentStore = useDocumentStore()

function onHighlight(chunk: DiffChunk) {
  const content = documentStore.content
  const index = content.indexOf(chunk.original)
  if (index === -1) return
  toolStore.setHighlightRange({
    from: index,
    to: index + chunk.original.length,
  })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-3 gap-3 text-sm">
      <div class="rounded bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Original</div>
        <div class="text-sm font-medium">{{ props.result.originalWordCount }} words</div>
      </div>
      <div class="rounded bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Edited</div>
        <div class="text-sm font-medium">{{ props.result.editedWordCount }} words</div>
      </div>
      <div class="rounded bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Reduction</div>
        <div class="text-sm font-medium">{{ Math.round(props.result.reductionPercent) }}%</div>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <div
        v-for="chunk in props.result.chunks.filter(c => c.accepted === null)"
        :key="chunk.id"
        class="rounded border border-gray-200 p-3 text-sm"
      >
        <div class="mb-2 rounded bg-red-50 p-2 text-red-800 line-through">
          {{ chunk.original }}
        </div>
        <div class="mb-2 rounded bg-green-50 p-2 text-green-800">
          {{ chunk.edited }}
        </div>
        <div class="mb-2 text-xs text-gray-500">{{ chunk.reason }}</div>
        <div class="flex gap-2">
          <button
            :data-testid="`accept-${chunk.id}`"
            class="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
            @click="emit('accept', chunk.id)"
          >
            Accept
          </button>
          <button
            :data-testid="`reject-${chunk.id}`"
            class="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
            @click="emit('reject', chunk.id)"
          >
            Reject
          </button>
          <button
            :data-testid="`highlight-${chunk.id}`"
            class="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
            @click="onHighlight(chunk)"
          >
            Highlight
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
