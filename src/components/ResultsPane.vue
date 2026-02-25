<script setup lang="ts">
import { useToolStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import ToolSelector from '@/components/ToolSelector.vue'
import ReadabilityResult from '@/components/results/ReadabilityResult.vue'
import StyleCheckResult from '@/components/results/StyleCheckResult.vue'
import PronounResult from '@/components/results/PronounResult.vue'
import CutResult from '@/components/results/CutResult.vue'
import PromiseResult from '@/components/results/PromiseResult.vue'

const toolStore = useToolStore()
const settingsStore = useSettingsStore()
</script>

<template>
  <div class="results-pane flex flex-col gap-4 p-4">
    <ToolSelector />
    <div v-if="!settingsStore.hasKeyForCurrentProvider && !toolStore.activeTool" class="text-sm text-amber-600">
      Please configure AI in the settings before using tools
    </div>
    <div v-else-if="toolStore.isRunning" class="text-sm text-gray-500">Analyzing...</div>
    <div v-else-if="!toolStore.result" class="text-sm text-gray-500">
      Select a tool and run it to see results
    </div>
    <ReadabilityResult v-else-if="toolStore.result.type === 'readability'" :result="toolStore.result" />
    <StyleCheckResult v-else-if="toolStore.result.type === 'style-check'" :result="toolStore.result" />
    <PronounResult v-else-if="toolStore.result.type === 'pronouns'" :result="toolStore.result" />
    <CutResult v-else-if="toolStore.result.type === 'cut-twenty'" :result="toolStore.result" />
    <PromiseResult v-else-if="toolStore.result.type === 'promise-tracker'" :result="toolStore.result" />
  </div>
</template>
