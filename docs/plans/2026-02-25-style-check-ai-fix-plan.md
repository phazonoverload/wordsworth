# Style Check AI Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add highlight, per-issue AI fix, and batch AI fix buttons to style check results, with a CodeMirror unified merge view for reviewing changes.

**Architecture:** Extend `StyleIssue` with `absoluteOffset`. Add `@codemirror/merge`-based `MergePane.vue` that replaces `EditorPane` when merge state is active. AI fixes use `generateObject()` via Vercel AI SDK. Tool store manages merge state.

**Tech Stack:** Vue 3, CodeMirror 6, `@codemirror/merge`, Vercel AI SDK (`generateObject`), Zod, Pinia

---

### Task 1: Install @codemirror/merge

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run: `npm install @codemirror/merge`

**Step 2: Verify installation**

Run: `npm ls @codemirror/merge`
Expected: Shows `@codemirror/merge@x.x.x`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add @codemirror/merge dependency"
```

---

### Task 2: Add absoluteOffset to StyleIssue and fix highlight bug

**Files:**
- Modify: `src/tools/types.ts:31-38`
- Modify: `src/tools/style-check.ts:42-48, 56-66, 69-82, 86-104`
- Modify: `src/components/results/StyleCheckResult.vue:17-19`
- Modify: `src/tools/__tests__/style-check.test.ts`
- Modify: `src/components/__tests__/results/StyleCheckResult.test.ts:91-103`

**Step 1: Write failing test for absoluteOffset**

Add to `src/tools/__tests__/style-check.test.ts`:

```ts
it('includes absoluteOffset for issues on later lines', () => {
  const text = 'Line one is fine.\nThe report was written by the team.'
  const result = checkStyle(text, '')
  const passiveIssues = result.issues.filter((i) => i.category === 'passive-voice')
  expect(passiveIssues.length).toBeGreaterThan(0)
  const issue = passiveIssues[0]
  expect(issue.line).toBe(2)
  // absoluteOffset should be position in full document (18 for start of line 2 + column offset)
  expect(issue.absoluteOffset).toBe(text.indexOf('was written'))
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/tools/__tests__/style-check.test.ts`
Expected: FAIL — `absoluteOffset` does not exist on type `StyleIssue`

**Step 3: Add absoluteOffset to StyleIssue type**

In `src/tools/types.ts`, add `absoluteOffset: number` to `StyleIssue`:

```ts
export interface StyleIssue {
  severity: 'warning' | 'info'
  category: 'passive-voice' | 'jargon' | 'wordiness' | 'inconsistency'
  message: string
  line: number
  offset: number
  absoluteOffset: number
  length: number
  suggestion?: string
}
```

**Step 4: Update findLineAndOffset to return absoluteOffset**

In `src/tools/style-check.ts`, change `findLineAndOffset`:

```ts
function findLineAndOffset(text: string, matchIndex: number): { line: number; offset: number; absoluteOffset: number } {
  const upTo = text.slice(0, matchIndex)
  const line = (upTo.match(/\n/g) || []).length + 1
  const lastNewline = upTo.lastIndexOf('\n')
  const offset = matchIndex - (lastNewline + 1)
  return { line, offset, absoluteOffset: matchIndex }
}
```

**Step 5: Update all issue push sites to include absoluteOffset**

In `src/tools/style-check.ts`, every `issues.push(...)` call destructures `findLineAndOffset`. Update each to include `absoluteOffset`:

For passive voice (line ~57):
```ts
const { line, offset, absoluteOffset } = findLineAndOffset(text, match.index)
issues.push({
  severity: 'warning',
  category: 'passive-voice',
  message: `Passive voice: "${match[0]}". Consider rewriting in active voice.`,
  line,
  offset,
  absoluteOffset,
  length: match[0].length,
})
```

For wordy phrases (line ~72):
```ts
const { line, offset, absoluteOffset } = findLineAndOffset(text, match.index)
issues.push({
  severity: 'info',
  category: 'wordiness',
  message: `Wordy: "${label}" can be simplified.`,
  line,
  offset,
  absoluteOffset,
  length: match[0].length,
  suggestion,
})
```

For jargon (line ~92):
```ts
const { line, offset, absoluteOffset } = findLineAndOffset(text, charIndex)
issues.push({
  severity: 'info',
  category: 'jargon',
  message: `"${cleaned}" may be unfamiliar to your target reader.`,
  line,
  offset,
  absoluteOffset,
  length: word.length,
  suggestion: `Consider explaining or replacing "${cleaned}"`,
})
```

**Step 6: Fix highlight in StyleCheckResult.vue**

In `src/components/results/StyleCheckResult.vue`, change `onIssueClick`:

```ts
function onIssueClick(issue: StyleIssue) {
  toolStore.setHighlightRange({ from: issue.absoluteOffset, to: issue.absoluteOffset + issue.length })
}
```

**Step 7: Run tests to verify they pass**

Run: `npx vitest run src/tools/__tests__/style-check.test.ts`
Expected: ALL PASS

**Step 8: Update component test for new offset behavior**

In `src/components/__tests__/results/StyleCheckResult.test.ts`, update `makeIssue` and the click test:

```ts
function makeIssue(overrides: Partial<StyleIssue> = {}): StyleIssue {
  return {
    severity: 'warning',
    category: 'passive-voice',
    message: 'Passive voice detected',
    line: 5,
    offset: 10,
    absoluteOffset: 50,
    length: 12,
    ...overrides,
  }
}
```

Update the click test expectation:
```ts
it('calls setHighlightRange when an issue is clicked', async () => {
  const pinia = createPinia()
  const wrapper = mount(StyleCheckResult, {
    props: { result: makeResult([makeIssue({ absoluteOffset: 50, length: 12 })]) },
    global: { plugins: [pinia] },
  })
  const store = useToolStore(pinia)
  const spy = vi.spyOn(store, 'setHighlightRange')

  await wrapper.find('[data-testid="style-issue"]').trigger('click')

  expect(spy).toHaveBeenCalledWith({ from: 50, to: 62 })
})
```

**Step 9: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

**Step 10: Commit**

```bash
git add -A
git commit -m "fix: use absoluteOffset for correct style issue highlighting"
```

---

### Task 3: Add merge state to tool store

**Files:**
- Modify: `src/stores/tools.ts`

**Step 1: Add merge state and actions**

In `src/stores/tools.ts`, add:

```ts
const mergeOriginal = ref<string | null>(null)
const mergeModified = ref<string | null>(null)

function setMergeState(original: string, modified: string) {
  mergeOriginal.value = original
  mergeModified.value = modified
}

function clearMergeState() {
  mergeOriginal.value = null
  mergeModified.value = null
}
```

Export them in the return object:

```ts
return {
  activeTool, isRunning, result, history, highlightRange,
  mergeOriginal, mergeModified,
  setActiveTool, setRunning, setResult, setHighlightRange, clearHighlightRange,
  setMergeState, clearMergeState,
}
```

**Step 2: Commit**

```bash
git add src/stores/tools.ts
git commit -m "feat: add merge state to tool store"
```

---

### Task 4: Create MergePane component

**Files:**
- Create: `src/components/MergePane.vue`

**Step 1: Create MergePane.vue**

```vue
<template>
  <div class="flex h-full flex-col">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2">
      <span class="text-sm font-medium text-gray-700">Review AI Changes</span>
      <div class="flex-1" />
      <button
        data-testid="merge-reject"
        class="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        @click="onReject"
      >
        Reject
      </button>
      <button
        data-testid="merge-accept"
        class="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 transition-colors"
        @click="onAccept"
      >
        Accept
      </button>
    </div>
    <!-- Merge editor -->
    <div ref="mergeRef" class="flex-1 overflow-hidden"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { MergeView } from '@codemirror/merge'
import { markdown } from '@codemirror/lang-markdown'
import { useToolStore } from '@/stores/tools'
import { useDocumentStore } from '@/stores/document'

const toolStore = useToolStore()
const documentStore = useDocumentStore()

const mergeRef = ref<HTMLDivElement>()
let mergeView: MergeView | null = null

const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px' },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  '.cm-content': { padding: '16px' },
  '&.cm-focused': { outline: 'none' },
})

onMounted(() => {
  if (!mergeRef.value) return
  if (!toolStore.mergeOriginal || !toolStore.mergeModified) return

  mergeView = new MergeView({
    parent: mergeRef.value,
    a: {
      doc: toolStore.mergeOriginal,
      extensions: [markdown(), EditorState.readOnly.of(true), theme, EditorView.lineWrapping],
    },
    b: {
      doc: toolStore.mergeModified,
      extensions: [markdown(), EditorState.readOnly.of(true), theme, EditorView.lineWrapping],
    },
  })
})

onUnmounted(() => {
  if (mergeView) {
    mergeView.destroy()
    mergeView = null
  }
})

function onAccept() {
  if (toolStore.mergeModified) {
    documentStore.setContent(toolStore.mergeModified)
  }
  toolStore.clearMergeState()
}

function onReject() {
  toolStore.clearMergeState()
}
</script>
```

**Step 2: Commit**

```bash
git add src/components/MergePane.vue
git commit -m "feat: add MergePane component with accept/reject toolbar"
```

---

### Task 5: Wire MergePane into App.vue

**Files:**
- Modify: `src/App.vue`

**Step 1: Add conditional rendering**

Import `MergePane` and the tool store, then conditionally render it instead of `EditorPane`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Settings } from 'lucide-vue-next'
import EditorPane from '@/components/EditorPane.vue'
import MergePane from '@/components/MergePane.vue'
import ReaderContext from '@/components/ReaderContext.vue'
import ResultsPane from '@/components/ResultsPane.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { useAutoRun } from '@/composables/useAutoRun'
import { useToolStore } from '@/stores/tools'

const showSettings = ref(false)
const toolStore = useToolStore()
useAutoRun()
</script>
```

In the template, replace:
```html
<EditorPane class="flex-1" />
```
with:
```html
<MergePane v-if="toolStore.mergeOriginal && toolStore.mergeModified" class="flex-1" />
<EditorPane v-else class="flex-1" />
```

**Step 2: Verify manually**

Run: `npm run dev`
Open browser, verify the editor still renders normally. No merge state is set yet, so `EditorPane` should display.

**Step 3: Commit**

```bash
git add src/App.vue
git commit -m "feat: conditionally render MergePane when merge state is active"
```

---

### Task 6: Create style fix AI function

**Files:**
- Create: `src/tools/style-fix.ts`
- Create: `src/tools/__tests__/style-fix.test.ts`

**Step 1: Write the AI fix function**

Create `src/tools/style-fix.ts`:

```ts
import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from '@/ai/client'
import type { StyleIssue } from './types'

const singleFixSchema = z.object({
  editedParagraph: z.string().describe('The paragraph with the style issue fixed'),
})

const batchFixSchema = z.object({
  editedDocument: z.string().describe('The full document with all flagged style issues fixed'),
})

/**
 * Extract the paragraph containing the given line number.
 * Paragraphs are separated by blank lines.
 * Returns { paragraph, startIndex, endIndex } where indices are into the full text.
 */
export function extractParagraph(text: string, lineNumber: number): { paragraph: string; startIndex: number; endIndex: number } {
  const lines = text.split('\n')
  // Find the target line index (0-based)
  const targetIdx = lineNumber - 1

  // Walk backwards to find paragraph start
  let startLine = targetIdx
  while (startLine > 0 && lines[startLine - 1].trim() !== '') {
    startLine--
  }

  // Walk forwards to find paragraph end
  let endLine = targetIdx
  while (endLine < lines.length - 1 && lines[endLine + 1].trim() !== '') {
    endLine++
  }

  // Compute character indices
  let startIndex = 0
  for (let i = 0; i < startLine; i++) {
    startIndex += lines[i].length + 1 // +1 for \n
  }

  let endIndex = startIndex
  for (let i = startLine; i <= endLine; i++) {
    endIndex += lines[i].length + (i < endLine ? 1 : 0)
  }

  const paragraph = lines.slice(startLine, endLine + 1).join('\n')
  return { paragraph, startIndex, endIndex }
}

export async function fixSingleIssue(text: string, issue: StyleIssue, readerContext: string): Promise<string> {
  const model = getModel()
  const { paragraph, startIndex, endIndex } = extractParagraph(text, issue.line)

  // Mark the problematic text within the paragraph
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

  const { object } = await generateObject({
    model,
    schema: singleFixSchema,
    system,
    prompt: paragraph,
  })

  // Replace the paragraph in the full document
  return text.slice(0, startIndex) + object.editedParagraph + text.slice(endIndex)
}

export async function fixAllIssues(text: string, issues: StyleIssue[], readerContext: string): Promise<string> {
  const model = getModel()

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

  const { object } = await generateObject({
    model,
    schema: batchFixSchema,
    system,
    prompt: text,
  })

  return object.editedDocument
}
```

**Step 2: Write unit test for extractParagraph**

Create `src/tools/__tests__/style-fix.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { extractParagraph } from '@/tools/style-fix'

describe('extractParagraph', () => {
  it('extracts a single-line paragraph', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'
    const result = extractParagraph(text, 3)
    expect(result.paragraph).toBe('Second paragraph.')
    expect(text.slice(result.startIndex, result.endIndex)).toBe('Second paragraph.')
  })

  it('extracts a multi-line paragraph', () => {
    const text = 'First line.\n\nPara line one.\nPara line two.\nPara line three.\n\nLast.'
    const result = extractParagraph(text, 4)
    expect(result.paragraph).toBe('Para line one.\nPara line two.\nPara line three.')
    expect(text.slice(result.startIndex, result.endIndex)).toBe('Para line one.\nPara line two.\nPara line three.')
  })

  it('extracts first paragraph', () => {
    const text = 'Hello world.\n\nSecond para.'
    const result = extractParagraph(text, 1)
    expect(result.paragraph).toBe('Hello world.')
    expect(result.startIndex).toBe(0)
  })

  it('extracts last paragraph', () => {
    const text = 'First.\n\nLast paragraph here.'
    const result = extractParagraph(text, 3)
    expect(result.paragraph).toBe('Last paragraph here.')
  })

  it('handles single paragraph document', () => {
    const text = 'Just one line.'
    const result = extractParagraph(text, 1)
    expect(result.paragraph).toBe('Just one line.')
    expect(result.startIndex).toBe(0)
    expect(result.endIndex).toBe(text.length)
  })
})
```

**Step 3: Run test**

Run: `npx vitest run src/tools/__tests__/style-fix.test.ts`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add src/tools/style-fix.ts src/tools/__tests__/style-fix.test.ts
git commit -m "feat: add style fix AI functions with extractParagraph helper"
```

---

### Task 7: Add Fix with AI button and Fix All with AI to StyleCheckResult

**Files:**
- Modify: `src/components/results/StyleCheckResult.vue`

**Step 1: Update the component**

Replace the full component with:

```vue
<script setup lang="ts">
import type { StyleCheckResult as StyleCheckResultType, StyleIssue } from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { useDocumentStore } from '@/stores/document'
import { useSettingsStore } from '@/stores/settings'
import { fixSingleIssue, fixAllIssues } from '@/tools/style-fix'
import { ref } from 'vue'

const props = defineProps<{
  result: StyleCheckResultType
}>()

const toolStore = useToolStore()
const documentStore = useDocumentStore()
const settingsStore = useSettingsStore()

const fixingIssueKey = ref<string | null>(null)
const fixingAll = ref(false)

function severityClasses(severity: 'warning' | 'info'): string {
  return severity === 'warning'
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-blue-100 text-blue-800'
}

function issueKey(issue: StyleIssue): string {
  return `${issue.line}-${issue.offset}`
}

function onIssueClick(issue: StyleIssue) {
  toolStore.setHighlightRange({ from: issue.absoluteOffset, to: issue.absoluteOffset + issue.length })
}

async function onFixSingle(issue: StyleIssue) {
  const key = issueKey(issue)
  fixingIssueKey.value = key
  try {
    const original = documentStore.content
    const modified = await fixSingleIssue(
      original,
      issue,
      documentStore.readerContext.description,
    )
    toolStore.setMergeState(original, modified)
  } finally {
    fixingIssueKey.value = null
  }
}

async function onFixAll() {
  fixingAll.value = true
  try {
    const original = documentStore.content
    const modified = await fixAllIssues(
      original,
      props.result.issues,
      documentStore.readerContext.description,
    )
    toolStore.setMergeState(original, modified)
  } finally {
    fixingAll.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="props.result.issues.length === 0" class="text-sm text-gray-500">
      No issues found
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <div class="text-sm font-medium text-gray-700">
          {{ props.result.issues.length }} issue{{ props.result.issues.length === 1 ? '' : 's' }} found
        </div>
        <button
          v-if="props.result.issues.length > 1 && settingsStore.hasKeyForCurrentProvider"
          data-testid="fix-all-btn"
          :disabled="fixingAll"
          class="rounded bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
          @click="onFixAll"
        >
          {{ fixingAll ? 'Fixing...' : 'Fix All with AI' }}
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <div
          v-for="issue in props.result.issues"
          :key="issueKey(issue)"
          data-testid="style-issue"
          class="rounded border border-gray-200 text-sm transition-colors"
        >
          <div
            class="cursor-pointer p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            @click="onIssueClick(issue)"
          >
            <div class="mb-1 flex items-center gap-2">
              <span
                data-testid="severity-badge"
                :class="['rounded px-2 py-0.5 text-xs font-medium', severityClasses(issue.severity)]"
              >
                {{ issue.severity }}
              </span>
              <span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {{ issue.category }}
              </span>
              <span class="text-xs text-gray-400">Line {{ issue.line }}</span>
            </div>
            <div class="text-gray-800">{{ issue.message }}</div>
            <div v-if="issue.suggestion" class="mt-1 text-xs text-gray-500">
              Suggestion: {{ issue.suggestion }}
            </div>
          </div>
          <div
            v-if="settingsStore.hasKeyForCurrentProvider"
            class="border-t border-gray-100 px-3 py-1.5"
          >
            <button
              data-testid="fix-single-btn"
              :disabled="fixingIssueKey === issueKey(issue)"
              class="text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors disabled:opacity-50"
              @click.stop="onFixSingle(issue)"
            >
              {{ fixingIssueKey === issueKey(issue) ? 'Fixing...' : 'Fix with AI' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
```

**Step 2: Update component tests**

Update `src/components/__tests__/results/StyleCheckResult.test.ts` to account for new structure. The `data-testid="style-issue"` still exists on the outer div, but clicking for highlight now targets the inner clickable div. The `@click` is on the inner div, so we need to update the click test to target the inner element. Also add tests for the Fix buttons.

Add to the test file:

```ts
import { useSettingsStore } from '@/stores/settings'

// In the click test, click the inner clickable div instead of the outer wrapper:
it('calls setHighlightRange when the issue content area is clicked', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(StyleCheckResult, {
    props: { result: makeResult([makeIssue({ absoluteOffset: 50, length: 12 })]) },
    global: { plugins: [pinia] },
  })
  const store = useToolStore(pinia)
  const spy = vi.spyOn(store, 'setHighlightRange')

  // Click the inner clickable area within the issue card
  const issueCard = wrapper.find('[data-testid="style-issue"]')
  await issueCard.find('.cursor-pointer').trigger('click')

  expect(spy).toHaveBeenCalledWith({ from: 50, to: 62 })
})

it('shows Fix All button when more than 1 issue and API key configured', () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const settings = useSettingsStore(pinia)
  settings.setKey('openai', 'test-key')

  const issues = [makeIssue(), makeIssue({ message: 'Another issue', line: 10, absoluteOffset: 100 })]
  const wrapper = mount(StyleCheckResult, {
    props: { result: makeResult(issues) },
    global: { plugins: [pinia] },
  })

  expect(wrapper.find('[data-testid="fix-all-btn"]').exists()).toBe(true)
})

it('hides Fix All button when only 1 issue', () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const settings = useSettingsStore(pinia)
  settings.setKey('openai', 'test-key')

  const wrapper = mount(StyleCheckResult, {
    props: { result: makeResult([makeIssue()]) },
    global: { plugins: [pinia] },
  })

  expect(wrapper.find('[data-testid="fix-all-btn"]').exists()).toBe(false)
})

it('shows Fix with AI button on each issue when API key configured', () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const settings = useSettingsStore(pinia)
  settings.setKey('openai', 'test-key')

  const wrapper = mount(StyleCheckResult, {
    props: { result: makeResult([makeIssue()]) },
    global: { plugins: [pinia] },
  })

  expect(wrapper.find('[data-testid="fix-single-btn"]').exists()).toBe(true)
  expect(wrapper.find('[data-testid="fix-single-btn"]').text()).toBe('Fix with AI')
})

it('hides Fix buttons when no API key', () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  // No key set

  const issues = [makeIssue(), makeIssue({ message: 'Another', line: 2, absoluteOffset: 20 })]
  const wrapper = mount(StyleCheckResult, {
    props: { result: makeResult(issues) },
    global: { plugins: [pinia] },
  })

  expect(wrapper.find('[data-testid="fix-all-btn"]').exists()).toBe(false)
  expect(wrapper.find('[data-testid="fix-single-btn"]').exists()).toBe(false)
})
```

**Step 3: Run tests**

Run: `npx vitest run`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Fix with AI and Fix All buttons to style check results"
```

---

### Task 8: Run full build and verify

**Step 1: Run tests**

Run: `npx vitest run`
Expected: ALL PASS

**Step 2: Run type check and build**

Run: `npm run build`
Expected: Clean build with no errors

**Step 3: Manual smoke test**

Run: `npm run dev`

1. Type text with passive voice: "The report was written by the team"
2. Verify style check runs and shows issues
3. Click an issue card — verify the correct text is highlighted in the editor
4. Click "Fix with AI" on an issue — verify the merge view appears with a diff
5. Click Accept — verify the fix is applied and the editor returns to normal
6. Repeat with "Fix All with AI" for multiple issues
7. Click Reject — verify it discards and returns to the editor

**Step 4: Commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```
