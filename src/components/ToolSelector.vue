<script setup lang="ts">
import { TOOLS } from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import { runTool } from '@/tools/runner'
import type { ToolId } from '@/tools/types'

const toolStore = useToolStore()
const settingsStore = useSettingsStore()

const allTools = [...TOOLS.filter((t) => t.category === 'analysis'), ...TOOLS.filter((t) => t.category === 'ai')]

function activeDef() {
  return TOOLS.find(t => t.id === toolStore.activeTool)
}

function isAiTool() {
  return activeDef()?.category === 'ai'
}

function isRunDisabled(): boolean {
  if (toolStore.isRunning) return true
  if (!toolStore.activeTool) return true
  if (isAiTool() && !settingsStore.hasKeyForCurrentProvider) return true
  return false
}

function onSelect(event: Event) {
  const id = (event.target as HTMLSelectElement).value as ToolId
  toolStore.setActiveTool(id)
  const tool = TOOLS.find(t => t.id === id)
  if (tool && tool.category !== 'ai') {
    runTool()
  }
}

function onRun() {
  if (!isRunDisabled()) {
    runTool()
  }
}
</script>

<template>
  <div class="tool-selector flex items-center gap-2">
    <select
      :value="toolStore.activeTool ?? ''"
      :disabled="toolStore.isRunning"
      class="flex-1 min-w-0 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-orange-400 disabled:opacity-50"
      @change="onSelect"
    >
      <option value="" disabled>Select a tool...</option>
      <optgroup label="Analysis">
        <option v-for="tool in allTools.filter(t => t.category === 'analysis')" :key="tool.id" :value="tool.id">
          {{ tool.label }}
        </option>
      </optgroup>
      <optgroup label="AI">
        <option
          v-for="tool in allTools.filter(t => t.category === 'ai')"
          :key="tool.id"
          :value="tool.id"
          :disabled="!settingsStore.hasKeyForCurrentProvider"
        >
          {{ tool.label }}
        </option>
      </optgroup>
    </select>
    <button
      v-if="isAiTool()"
      :disabled="isRunDisabled()"
      class="shrink-0 cursor-pointer rounded bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      @click="onRun"
    >
      Analyze with AI
    </button>
  </div>
</template>
