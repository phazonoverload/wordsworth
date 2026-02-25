# Two-Pane Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert Wordsworth from a 3-column layout to a 2-column layout, with tool selection as a horizontal pill row at the top of the results pane, AI tools greyed out when no key is set for the current provider, and a simplified Settings modal showing only one API key input at a time.

**Architecture:** The ToolBar component is replaced by a ToolSelector component embedded inside the results column. The settings store gains a `hasKeyForCurrentProvider` computed. The SettingsModal is simplified to show a single key input that changes with the selected provider.

**Tech Stack:** Vue 3 + TypeScript, Pinia, Tailwind CSS v4, Vitest + Vue Test Utils

---

### Task 1: Add `hasKeyForCurrentProvider` to settings store

**Files:**
- Modify: `src/stores/settings.ts`
- Modify: `src/stores/__tests__/settings.test.ts`

**Step 1: Write the failing tests**

Add to `src/stores/__tests__/settings.test.ts`:

```ts
it('reports hasKeyForCurrentProvider as false when no key set', () => {
  const store = useSettingsStore()
  expect(store.hasKeyForCurrentProvider).toBe(false)
})

it('reports hasKeyForCurrentProvider as true when key set for current provider', () => {
  const store = useSettingsStore()
  store.setKey('openai', 'sk-test')
  expect(store.hasKeyForCurrentProvider).toBe(true)
})

it('reports hasKeyForCurrentProvider as false when key set for different provider', () => {
  const store = useSettingsStore()
  store.setKey('anthropic', 'sk-ant-test')
  // Default provider is openai
  expect(store.hasKeyForCurrentProvider).toBe(false)
})

it('updates hasKeyForCurrentProvider when provider changes', () => {
  const store = useSettingsStore()
  store.setKey('anthropic', 'sk-ant-test')
  store.setProvider('anthropic')
  expect(store.hasKeyForCurrentProvider).toBe(true)
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/__tests__/settings.test.ts`
Expected: FAIL — `hasKeyForCurrentProvider` not defined

**Step 3: Implement**

In `src/stores/settings.ts`, add a computed after `hasAnyKey`:

```ts
const hasKeyForCurrentProvider = computed(() => {
  const k = keys.value[provider.value as ProviderId]
  return !!k && k.length > 0
})
```

And add it to the return object:

```ts
return { keys, provider, model, hasAnyKey, hasKeyForCurrentProvider, setKey, setProvider, setModel }
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/settings.test.ts`
Expected: all PASS

**Step 5: Commit**

```
git add src/stores/settings.ts src/stores/__tests__/settings.test.ts
git commit -m "feat: add hasKeyForCurrentProvider computed to settings store"
```

---

### Task 2: Create ToolSelector component (replaces ToolBar)

**Files:**
- Create: `src/components/ToolSelector.vue`
- Delete: `src/components/ToolBar.vue`
- Create: `src/components/__tests__/ToolSelector.test.ts`
- Delete: `src/components/__tests__/ToolBar.test.ts`

**Step 1: Write the failing tests**

Create `src/components/__tests__/ToolSelector.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/tools/runner', () => ({
  runTool: vi.fn(),
}))

import ToolSelector from '../ToolSelector.vue'
import { useToolStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import { runTool } from '@/tools/runner'

describe('ToolSelector', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders all 5 tools as buttons', () => {
    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(5)
  })

  it('displays tool labels', () => {
    const wrapper = mount(ToolSelector)
    expect(wrapper.text()).toContain('Readability')
    expect(wrapper.text()).toContain('Style Check')
    expect(wrapper.text()).toContain('Pronouns')
    expect(wrapper.text()).toContain('Cut 20%')
    expect(wrapper.text()).toContain('Promises')
  })

  it('calls setActiveTool and runTool when a tool is clicked', async () => {
    const wrapper = mount(ToolSelector)
    const store = useToolStore()
    const spy = vi.spyOn(store, 'setActiveTool')

    const buttons = wrapper.findAll('button')
    const readabilityBtn = buttons.find((b) => b.text().includes('Readability'))
    await readabilityBtn!.trigger('click')

    expect(spy).toHaveBeenCalledWith('readability')
    expect(runTool).toHaveBeenCalled()
  })

  it('highlights the active tool', () => {
    const store = useToolStore()
    store.setActiveTool('style-check')

    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')
    const styleBtn = buttons.find((b) => b.text().includes('Style Check'))

    expect(styleBtn!.classes()).toContain('active')
  })

  it('disables all buttons when a tool is running', () => {
    const store = useToolStore()
    store.setRunning(true)

    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')

    for (const btn of buttons) {
      expect(btn.attributes('disabled')).toBeDefined()
    }
  })

  it('disables AI tools when no key for current provider', () => {
    // Default provider is openai, no key set
    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')

    const cutBtn = buttons.find((b) => b.text().includes('Cut 20%'))
    const promisesBtn = buttons.find((b) => b.text().includes('Promises'))

    expect(cutBtn!.attributes('disabled')).toBeDefined()
    expect(promisesBtn!.attributes('disabled')).toBeDefined()
  })

  it('enables AI tools when key is set for current provider', () => {
    const settings = useSettingsStore()
    settings.setKey('openai', 'sk-test-key')

    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')

    const cutBtn = buttons.find((b) => b.text().includes('Cut 20%'))
    const promisesBtn = buttons.find((b) => b.text().includes('Promises'))

    expect(cutBtn!.attributes('disabled')).toBeUndefined()
    expect(promisesBtn!.attributes('disabled')).toBeUndefined()
  })

  it('analysis tools are always enabled (when not running)', () => {
    const wrapper = mount(ToolSelector)
    const buttons = wrapper.findAll('button')

    const readabilityBtn = buttons.find((b) => b.text().includes('Readability'))
    const styleBtn = buttons.find((b) => b.text().includes('Style Check'))
    const pronounsBtn = buttons.find((b) => b.text().includes('Pronouns'))

    expect(readabilityBtn!.attributes('disabled')).toBeUndefined()
    expect(styleBtn!.attributes('disabled')).toBeUndefined()
    expect(pronounsBtn!.attributes('disabled')).toBeUndefined()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/ToolSelector.test.ts`
Expected: FAIL — module not found

**Step 3: Implement ToolSelector component**

Create `src/components/ToolSelector.vue`:

```vue
<script setup lang="ts">
import { TOOLS, type ToolId } from '@/tools/types'
import { useToolStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import { runTool } from '@/tools/runner'

const toolStore = useToolStore()
const settingsStore = useSettingsStore()

const analysisTools = TOOLS.filter((t) => t.category === 'analysis')
const aiTools = TOOLS.filter((t) => t.category === 'ai')

function isDisabled(tool: (typeof TOOLS)[number]): boolean {
  if (toolStore.isRunning) return true
  if (tool.category === 'ai' && !settingsStore.hasKeyForCurrentProvider) return true
  return false
}

async function selectTool(tool: (typeof TOOLS)[number]) {
  if (isDisabled(tool)) return
  toolStore.setActiveTool(tool.id)
  await runTool()
}
</script>

<template>
  <div class="tool-selector flex items-center gap-1 flex-wrap">
    <button
      v-for="tool in analysisTools"
      :key="tool.id"
      :disabled="isDisabled(tool)"
      :class="[
        'rounded-full px-3 py-1 text-sm transition whitespace-nowrap',
        'disabled:cursor-not-allowed disabled:opacity-50',
        toolStore.activeTool === tool.id
          ? 'active bg-blue-100 font-medium text-blue-900'
          : 'text-gray-700 hover:bg-gray-100',
      ]"
      @click="selectTool(tool)"
    >
      {{ tool.label }}
    </button>

    <span class="mx-1 text-gray-300">|</span>

    <button
      v-for="tool in aiTools"
      :key="tool.id"
      :disabled="isDisabled(tool)"
      :title="!settingsStore.hasKeyForCurrentProvider && !toolStore.isRunning ? 'Set API key in Settings' : undefined"
      :class="[
        'rounded-full px-3 py-1 text-sm transition whitespace-nowrap',
        'disabled:cursor-not-allowed disabled:opacity-50',
        toolStore.activeTool === tool.id
          ? 'active bg-blue-100 font-medium text-blue-900'
          : 'text-gray-700 hover:bg-gray-100',
      ]"
      @click="selectTool(tool)"
    >
      {{ tool.label }}
    </button>
  </div>
</template>
```

**Step 4: Delete old ToolBar files**

```
rm src/components/ToolBar.vue
rm src/components/__tests__/ToolBar.test.ts
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/ToolSelector.test.ts`
Expected: all PASS

**Step 6: Commit**

```
git add -A
git commit -m "feat: replace ToolBar with horizontal ToolSelector, grey out AI tools without key"
```

---

### Task 3: Update App.vue to 2-pane layout

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/__tests__/App.test.ts`

**Step 1: Update App.test.ts**

Replace the ToolBar test with ToolSelector:

Change:
```ts
it('renders the ToolBar component', () => {
  const wrapper = mountApp()
  expect(wrapper.findComponent({ name: 'ToolBar' }).exists()).toBe(true)
})
```

To:
```ts
it('does not render a ToolBar component', () => {
  const wrapper = mountApp()
  expect(wrapper.findComponent({ name: 'ToolBar' }).exists()).toBe(false)
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/App.test.ts`
Expected: FAIL — ToolBar still present

**Step 3: Update App.vue**

Replace the 3-column layout with a 2-column layout. Remove the ToolBar import and aside. The right pane now just contains `<ResultsPane />` (which will include ToolSelector internally — see Task 4).

Updated `App.vue`:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Settings } from 'lucide-vue-next'
import EditorPane from '@/components/EditorPane.vue'
import ReaderContext from '@/components/ReaderContext.vue'
import ResultsPane from '@/components/ResultsPane.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { useAutoRun } from '@/composables/useAutoRun'

const showSettings = ref(false)
useAutoRun()
</script>

<template>
  <div class="h-screen flex flex-col bg-white text-gray-900">
    <!-- Header -->
    <header class="border-b border-gray-200 px-4 py-2 flex items-center justify-between bg-white">
      <h1 class="text-lg font-semibold">Wordsworth</h1>
      <button
        class="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        @click="showSettings = true"
      >
        <Settings class="w-4 h-4" />
        Settings
      </button>
    </header>

    <!-- Main content: 2-pane layout -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Editor + Reader Context -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <ReaderContext />
        <EditorPane class="flex-1" />
      </div>

      <!-- Right: Results (includes ToolSelector at top) -->
      <aside class="w-96 border-l border-gray-200 overflow-y-auto">
        <ResultsPane />
      </aside>
    </div>

    <!-- Settings Modal -->
    <SettingsModal v-model="showSettings" />
  </div>
</template>
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/App.test.ts`
Expected: all PASS

**Step 5: Commit**

```
git add src/App.vue src/components/__tests__/App.test.ts
git commit -m "refactor: convert to 2-pane layout, remove ToolBar from App"
```

---

### Task 4: Integrate ToolSelector into ResultsPane

**Files:**
- Modify: `src/components/ResultsPane.vue`
- Modify: `src/components/__tests__/ResultsPane.test.ts`

**Step 1: Read current ResultsPane test**

Check `src/components/__tests__/ResultsPane.test.ts` for existing tests.

**Step 2: Add test for ToolSelector presence**

Add to `ResultsPane.test.ts`:

```ts
import ToolSelector from '../ToolSelector.vue'

it('renders the ToolSelector component', () => {
  const wrapper = mount(ResultsPane, {
    global: { plugins: [createPinia()] },
  })
  expect(wrapper.findComponent(ToolSelector).exists()).toBe(true)
})
```

**Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/ResultsPane.test.ts`
Expected: FAIL — ToolSelector not found

**Step 4: Update ResultsPane.vue**

Add ToolSelector at the top of the results pane:

```vue
<script setup lang="ts">
import { useToolStore } from '@/stores/tools'
import ToolSelector from '@/components/ToolSelector.vue'
import ReadabilityResult from '@/components/results/ReadabilityResult.vue'
import StyleCheckResult from '@/components/results/StyleCheckResult.vue'
import PronounResult from '@/components/results/PronounResult.vue'
import CutResult from '@/components/results/CutResult.vue'
import PromiseResult from '@/components/results/PromiseResult.vue'

const toolStore = useToolStore()
</script>

<template>
  <div class="results-pane flex flex-col gap-4 p-4">
    <ToolSelector />
    <div v-if="toolStore.isRunning" class="text-sm text-gray-500">Analyzing...</div>
    <div v-else-if="!toolStore.result" class="text-sm text-gray-500">
      Select a tool and run it to see results
    </div>
    <ReadabilityResult v-else-if="toolStore.result.type === 'readability'" :result="toolStore.result" />
    <StyleCheckResult v-else-if="toolStore.result.type === 'style-check'" :result="toolStore.result" />
    <PronounResult v-else-if="toolStore.result.type === 'pronouns'" :result="toolStore.result" />
    <CutResult v-else-if="toolStore.result.type === 'cut-twenty'" :result="toolStore.result" />
    <PromiseResult v-else-if="toolStore.result.type === 'promise-tracker'" :result="toolStore.result" />
  </div>
</template>
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/ResultsPane.test.ts`
Expected: all PASS

**Step 6: Commit**

```
git add src/components/ResultsPane.vue src/components/__tests__/ResultsPane.test.ts
git commit -m "feat: embed ToolSelector at top of ResultsPane"
```

---

### Task 5: Simplify SettingsModal to single key input

**Files:**
- Modify: `src/components/SettingsModal.vue`
- Modify: `src/components/__tests__/SettingsModal.test.ts`

**Step 1: Update tests**

Replace the test file. Key changes:
- Remove test "renders API key inputs for each provider" (3 inputs)
- Add test "renders single API key input for current provider"
- Update key-input test IDs — now just `data-testid="key-input"` (singular)
- Keep: provider select, model select, close, overlay, show/hide toggle tests
- Add: test that key input label changes when provider changes

Updated test expectations:
```ts
it('renders single API key input for current provider', () => {
  const wrapper = mountModal()
  // Only one key input visible
  const inputs = wrapper.findAll('[data-testid="key-input"]')
  expect(inputs).toHaveLength(1)
  // Label should mention current provider (OpenAI by default)
  expect(wrapper.text()).toContain('OpenAI')
})

it('key input changes when provider changes', async () => {
  const store = useSettingsStore()
  store.setKey('anthropic', 'sk-ant-key')

  const wrapper = mountModal()
  const providerSelect = wrapper.find('[data-testid="provider-select"]')
  await providerSelect.setValue('anthropic')

  const input = wrapper.find('[data-testid="key-input"]')
  expect((input.element as HTMLInputElement).value).toBe('sk-ant-key')
})

it('shows green indicator when current provider has key', () => {
  const store = useSettingsStore()
  store.setKey('openai', 'sk-test')
  const wrapper = mountModal()
  const indicator = wrapper.find('[data-testid="key-indicator"]')
  expect(indicator.classes()).toContain('bg-green-500')
})

it('shows gray indicator when current provider has no key', () => {
  const wrapper = mountModal()
  const indicator = wrapper.find('[data-testid="key-indicator"]')
  expect(indicator.classes()).toContain('bg-gray-300')
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/SettingsModal.test.ts`
Expected: FAIL — old test IDs still present

**Step 3: Rewrite SettingsModal template API Keys section**

Replace the `v-for` over all providers with a single key input that uses the current provider:

```vue
<!-- API Key for current provider -->
<div class="space-y-2">
  <h3 class="text-sm font-medium text-gray-700">API Key</h3>
  <div class="flex items-center gap-2">
    <span
      data-testid="key-indicator"
      class="inline-block w-2 h-2 rounded-full flex-shrink-0"
      :class="settingsStore.hasKeyForCurrentProvider ? 'bg-green-500' : 'bg-gray-300'"
    />
    <label class="text-sm text-gray-600 flex-shrink-0">
      {{ currentProviderLabel }}
    </label>
    <input
      data-testid="key-input"
      :type="showKey ? 'text' : 'password'"
      :value="settingsStore.keys[settingsStore.provider as ProviderId] ?? ''"
      :placeholder="`${currentProviderLabel} API key`"
      class="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-900"
      @input="onKeyInput(settingsStore.provider as ProviderId, $event)"
    />
    <button
      data-testid="key-toggle"
      class="text-xs text-gray-500 hover:text-gray-700 flex-shrink-0"
      @click="showKey = !showKey"
    >
      {{ showKey ? 'Hide' : 'Show' }}
    </button>
  </div>
</div>
```

In `<script setup>`, replace `showKeys` ref with:
```ts
const showKey = ref(false)

const currentProviderLabel = computed(() => {
  const found = PROVIDERS.find((p) => p.value === settingsStore.provider)
  return found ? found.label : ''
})
```

Remove `toggleKeyVisibility` function.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/SettingsModal.test.ts`
Expected: all PASS

**Step 5: Commit**

```
git add src/components/SettingsModal.vue src/components/__tests__/SettingsModal.test.ts
git commit -m "refactor: simplify Settings modal to single API key input for selected provider"
```

---

### Task 6: Full test suite + build check

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: all pass (should be ~210 tests, minus a few removed, plus new ones)

**Step 2: Type check and build**

Run: `npx vue-tsc --noEmit && npm run build`
Expected: clean build

**Step 3: Commit if any fixups needed**

If any fixes were required, commit them. Otherwise this task is just verification.
