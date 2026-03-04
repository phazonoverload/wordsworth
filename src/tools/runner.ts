import { useToolStore } from '@/stores/tools'
import { useDocumentStore } from '@/stores/document'
import { analyzeReadability } from '@/tools/readability'
import { checkStyle } from '@/tools/style-check'
import { analyzePronouns } from '@/tools/pronouns'
import { cutTwenty } from '@/tools/cut-twenty'
import { trackPromises } from '@/tools/promise-tracker'
import { scanHeaders } from '@/tools/header-shift'
import { checkParallelStructure } from '@/tools/parallel-structure'
import { checkAcronyms } from '@/tools/acronym-checker'
import { analyzeHedgeWords } from '@/tools/hedge-words'
import type { ToolResult } from '@/tools/types'

export async function runTool(): Promise<void> {
  const toolStore = useToolStore()
  const documentStore = useDocumentStore()

  if (!toolStore.activeTool) return
  if (!documentStore.content) return

  const content = documentStore.content
  const readerContext = documentStore.readerContext.description

  toolStore.setRunning(true)
  try {
    let result: ToolResult

    switch (toolStore.activeTool) {
      case 'readability':
        result = analyzeReadability(content)
        break
      case 'style-check':
        result = checkStyle(content, readerContext)
        break
      case 'pronouns':
        result = analyzePronouns(content)
        break
      case 'cut-twenty':
        result = await cutTwenty(content, readerContext)
        break
      case 'promise-tracker':
        result = await trackPromises(content)
        break
      case 'header-shift':
        result = scanHeaders(content)
        break
      case 'parallel-structure':
        result = checkParallelStructure(content)
        break
      case 'acronym-checker':
        result = checkAcronyms(content)
        break
      case 'hedge-words':
        result = analyzeHedgeWords(content)
        break
    }

    toolStore.setResult(result)
  } catch {
    // Error handled gracefully — isRunning is reset in finally
  } finally {
    toolStore.setRunning(false)
  }
}
