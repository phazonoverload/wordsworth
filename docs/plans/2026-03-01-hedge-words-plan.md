# Hedge Words Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a client-side "Hedge Words" tool that detects hedging language (might, could, possibly, generally, etc.), groups matches into 3 categories with counts/percentages, highlights them inline in the editor with per-group colors, provides a confidence tone assessment, and supports per-match dismiss.

**Architecture:** Hybrid of Pronouns (word-level regex matching, grouped categories, inline editor highlighting with per-group colors, percentage bars) and Acronym Checker (per-match dismiss with `dismissed` boolean, visible/dismissed filtering). Detection uses `maskCodeBlocks` to exclude code, then `\b`-bounded case-insensitive regex per word. Matches carry `from`/`to` character offsets for both highlighting and click-to-scroll.

**Tech Stack:** Vue 3, TypeScript, Pinia, CodeMirror 6, Vitest, @vue/test-utils

---

### Task 1: Add types to `types.ts`

**Files:**
- Modify: `src/tools/types.ts`

**Step 1: Add `'hedge-words'` to the ToolId union (line 1)**

Change:
```ts
export type ToolId = 'readability' | 'style-check' | 'pronouns' | 'cut-twenty' | 'promise-tracker' | 'header-shift' | 'parallel-structure' | 'acronym-checker'
```
To:
```ts
export type ToolId = 'readability' | 'style-check' | 'pronouns' | 'cut-twenty' | 'promise-tracker' | 'header-shift' | 'parallel-structure' | 'acronym-checker' | 'hedge-words'
```

**Step 2: Add the TOOLS entry (after the acronym-checker entry, before the `]`)**

```ts
	{
		id: 'hedge-words',
		label: 'Hedge Words',
		category: 'analysis',
		description: 'Find hedging language that weakens confident technical writing',
	},
```

**Step 3: Add the type interfaces (after AcronymCheckerResult, before the ToolResult union)**

```ts
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
```

**Step 4: Add `HedgeWordResult` to the ToolResult union**

```ts
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
```

**Step 5: Verify the build**

Run: `npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors from the types we just added.

**Step 6: Commit**

```
git add src/tools/types.ts
git commit -m "feat(hedge-words): add type definitions"
```

---

### Task 2: Implement detection logic with tests (TDD)

**Files:**
- Create: `src/tools/__tests__/hedge-words.test.ts`
- Create: `src/tools/hedge-words.ts`

**Step 1: Write the test file**

```ts
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
		// "might" is 1 hedge word out of 4 total words = 25%
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
		// "might" inside "nightmare" should NOT match; "sometimes" SHOULD match
		expect(result.total).toBe(1)
		expect(result.matches[0]!.word).toBe('sometimes')
	})

	it('assesses tone as fully assertive when no hedge words', () => {
		const result = analyzeHedgeWords('The API returns JSON.')
		expect(result.toneAssessment).toContain('assertive')
	})

	it('assesses tone as heavily hedged at high density', () => {
		// 4 hedge words in a 6-word sentence ≈ 67%
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
```

**Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/tools/__tests__/hedge-words.test.ts 2>&1 | tail -5`
Expected: FAIL — module not found

**Step 3: Write the implementation**

Create `src/tools/hedge-words.ts`:

```ts
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
```

**Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/tools/__tests__/hedge-words.test.ts`
Expected: All tests pass

**Step 5: Commit**

```
git add src/tools/hedge-words.ts src/tools/__tests__/hedge-words.test.ts
git commit -m "feat(hedge-words): add detection logic with tests"
```

---

### Task 3: Wire into runner

**Files:**
- Modify: `src/tools/runner.ts`
- Modify: `src/tools/__tests__/runner.test.ts`

**Step 1: Add the mock to `runner.test.ts` (after the acronym-checker mock)**

```ts
vi.mock('@/tools/hedge-words', () => ({
  analyzeHedgeWords: vi.fn(() => ({
    type: 'hedge-words',
    matches: [],
    counts: { uncertainty: 0, frequency: 0, softener: 0 },
    total: 0,
    wordCount: 0,
    percentages: { uncertainty: 0, frequency: 0, softener: 0 },
    density: 0,
    toneAssessment: 'Fully assertive — no hedging language detected.',
  })),
}))
```

Add the import (after the checkAcronyms import):
```ts
import { analyzeHedgeWords } from '@/tools/hedge-words'
```

Add the test (after the acronym-checker dispatch test):
```ts
  it('dispatches to analyzeHedgeWords', async () => {
    const toolStore = useToolStore()
    const docStore = useDocumentStore()
    docStore.setContent('This might work.')
    toolStore.setActiveTool('hedge-words')

    await runTool()

    expect(analyzeHedgeWords).toHaveBeenCalledWith('This might work.')
    expect(toolStore.result).not.toBeNull()
    expect(toolStore.result!.type).toBe('hedge-words')
  })
```

**Step 2: Add the import and case to `runner.ts`**

Import (after the acronym-checker import):
```ts
import { analyzeHedgeWords } from '@/tools/hedge-words'
```

Case (after the acronym-checker case, before the closing `}`):
```ts
      case 'hedge-words':
        result = analyzeHedgeWords(content)
        break
```

**Step 3: Run the runner tests**

Run: `npx vitest run src/tools/__tests__/runner.test.ts`
Expected: All pass

**Step 4: Commit**

```
git add src/tools/runner.ts src/tools/__tests__/runner.test.ts
git commit -m "feat(hedge-words): wire into tool runner"
```

---

### Task 4: Add hedge highlights to the tool store

**Files:**
- Modify: `src/stores/tools.ts`

**Step 1: Add the hedgeHighlights ref (after pronounHighlights)**

```ts
  const hedgeHighlights = ref<HedgeMatch[]>([])
```

Import `HedgeMatch` from types (add to the existing import).

**Step 2: Clear in setActiveTool (after `pronounHighlights.value = []`)**

```ts
    hedgeHighlights.value = []
```

**Step 3: Add set/clear functions (after clearPronounHighlights)**

```ts
  function setHedgeHighlights(matches: HedgeMatch[]) {
    hedgeHighlights.value = matches
  }

  function clearHedgeHighlights() {
    hedgeHighlights.value = []
  }
```

**Step 4: Add to return object**

Add `hedgeHighlights` to the reactive values and `setHedgeHighlights, clearHedgeHighlights` to the functions in the return statement.

**Step 5: Run store tests**

Run: `npx vitest run src/stores/__tests__/tools.test.ts`
Expected: All pass

**Step 6: Commit**

```
git add src/stores/tools.ts
git commit -m "feat(hedge-words): add hedge highlights to tool store"
```

---

### Task 5: Add editor highlighting

**Files:**
- Modify: `src/components/EditorPane.vue`

**Step 1: Add hedge color constants (after PRONOUN_COLORS)**

```ts
const HEDGE_COLORS: Record<HedgeGroup, string> = {
  uncertainty: '#fed7aa', // orange-200
  frequency: '#fde68a',  // amber-200
  softener: '#fecdd3',   // rose-200
}

const hedgeMarkDecorations: Record<HedgeGroup, Decoration> = {
  uncertainty: Decoration.mark({ class: 'cm-hedge-uncertainty' }),
  frequency: Decoration.mark({ class: 'cm-hedge-frequency' }),
  softener: Decoration.mark({ class: 'cm-hedge-softener' }),
}
```

Import `HedgeGroup` and `HedgeMatch` from types (add to existing import).

**Step 2: Add StateEffect (after setPronounHighlightsEffect)**

```ts
const setHedgeHighlightsEffect = StateEffect.define<HedgeMatch[]>()
```

**Step 3: Add StateField (after pronounHighlightField)**

Follow the exact same pattern as `pronounHighlightField` but use `setHedgeHighlightsEffect` and `hedgeMarkDecorations[m.group]`. The field is identical in structure — just uses different effect/decoration references.

```ts
const hedgeHighlightField = StateField.define<RangeSet<Decoration>>({
  create() {
    return RangeSet.empty
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHedgeHighlightsEffect)) {
        const matches = effect.value
        if (matches.length === 0) return RangeSet.empty
        const docLen = tr.state.doc.length
        const ranges = matches
          .filter(m => m.from < docLen && m.to <= docLen)
          .map(m => hedgeMarkDecorations[m.group].range(m.from, m.to))
          .sort((a, b) => a.from - b.from)
        return RangeSet.of(ranges)
      }
    }

    if (tr.docChanged) {
      let mapped = decorations.map(tr.changes)
      const rangesToRemove: { from: number; to: number }[] = []
      tr.changes.iterChangedRanges((_fromOld, _toOld, fromNew, toNew) => {
        rangesToRemove.push({ from: fromNew, to: toNew })
      })
      if (rangesToRemove.length > 0) {
        const kept: { from: number; to: number; value: Decoration }[] = []
        const cursor = mapped.iter()
        while (cursor.value) {
          const decoFrom = cursor.from
          const decoTo = cursor.to
          const overlaps = rangesToRemove.some(
            r => decoFrom < r.to && decoTo > r.from,
          )
          if (!overlaps) {
            kept.push({ from: decoFrom, to: decoTo, value: cursor.value })
          }
          cursor.next()
        }
        return RangeSet.of(kept.map(k => k.value.range(k.from, k.to)))
      }
      return mapped
    }
    return decorations
  },
  provide: (field) => EditorView.decorations.from(field),
})
```

**Step 4: Add CSS theme classes (after the `.cm-pronoun-we` entry)**

```ts
  '.cm-hedge-uncertainty': {
    backgroundColor: HEDGE_COLORS.uncertainty,
    borderRadius: '2px',
  },
  '.cm-hedge-frequency': {
    backgroundColor: HEDGE_COLORS.frequency,
    borderRadius: '2px',
  },
  '.cm-hedge-softener': {
    backgroundColor: HEDGE_COLORS.softener,
    borderRadius: '2px',
  },
```

**Step 5: Add hedgeHighlightField to the extensions array**

Find where `pronounHighlightField` is included in the EditorState extensions and add `hedgeHighlightField` next to it.

**Step 6: Add watcher (after the pronoun highlights watcher)**

```ts
watch(
  () => toolStore.hedgeHighlights,
  (matches) => {
    if (!view) return
    view.dispatch({
      effects: setHedgeHighlightsEffect.of(matches),
    })
  },
)
```

**Step 7: Verify build**

Run: `npx vue-tsc --noEmit 2>&1 | head -20`

**Step 8: Commit**

```
git add src/components/EditorPane.vue
git commit -m "feat(hedge-words): add editor highlighting with per-group colors"
```

---

### Task 6: Build the result component with tests (TDD)

**Files:**
- Create: `src/components/__tests__/results/HedgeWordResult.test.ts`
- Create: `src/components/results/HedgeWordResult.vue`

**Step 1: Write the test file**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HedgeWordResult from '../../results/HedgeWordResult.vue'
import { useToolStore } from '@/stores/tools'
import type { HedgeWordResult as HedgeWordResultType, HedgeMatch } from '@/tools/types'

function makeMatch(overrides: Partial<HedgeMatch> = {}): HedgeMatch {
  return {
    from: 0,
    to: 5,
    word: 'might',
    group: 'uncertainty',
    line: 1,
    dismissed: false,
    ...overrides,
  }
}

function makeResult(overrides: Partial<HedgeWordResultType> = {}): HedgeWordResultType {
  return {
    type: 'hedge-words',
    matches: [],
    counts: { uncertainty: 0, frequency: 0, softener: 0 },
    total: 0,
    wordCount: 100,
    percentages: { uncertainty: 0, frequency: 0, softener: 0 },
    density: 0,
    toneAssessment: 'Fully assertive — no hedging language detected.',
    ...overrides,
  }
}

describe('HedgeWordResult', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows tone assessment banner', () => {
    const wrapper = mount(HedgeWordResult, {
      props: { result: makeResult({ toneAssessment: 'Cautious tone — noticeable hedging throughout.' }) },
    })
    expect(wrapper.text()).toContain('Cautious tone')
  })

  it('shows total hedge word count', () => {
    const wrapper = mount(HedgeWordResult, {
      props: { result: makeResult({ total: 7 }) },
    })
    expect(wrapper.text()).toContain('7')
  })

  it('shows density percentage', () => {
    const wrapper = mount(HedgeWordResult, {
      props: { result: makeResult({ density: 3.5 }) },
    })
    expect(wrapper.text()).toContain('3.5%')
  })

  it('renders a card for each group', () => {
    const wrapper = mount(HedgeWordResult, {
      props: { result: makeResult() },
    })
    const cards = wrapper.findAll('[data-testid="hedge-card"]')
    expect(cards).toHaveLength(3)
  })

  it('shows count per group', () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          counts: { uncertainty: 5, frequency: 3, softener: 2 },
          total: 10,
        }),
      },
    })
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('2')
  })

  it('shows percentage bars', () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          percentages: { uncertainty: 50, frequency: 30, softener: 20 },
          total: 10,
        }),
      },
    })
    const bars = wrapper.findAll('[data-testid="hedge-bar"]')
    expect(bars).toHaveLength(3)
  })

  it('renders individual match items for visible matches', () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [
            makeMatch({ word: 'might', from: 0 }),
            makeMatch({ word: 'could', from: 10, group: 'uncertainty' }),
          ],
          total: 2,
          counts: { uncertainty: 2, frequency: 0, softener: 0 },
        }),
      },
    })
    const items = wrapper.findAll('[data-testid="hedge-match"]')
    expect(items).toHaveLength(2)
  })

  it('shows word and line number for each match', () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [makeMatch({ word: 'might', line: 5 })],
          total: 1,
          counts: { uncertainty: 1, frequency: 0, softener: 0 },
        }),
      },
    })
    expect(wrapper.text()).toContain('might')
    expect(wrapper.text()).toContain('Line 5')
  })

  it('calls setHighlightRange when a match is clicked', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [makeMatch({ from: 10, to: 15 })],
          total: 1,
          counts: { uncertainty: 1, frequency: 0, softener: 0 },
        }),
      },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    const spy = vi.spyOn(store, 'setHighlightRange')

    await wrapper.find('[data-testid="hedge-match"] .cursor-pointer').trigger('click')

    expect(spy).toHaveBeenCalledWith({ from: 10, to: 15 })
  })

  it('shows dismiss button on each match', () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [makeMatch()],
          total: 1,
          counts: { uncertainty: 1, frequency: 0, softener: 0 },
        }),
      },
    })
    expect(wrapper.find('[data-testid="dismiss-btn"]').exists()).toBe(true)
  })

  it('hides match when dismiss is clicked', async () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [
            makeMatch({ word: 'might', from: 0 }),
            makeMatch({ word: 'could', from: 10 }),
          ],
          total: 2,
          counts: { uncertainty: 2, frequency: 0, softener: 0 },
        }),
      },
    })
    expect(wrapper.findAll('[data-testid="hedge-match"]')).toHaveLength(2)

    await wrapper.find('[data-testid="dismiss-btn"]').trigger('click')

    expect(wrapper.findAll('[data-testid="hedge-match"]')).toHaveLength(1)
  })

  it('shows dismissed count after dismissing', async () => {
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [makeMatch(), makeMatch({ from: 10 })],
          total: 2,
          counts: { uncertainty: 2, frequency: 0, softener: 0 },
        }),
      },
    })

    await wrapper.find('[data-testid="dismiss-btn"]').trigger('click')

    expect(wrapper.find('[data-testid="dismissed-count"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="dismissed-count"]').text()).toContain('1 dismissed')
  })

  it('dismiss click does not trigger highlight', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(HedgeWordResult, {
      props: {
        result: makeResult({
          matches: [makeMatch()],
          total: 1,
          counts: { uncertainty: 1, frequency: 0, softener: 0 },
        }),
      },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    const spy = vi.spyOn(store, 'setHighlightRange')

    await wrapper.find('[data-testid="dismiss-btn"]').trigger('click')

    expect(spy).not.toHaveBeenCalled()
  })

  it('pushes highlights to store on mount', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const matches = [makeMatch({ from: 0, to: 5 })]
    mount(HedgeWordResult, {
      props: {
        result: makeResult({ matches, total: 1, counts: { uncertainty: 1, frequency: 0, softener: 0 } }),
      },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    expect(store.hedgeHighlights).toHaveLength(1)
  })

  it('does not push highlights when matches are empty', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    mount(HedgeWordResult, {
      props: { result: makeResult() },
      global: { plugins: [pinia] },
    })
    const store = useToolStore(pinia)
    expect(store.hedgeHighlights).toHaveLength(0)
  })

  it('shows success message when no hedge words found', () => {
    const wrapper = mount(HedgeWordResult, {
      props: { result: makeResult({ total: 0 }) },
    })
    expect(wrapper.text()).toContain('No hedge words detected')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/results/HedgeWordResult.test.ts 2>&1 | tail -5`
Expected: FAIL — module not found

**Step 3: Write the component**

Create `src/components/results/HedgeWordResult.vue`:

```vue
<script setup lang="ts">
import type { HedgeWordResult as HedgeWordResultType, HedgeMatch, HedgeWordCounts } from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { watch, computed } from 'vue'

const props = defineProps<{
  result: HedgeWordResultType
}>()

const toolStore = useToolStore()

const visibleMatches = computed(() => props.result.matches.filter(m => !m.dismissed))
const dismissedCount = computed(() => props.result.matches.length - visibleMatches.value.length)

const hedgeGroups: { key: keyof HedgeWordCounts; label: string; words: string; bgClass: string; barClass: string; borderClass: string }[] = [
  { key: 'uncertainty', label: 'Uncertainty', words: 'might, could, may, perhaps, possibly...', bgClass: 'bg-orange-50', barClass: 'bg-orange-400', borderClass: 'border-orange-200' },
  { key: 'frequency', label: 'Frequency', words: 'generally, usually, often, sometimes...', bgClass: 'bg-amber-50', barClass: 'bg-amber-400', borderClass: 'border-amber-200' },
  { key: 'softener', label: 'Softeners', words: 'somewhat, fairly, rather, quite...', bgClass: 'bg-rose-50', barClass: 'bg-rose-400', borderClass: 'border-rose-200' },
]

function onMatchClick(match: HedgeMatch) {
  toolStore.setHighlightRange({ from: match.from, to: match.to })
}

function onDismiss(match: HedgeMatch) {
  match.dismissed = true
}

watch(() => props.result.matches, (matches) => {
  if (matches.length > 0) {
    toolStore.setHedgeHighlights(matches)
  } else {
    toolStore.clearHedgeHighlights()
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="rounded bg-orange-50 p-3 text-sm text-orange-800">
      {{ props.result.toneAssessment }}
    </div>

    <div v-if="props.result.total === 0" class="text-sm text-gray-500">
      No hedge words detected in {{ props.result.wordCount }} words.
    </div>

    <template v-else>
      <div class="flex items-center gap-3 text-sm text-gray-700">
        <span>Hedge words: <span class="font-medium">{{ props.result.total }}</span></span>
        <span>Density: <span class="font-medium">{{ props.result.density.toFixed(1) }}%</span></span>
      </div>

      <div class="flex flex-col gap-3">
        <div
          v-for="group in hedgeGroups"
          :key="group.key"
          data-testid="hedge-card"
          :class="['rounded-lg border p-3', group.bgClass, group.borderClass]"
        >
          <div class="mb-2 flex items-center justify-between">
            <div>
              <span class="text-sm font-medium text-gray-800">{{ group.label }}</span>
              <span class="ml-2 text-xs text-gray-500">{{ group.words }}</span>
            </div>
            <span class="text-sm font-semibold text-gray-700">{{ props.result.counts[group.key] }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative h-3 flex-1 rounded-full bg-white/60">
              <div
                data-testid="hedge-bar"
                :class="['h-3 rounded-full', group.barClass]"
                :style="{ width: `${props.result.percentages[group.key]}%` }"
              />
            </div>
            <span class="w-10 text-right text-xs font-medium text-gray-600">{{ props.result.percentages[group.key] }}%</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between text-sm text-gray-700">
          <span class="font-medium">Matches</span>
          <span v-if="dismissedCount > 0" class="text-gray-400" data-testid="dismissed-count">
            ({{ dismissedCount }} dismissed)
          </span>
        </div>
        <div class="flex flex-col gap-1.5">
          <div
            v-for="(match, idx) in visibleMatches"
            :key="`${match.from}-${idx}`"
            data-testid="hedge-match"
            class="rounded border border-gray-200 text-sm transition-colors"
          >
            <div
              class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
              @click="onMatchClick(match)"
            >
              <span class="font-medium text-gray-800">{{ match.word }}</span>
              <span class="text-xs text-gray-400">Line {{ match.line }}</span>
            </div>
            <div class="border-t border-gray-100 px-3 py-1">
              <button
                data-testid="dismiss-btn"
                class="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                @click.stop="onDismiss(match)"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
```

**Step 4: Run the tests**

Run: `npx vitest run src/components/__tests__/results/HedgeWordResult.test.ts`
Expected: All pass

**Step 5: Commit**

```
git add src/components/results/HedgeWordResult.vue src/components/__tests__/results/HedgeWordResult.test.ts
git commit -m "feat(hedge-words): add result component with dismiss and highlights"
```

---

### Task 7: Wire into ResultsPane and update ToolSelector test

**Files:**
- Modify: `src/components/ResultsPane.vue`
- Modify: `src/components/__tests__/ToolSelector.test.ts`

**Step 1: Add import to ResultsPane.vue (after AcronymCheckerResult import)**

```ts
import HedgeWordResult from '@/components/results/HedgeWordResult.vue'
```

**Step 2: Add v-else-if (after the AcronymCheckerResult line)**

```html
      <HedgeWordResult v-else-if="toolStore.result.type === 'hedge-words'" :result="toolStore.result" />
```

**Step 3: Update ToolSelector test**

Change `'renders a select with all 8 tools as options'` to `'renders a select with all 9 tools as options'` and change both `8` to `9`.

**Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (should be 440 + new tests)

**Step 5: Commit**

```
git add src/components/ResultsPane.vue src/components/__tests__/ToolSelector.test.ts
git commit -m "feat(hedge-words): wire result component into results pane"
```

---

### Task 8: Final verification

**Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: Run type check**

Run: `npx vue-tsc --noEmit`
Expected: No errors

**Step 3: Verify all files committed**

Run: `git status`
Expected: clean working tree
