import type { HedgeWordResult, HedgeMatch, HedgeWordCounts, HedgeGroup } from './types'
import { maskCodeBlocks } from '@/lib/text-utils'

const HEDGE_PATTERNS: Record<HedgeGroup, string[]> = {
	uncertainty: ['might', 'could', 'may', 'perhaps', 'possibly', 'conceivably', 'presumably'],
	frequency: ['generally', 'usually', 'often', 'sometimes', 'occasionally', 'typically', 'normally', 'frequently', 'rarely', 'seldom'],
	softener: ['somewhat', 'fairly', 'rather', 'quite', 'slightly', 'relatively', 'arguably', 'practically', 'essentially', 'basically', 'virtually'],
}

function findLineNumber(text: string, index: number): number {
	return (text.slice(0, index).match(/\n/g) || []).length + 1
}

function countWords(text: string): number {
	const words = text.trim().split(/\s+/).filter(w => w.length > 0)
	return words.length
}

function assessTone(density: number): string {
	if (density === 0) return 'Fully assertive — no hedging language detected.'
	if (density < 1) return 'Assertive tone — minimal hedging.'
	if (density <= 3) return 'Balanced tone — moderate hedging.'
	if (density <= 5) return 'Cautious tone — noticeable hedging throughout.'
	return 'Heavily hedged — hedging language may undermine confidence.'
}

export function analyzeHedgeWords(text: string): HedgeWordResult {
	const prose = maskCodeBlocks(text)
	const allMatches: HedgeMatch[] = []

	for (const [group, words] of Object.entries(HEDGE_PATTERNS) as [HedgeGroup, string[]][]) {
		for (const word of words) {
			const re = new RegExp(`\\b${word}\\b`, 'gi')
			let match: RegExpExecArray | null
			while ((match = re.exec(prose)) !== null) {
				allMatches.push({
					from: match.index,
					to: match.index + match[0].length,
					word: match[0].toLowerCase(),
					group,
					line: findLineNumber(text, match.index),
					dismissed: false,
				})
			}
		}
	}

	allMatches.sort((a, b) => a.from - b.from)

	const counts: HedgeWordCounts = { uncertainty: 0, frequency: 0, softener: 0 }
	for (const m of allMatches) {
		counts[m.group]++
	}

	const total = allMatches.length
	const wordCount = countWords(prose)

	const percentages = {} as Record<HedgeGroup, number>
	for (const key of Object.keys(counts) as HedgeGroup[]) {
		percentages[key] = total > 0 ? Math.round((counts[key] / total) * 100) : 0
	}

	const density = wordCount > 0 ? (total / wordCount) * 100 : 0

	return {
		type: 'hedge-words',
		matches: allMatches,
		counts,
		total,
		wordCount,
		percentages,
		density,
		toneAssessment: assessTone(density),
	}
}
