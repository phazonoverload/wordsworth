import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/lib/storage'
import type { ToolId, ToolResult, ToolRun } from '@/tools/types'

const MAX_HISTORY = 20

export const useToolStore = defineStore('tools', () => {
  const savedHistory = storage.get<ToolRun[]>('wordsworth:history')

  const activeTool = ref<ToolId | null>(null)
  const isRunning = ref(false)
  const result = ref<ToolResult | null>(null)
  const history = ref<ToolRun[]>(savedHistory ?? [])

  function setActiveTool(toolId: ToolId) {
    activeTool.value = toolId
    result.value = null
  }

  function setRunning(running: boolean) {
    isRunning.value = running
  }

  function setResult(toolResult: ToolResult) {
    result.value = toolResult
    if (activeTool.value) {
      history.value.push({
        toolId: activeTool.value,
        result: toolResult,
        timestamp: Date.now(),
      })
      if (history.value.length > MAX_HISTORY) {
        history.value = history.value.slice(-MAX_HISTORY)
      }
      storage.set('wordsworth:history', history.value)
    }
  }

  return { activeTool, isRunning, result, history, setActiveTool, setRunning, setResult }
})
