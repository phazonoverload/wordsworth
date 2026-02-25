# Editor Line Numbers + Click-to-Highlight Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add line numbers to the CodeMirror editor, and allow clicking a style-check issue to highlight the relevant range in the editor.

**Architecture:** Line numbers use CodeMirror's built-in `lineNumbers()` extension. Click-to-highlight uses a `highlightRange` ref in the tool store as a mediator between StyleCheckResult (sets it) and EditorPane (watches it and applies a CodeMirror `StateField` decoration + scrolls into view). Highlight clears on next editor change or tool switch.

**Tech Stack:** CodeMirror 6 (`@codemirror/view`, `@codemirror/state`), Vue 3, Pinia, Vitest

---

### Task 1: Add `highlightRange` to tool store

**Files:**
- Modify: `src/stores/tools.ts`
- Modify: `src/stores/__tests__/tools.test.ts`

**Step 1: Write failing tests**

Add to `src/stores/__tests__/tools.test.ts`:

```ts
it('starts with no highlight range', () => {
  const store = useToolStore()
  expect(store.highlightRange).toBeNull()
})

it('sets highlight range', () => {
  const store = useToolStore()
  store.setHighlightRange({ from: 10, to: 22 })
  expect(store.highlightRange).toEqual({ from: 10, to: 22 })
})

it('clears highlight range', () => {
  const store = useToolStore()
  store.setHighlightRange({ from: 10, to: 22 })
  store.clearHighlightRange()
  expect(store.highlightRange).toBeNull()
})

it('clears highlight range when switching tools', () => {
  const store = useToolStore()
  store.setHighlightRange({ from: 10, to: 22 })
  store.setActiveTool('pronouns')
  expect(store.highlightRange).toBeNull()
})
```

**Step 2: Run tests, verify fail**

Run: `npx vitest run src/stores/__tests__/tools.test.ts`

**Step 3: Implement**

In `src/stores/tools.ts`:

Add ref:
```ts
const highlightRange = ref<{ from: number; to: number } | null>(null)
```

Add functions:
```ts
function setHighlightRange(range: { from: number; to: number }) {
  highlightRange.value = range
}

function clearHighlightRange() {
  highlightRange.value = null
}
```

In `setActiveTool`, add `highlightRange.value = null` alongside the existing `result.value = null`.

Add to return: `highlightRange, setHighlightRange, clearHighlightRange`

**Step 4: Run tests, verify pass**

**Step 5: Commit**

```
git commit -m "feat: add highlightRange to tool store for click-to-highlight"
```

---

### Task 2: Add line numbers + highlight decoration to EditorPane

**Files:**
- Modify: `src/components/EditorPane.vue`
- Modify: `src/components/__tests__/EditorPane.test.ts`

**Step 1: Write failing tests**

Add to `src/components/__tests__/EditorPane.test.ts`. Note the mock must be updated to include `lineNumbers`:

Update the `@codemirror/view` mock to add `lineNumbers`:
```ts
vi.mock('@codemirror/view', () => ({
  EditorView: Object.assign(
    vi.fn(() => mockView),
    {
      theme: vi.fn(() => []),
      updateListener: { of: vi.fn(() => []) },
      lineWrapping: [],
      scrollIntoView: vi.fn(() => ({})),
    },
  ),
  keymap: { of: vi.fn(() => []) },
  lineWrapping: [],
  lineNumbers: vi.fn(() => []),
  Decoration: {
    mark: vi.fn(() => ({ range: vi.fn(() => ({})) })),
  },
}))
```

Also mock `@codemirror/state` to include `StateField` and `RangeSet`:
```ts
vi.mock('@codemirror/state', () => ({
  EditorState: {
    create: vi.fn(() => ({})),
  },
  StateField: {
    define: vi.fn(() => []),
  },
  RangeSet: {
    empty: {},
  },
}))
```

Add test:
```ts
import { lineNumbers } from '@codemirror/view'

it('includes lineNumbers extension', () => {
  mount(EditorPane)
  expect(lineNumbers).toHaveBeenCalled()
})
```

**Step 2: Run tests, verify fail**

**Step 3: Implement**

In `src/components/EditorPane.vue`:

Add imports:
```ts
import { EditorView, lineNumbers, Decoration } from '@codemirror/view'
import { EditorState, StateField, RangeSet } from '@codemirror/state'
import { useToolStore } from '@/stores/tools'
```

Add highlight field (before onMounted):
```ts
const toolStore = useToolStore()

const highlightMark = Decoration.mark({ class: 'cm-highlight' })

const highlightField = StateField.define({
  create() {
    return RangeSet.empty as any
  },
  update(value: any, tr: any) {
    // Only update via effects — return current value for normal transactions
    return value
  },
})
```

Add `lineNumbers()` and `highlightField` to the extensions array in `EditorState.create`.

Add a watcher for `toolStore.highlightRange`:
```ts
watch(
  () => toolStore.highlightRange,
  (range) => {
    if (!view) return
    if (!range) {
      // Clear highlight
      view.dispatch({
        effects: [],
        // Remove decorations by replacing the field
      })
      return
    }
    // Add highlight decoration and scroll into view
    const from = Math.min(range.from, view.state.doc.length)
    const to = Math.min(range.to, view.state.doc.length)
    view.dispatch({
      selection: { anchor: from, head: to },
      scrollIntoView: true,
    })
  },
)
```

Actually, using `selection` with `scrollIntoView` is simpler and more reliable than decorations. The editor's native selection highlight will show the range. This avoids the complexity of a StateField + effects for decorations.

Simpler approach — just use selection:

Add theme entry for highlighted selection area:
```ts
'.cm-selectionBackground': {
  backgroundColor: '#fef08a !important',  // yellow-200
},
```

Add `lineNumbers()` to extensions. Watch `highlightRange` and dispatch a selection + scrollIntoView.

Add to theme:
```ts
'&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
  backgroundColor: '#fef08a !important',
},
```

**Step 4: Run tests, verify pass**

**Step 5: Commit**

```
git commit -m "feat: add line numbers and highlight-range support to editor"
```

---

### Task 3: Make StyleCheckResult issues clickable

**Files:**
- Modify: `src/components/results/StyleCheckResult.vue`
- Modify: `src/components/__tests__/results/StyleCheckResult.test.ts`

**Step 1: Write failing tests**

Add to `src/components/__tests__/results/StyleCheckResult.test.ts`. Need to add pinia setup:

```ts
import { beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useToolStore } from '@/stores/tools'

// In describe block:
beforeEach(() => {
  setActivePinia(createPinia())
})

it('calls setHighlightRange when an issue is clicked', async () => {
  const issue = makeIssue({ line: 5, offset: 10, length: 12 })
  const wrapper = mount(StyleCheckResult, {
    props: { result: makeResult([issue]) },
    global: { plugins: [createPinia()] },
  })
  const store = useToolStore()
  const spy = vi.spyOn(store, 'setHighlightRange')

  const issueEl = wrapper.find('[data-testid="style-issue"]')
  await issueEl.trigger('click')

  expect(spy).toHaveBeenCalledWith({ from: 10, to: 22 })
})

it('issue elements have cursor-pointer for clickability', () => {
  const wrapper = mount(StyleCheckResult, {
    props: { result: makeResult([makeIssue()]) },
    global: { plugins: [createPinia()] },
  })
  const issueEl = wrapper.find('[data-testid="style-issue"]')
  expect(issueEl.classes()).toContain('cursor-pointer')
})
```

**Step 2: Run tests, verify fail**

**Step 3: Implement**

In `src/components/results/StyleCheckResult.vue`:

Add imports:
```ts
import { useToolStore } from '@/stores/tools'
const toolStore = useToolStore()
```

Add click handler:
```ts
function onIssueClick(issue: StyleIssue) {
  toolStore.setHighlightRange({ from: issue.offset, to: issue.offset + issue.length })
}
```

Update the issue div to be clickable:
```html
<div
  v-for="issue in props.result.issues"
  :key="`${issue.line}-${issue.offset}`"
  data-testid="style-issue"
  class="rounded border border-gray-200 p-3 text-sm cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
  @click="onIssueClick(issue)"
>
```

**Step 4: Run tests, verify pass**

**Step 5: Run full suite**

Run: `npx vitest run`

**Step 6: Commit**

```
git commit -m "feat: click style-check issues to highlight range in editor"
```
