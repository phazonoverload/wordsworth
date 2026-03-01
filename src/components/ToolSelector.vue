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

function onSelect(id: ToolId) {
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
    <div class="grid grid-cols-3 gap-1.5">
      <button
        v-for="tool in TOOLS"
        :key="tool.id"
        :disabled="toolStore.isRunning"
        :class="[
          'cursor-pointer rounded border px-2 py-1.5 text-xs font-medium transition',
          toolStore.activeTool === tool.id
            ? 'border-orange-400 bg-orange-50 text-orange-700'
            : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50',
          'disabled:cursor-not-allowed disabled:opacity-50',
        ]"
        @click="onSelect(tool.id)"
      >
        {{ tool.label }}
      </button>
    </div>
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
