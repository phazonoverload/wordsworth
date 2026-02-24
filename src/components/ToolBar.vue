<script setup lang="ts">
import { computed } from 'vue'
import { TOOLS, type ToolId } from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { runTool } from '@/tools/runner'

const toolStore = useToolStore()

const groupedTools = computed(() => {
  const categories = [
    { name: 'Analysis', key: 'analysis' as const },
    { name: 'AI', key: 'ai' as const },
  ]
  return categories.map((cat) => ({
    name: cat.name,
    tools: TOOLS.filter((t) => t.category === cat.key),
  }))
})

async function selectTool(toolId: ToolId) {
  toolStore.setActiveTool(toolId)
  await runTool()
}
</script>

<template>
  <div class="tool-bar flex flex-col gap-4 p-4">
    <div v-for="category in groupedTools" :key="category.name">
      <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {{ category.name }}
      </h3>
      <div class="flex flex-col gap-1">
        <button
          v-for="tool in category.tools"
          :key="tool.id"
          :disabled="toolStore.isRunning"
          :class="[
            'flex flex-col items-start rounded px-3 py-2 text-left text-sm transition',
            'hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
            toolStore.activeTool === tool.id
              ? 'active bg-blue-100 font-medium text-blue-900'
              : 'text-gray-700',
          ]"
          @click="selectTool(tool.id)"
        >
          <span class="font-medium">{{ tool.label }}</span>
          <span class="text-xs text-gray-500">{{ tool.description }}</span>
        </button>
      </div>
    </div>
    <div
      v-if="toolStore.isRunning"
      class="mt-2 text-center text-sm text-gray-500"
    >
      Running...
    </div>
  </div>
</template>
