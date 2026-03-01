import type { AcronymCheckerResult, AcronymIssue } from './types'
import { maskCodeBlocks } from '@/lib/text-utils'

/**
 * Common abbreviations that are well-understood without expansion.
 * Kept intentionally small — only truly universal terms.
 */
const SKIP_LIST = new Set([
	'OK', 'US', 'AM', 'PM', 'ID', 'TV', 'UK', 'EU', 'UN', 'DC',
	'AD', 'BC', 'CE', 'IT', 'OR', 'AN', 'AT', 'IF', 'IN', 'IS',
	'NO', 'OF', 'ON', 'SO', 'TO', 'UP', 'VS',
])

/** Regex to find sequences of 2+ uppercase letters as whole words. */
const ACRONYM_REGEX = /\b[A-Z]{2,}\b/g

/**
 * Check whether an acronym is expanded near its first occurrence.
 *
 * Recognized patterns:
 *   1. Parenthetical definition: "Full Phrase (ACRONYM)" — the acronym
 *      appears inside parentheses immediately after its expansion.
 *   2. Reverse parenthetical: "ACRONYM (Full Phrase)" — the acronym
 *      comes first, followed by its expansion in parentheses.
 *   3. Inline "or" definition: "ACRONYM, or Full Phrase" — the acronym
 *      is followed by a comma + "or" and the expansion.
 */
function isExpanded(text: string, acronym: string): boolean {
	// Pattern 1: "Some Phrase (ACRONYM)"
	const parenDef = new RegExp(`\\([^)]*\\b${acronym}\\b[^)]*\\)`, 'g')
	if (parenDef.test(text)) return true

	// Pattern 2: "ACRONYM (Some Phrase)"
	const reverseParen = new RegExp(`\\b${acronym}\\b\\s*\\([^)]+\\)`, 'g')
	if (reverseParen.test(text)) return true

	// Pattern 3: "ACRONYM, or Some Phrase" / "ACRONYM — or Some Phrase"
	const inlineOr = new RegExp(`\\b${acronym}\\b[,\\s]+or\\s+[A-Za-z]`, 'g')
	if (inlineOr.test(text)) return true

	return false
}

function findLineAndOffset(text: string, matchIndex: number): { line: number; absoluteOffset: number } {
	const upTo = text.slice(0, matchIndex)
	const line = (upTo.match(/\n/g) || []).length + 1
	return { line, absoluteOffset: matchIndex }
}

export function checkAcronyms(text: string): AcronymCheckerResult {
	const prose = maskCodeBlocks(text)

	// Collect all acronym occurrences
	const occurrences: Map<string, { positions: number[] }> = new Map()
	let match: RegExpExecArray | null
	const regex = new RegExp(ACRONYM_REGEX.source, 'g')

	while ((match = regex.exec(prose)) !== null) {
		const acronym = match[0]

		// Skip well-known abbreviations
		if (SKIP_LIST.has(acronym)) continue

		if (!occurrences.has(acronym)) {
			occurrences.set(acronym, { positions: [] })
		}
		occurrences.get(acronym)!.positions.push(match.index)
	}

	const totalAcronymsFound = occurrences.size
	const issues: AcronymIssue[] = []

	for (const [acronym, data] of occurrences) {
		const expanded = isExpanded(prose, acronym)

		if (!expanded) {
			const firstPos = data.positions[0]!
			const { line, absoluteOffset } = findLineAndOffset(text, firstPos)
			issues.push({
				acronym,
				line,
				absoluteOffset,
				length: acronym.length,
				count: data.positions.length,
				firstExpanded: false,
				dismissed: false,
			})
		}
	}

	// Sort by first appearance in the document
	issues.sort((a, b) => a.absoluteOffset - b.absoluteOffset)

	return {
		type: 'acronym-checker',
		acronyms: issues,
		totalAcronymsFound,
		allExpanded: issues.length === 0,
	}
}
