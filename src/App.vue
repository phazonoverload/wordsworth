<script setup lang="ts">
import { ref } from 'vue'
import { Settings } from 'lucide-vue-next'
import EditorPane from '@/components/EditorPane.vue'
import ToolBar from '@/components/ToolBar.vue'
import ReaderContext from '@/components/ReaderContext.vue'
import ResultsPane from '@/components/ResultsPane.vue'
import SettingsModal from '@/components/SettingsModal.vue'

const showSettings = ref(false)
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-900 text-gray-100">
    <!-- Header -->
    <header class="border-b border-gray-700 px-4 py-2 flex items-center justify-between bg-gray-900">
      <h1 class="text-lg font-semibold">Wordsworth</h1>
      <button
        class="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
        @click="showSettings = true"
      >
        <Settings class="w-4 h-4" />
        Settings
      </button>
    </header>

    <!-- Main content: 3-column layout -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Tool bar -->
      <aside class="w-56 border-r border-gray-700 overflow-y-auto bg-gray-850">
        <ToolBar />
      </aside>

      <!-- Center: Reader Context + Editor -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <ReaderContext />
        <EditorPane class="flex-1" />
      </div>

      <!-- Right: Results -->
      <aside class="w-96 border-l border-gray-700 overflow-y-auto">
        <ResultsPane />
      </aside>
    </div>

    <!-- Settings Modal -->
    <SettingsModal v-model="showSettings" />
  </div>
</template>
