import type { StyleCheckResult, StyleIssue } from './types'
import { maskCodeBlocks } from '@/lib/text-utils'

const PASSIVE_REGEX = /\b(was|were|is|are|been|being|be)\s+(\w+ed|written|built|made|done|seen|given|taken|found|known|shown|told|sent|kept|left)\b/gi

const WORDY_PHRASES: Array<{ pattern: RegExp; suggestion: string; label: string }> = [
  { pattern: /\bin order to\b/gi, suggestion: 'to', label: 'in order to' },
  { pattern: /\bat this point in time\b/gi, suggestion: 'now', label: 'at this point in time' },
  { pattern: /\bdue to the fact that\b/gi, suggestion: 'because', label: 'due to the fact that' },
  { pattern: /\bin the event that\b/gi, suggestion: 'if', label: 'in the event that' },
  { pattern: /\bfor the purpose of\b/gi, suggestion: 'to', label: 'for the purpose of' },
  { pattern: /\bin the process of\b/gi, suggestion: '(omit)', label: 'in the process of' },
  { pattern: /\bit is important to note that\b/gi, suggestion: '(omit)', label: 'it is important to note that' },
  { pattern: /\bas a matter of fact\b/gi, suggestion: 'in fact', label: 'as a matter of fact' },
  { pattern: /\ba large number of\b/gi, suggestion: 'many', label: 'a large number of' },
  { pattern: /\butilize\b/gi, suggestion: 'use', label: 'utilize' },
  { pattern: /\bleverage\b/gi, suggestion: 'use', label: 'leverage' },
  { pattern: /\bfacilitate\b/gi, suggestion: 'help / enable', label: 'facilitate' },
]

/** US/UK spelling variant pairs. Each tuple is [US spelling, UK spelling]. */
const SPELLING_VARIANTS: Array<[string, string]> = [
  ['color', 'colour'],
  ['favor', 'favour'],
  ['honor', 'honour'],
  ['humor', 'humour'],
  ['labor', 'labour'],
  ['neighbor', 'neighbour'],
  ['behavior', 'behaviour'],
  ['organize', 'organise'],
  ['realize', 'realise'],
  ['recognize', 'recognise'],
  ['analyze', 'analyse'],
  ['apologize', 'apologise'],
  ['customize', 'customise'],
  ['center', 'centre'],
  ['meter', 'metre'],
  ['theater', 'theatre'],
  ['defense', 'defence'],
  ['offense', 'offence'],
  ['license', 'licence'],
  ['catalog', 'catalogue'],
  ['dialog', 'dialogue'],
  ['program', 'programme'],
  ['gray', 'grey'],
  ['canceled', 'cancelled'],
  ['traveled', 'travelled'],
  ['modeling', 'modelling'],
  ['judgment', 'judgement'],
  ['acknowledgment', 'acknowledgement'],
  ['fulfill', 'fulfil'],
]

/** Groups of terms that refer to the same concept. */
const TERM_VARIANTS: string[][] = [
  ['user', 'customer', 'client'],
  ['app', 'application'],
  ['e-mail', 'email'],
  ['login', 'log in', 'log-in'],
  ['setup', 'set up', 'set-up'],
  ['database', 'data base'],
  ['website', 'web site', 'web-site'],
  ['ok', 'okay'],
  ['percent', 'per cent'],
  ['afterward', 'afterwards'],
  ['toward', 'towards'],
  ['among', 'amongst'],
  ['while', 'whilst'],
]

function findLineAndOffset(text: string, matchIndex: number): { line: number; offset: number; absoluteOffset: number } {
  const upTo = text.slice(0, matchIndex)
  const line = (upTo.match(/\n/g) || []).length + 1
  const lastNewline = upTo.lastIndexOf('\n')
  const offset = matchIndex - (lastNewline + 1)
  return { line, offset, absoluteOffset: matchIndex }
}

/** Count case-insensitive whole-word occurrences and collect their positions. */
function findWordOccurrences(text: string, term: string): number[] {
  const escaped = term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
  const positions: number[] = []
  let m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    positions.push(m.index)
  }
  return positions
}

/**
 * Given a list of variant terms, find which ones appear in the text.
 * Returns the dominant term (most occurrences) and issues for the minority variants.
 */
function detectVariantInconsistencies(
  text: string,
  variants: string[][],
  labelPrefix: string,
): StyleIssue[] {
  const issues: StyleIssue[] = []

  for (const group of variants) {
    const found: Array<{ term: string; positions: number[] }> = []
    for (const term of group) {
      const positions = findWordOccurrences(text, term)
      if (positions.length > 0) {
        found.push({ term, positions })
      }
    }

    // Only flag if two or more variants from the same group are used
    if (found.length < 2) continue

    // Determine the dominant variant (most occurrences)
    found.sort((a, b) => b.positions.length - a.positions.length)
    const dominant = found[0]!

    // Flag all occurrences of non-dominant variants
    for (let i = 1; i < found.length; i++) {
      const minority = found[i]!
      for (const pos of minority.positions) {
        const { line, offset, absoluteOffset } = findLineAndOffset(text, pos)
        issues.push({
          severity: 'info',
          category: 'inconsistency',
          message: `${labelPrefix}: "${minority.term}" is also written as "${dominant.term}" elsewhere. Pick one for consistency.`,
          line,
          offset,
          absoluteOffset,
          length: minority.term.length,
          suggestion: dominant.term,
        })
      }
    }
  }

  return issues
}

export function checkStyle(text: string, _readerContext: string): StyleCheckResult {
  const issues: StyleIssue[] = []
  // Mask code blocks so regexes skip them, but positions stay valid
  const prose = maskCodeBlocks(text)

  // Passive voice
  let match: RegExpExecArray | null
  const passiveRegex = new RegExp(PASSIVE_REGEX.source, 'gi')
  while ((match = passiveRegex.exec(prose)) !== null) {
    const { line, offset, absoluteOffset } = findLineAndOffset(prose, match.index)
    issues.push({
      severity: 'warning',
      category: 'passive-voice',
      message: `Passive voice: "${match[0]}". Consider rewriting in active voice.`,
      line,
      offset,
      absoluteOffset,
      length: match[0].length,
    })
  }

  // Wordy phrases
  for (const { pattern, suggestion, label } of WORDY_PHRASES) {
    const regex = new RegExp(pattern.source, 'gi')
    while ((match = regex.exec(prose)) !== null) {
      const { line, offset, absoluteOffset } = findLineAndOffset(prose, match.index)
      issues.push({
        severity: 'info',
        category: 'wordiness',
        message: `Wordy: "${label}" can be simplified.`,
        line,
        offset,
        absoluteOffset,
        length: match[0].length,
        suggestion,
      })
    }
  }

  // Inconsistent spelling (US/UK variants)
  const spellingVariantGroups = SPELLING_VARIANTS.map(([us, uk]) => [us, uk])
  issues.push(...detectVariantInconsistencies(prose, spellingVariantGroups, 'Inconsistent spelling'))

  // Inconsistent terminology
  issues.push(...detectVariantInconsistencies(prose, TERM_VARIANTS, 'Inconsistent term'))

  return { type: 'style-check', issues }
}
