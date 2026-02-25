import type { StyleCheckResult, StyleIssue } from './types'

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

const TECHNICAL_JARGON = [
  'api', 'endpoint', 'middleware', 'refactor', 'deploy', 'repository', 'merge',
  'commit', 'pipeline', 'microservice', 'containerize', 'kubernetes', 'docker',
  'webhook', 'sdk', 'cli', 'dns', 'tcp', 'http', 'ssl', 'ssh', 'cdn',
  'cron', 'daemon', 'regex', 'mutex', 'semaphore', 'polymorphism',
  'abstraction', 'encapsulation', 'serialization', 'deserialization',
]

function isTechnicalAudience(readerContext: string): boolean {
  const lower = readerContext.toLowerCase()
  if (lower === '') return true
  if (/\bnon[- ]?technical\b/.test(lower)) return false
  return (
    lower.includes('developer') ||
    lower.includes('engineer') ||
    lower.includes('technical') ||
    lower.includes('programmer') ||
    lower.includes('devops') ||
    lower.includes('architect')
  )
}

function findLineAndOffset(text: string, matchIndex: number): { line: number; offset: number; absoluteOffset: number } {
  const upTo = text.slice(0, matchIndex)
  const line = (upTo.match(/\n/g) || []).length + 1
  const lastNewline = upTo.lastIndexOf('\n')
  const offset = matchIndex - (lastNewline + 1)
  return { line, offset, absoluteOffset: matchIndex }
}

export function checkStyle(text: string, readerContext: string): StyleCheckResult {
  const issues: StyleIssue[] = []

  // Passive voice
  let match: RegExpExecArray | null
  const passiveRegex = new RegExp(PASSIVE_REGEX.source, 'gi')
  while ((match = passiveRegex.exec(text)) !== null) {
    const { line, offset, absoluteOffset } = findLineAndOffset(text, match.index)
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
    while ((match = regex.exec(text)) !== null) {
      const { line, offset, absoluteOffset } = findLineAndOffset(text, match.index)
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

  // Jargon (only for non-technical audiences)
  if (!isTechnicalAudience(readerContext)) {
    const words = text.toLowerCase().split(/\b/)
    let charIndex = 0
    for (const word of words) {
      const cleaned = word.replace(/[^a-z]/g, '')
      if (TECHNICAL_JARGON.includes(cleaned)) {
        const { line, offset, absoluteOffset } = findLineAndOffset(text, charIndex)
        issues.push({
          severity: 'info',
          category: 'jargon',
          message: `"${cleaned}" may be unfamiliar to your target reader.`,
          line,
          offset,
          absoluteOffset,
          length: word.length,
          suggestion: `Consider explaining or replacing "${cleaned}"`,
        })
      }
      charIndex += word.length
    }
  }

  return { type: 'style-check', issues }
}
