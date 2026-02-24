import { watch } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { useToolStore } from '@/stores/tools'
import { runTool } from '@/tools/runner'
import { TOOLS } from '@/tools/types'

export function useAutoRun() {
  const documentStore = useDocumentStore()
  const toolStore = useToolStore()

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(() => documentStore.content, () => {
    if (!toolStore.activeTool || !documentStore.content) return

    const tool = TOOLS.find(t => t.id === toolStore.activeTool)
    if (!tool || tool.category !== 'analysis') return

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      runTool()
    }, 500)
  })
}
