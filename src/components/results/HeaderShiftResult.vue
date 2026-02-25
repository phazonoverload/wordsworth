<script setup lang="ts">
import { ref } from 'vue'
import type { HeaderShiftResult as HeaderShiftResultType } from '@/tools/types'
import { promoteHeaders, demoteHeaders, scanHeaders } from '@/tools/header-shift'
import { useDocumentStore } from '@/stores/document'
import { useToolStore } from '@/stores/tools'
import { runTool } from '@/tools/runner'

const props = defineProps<{
  result: HeaderShiftResultType
}>()

const documentStore = useDocumentStore()
const toolStore = useToolStore()

const errorMessage = ref<string | null>(null)
const previousContent = ref<string | null>(null)
const lastShiftedCount = ref(0)
const lastAction = ref<'promoted' | 'demoted' | null>(null)

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-orange-100 text-orange-800',
  2: 'bg-amber-100 text-amber-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-lime-100 text-lime-800',
  5: 'bg-emerald-100 text-emerald-800',
  6: 'bg-teal-100 text-teal-800',
}

function activelevels() {
  return ([1, 2, 3, 4, 5, 6] as const).filter(l => props.result.headerCounts[l] > 0)
}

function promote() {
  errorMessage.value = null
  const result = promoteHeaders(documentStore.content)
  if (!result.ok) {
    errorMessage.value = result.error!
    return
  }
  previousContent.value = documentStore.content
  lastShiftedCount.value = result.shifted
  lastAction.value = 'promoted'
  documentStore.setContent(result.content!)
  runTool()
}

function demote() {
  errorMessage.value = null
  const result = demoteHeaders(documentStore.content)
  if (!result.ok) {
    errorMessage.value = result.error!
    return
  }
  previousContent.value = documentStore.content
  lastShiftedCount.value = result.shifted
  lastAction.value = 'demoted'
  documentStore.setContent(result.content!)
  runTool()
}

function undo() {
  if (previousContent.value !== null) {
    documentStore.setContent(previousContent.value)
    previousContent.value = null
    lastAction.value = null
    lastShiftedCount.value = 0
    errorMessage.value = null
    runTool()
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="props.result.totalHeaders === 0" class="text-sm text-gray-500">
      No headers found in the document.
    </div>

    <template v-else>
      <div class="flex items-center gap-3">
        <span class="text-lg font-semibold">{{ props.result.totalHeaders }} headers</span>
      </div>

      <div class="flex flex-wrap gap-2">
        <span
          v-for="level in activelevels()"
          :key="level"
          data-testid="header-level-badge"
          :class="['inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium', LEVEL_COLORS[level]]"
        >
          H{{ level }}
          <span class="font-semibold">{{ props.result.headerCounts[level] }}</span>
        </span>
      </div>
    </template>

    <div class="flex gap-2">
      <button
        data-testid="promote-btn"
        class="rounded bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        @click="promote"
      >
        Promote (H2 &rarr; H1)
      </button>
      <button
        data-testid="demote-btn"
        class="rounded bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        @click="demote"
      >
        Demote (H1 &rarr; H2)
      </button>
    </div>

    <div v-if="errorMessage" data-testid="error-message" class="rounded bg-red-50 p-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-if="lastAction" class="flex items-center gap-3">
      <span class="text-sm text-gray-600">{{ lastShiftedCount }} headers {{ lastAction }}</span>
      <button
        data-testid="undo-btn"
        class="rounded border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
        @click="undo"
      >
        Undo
      </button>
    </div>
  </div>
</template>
