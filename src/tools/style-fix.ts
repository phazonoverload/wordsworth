import { callAI } from '@/ai/client'
import type { StyleIssue } from './types'

interface SingleFixResponse {
  editedParagraph: string
}

interface BatchFixResponse {
  editedDocument: string
}

/**
 * Extract the paragraph containing the given line number.
 * Paragraphs are separated by blank lines.
 * Returns { paragraph, startIndex, endIndex } where indices are absolute character positions in the full text.
 */
export function extractParagraph(text: string, lineNumber: number): { paragraph: string; startIndex: number; endIndex: number } {
  const lines = text.split('\n')
  const targetIdx = lineNumber - 1

  // Walk backwards to find paragraph start
  let startLine = targetIdx
  while (startLine > 0 && lines[startLine - 1]!.trim() !== '') {
    startLine--
  }

  // Walk forwards to find paragraph end
  let endLine = targetIdx
  while (endLine < lines.length - 1 && lines[endLine + 1]!.trim() !== '') {
    endLine++
  }

  // Compute character indices
  let startIndex = 0
  for (let i = 0; i < startLine; i++) {
    startIndex += lines[i]!.length + 1 // +1 for \n
  }

  let endIndex = startIndex
  for (let i = startLine; i <= endLine; i++) {
    endIndex += lines[i]!.length + (i < endLine ? 1 : 0)
  }

  const paragraph = lines.slice(startLine, endLine + 1).join('\n')
  return { paragraph, startIndex, endIndex }
}

export async function fixSingleIssue(text: string, issue: StyleIssue, readerContext: string): Promise<string> {
  const { paragraph, startIndex, endIndex } = extractParagraph(text, issue.line)

  const issueStart = issue.absoluteOffset - startIndex
  const issueEnd = issueStart + issue.length
  const flaggedText = paragraph.slice(issueStart, issueEnd)

  const system = [
    'You are a writing editor. Fix the specific style issue in the given paragraph.',
    'Return the entire paragraph with only the flagged issue fixed. Preserve all other text exactly.',
    `Issue: ${issue.message}`,
    issue.suggestion ? `Suggestion: ${issue.suggestion}` : '',
    `The problematic text is: "${flaggedText}"`,
    readerContext ? `Target audience: ${readerContext}` : '',
  ].filter(Boolean).join('\n')

  const object = await callAI<SingleFixResponse>({
    action: 'fix-single',
    system,
    prompt: paragraph,
  })

  return text.slice(0, startIndex) + object.editedParagraph + text.slice(endIndex)
}

export async function fixAllIssues(text: string, issues: StyleIssue[], readerContext: string): Promise<string> {
  const issueList = issues.map((issue, i) => {
    return `${i + 1}. Line ${issue.line}: [${issue.category}] ${issue.message}${issue.suggestion ? ` (suggestion: ${issue.suggestion})` : ''}`
  }).join('\n')

  const system = [
    'You are a writing editor. Fix all the flagged style issues in the document.',
    'Return the entire document with only the listed issues fixed. Preserve all other text exactly.',
    'Issues to fix:',
    issueList,
    readerContext ? `Target audience: ${readerContext}` : '',
  ].filter(Boolean).join('\n')

  const object = await callAI<BatchFixResponse>({
    action: 'fix-all',
    system,
    prompt: text,
  })

  return object.editedDocument
}
