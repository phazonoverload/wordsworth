# AI Audience Assessment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the crude keyword-based audience suitability heuristic with an AI-powered assessment that considers domain-appropriate jargon and audience expertise.

**Architecture:** The readability tool stays as an instant analysis tool. The `audienceNote` field is removed from `ReadabilityResult`. The grade-level description moves inline into the component. A new AI action `audience-assessment` is added to the proxy and frontend client. The ReadabilityResult component gets a "Assess for audience" button that triggers the AI call and displays the result.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vitest, Vercel AI SDK (backend), Zod (backend schemas)

---

### Task 1: Remove `audienceNote` from readability tool

**Files:**
- Modify: `src/tools/types.ts:19-28` — remove `audienceNote` from `ReadabilityResult`
- Modify: `src/tools/readability.ts:40-54` — remove audience note generation, remove `readerContext` param
- Modify: `src/tools/runner.ts:25-27` — stop passing `readerContext` to `analyzeReadability`
- Test: `src/tools/__tests__/readability.test.ts`

**Step 1: Update the test — remove `audienceNote` test, update function signature**

Remove the test at line 53-56 that checks `result.audienceNote`. Update all `analyzeReadability(text, '')` calls to `analyzeReadability(text)` (no second arg). Add a test verifying `audienceNote` is NOT in the result.

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tools/__tests__/readability.test.ts`
Expected: FAIL — function signature mismatch and missing property

**Step 3: Update `ReadabilityResult` interface in `types.ts`**

Remove the `audienceNote: string` field.

**Step 4: Update `analyzeReadability` in `readability.ts`**

- Remove the `readerContext` parameter
- Remove the `gradeDescription` function (move to component later)
- Remove all audience note generation logic (lines 40-54)
- Remove `audienceNote` from the return object

**Step 5: Update `runner.ts`**

Change `analyzeReadability(content, readerContext)` to `analyzeReadability(content)`.

**Step 6: Run tests to verify they pass**

Run: `npx vitest run src/tools/__tests__/readability.test.ts`
Expected: PASS

**Step 7: Commit**

```
git add -A && git commit -m "remove audienceNote from readability tool"
```

---

### Task 2: Add `audience-assessment` action to AI proxy

**Files:**
- Modify: `netlify/functions/ai-proxy.mts:12-54` — add `audience-assessment` schema
- Modify: `src/ai/client.ts:3` — add `audience-assessment` to `ActionId`

**Step 1: Add schema to AI proxy**

In `ai-proxy.mts`, add to the `SCHEMAS` object:

```typescript
"audience-assessment": z.object({
  assessment: z.string().describe("A one-paragraph assessment of whether the writing is well-suited for the target audience, considering domain-appropriate jargon, sentence complexity, and assumed knowledge"),
}),
```

**Step 2: Add to frontend `ActionId`**

In `src/ai/client.ts`, update:

```typescript
export type ActionId = 'cut-twenty' | 'fix-single' | 'fix-all' | 'promise-tracker' | 'audience-assessment'
```

**Step 3: Commit**

```
git add -A && git commit -m "add audience-assessment action to AI proxy"
```

---

### Task 3: Create `assessAudience` tool function

**Files:**
- Create: `src/tools/audience-assessment.ts`
- Test: `src/tools/__tests__/audience-assessment.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/ai/client', () => ({
  callAI: vi.fn(),
}))

import { assessAudience } from '@/tools/audience-assessment'
import { callAI } from '@/ai/client'

describe('assessAudience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls callAI with audience-assessment action', async () => {
    const mockCallAI = vi.mocked(callAI)
    mockCallAI.mockResolvedValue({ assessment: 'Well-suited.' })

    await assessAudience('Some text', 'Senior developers')

    expect(mockCallAI).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'audience-assessment' })
    )
  })

  it('includes audience description in prompt', async () => {
    const mockCallAI = vi.mocked(callAI)
    mockCallAI.mockResolvedValue({ assessment: 'Well-suited.' })

    await assessAudience('Some text', 'Junior developers')

    const call = mockCallAI.mock.calls[0]![0]
    expect(call.prompt).toContain('Junior developers')
  })

  it('includes document content in prompt', async () => {
    const mockCallAI = vi.mocked(callAI)
    mockCallAI.mockResolvedValue({ assessment: 'Well-suited.' })

    await assessAudience('My document content here', 'General audience')

    const call = mockCallAI.mock.calls[0]![0]
    expect(call.prompt).toContain('My document content here')
  })

  it('returns the assessment string', async () => {
    const mockCallAI = vi.mocked(callAI)
    mockCallAI.mockResolvedValue({ assessment: 'This is well-matched.' })

    const result = await assessAudience('Text', 'Audience')
    expect(result).toBe('This is well-matched.')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/tools/__tests__/audience-assessment.test.ts`
Expected: FAIL — module not found

**Step 3: Implement `assessAudience`**

```typescript
import { callAI } from '@/ai/client'

interface AudienceAssessmentResponse {
  assessment: string
}

export async function assessAudience(content: string, audienceDescription: string): Promise<string> {
  const system = `You are a writing coach assessing whether a piece of writing is well-suited for its target audience. Consider:
- Whether technical jargon and domain terminology are appropriate (domain experts EXPECT technical terms — don't penalize their use for technical audiences)
- Whether sentence structure and complexity match the audience's expectations
- Whether the writing assumes knowledge the audience would or wouldn't have
- The overall tone and accessibility

Provide a concise one-paragraph verdict. Be specific about what works and what could be improved. If the writing is well-matched, say so clearly.`

  const prompt = `Target audience: ${audienceDescription}

Document:
${content}`

  const result = await callAI<AudienceAssessmentResponse>({
    action: 'audience-assessment',
    system,
    prompt,
  })

  return result.assessment
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/tools/__tests__/audience-assessment.test.ts`
Expected: PASS

**Step 5: Commit**

```
git add -A && git commit -m "add assessAudience tool function"
```

---

### Task 4: Update ReadabilityResult component

**Files:**
- Modify: `src/components/results/ReadabilityResult.vue`
- Modify: `src/components/ReaderContext.vue` — increase textarea rows
- Test: `src/components/__tests__/results/ReadabilityResult.test.ts`

**Step 1: Update component tests**

Remove the `audienceNote` from `makeResult`. Remove the test "displays audience note". Add new tests:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ReadabilityResult from '../../results/ReadabilityResult.vue'
import type { ReadabilityResult as ReadabilityResultType } from '@/tools/types'
import { useSettingsStore } from '@/stores/settings'

vi.mock('@/tools/audience-assessment', () => ({
  assessAudience: vi.fn(),
}))

import { assessAudience } from '@/tools/audience-assessment'

function makeResult(overrides: Partial<ReadabilityResultType> = {}): ReadabilityResultType {
  return {
    type: 'readability',
    fleschKincaid: 65.2,
    gunningFog: 10.4,
    gradeLevel: 8,
    wordCount: 250,
    sentenceCount: 18,
    readingTimeMinutes: 1.2,
    ...overrides,
  }
}

function mountResult(overrides: Partial<ReadabilityResultType> = {}) {
  return mount(ReadabilityResult, {
    props: { result: makeResult(overrides) },
    global: { plugins: [createPinia()] },
  })
}
```

Tests to include:
- displays grade level
- displays grade level description (e.g. "middle school")
- displays Flesch-Kincaid, Gunning Fog, word count, sentence count, reading time
- grade indicator colors (green/yellow/red)
- renders ReaderContext component
- shows "Assess for audience" button when API key is set
- does not show "Assess for audience" button when no API key
- clicking "Assess for audience" calls assessAudience
- displays assessment text after AI returns
- hides button after assessment is displayed

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/results/ReadabilityResult.test.ts`
Expected: FAIL

**Step 3: Update `ReadabilityResult.vue`**

- Add `gradeDescription` function inline (moved from readability.ts)
- Display grade description under the grade level heading
- Remove `audienceNote` display
- Add component-local refs: `assessment`, `isAssessing`, `lastAudienceDesc`
- Add "Assess for audience" button (only shown when settings store has API key and no assessment yet, or audience changed)
- On click: call `assessAudience(documentStore.content, documentStore.readerContext.description)`, store result in `assessment` ref
- Display assessment in orange-50 box when available
- Watch `documentStore.readerContext.description` — clear assessment when it changes

**Step 4: Update `ReaderContext.vue`**

Change textarea `rows="2"` to `rows="4"`.

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/results/ReadabilityResult.test.ts`
Expected: PASS

**Step 6: Commit**

```
git add -A && git commit -m "add AI audience assessment to readability tool"
```

---

### Task 5: Final verification

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: Commit and push**

```
git add -A && git push
```
