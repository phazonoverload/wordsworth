import { callAI } from '@/ai/client'
import type { ParallelStructureIssue, ParallelStructureList } from './types'

interface SingleFixResponse {
	editedItem: string
}

interface BatchFixResponse {
	editedDocument: string
}

/**
 * Find the line in the text at the given 1-indexed line number
 * and return the start/end character offsets of the full line.
 */
function findLineRange(text: string, lineNumber: number): { start: number; end: number } {
	const lines = text.split('\n')
	let start = 0
	for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
		start += lines[i]!.length + 1
	}
	const lineContent = lines[lineNumber - 1] || ''
	return { start, end: start + lineContent.length }
}

export async function fixParallelSingle(
	text: string,
	issue: ParallelStructureIssue,
	list: ParallelStructureList,
	readerContext: string,
): Promise<string> {
	const item = list.items[issue.itemIndex]!
	const { start: lineStart, end: lineEnd } = findLineRange(text, issue.itemLine)
	const fullLine = text.slice(lineStart, lineEnd)

	const targetDescriptions: string[] = []
	if (issue.kind === 'pattern' || list.dominantPattern !== item.pattern) {
		targetDescriptions.push(`grammatical pattern: ${list.dominantPattern}`)
	}
	if (issue.kind === 'capitalization' || item.capitalized !== list.dominantCapitalization) {
		targetDescriptions.push(`capitalization: ${list.dominantCapitalization ? 'capitalize first word' : 'lowercase first word'}`)
	}
	if (issue.kind === 'punctuation' || item.trailingPunctuation !== list.dominantPunctuation) {
		targetDescriptions.push(`ending punctuation: ${list.dominantPunctuation || 'none'}`)
	}

	const system = [
		'You are a writing editor fixing a list item for parallel structure.',
		'Rewrite ONLY the list item text (without the bullet/number marker) to match the target conventions.',
		`Current item text: "${item.text}"`,
		`Target conventions: ${targetDescriptions.join(', ')}`,
		`Example items from same list that follow the convention: ${list.items.filter((_, i) => i !== issue.itemIndex).map(i => `"${i.text}"`).slice(0, 3).join(', ')}`,
		'Preserve the meaning of the item. Only change the grammatical form, capitalization, and punctuation.',
		readerContext ? `Target audience: ${readerContext}` : '',
	].filter(Boolean).join('\n')

	const object = await callAI<SingleFixResponse>({
		action: 'fix-parallel-single',
		system,
		prompt: fullLine,
	})

	// Replace just the item text portion within the line
	const markerPrefix = fullLine.slice(0, fullLine.length - item.text.length)
	const newLine = markerPrefix + object.editedItem
	return text.slice(0, lineStart) + newLine + text.slice(lineEnd)
}

export async function fixParallelAll(
	text: string,
	issues: ParallelStructureIssue[],
	lists: ParallelStructureList[],
	readerContext: string,
): Promise<string> {
	const issueList = issues.map((issue, i) => {
		const list = lists[issue.listIndex]!
		const item = list.items[issue.itemIndex]!
		const targetParts: string[] = []
		if (issue.kind === 'pattern') {
			targetParts.push(`pattern should be ${list.dominantPattern}`)
		}
		if (issue.kind === 'capitalization') {
			targetParts.push(`should ${list.dominantCapitalization ? 'be capitalized' : 'be lowercase'}`)
		}
		if (issue.kind === 'punctuation') {
			targetParts.push(`should end with ${list.dominantPunctuation || 'no punctuation'}`)
		}
		return `${i + 1}. Line ${issue.itemLine}: "${item.text}" — ${targetParts.join(', ')}`
	}).join('\n')

	const system = [
		'You are a writing editor. Fix all the flagged list items in the document for parallel structure.',
		'Return the entire document with only the listed items fixed. Preserve all other text exactly.',
		'For each item, rewrite only the item text to match the target convention while preserving meaning.',
		'Issues to fix:',
		issueList,
		readerContext ? `Target audience: ${readerContext}` : '',
	].filter(Boolean).join('\n')

	const object = await callAI<BatchFixResponse>({
		action: 'fix-parallel-all',
		system,
		prompt: text,
	})

	return object.editedDocument
}
