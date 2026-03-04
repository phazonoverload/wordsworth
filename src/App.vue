<script setup lang="ts">
import { ref } from 'vue'
import { Settings, Github } from 'lucide-vue-next'
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
    <header class="border-b border-gray-200 px-4 py-4 md:py-2 flex items-center justify-between bg-white">
      <h1 class="text-lg font-semibold leading-tight">Wordsworth<br class="md:hidden" /> <span class="text-sm font-semibold text-gray-400">by <a href="https://lws.io" target="_blank" rel="noopener noreferrer" class="hover:text-gray-600">Kevin Lewis</a></span></h1>
      <div class="flex items-center gap-1">
        <a
          href="https://github.com/phazonoverload/wordsworth"
          target="_blank"
          rel="noopener noreferrer"
          class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        >
          <Github class="w-4 h-4" />
        </a>
        <button
          aria-label="Settings"
          class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          @click="showSettings = true"
        >
          <Settings class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Main content: 2-pane layout -->
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
      <!-- Tools/Results: top on mobile, right sidebar on desktop -->
      <aside class="h-80 shrink-0 border-b border-gray-200 md:order-2 md:h-auto md:w-96 md:border-b-0 md:border-l">
        <ResultsPane />
      </aside>

      <!-- Editor -->
      <div class="flex-1 flex flex-col overflow-hidden md:order-1">
        <MergePane v-if="toolStore.mergeOriginal && toolStore.mergeModified" class="flex-1" />
        <EditorPane v-else class="flex-1" />
      </div>
    </div>

    <!-- Settings Modal -->
    <SettingsModal v-model="showSettings" />
  </div>
</template>
