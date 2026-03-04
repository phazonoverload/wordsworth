import { describe, it, expect } from 'vitest'
import { analyzeHedgeWords } from '@/tools/hedge-words'

describe('analyzeHedgeWords', () => {
	it('returns type hedge-words', () => {
		const result = analyzeHedgeWords('Hello world.')
		expect(result.type).toBe('hedge-words')
	})

	it('detects uncertainty words', () => {
		const result = analyzeHedgeWords('This might work. It could fail. Perhaps not.')
		expect(result.counts.uncertainty).toBe(3)
	})

	it('detects frequency words', () => {
		const result = analyzeHedgeWords('This generally works. It usually succeeds. Sometimes it fails.')
		expect(result.counts.frequency).toBe(3)
	})

	it('detects softener words', () => {
		const result = analyzeHedgeWords('It is somewhat fast. The API is fairly stable. Results are relatively consistent.')
		expect(result.counts.softener).toBe(3)
	})

	it('is case-insensitive', () => {
		const result = analyzeHedgeWords('MIGHT work. Could fail. PERHAPS not.')
		expect(result.counts.uncertainty).toBe(3)
	})

	it('calculates total across all groups', () => {
		const result = analyzeHedgeWords('This might generally be somewhat true.')
		expect(result.total).toBe(3)
	})

	it('calculates percentages', () => {
		const result = analyzeHedgeWords('might could perhaps')
		expect(result.percentages.uncertainty).toBe(100)
		expect(result.percentages.frequency).toBe(0)
		expect(result.percentages.softener).toBe(0)
	})

	it('returns zero counts when no hedge words found', () => {
		const result = analyzeHedgeWords('The API returns a JSON response.')
		expect(result.total).toBe(0)
		expect(result.counts.uncertainty).toBe(0)
		expect(result.counts.frequency).toBe(0)
		expect(result.counts.softener).toBe(0)
	})

	it('calculates density as percentage of total words', () => {
		const result = analyzeHedgeWords('This might work fine.')
		expect(result.density).toBeCloseTo(25, 0)
	})

	it('returns wordCount', () => {
		const result = analyzeHedgeWords('one two three four five')
		expect(result.wordCount).toBe(5)
	})

	it('excludes fenced code blocks', () => {
		const text = 'Start.\n```\nThis might could perhaps fail.\n```\nEnd.'
		const result = analyzeHedgeWords(text)
		expect(result.total).toBe(0)
	})

	it('excludes inline code', () => {
		const text = 'Use `might` and `could` carefully.'
		const result = analyzeHedgeWords(text)
		expect(result.total).toBe(0)
	})

	it('provides correct from/to offsets', () => {
		const text = 'It might work.'
		const result = analyzeHedgeWords(text)
		expect(result.matches).toHaveLength(1)
		expect(result.matches[0]!.from).toBe(3)
		expect(result.matches[0]!.to).toBe(8)
		expect(text.slice(result.matches[0]!.from, result.matches[0]!.to)).toBe('might')
	})

	it('sorts matches by from position', () => {
		const result = analyzeHedgeWords('might could perhaps')
		const froms = result.matches.map(m => m.from)
		expect(froms).toEqual([...froms].sort((a, b) => a - b))
	})

	it('assigns correct group to each match', () => {
		const result = analyzeHedgeWords('might generally somewhat')
		expect(result.matches[0]!.group).toBe('uncertainty')
		expect(result.matches[1]!.group).toBe('frequency')
		expect(result.matches[2]!.group).toBe('softener')
	})

	it('includes line number for each match', () => {
		const text = 'Line one.\nThis might work.\nLine three.'
		const result = analyzeHedgeWords(text)
		expect(result.matches[0]!.line).toBe(2)
	})

	it('initializes dismissed to false', () => {
		const result = analyzeHedgeWords('might')
		expect(result.matches[0]!.dismissed).toBe(false)
	})

	it('does not match partial words', () => {
		const result = analyzeHedgeWords('nightmare sometimes')
		expect(result.total).toBe(1)
		expect(result.matches[0]!.word).toBe('sometimes')
	})

	it('assesses tone as fully assertive when no hedge words', () => {
		const result = analyzeHedgeWords('The API returns JSON.')
		expect(result.toneAssessment).toContain('assertive')
	})

	it('assesses tone as heavily hedged at high density', () => {
		const result = analyzeHedgeWords('might could perhaps possibly generally somewhat')
		expect(result.toneAssessment).toMatch(/hedged/i)
	})

	it('detects all uncertainty words', () => {
		const words = ['might', 'could', 'may', 'perhaps', 'possibly', 'conceivably', 'presumably']
		for (const word of words) {
			const result = analyzeHedgeWords(`This ${word} works.`)
			expect(result.counts.uncertainty).toBe(1)
		}
	})

	it('detects all frequency words', () => {
		const words = ['generally', 'usually', 'often', 'sometimes', 'occasionally', 'typically', 'normally', 'frequently', 'rarely', 'seldom']
		for (const word of words) {
			const result = analyzeHedgeWords(`This ${word} works.`)
			expect(result.counts.frequency).toBe(1)
		}
	})

	it('detects all softener words', () => {
		const words = ['somewhat', 'fairly', 'rather', 'quite', 'slightly', 'relatively', 'arguably', 'practically', 'essentially', 'basically', 'virtually']
		for (const word of words) {
			const result = analyzeHedgeWords(`This ${word} works.`)
			expect(result.counts.softener).toBe(1)
		}
	})
})
