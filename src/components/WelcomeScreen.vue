<script setup lang="ts">
import { TOOLS } from '@/tools/types'
import { computed } from 'vue'

const emit = defineEmits<{
  dismiss: []
}>()

const analysisWithAI: Record<string, string> = {
  'style-check': 'AI-powered style fixes',
  'readability': 'AI-powered audience assessment',
  'parallel-structure': 'AI-powered list fixes',
}

const analysisTools = computed(() => TOOLS.filter(t => t.category === 'analysis' && t.id !== 'header-shift'))
const aiTools = computed(() => TOOLS.filter(t => t.category === 'ai'))

function aiFeature(id: string) {
  return analysisWithAI[id] || null
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('dismiss')
}
</script>

<template>
  <div
    class="flex-1 flex flex-col items-center justify-center overflow-auto bg-white px-4 py-8"
    @keydown="onKeydown"
  >
    <div class="max-w-3xl w-full">
      <h2 class="text-2xl font-bold text-gray-900 mb-1">Welcome to Wordsworth</h2>
      <p class="text-gray-500 mb-8">A writing toolkit to help you write clearer, more confident technical prose.</p>

      <!-- Analysis Tools -->
      <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Analysis</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <div
          v-for="tool in analysisTools"
          :key="tool.id"
          class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
        >
          <p class="text-sm font-medium text-gray-900">{{ tool.label }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ tool.description }}</p>
          <p v-if="aiFeature(tool.id)" class="text-xs text-orange-500 mt-1.5 font-medium">+ {{ aiFeature(tool.id) }}</p>
        </div>
      </div>

      <!-- AI Tools -->
      <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">AI</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <div
          v-for="tool in aiTools"
          :key="tool.id"
          class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
        >
          <p class="text-sm font-medium text-gray-900">{{ tool.label }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ tool.description }}</p>
        </div>
      </div>

      <button
        class="rounded bg-orange-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600"
        @click="emit('dismiss')"
      >
        Get Started
      </button>
    </div>
  </div>
</template>
