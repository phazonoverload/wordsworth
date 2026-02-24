import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from '@/ai/client'
import { countWords } from '@/lib/text-utils'
import type { CutResult } from './types'

const cutResponseSchema = z.object({
  chunks: z.array(z.object({
    original: z.string().describe('The original text segment'),
    edited: z.string().describe('The condensed version'),
    reason: z.string().describe('Why this edit was made'),
  })),
})

export async function cutTwenty(text: string, readerContext: string): Promise<CutResult> {
  const model = getModel()

  const system = [
    'You are a technical editor. Your task is to cut the provided text by approximately 20% while preserving technical accuracy and meaning.',
    'Return only the chunks where you made edits — do not include unchanged sections.',
    'Each chunk should contain the original text segment and your condensed version.',
    readerContext
      ? `The target audience is: ${readerContext}. Consider their background when deciding what to cut.`
      : '',
  ].filter(Boolean).join('\n')

  const { object } = await generateObject({
    model,
    schema: cutResponseSchema,
    system,
    prompt: text,
  })

  const originalWordCount = countWords(text)

  // Build the edited full text by replacing original segments with edited ones
  let editedText = text
  for (const chunk of object.chunks) {
    editedText = editedText.replace(chunk.original, chunk.edited)
  }
  const editedWordCount = countWords(editedText)

  const reductionPercent = originalWordCount > 0
    ? ((originalWordCount - editedWordCount) / originalWordCount) * 100
    : 0

  const chunks = object.chunks.map((chunk) => ({
    id: crypto.randomUUID(),
    original: chunk.original,
    edited: chunk.edited,
    reason: chunk.reason,
    accepted: null as boolean | null,
  }))

  return {
    type: 'cut-twenty',
    chunks,
    originalWordCount,
    editedWordCount,
    reductionPercent,
  }
}
