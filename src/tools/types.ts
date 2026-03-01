export type ToolId = 'readability' | 'style-check' | 'pronouns' | 'cut-twenty' | 'promise-tracker' | 'header-shift' | 'parallel-structure' | 'acronym-checker' | 'hedge-words'

export type ToolCategory = 'analysis' | 'ai'

export interface ToolDefinition {
	id: ToolId
	label: string
	category: ToolCategory
	description: string
}

export const TOOLS: ToolDefinition[] = [
	{
		id: 'readability',
		label: 'Readability',
		category: 'analysis',
		description: 'Flesch-Kincaid, Gunning Fog, grade level, word count, reading time',
	},
	{
		id: 'style-check',
		label: 'Style Check',
		category: 'analysis',
		description: 'Passive voice, wordy phrases, inconsistent spelling & terminology',
	},
	{ id: 'pronouns', label: 'Pronouns', category: 'analysis', description: 'Pronoun frequency, tone assessment' },
	{
		id: 'header-shift',
		label: 'Header Shift',
		category: 'analysis',
		description: 'Promote or demote all markdown headers by one level',
	},
	{
		id: 'cut-twenty',
		label: 'Cut 20%',
		category: 'ai',
		description: 'Trim text to ~80% length with diff review',
	},
	{
		id: 'promise-tracker',
		label: 'Promises',
		category: 'ai',
		description: 'Check if intro promises are delivered in conclusion',
	},
	{
		id: 'parallel-structure',
		label: 'Parallel Structure',
		category: 'analysis',
		description: 'Find lists where items don\'t follow the same grammatical pattern',
	},
	{
		id: 'acronym-checker',
		label: 'Acronym Checker',
		category: 'analysis',
		description: 'Find acronyms that aren\'t expanded on first use',
	},
	{
		id: 'hedge-words',
		label: 'Hedge Words',
		category: 'analysis',
		description: 'Find hedging language that weakens confident technical writing',
	},
]

export interface ReadabilityResult {
	type: 'readability'
	fleschKincaid: number
	gunningFog: number
	gradeLevel: number
	wordCount: number
	sentenceCount: number
	readingTimeMinutes: number
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
	i: number
	you: number
	we: number
}

export interface PronounMatch {
	from: number
	to: number
	group: keyof PronounCounts
}

export interface PronounResult {
	type: 'pronouns'
	counts: PronounCounts
	total: number
	percentages: Record<keyof PronounCounts, number>
	matches: PronounMatch[]
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

export type HeaderCounts = Record<1 | 2 | 3 | 4 | 5 | 6, number>

export interface HeaderShiftResult {
	type: 'header-shift'
	headerCounts: HeaderCounts
	totalHeaders: number
}

export interface ShiftResult {
	ok: boolean
	content?: string
	error?: string
	shifted: number
}

export type ListItemPattern = 'imperative' | 'gerund' | 'infinitive' | 'noun-phrase' | 'sentence' | 'other'

export interface ParallelStructureItem {
	line: number
	text: string
	pattern: ListItemPattern
	capitalized: boolean
	trailingPunctuation: string
}

export interface ParallelStructureList {
	startLine: number
	items: ParallelStructureItem[]
	dominantPattern: ListItemPattern
	dominantCapitalization: boolean
	dominantPunctuation: string
	isConsistent: boolean
}

export type ParallelStructureIssueKind = 'pattern' | 'capitalization' | 'punctuation'

export interface ParallelStructureIssue {
	listIndex: number
	itemIndex: number
	itemLine: number
	itemAbsoluteOffset: number
	itemLength: number
	kind: ParallelStructureIssueKind
	message: string
	suggestion?: string
}

export interface ParallelStructureResult {
	type: 'parallel-structure'
	lists: ParallelStructureList[]
	issues: ParallelStructureIssue[]
}

export interface AcronymIssue {
	acronym: string
	line: number
	absoluteOffset: number
	length: number
	count: number
	firstExpanded: boolean
	dismissed: boolean
}

export interface AcronymCheckerResult {
	type: 'acronym-checker'
	acronyms: AcronymIssue[]
	totalAcronymsFound: number
	allExpanded: boolean
}

export type HedgeGroup = 'uncertainty' | 'frequency' | 'softener'

export interface HedgeMatch {
	from: number
	to: number
	word: string
	group: HedgeGroup
	line: number
	dismissed: boolean
}

export interface HedgeWordCounts {
	uncertainty: number
	frequency: number
	softener: number
}

export interface HedgeWordResult {
	type: 'hedge-words'
	matches: HedgeMatch[]
	counts: HedgeWordCounts
	total: number
	wordCount: number
	percentages: Record<HedgeGroup, number>
	density: number
	toneAssessment: string
}

export type ToolResult =
	| ReadabilityResult
	| StyleCheckResult
	| PronounResult
	| CutResult
	| PromiseResult
	| HeaderShiftResult
	| ParallelStructureResult
	| AcronymCheckerResult
	| HedgeWordResult

export interface ToolRun {
	toolId: ToolId
	result: ToolResult
	timestamp: number
}
