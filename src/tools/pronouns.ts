import type { PronounResult, PronounCounts, PronounMatch } from './types'

// Each group aggregates personal pronoun, objective, possessive adjective, and possessive pronoun
const PRONOUN_GROUP_PATTERNS: Record<keyof PronounCounts, RegExp[]> = {
  i: [/\bi\b/gi, /\bme\b/gi, /\bmy\b/gi, /\bmine\b/gi],
  you: [/\byou\b/gi, /\byour\b/gi, /\byours\b/gi],
  we: [/\bwe\b/gi, /\bus\b/gi, /\bour\b/gi, /\bours\b/gi],
}

function collectMatches(text: string, group: keyof PronounCounts, patterns: RegExp[]): PronounMatch[] {
  const matches: PronounMatch[] = []
  for (const regex of patterns) {
    // Reset lastIndex since we reuse the regex
    const re = new RegExp(regex.source, regex.flags)
    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
      matches.push({ from: match.index, to: match.index + match[0].length, group })
    }
  }
  return matches
}

function assessTone(counts: PronounCounts, total: number): string {
  if (total === 0) return 'No pronouns detected — neutral/impersonal tone.'

  const authorFocused = counts.i + counts.we
  const readerFocused = counts.you

  const authorPct = (authorFocused / total) * 100
  const readerPct = (readerFocused / total) * 100

  if (readerPct > 50) return 'Strongly reader-focused tone. Addresses the reader directly.'
  if (readerPct > authorPct) return 'Mostly reader-focused tone.'
  if (authorPct > 50) return 'Strongly author-focused tone. Centered on the writer/team.'
  if (authorPct > readerPct) return 'Mostly author-focused tone.'
  return 'Balanced tone between author and reader.'
}

export function analyzePronouns(text: string): PronounResult {
  const allMatches: PronounMatch[] = []

  for (const group of Object.keys(PRONOUN_GROUP_PATTERNS) as Array<keyof PronounCounts>) {
    allMatches.push(...collectMatches(text, group, PRONOUN_GROUP_PATTERNS[group]))
  }

  // Sort by position for consistent ordering
  allMatches.sort((a, b) => a.from - b.from)

  const counts: PronounCounts = { i: 0, you: 0, we: 0 }
  for (const match of allMatches) {
    counts[match.group]++
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
    matches: allMatches,
    toneAssessment: assessTone(counts, total),
  }
}
