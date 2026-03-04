import type {
	ParallelStructureResult,
	ParallelStructureList,
	ParallelStructureItem,
	ParallelStructureIssue,
	ListItemPattern,
} from './types'
import { maskCodeBlocks } from '@/lib/text-utils'

// ~80 common imperative verbs for API docs / technical writing
const IMPERATIVE_VERBS = new Set([
	'install', 'run', 'click', 'open', 'create', 'delete', 'update', 'configure', 'set', 'add',
	'remove', 'enable', 'disable', 'start', 'stop', 'restart', 'build', 'deploy', 'test', 'check',
	'verify', 'select', 'enter', 'type', 'copy', 'paste', 'navigate', 'go', 'use', 'download',
	'upload', 'import', 'export', 'save', 'load', 'read', 'write', 'connect', 'disconnect', 'log',
	'sign', 'submit', 'cancel', 'confirm', 'accept', 'reject', 'approve', 'deny', 'allow', 'block',
	'grant', 'revoke', 'assign', 'unassign', 'close', 'send', 'receive', 'define', 'declare',
	'initialize', 'call', 'invoke', 'return', 'pass', 'throw', 'catch', 'handle', 'validate',
	'parse', 'format', 'convert', 'transform', 'merge', 'split', 'sort', 'filter', 'map', 'reduce',
	'bind', 'attach', 'detach', 'mount', 'unmount', 'render', 'fetch', 'push', 'pull', 'commit',
	'clone', 'fork', 'publish', 'subscribe', 'unsubscribe', 'register', 'deregister', 'wrap',
	'unwrap', 'encode', 'decode', 'encrypt', 'decrypt', 'compress', 'decompress', 'scroll', 'drag',
	'drop', 'hover', 'focus', 'blur', 'toggle', 'switch', 'swap', 'reset', 'clear', 'flush',
	'purge', 'refresh', 'reload', 'retry', 'skip', 'abort', 'pause', 'resume', 'lock', 'unlock',
	'pin', 'unpin', 'archive', 'restore', 'backup', 'migrate', 'upgrade', 'downgrade', 'patch',
	'debug', 'trace', 'monitor', 'profile', 'benchmark', 'audit', 'scan', 'lint', 'specify',
	'ensure', 'include', 'exclude', 'extend', 'override', 'implement', 'annotate', 'tag', 'label',
	'name', 'list', 'describe', 'show', 'display', 'print', 'output', 'note', 'document', 'comment',
	'mark', 'highlight', 'flag', 'indicate', 'point', 'reference', 'link', 'embed', 'insert',
	'append', 'prepend', 'inject', 'eject', 'require', 'need', 'want', 'expect', 'assert', 'assume',
])

const DETERMINERS = new Set([
	'the', 'a', 'an', 'this', 'that', 'these', 'those', 'each', 'every',
	'some', 'any', 'all', 'no', 'your', 'our', 'their', 'its', 'my', 'his', 'her',
])

const SUBJECT_PRONOUNS_AND_NOUNS = new Set([
	'you', 'we', 'they', 'it', 'he', 'she',
	'users', 'developers', 'administrators', 'clients', 'servers', 'applications',
	'systems', 'services', 'components', 'modules', 'functions', 'methods', 'classes',
	'objects', 'files', 'directories', 'endpoints', 'requests', 'responses',
])

const COMMON_VERBS = new Set([
	'is', 'are', 'was', 'were', 'has', 'have', 'had', 'can', 'could', 'will', 'would',
	'should', 'may', 'might', 'must', 'shall', 'do', 'does', 'did', 'need', 'needs',
])

const LIST_ITEM_REGEX = /^(\s*)([-*+])\s+(.*)$|^(\s*)(\d+)\.\s+(.*)$/

/**
 * Extract the item text and the character offset where it starts within the line.
 */
function parseListLine(line: string): { text: string; markerLength: number } | null {
	const m = LIST_ITEM_REGEX.exec(line)
	if (!m) return null

	if (m[2] !== undefined) {
		// Unordered: groups 1(indent), 2(marker), 3(text)
		const indent = m[1] || ''
		const marker = m[2]
		// "  - text" → markerLength = indent + marker + space = indent.length + 1 + 1
		const markerLength = indent.length + marker.length + 1
		return { text: m[3] || '', markerLength }
	} else {
		// Ordered: groups 4(indent), 5(digits), 6(text)
		const indent = m[4] || ''
		const digits = m[5] || ''
		// "  1. text" → markerLength = indent + digits + ". "
		const markerLength = indent.length + digits.length + 2
		return { text: m[6] || '', markerLength }
	}
}

function classifyPattern(text: string): ListItemPattern {
	const words = text.split(/\s+/).filter(w => w.length > 0)
	if (words.length === 0) return 'other'

	const firstWord = words[0]!
	const firstWordLower = firstWord.toLowerCase()

	// Infinitive: "to" + verb-like second word
	if (firstWordLower === 'to' && words.length >= 2) {
		const secondWord = words[1]!.toLowerCase()
		if (IMPERATIVE_VERBS.has(secondWord) || secondWord.endsWith('ate') || secondWord.endsWith('ize') || secondWord.endsWith('ify')) {
			return 'infinitive'
		}
	}

	// Gerund: first word ends in -ing, length > 4
	if (firstWordLower.endsWith('ing') && firstWordLower.length > 4) {
		return 'gerund'
	}

	// Imperative: first word is a known imperative verb
	if (IMPERATIVE_VERBS.has(firstWordLower)) {
		return 'imperative'
	}

	// Noun-phrase: first word is a determiner/article
	if (DETERMINERS.has(firstWordLower)) {
		return 'noun-phrase'
	}

	// Sentence: first word is a subject pronoun/noun
	if (SUBJECT_PRONOUNS_AND_NOUNS.has(firstWordLower)) {
		return 'sentence'
	}

	// Sentence: first word capitalized + second word is a common verb
	if (words.length >= 2 && /^[A-Z]/.test(firstWord)) {
		const secondWordLower = words[1]!.toLowerCase()
		if (COMMON_VERBS.has(secondWordLower)) {
			return 'sentence'
		}
	}

	return 'other'
}

function getTrailingPunctuation(text: string): string {
	if (text.length === 0) return ''
	const lastChar = text[text.length - 1]!
	if (lastChar === '.' || lastChar === ';' || lastChar === ':') {
		return lastChar
	}
	return ''
}

function computeDominantPattern(items: ParallelStructureItem[]): ListItemPattern {
	const counts = new Map<ListItemPattern, number>()
	for (const item of items) {
		counts.set(item.pattern, (counts.get(item.pattern) || 0) + 1)
	}

	let best: ListItemPattern = items[0]!.pattern
	let bestCount = 0
	for (const [pattern, count] of counts) {
		if (count > bestCount) {
			bestCount = count
			best = pattern
		}
	}
	return best
}

function computeDominantCapitalization(items: ParallelStructureItem[]): boolean {
	let trueCount = 0
	let falseCount = 0
	for (const item of items) {
		if (item.capitalized) trueCount++
		else falseCount++
	}
	// If tied, prefer capitalized (true)
	return trueCount >= falseCount
}

function computeDominantPunctuation(items: ParallelStructureItem[]): string {
	const counts = new Map<string, number>()
	for (const item of items) {
		counts.set(item.trailingPunctuation, (counts.get(item.trailingPunctuation) || 0) + 1)
	}

	let best = ''
	let bestCount = 0
	for (const [punct, count] of counts) {
		if (count > bestCount) {
			bestCount = count
			best = punct
		} else if (count === bestCount && punct === '') {
			// If tied, prefer '' (no punctuation)
			best = ''
		}
	}
	return best
}

export function checkParallelStructure(text: string): ParallelStructureResult {
	const prose = maskCodeBlocks(text)
	const lines = prose.split('\n')

	// Extract list groups
	type RawItem = {
		line: number       // 1-indexed line number
		text: string       // item text after marker
		absoluteOffset: number  // character offset of text in original doc
	}

	const listGroups: RawItem[][] = []
	let currentGroup: RawItem[] = []

	let charOffset = 0
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!
		const parsed = parseListLine(line)

		if (parsed && parsed.text.trim().length > 0) {
			currentGroup.push({
				line: i + 1,
				text: parsed.text,
				absoluteOffset: charOffset + parsed.markerLength,
			})
		} else {
			// Non-list line breaks the group
			if (currentGroup.length > 0) {
				listGroups.push(currentGroup)
				currentGroup = []
			}
		}

		charOffset += line.length + 1 // +1 for the \n
	}
	// Don't forget the last group
	if (currentGroup.length > 0) {
		listGroups.push(currentGroup)
	}

	// Build ParallelStructureList and issues
	const lists: ParallelStructureList[] = []
	const issues: ParallelStructureIssue[] = []

	for (let listIdx = 0; listIdx < listGroups.length; listIdx++) {
		const group = listGroups[listIdx]!

		const items: ParallelStructureItem[] = group.map(raw => ({
			line: raw.line,
			text: raw.text,
			pattern: classifyPattern(raw.text),
			capitalized: raw.text.length > 0 && /^[A-Z]/.test(raw.text),
			trailingPunctuation: getTrailingPunctuation(raw.text),
		}))

		const dominantPattern = computeDominantPattern(items)
		const dominantCapitalization = computeDominantCapitalization(items)
		const dominantPunctuation = computeDominantPunctuation(items)

		let isConsistent = true

		// Only flag lists with 2+ items
		if (items.length >= 2) {
			for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
				const item = items[itemIdx]!
				const raw = group[itemIdx]!

				// Pattern issues
				if (item.pattern !== dominantPattern) {
					isConsistent = false
					issues.push({
						listIndex: listIdx,
						itemIndex: itemIdx,
						itemLine: item.line,
						itemAbsoluteOffset: raw.absoluteOffset,
						itemLength: item.text.length,
						kind: 'pattern',
						message: `Expected ${dominantPattern} pattern but found ${item.pattern}: "${item.text}"`,
					})
				}

				// Capitalization issues
				if (item.capitalized !== dominantCapitalization) {
					isConsistent = false
					const isCapitalized = item.capitalized ? 'is' : 'is not'
					const mostAre = dominantCapitalization ? 'are' : 'are not'
					issues.push({
						listIndex: listIdx,
						itemIndex: itemIdx,
						itemLine: item.line,
						itemAbsoluteOffset: raw.absoluteOffset,
						itemLength: item.text.length,
						kind: 'capitalization',
						message: `Inconsistent capitalization: this item ${isCapitalized} capitalized while most items ${mostAre}`,
					})
				}

				// Punctuation issues
				if (item.trailingPunctuation !== dominantPunctuation) {
					isConsistent = false
					const actual = item.trailingPunctuation || 'no punctuation'
					const dominant = dominantPunctuation || 'no punctuation'
					issues.push({
						listIndex: listIdx,
						itemIndex: itemIdx,
						itemLine: item.line,
						itemAbsoluteOffset: raw.absoluteOffset,
						itemLength: item.text.length,
						kind: 'punctuation',
						message: `Inconsistent ending punctuation: this item ends with "${actual}" while most items end with "${dominant}"`,
					})
				}
			}
		}

		lists.push({
			startLine: items[0]!.line,
			items,
			dominantPattern,
			dominantCapitalization,
			dominantPunctuation,
			isConsistent,
		})
	}

	return { type: 'parallel-structure', lists, issues }
}
