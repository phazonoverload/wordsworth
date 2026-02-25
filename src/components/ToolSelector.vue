<script setup lang="ts">
import { TOOLS } from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import { runTool } from '@/tools/runner'

const toolStore = useToolStore()
const settingsStore = useSettingsStore()

const analysisTools = TOOLS.filter((t) => t.category === 'analysis')
const aiTools = TOOLS.filter((t) => t.category === 'ai')

function isDisabled(tool: (typeof TOOLS)[number]): boolean {
  if (toolStore.isRunning) return true
  if (tool.category === 'ai' && !settingsStore.hasKeyForCurrentProvider) return true
  return false
}

async function selectTool(tool: (typeof TOOLS)[number]) {
  if (isDisabled(tool)) return
  toolStore.setActiveTool(tool.id)
  await runTool()
}
</script>

<template>
  <div class="tool-selector flex items-center gap-1 flex-wrap">
    <button
      v-for="tool in analysisTools"
      :key="tool.id"
      :disabled="isDisabled(tool)"
      :class="[
        'rounded-full px-3 py-1 text-sm transition whitespace-nowrap',
        'disabled:cursor-not-allowed disabled:opacity-50',
        toolStore.activeTool === tool.id
          ? 'active bg-blue-100 font-medium text-blue-900'
          : 'text-gray-700 hover:bg-gray-100',
      ]"
      @click="selectTool(tool)"
    >
      {{ tool.label }}
    </button>

    <span class="mx-1 text-gray-300">|</span>

    <button
      v-for="tool in aiTools"
      :key="tool.id"
      :disabled="isDisabled(tool)"
      :title="!settingsStore.hasKeyForCurrentProvider && !toolStore.isRunning ? 'Set API key in Settings' : undefined"
      :class="[
        'rounded-full px-3 py-1 text-sm transition whitespace-nowrap',
        'disabled:cursor-not-allowed disabled:opacity-50',
        toolStore.activeTool === tool.id
          ? 'active bg-blue-100 font-medium text-blue-900'
          : 'text-gray-700 hover:bg-gray-100',
      ]"
      @click="selectTool(tool)"
    >
      {{ tool.label }}
    </button>
  </div>
</template>
