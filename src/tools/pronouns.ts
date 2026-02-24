import type { PronounResult, PronounCounts } from './types'

const PRONOUN_PATTERNS: Record<keyof PronounCounts, RegExp> = {
  we: /\bwe\b/gi,
  i: /\bi\b/gi,
  you: /\byou\b/gi,
  they: /\bthey\b/gi,
  he: /\bhe\b/gi,
  she: /\bshe\b/gi,
  it: /\bit\b/gi,
}

function countMatches(text: string, regex: RegExp): number {
  const matches = text.match(regex)
  return matches ? matches.length : 0
}

function assessTone(counts: PronounCounts, total: number): string {
  if (total === 0) return 'No pronouns detected — neutral/impersonal tone.'

  const authorFocused = counts.i + counts.we
  const readerFocused = counts.you
  const thirdPerson = counts.they + counts.he + counts.she + counts.it

  const authorPct = (authorFocused / total) * 100
  const readerPct = (readerFocused / total) * 100

  if (readerPct > 50) return 'Strongly reader-focused tone. Addresses the reader directly.'
  if (readerPct > authorPct) return 'Mostly reader-focused tone.'
  if (authorPct > 50) return 'Strongly author-focused tone. Centered on the writer/team.'
  if (authorPct > readerPct) return 'Mostly author-focused tone.'
  if (thirdPerson > authorFocused + readerFocused) return 'Third-person/descriptive tone.'
  return 'Balanced tone between author and reader.'
}

export function analyzePronouns(text: string): PronounResult {
  const counts: PronounCounts = {
    we: countMatches(text, PRONOUN_PATTERNS.we),
    i: countMatches(text, PRONOUN_PATTERNS.i),
    you: countMatches(text, PRONOUN_PATTERNS.you),
    they: countMatches(text, PRONOUN_PATTERNS.they),
    he: countMatches(text, PRONOUN_PATTERNS.he),
    she: countMatches(text, PRONOUN_PATTERNS.she),
    it: countMatches(text, PRONOUN_PATTERNS.it),
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)

  const percentages = {} as Record<keyof PronounCounts, number>
  for (const key of Object.keys(counts) as Array<keyof PronounCounts>) {
    percentages[key] = total > 0 ? Math.round((counts[key] / total) * 100) : 0
  }

  return {
    type: 'pronouns',
    counts,
    total,
    percentages,
    toneAssessment: assessTone(counts, total),
  }
}
