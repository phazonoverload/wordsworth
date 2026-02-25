<script setup lang="ts">
import { TOOLS } from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import { runTool } from '@/tools/runner'
import type { ToolId } from '@/tools/types'

const toolStore = useToolStore()
const settingsStore = useSettingsStore()

function activeDef() {
  return TOOLS.find(t => t.id === toolStore.activeTool)
}

function isAiTool() {
  return activeDef()?.category === 'ai'
}

function showAiButton() {
  if (!isAiTool()) return false
  if (toolStore.result && toolStore.result.type === toolStore.activeTool) return false
  return true
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
  <div class="tool-selector flex flex-col gap-2">
    <select
      :value="toolStore.activeTool ?? ''"
      :disabled="toolStore.isRunning"
      class="flex-1 min-w-0 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-orange-400 disabled:opacity-50"
      @change="onSelect"
    >
      <option value="" disabled>Select a tool...</option>
      <option v-for="tool in TOOLS" :key="tool.id" :value="tool.id">
        {{ tool.label }}
      </option>
    </select>
    <p v-if="activeDef()" class="text-xs text-gray-400">{{ activeDef()!.description }}</p>
    <button
      v-if="showAiButton()"
      :disabled="isRunDisabled()"
      class="shrink-0 cursor-pointer rounded bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      @click="onRun"
    >
      Analyze with AI
    </button>
  </div>
</template>
