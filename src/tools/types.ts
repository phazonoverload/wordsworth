export type ToolId = 'readability' | 'style-check' | 'pronouns' | 'cut-twenty' | 'promise-tracker'

export type ToolCategory = 'analysis' | 'ai'

export interface ToolDefinition {
  id: ToolId
  label: string
  category: ToolCategory
  description: string
}

export const TOOLS: ToolDefinition[] = [
  { id: 'readability', label: 'Readability', category: 'analysis', description: 'Flesch-Kincaid, Gunning Fog, grade level, word count, reading time' },
  { id: 'style-check', label: 'Style Check', category: 'analysis', description: 'Passive voice, wordy phrases, inconsistent spelling & terminology' },
  { id: 'pronouns', label: 'Pronouns', category: 'analysis', description: 'Pronoun frequency, tone assessment' },
  { id: 'cut-twenty', label: 'Cut 20%', category: 'ai', description: 'Trim text to ~80% length with diff review' },
  { id: 'promise-tracker', label: 'Promises', category: 'ai', description: 'Check if intro promises are delivered in conclusion' },
]

export interface ReadabilityResult {
  type: 'readability'
  fleschKincaid: number
  gunningFog: number
  gradeLevel: number
  wordCount: number
  sentenceCount: number
  readingTimeMinutes: number
  audienceNote: string
}

export interface StyleIssue {
  severity: 'warning' | 'info'
  category: 'passive-voice' | 'wordiness' | 'inconsistency'
  message: string
  line: number
  offset: number
  absoluteOffset: number
  length: number
  suggestion?: string
}

export interface StyleCheckResult {
  type: 'style-check'
  issues: StyleIssue[]
}

export interface PronounCounts {
  we: number
  i: number
  you: number
  they: number
  he: number
  she: number
  it: number
}

export interface PronounResult {
  type: 'pronouns'
  counts: PronounCounts
  total: number
  percentages: Record<keyof PronounCounts, number>
  toneAssessment: string
}

export interface DiffChunk {
  id: string
  original: string
  edited: string
  reason: string
  accepted: boolean | null
}

export interface CutResult {
  type: 'cut-twenty'
  chunks: DiffChunk[]
  originalWordCount: number
  editedWordCount: number
  reductionPercent: number
}

export interface Promise {
  id: string
  text: string
}

export interface PromiseVerdict {
  promiseId: string
  verdict: 'pass' | 'fail' | 'partial'
  evidence: string
}

export interface PromiseResult {
  type: 'promise-tracker'
  promises: Promise[]
  verdicts: PromiseVerdict[]
}

export type ToolResult =
  | ReadabilityResult
  | StyleCheckResult
  | PronounResult
  | CutResult
  | PromiseResult

export interface ToolRun {
  toolId: ToolId
  result: ToolResult
  timestamp: number
}
