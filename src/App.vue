<script setup lang="ts">
import { ref } from 'vue'
import { Settings } from 'lucide-vue-next'
import EditorPane from '@/components/EditorPane.vue'
import MergePane from '@/components/MergePane.vue'
import ResultsPane from '@/components/ResultsPane.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { useAutoRun } from '@/composables/useAutoRun'
import { useToolStore } from '@/stores/tools'

const showSettings = ref(false)
const toolStore = useToolStore()
useAutoRun()
</script>

<template>
  <div class="h-screen flex flex-col bg-white text-gray-900">
    <!-- Header -->
    <header class="border-b border-gray-200 px-4 py-2 flex items-center justify-between bg-white">
      <h1 class="text-lg font-semibold">Wordsworth</h1>
      <button
        class="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        @click="showSettings = true"
      >
        <Settings class="w-4 h-4" />
        Settings
      </button>
    </header>

    <!-- Main content: 2-pane layout -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Editor + Reader Context -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <MergePane v-if="toolStore.mergeOriginal && toolStore.mergeModified" class="flex-1" />
        <EditorPane v-else class="flex-1" />
      </div>

      <!-- Right: Results (includes ToolSelector at top) -->
      <aside class="w-96 border-l border-gray-200 overflow-y-auto">
        <ResultsPane />
      </aside>
    </div>

    <!-- Settings Modal -->
    <SettingsModal v-model="showSettings" />
  </div>
</template>
