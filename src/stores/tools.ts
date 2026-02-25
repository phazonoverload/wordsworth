import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/lib/storage'
import type { ToolId, ToolResult, ToolRun, PronounMatch } from '@/tools/types'

export type HighlightRange = { from: number; to: number }

const MAX_HISTORY = 20

export const useToolStore = defineStore('tools', () => {
  const savedHistory = storage.get<ToolRun[]>('wordsworth:history')

  const activeTool = ref<ToolId | null>(null)
  const isRunning = ref(false)
  const result = ref<ToolResult | null>(null)
  const history = ref<ToolRun[]>(savedHistory ?? [])
  const highlightRange = ref<HighlightRange | null>(null)
  const pronounHighlights = ref<PronounMatch[]>([])
  const mergeOriginal = ref<string | null>(null)
  const mergeModified = ref<string | null>(null)

  function setActiveTool(toolId: ToolId) {
    activeTool.value = toolId
    result.value = null
    highlightRange.value = null
    pronounHighlights.value = []
  }

  function setHighlightRange(range: HighlightRange) {
    highlightRange.value = range
  }

  function clearHighlightRange() {
    highlightRange.value = null
  }

  function setPronounHighlights(matches: PronounMatch[]) {
    pronounHighlights.value = matches
  }

  function clearPronounHighlights() {
    pronounHighlights.value = []
  }

  function setRunning(running: boolean) {
    isRunning.value = running
  }

  function setMergeState(original: string, modified: string) {
    mergeOriginal.value = original
    mergeModified.value = modified
  }

  function clearMergeState() {
    mergeOriginal.value = null
    mergeModified.value = null
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

  return {
    activeTool, isRunning, result, history, highlightRange, pronounHighlights,
    mergeOriginal, mergeModified,
    setActiveTool, setRunning, setResult, setHighlightRange, clearHighlightRange,
    setPronounHighlights, clearPronounHighlights,
    setMergeState, clearMergeState,
  }
})
