import type { HeaderShiftResult, ShiftResult } from './types'

const HEADER_RE = /^(#{1,6})\s/

export function scanHeaders(content: string): HeaderShiftResult {
  const headerCounts: HeaderShiftResult['headerCounts'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  let totalHeaders = 0

  for (const line of content.split('\n')) {
    const match = line.match(HEADER_RE)
    if (match) {
      const level = match[1]!.length as 1 | 2 | 3 | 4 | 5 | 6
      headerCounts[level]++
      totalHeaders++
    }
  }

  return { type: 'header-shift', headerCounts, totalHeaders }
}

export function promoteHeaders(content: string): ShiftResult {
  const lines = content.split('\n')
  let shifted = 0

  // Check for H1s first
  for (const line of lines) {
    const match = line.match(HEADER_RE)
    if (match && match[1]!.length === 1) {
      return { ok: false, error: 'Cannot promote: H1 headers already exist and cannot go higher.', shifted: 0 }
    }
  }

  const result = lines.map(line => {
    const match = line.match(HEADER_RE)
    if (match) {
      shifted++
      return line.slice(1) // Remove one '#'
    }
    return line
  }).join('\n')

  return { ok: true, content: result, shifted }
}

export function demoteHeaders(content: string): ShiftResult {
  const lines = content.split('\n')
  let shifted = 0

  // Check for H6s first
  for (const line of lines) {
    const match = line.match(HEADER_RE)
    if (match && match[1]!.length === 6) {
      return { ok: false, error: 'Cannot demote: H6 headers already exist and cannot go lower.', shifted: 0 }
    }
  }

  const result = lines.map(line => {
    const match = line.match(HEADER_RE)
    if (match) {
      shifted++
      return '#' + line // Add one '#'
    }
    return line
  }).join('\n')

  return { ok: true, content: result, shifted }
}
