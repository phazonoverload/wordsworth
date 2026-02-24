import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/lib/storage'

export interface ReaderContext {
  description: string
  preset?: string
}

export const useDocumentStore = defineStore('document', () => {
  const saved = storage.get<{ content: string; updatedAt: number }>('wordsworth:document')
  const savedReader = storage.get<ReaderContext>('wordsworth:reader')

  const content = ref(saved?.content ?? '')
  const readerContext = ref<ReaderContext>(savedReader ?? { description: '' })

  function setContent(text: string) {
    content.value = text
    storage.set('wordsworth:document', { content: text, updatedAt: Date.now() })
  }

  function setReaderContext(ctx: ReaderContext) {
    readerContext.value = ctx
    storage.set('wordsworth:reader', ctx)
  }

  return { content, readerContext, setContent, setReaderContext }
})
