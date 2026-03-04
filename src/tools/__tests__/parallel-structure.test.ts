import { describe, it, expect } from 'vitest'
import { checkParallelStructure } from '@/tools/parallel-structure'

describe('checkParallelStructure', () => {
	it('returns type parallel-structure', () => {
		const result = checkParallelStructure('Hello world.')
		expect(result.type).toBe('parallel-structure')
	})

	it('returns empty lists and issues for text with no lists', () => {
		const result = checkParallelStructure('Just a paragraph with no lists at all.')
		expect(result.lists).toHaveLength(0)
		expect(result.issues).toHaveLength(0)
	})

	describe('list extraction', () => {
		it('extracts unordered lists with - markers', () => {
			const text = '- Install the package\n- Run the tests\n- Deploy the app'
			const result = checkParallelStructure(text)
			expect(result.lists).toHaveLength(1)
			expect(result.lists[0]!.items).toHaveLength(3)
			expect(result.lists[0]!.items[0]!.text).toBe('Install the package')
			expect(result.lists[0]!.items[1]!.text).toBe('Run the tests')
			expect(result.lists[0]!.items[2]!.text).toBe('Deploy the app')
		})

		it('extracts unordered lists with * markers', () => {
			const text = '* Install the package\n* Run the tests\n* Deploy the app'
			const result = checkParallelStructure(text)
			expect(result.lists).toHaveLength(1)
			expect(result.lists[0]!.items).toHaveLength(3)
			expect(result.lists[0]!.items[0]!.text).toBe('Install the package')
		})

		it('extracts ordered lists with numeric markers', () => {
			const text = '1. Install the package\n2. Run the tests\n3. Deploy the app'
			const result = checkParallelStructure(text)
			expect(result.lists).toHaveLength(1)
			expect(result.lists[0]!.items).toHaveLength(3)
			expect(result.lists[0]!.items[0]!.text).toBe('Install the package')
		})

		it('treats consecutive list items as one list', () => {
			const text = '- First item\n- Second item\n- Third item'
			const result = checkParallelStructure(text)
			expect(result.lists).toHaveLength(1)
			expect(result.lists[0]!.items).toHaveLength(3)
		})

		it('splits lists separated by blank lines', () => {
			const text = '- First list item 1\n- First list item 2\n\n- Second list item 1\n- Second list item 2'
			const result = checkParallelStructure(text)
			expect(result.lists).toHaveLength(2)
			expect(result.lists[0]!.items).toHaveLength(2)
			expect(result.lists[1]!.items).toHaveLength(2)
		})

		it('splits lists separated by non-list text', () => {
			const text = '- First list item 1\n- First list item 2\nSome paragraph text\n- Second list item 1\n- Second list item 2'
			const result = checkParallelStructure(text)
			expect(result.lists).toHaveLength(2)
		})

		it('handles multiple independent lists', () => {
			const text = '- Apple\n- Banana\n\nSome text.\n\n1. First step\n2. Second step'
			const result = checkParallelStructure(text)
			expect(result.lists).toHaveLength(2)
			expect(result.lists[0]!.items).toHaveLength(2)
			expect(result.lists[1]!.items).toHaveLength(2)
		})

		it('does not extract lists inside code blocks', () => {
			const text = 'Some text.\n```\n- This is code\n- Not a list\n```\nMore text.'
			const result = checkParallelStructure(text)
			expect(result.lists).toHaveLength(0)
		})
	})

	describe('pattern classification', () => {
		it('classifies imperative patterns', () => {
			const text = '- Install the package\n- Run the tests\n- Deploy the app'
			const result = checkParallelStructure(text)
			expect(result.lists[0]!.items[0]!.pattern).toBe('imperative')
			expect(result.lists[0]!.items[1]!.pattern).toBe('imperative')
			expect(result.lists[0]!.items[2]!.pattern).toBe('imperative')
		})

		it('classifies gerund patterns', () => {
			const text = '- Installing the package\n- Running the tests\n- Deploying the app'
			const result = checkParallelStructure(text)
			expect(result.lists[0]!.items[0]!.pattern).toBe('gerund')
			expect(result.lists[0]!.items[1]!.pattern).toBe('gerund')
			expect(result.lists[0]!.items[2]!.pattern).toBe('gerund')
		})

		it('classifies infinitive patterns', () => {
			const text = '- To install the package\n- To run the tests\n- To deploy the app'
			const result = checkParallelStructure(text)
			expect(result.lists[0]!.items[0]!.pattern).toBe('infinitive')
			expect(result.lists[0]!.items[1]!.pattern).toBe('infinitive')
			expect(result.lists[0]!.items[2]!.pattern).toBe('infinitive')
		})

		it('classifies noun-phrase patterns', () => {
			const text = '- The package manager\n- A test runner\n- An application server'
			const result = checkParallelStructure(text)
			expect(result.lists[0]!.items[0]!.pattern).toBe('noun-phrase')
			expect(result.lists[0]!.items[1]!.pattern).toBe('noun-phrase')
			expect(result.lists[0]!.items[2]!.pattern).toBe('noun-phrase')
		})

		it('classifies sentence patterns', () => {
			const text = '- You should install the package\n- We need to run the tests\n- They must deploy the app'
			const result = checkParallelStructure(text)
			expect(result.lists[0]!.items[0]!.pattern).toBe('sentence')
			expect(result.lists[0]!.items[1]!.pattern).toBe('sentence')
			expect(result.lists[0]!.items[2]!.pattern).toBe('sentence')
		})

		it('classifies other patterns', () => {
			const text = '- Red\n- Blue\n- Green'
			const result = checkParallelStructure(text)
			expect(result.lists[0]!.items[0]!.pattern).toBe('other')
			expect(result.lists[0]!.items[1]!.pattern).toBe('other')
			expect(result.lists[0]!.items[2]!.pattern).toBe('other')
		})
	})

	describe('parallel structure issues', () => {
		it('does not flag consistent lists', () => {
			const text = '- Install the package\n- Run the tests\n- Deploy the app'
			const result = checkParallelStructure(text)
			expect(result.issues.filter(i => i.kind === 'pattern')).toHaveLength(0)
			expect(result.lists[0]!.isConsistent).toBe(true)
		})

		it('flags mixed grammatical patterns', () => {
			const text = '- Install the package\n- Running the tests\n- Deploy the app'
			const result = checkParallelStructure(text)
			const patternIssues = result.issues.filter(i => i.kind === 'pattern')
			expect(patternIssues).toHaveLength(1)
			expect(patternIssues[0]!.message).toContain('imperative')
			expect(patternIssues[0]!.message).toContain('gerund')
			expect(patternIssues[0]!.itemIndex).toBe(1)
		})

		it('identifies dominant pattern correctly', () => {
			const text = '- Install the package\n- Running the tests\n- Deploy the app\n- Build the project'
			const result = checkParallelStructure(text)
			expect(result.lists[0]!.dominantPattern).toBe('imperative')
			const patternIssues = result.issues.filter(i => i.kind === 'pattern')
			expect(patternIssues).toHaveLength(1)
			expect(patternIssues[0]!.itemIndex).toBe(1)
		})

		it('does not flag single-item lists', () => {
			const text = '- Just one item'
			const result = checkParallelStructure(text)
			expect(result.issues).toHaveLength(0)
		})
	})

	describe('capitalization issues', () => {
		it('does not flag when all items have same capitalization', () => {
			const text = '- Install the package\n- Run the tests\n- Deploy the app'
			const result = checkParallelStructure(text)
			const capIssues = result.issues.filter(i => i.kind === 'capitalization')
			expect(capIssues).toHaveLength(0)
		})

		it('flags inconsistent capitalization', () => {
			const text = '- Install the package\n- run the tests\n- Deploy the app'
			const result = checkParallelStructure(text)
			const capIssues = result.issues.filter(i => i.kind === 'capitalization')
			expect(capIssues).toHaveLength(1)
			expect(capIssues[0]!.itemIndex).toBe(1)
			expect(capIssues[0]!.message).toContain('capitalization')
		})
	})

	describe('punctuation issues', () => {
		it('does not flag when all items have same trailing punctuation', () => {
			const text = '- Install the package.\n- Run the tests.\n- Deploy the app.'
			const result = checkParallelStructure(text)
			const punctIssues = result.issues.filter(i => i.kind === 'punctuation')
			expect(punctIssues).toHaveLength(0)
		})

		it('flags inconsistent trailing punctuation', () => {
			const text = '- Install the package.\n- Run the tests\n- Deploy the app.'
			const result = checkParallelStructure(text)
			const punctIssues = result.issues.filter(i => i.kind === 'punctuation')
			expect(punctIssues).toHaveLength(1)
			expect(punctIssues[0]!.itemIndex).toBe(1)
			expect(punctIssues[0]!.message).toContain('punctuation')
		})

		it('detects period as trailing punctuation', () => {
			const text = '- Install the package.\n- Run the tests.\n- Deploy the app.'
			const result = checkParallelStructure(text)
			expect(result.lists[0]!.items[0]!.trailingPunctuation).toBe('.')
			expect(result.lists[0]!.dominantPunctuation).toBe('.')
		})

		it('detects semicolon as trailing punctuation', () => {
			const text = '- Install the package;\n- Run the tests;\n- Deploy the app;'
			const result = checkParallelStructure(text)
			expect(result.lists[0]!.items[0]!.trailingPunctuation).toBe(';')
			expect(result.lists[0]!.dominantPunctuation).toBe(';')
		})

		it('detects no punctuation', () => {
			const text = '- Install the package\n- Run the tests\n- Deploy the app'
			const result = checkParallelStructure(text)
			expect(result.lists[0]!.items[0]!.trailingPunctuation).toBe('')
			expect(result.lists[0]!.dominantPunctuation).toBe('')
		})
	})

	describe('offsets', () => {
		it('provides correct absoluteOffset for items', () => {
			const text = '- Install the package\n- Run the tests'
			const result = checkParallelStructure(text)
			// "- " is 2 chars, so "Install" starts at index 2
			expect(result.lists[0]!.items[0]!.line).toBe(1)
			// For issues we check itemAbsoluteOffset, but for items we check via the list
			// The first item text "Install the package" starts after "- " at offset 2
			const firstItemOffset = text.indexOf('Install the package')
			expect(firstItemOffset).toBe(2)

			// The second item text "Run the tests" starts after "- " on line 2
			const secondItemOffset = text.indexOf('Run the tests')
			expect(secondItemOffset).toBe(24) // "- Install the package\n- " = 24

			// Now test via an issue: create a text that produces an issue
			const mixedText = '- Install the package\n- Running the tests\n- Deploy the app'
			const mixedResult = checkParallelStructure(mixedText)
			const issue = mixedResult.issues.find(i => i.kind === 'pattern')!
			expect(issue.itemAbsoluteOffset).toBe(mixedText.indexOf('Running the tests'))
		})

		it('provides correct itemLength', () => {
			const text = '- Install the package\n- Running the tests\n- Deploy the app'
			const result = checkParallelStructure(text)
			const issue = result.issues.find(i => i.kind === 'pattern')!
			expect(issue.itemLength).toBe('Running the tests'.length)
		})
	})
})
