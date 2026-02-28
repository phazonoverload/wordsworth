import { z } from 'zod'

/**
 * Zod schemas for each AI action's structured output.
 * Shared between the Netlify proxy (ai-proxy.mts) and the client-side Ollama path.
 */
export const SCHEMAS = {
  'cut-twenty': z.object({
    chunks: z.array(
      z.object({
        original: z.string().describe('The original text segment'),
        edited: z.string().describe('The condensed version'),
        reason: z.string().describe('Why this edit was made'),
      })
    ),
  }),
  'fix-single': z.object({
    editedParagraph: z
      .string()
      .describe('The paragraph with the style issue fixed'),
  }),
  'fix-all': z.object({
    editedDocument: z
      .string()
      .describe('The full document with all flagged style issues fixed'),
  }),
  'promise-tracker': z.object({
    promises: z.array(
      z.object({
        text: z
          .string()
          .describe('The promise or claim made in the introduction'),
      })
    ),
    verdicts: z.array(
      z.object({
        promiseIndex: z
          .number()
          .describe('Index of the promise this verdict is for'),
        verdict: z
          .enum(['pass', 'fail', 'partial'])
          .describe('Whether the promise was fulfilled'),
        evidence: z
          .string()
          .describe('Evidence supporting the verdict'),
      })
    ),
  }),
  'audience-assessment': z.object({
    assessment: z
      .string()
      .describe(
        'A one-paragraph assessment of whether the writing is well-suited for the target audience, considering domain-appropriate jargon, sentence complexity, and assumed knowledge'
      ),
  }),
} as const

export type ActionId = keyof typeof SCHEMAS
