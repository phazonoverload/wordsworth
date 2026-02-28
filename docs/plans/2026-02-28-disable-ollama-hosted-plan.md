# Disable Ollama on Hosted Deployments - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When `VITE_DISABLE_OLLAMA` env var is set, replace Ollama config inputs with a "run locally" message and link, and prevent Ollama from being treated as configured.

**Architecture:** A build-time Vite env var (`VITE_DISABLE_OLLAMA`) controls whether the Ollama provider shows config inputs or a redirect message. The check is centralized as an exported constant in the settings store. The `isConfigured` computed property returns `false` for Ollama when disabled, preventing tool execution.

**Tech Stack:** Vue 3, Vite (import.meta.env), Pinia, Vitest

---

### Task 1: Add TypeScript type declaration for VITE_DISABLE_OLLAMA

**Files:**
- Modify: `src/vite-env.d.ts:1`

**Step 1: Add the ImportMetaEnv interface**

Replace the contents of `src/vite-env.d.ts` with:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISABLE_OLLAMA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

**Step 2: Verify no type errors**

Run: `npx vue-tsc -b --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/vite-env.d.ts
git commit -m "feat: add VITE_DISABLE_OLLAMA env type declaration"
```

---

### Task 2: Export OLLAMA_DISABLED constant and update isConfigured

**Files:**
- Modify: `src/stores/settings.ts:7-8` (add constant after existing defaults)
- Modify: `src/stores/settings.ts:29-30` (update isConfigured)
- Test: `src/stores/__tests__/settings.test.ts`

**Step 1: Write failing tests**

Add these tests at the end of the `describe('settingsStore')` block in `src/stores/__tests__/settings.test.ts`:

```ts
describe('OLLAMA_DISABLED', () => {
  it('exports OLLAMA_DISABLED constant', async () => {
    const { OLLAMA_DISABLED } = await import('@/stores/settings')
    expect(typeof OLLAMA_DISABLED).toBe('boolean')
  })

  it('isConfigured returns false for ollama when OLLAMA_DISABLED is true', async () => {
    // We test the behavior via the store's isConfigured computed.
    // When OLLAMA_DISABLED is true, isConfigured should return false for ollama.
    // Since import.meta.env is baked at build time, we test the store logic
    // by checking the exported constant and the computed together.
    const { OLLAMA_DISABLED } = await import('@/stores/settings')
    const store = useSettingsStore()
    store.setProvider('ollama')
    if (OLLAMA_DISABLED) {
      expect(store.isConfigured).toBe(false)
    } else {
      expect(store.isConfigured).toBe(true)
    }
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/__tests__/settings.test.ts`
Expected: FAIL - `OLLAMA_DISABLED` is not exported

**Step 3: Add OLLAMA_DISABLED constant to settings store**

In `src/stores/settings.ts`, after line 8 (`export const DEFAULT_OLLAMA_MODEL = 'llama3.1:8b'`), add:

```ts
export const OLLAMA_DISABLED = !!import.meta.env.VITE_DISABLE_OLLAMA
```

**Step 4: Update isConfigured to respect OLLAMA_DISABLED**

In `src/stores/settings.ts`, change line 30 from:

```ts
    if (provider.value === 'ollama') return true
```

to:

```ts
    if (provider.value === 'ollama') return !OLLAMA_DISABLED
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/settings.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/stores/settings.ts src/stores/__tests__/settings.test.ts
git commit -m "feat: add OLLAMA_DISABLED constant and gate isConfigured"
```

---

### Task 3: Update SettingsModal to show disabled message

**Files:**
- Modify: `src/components/SettingsModal.vue:1-5` (add import)
- Modify: `src/components/SettingsModal.vue:132-164` (update Ollama template section)
- Test: `src/components/__tests__/SettingsModal.test.ts`

**Step 1: Write failing tests**

Add a new `describe` block inside the existing `describe('Ollama provider')` block in `src/components/__tests__/SettingsModal.test.ts`. Add these tests after the existing Ollama tests (before the closing `})` of the Ollama describe block at line 227):

```ts
    describe('when OLLAMA_DISABLED is true', () => {
      beforeEach(() => {
        vi.mock('@/stores/settings', async () => {
          const actual = await vi.importActual<typeof import('@/stores/settings')>('@/stores/settings')
          return {
            ...actual,
            OLLAMA_DISABLED: true,
          }
        })
      })

      afterEach(() => {
        vi.restoreAllMocks()
      })

      it('shows disabled message instead of Ollama config inputs', async () => {
        const wrapper = mountModal()
        await wrapper.find('[data-testid="provider-btn-ollama"]').trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.find('[data-testid="ollama-disabled-message"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="ollama-model-input"]').exists()).toBe(false)
        expect(wrapper.find('[data-testid="ollama-base-url-input"]').exists()).toBe(false)
      })

      it('disabled message contains link to README', async () => {
        const wrapper = mountModal()
        await wrapper.find('[data-testid="provider-btn-ollama"]').trigger('click')
        await wrapper.vm.$nextTick()

        const link = wrapper.find('[data-testid="ollama-readme-link"]')
        expect(link.exists()).toBe(true)
        expect(link.attributes('href')).toContain('github.com/phazonoverload/wordsworth')
        expect(link.attributes('href')).toContain('#using-ollama-local-models')
      })
    })
```

Also add `afterEach` import -- update line 1 from:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
```
to:
```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/SettingsModal.test.ts`
Expected: FAIL - `ollama-disabled-message` not found

**Step 3: Import OLLAMA_DISABLED in SettingsModal.vue**

In `src/components/SettingsModal.vue`, update line 4 from:

```ts
import { DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL } from '@/stores/settings'
```

to:

```ts
import { DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL, OLLAMA_DISABLED } from '@/stores/settings'
```

**Step 4: Update the Ollama template section**

In `src/components/SettingsModal.vue`, replace lines 132-164 (the entire Ollama settings template block):

```vue
          <!-- Ollama-specific settings -->
          <template v-if="isOllama">
            <div v-if="OLLAMA_DISABLED" data-testid="ollama-disabled-message" class="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p class="text-sm text-amber-800">
                Ollama requires a local server and cannot be used in a hosted environment.
              </p>
              <p class="text-sm text-amber-700">
                Please run Wordsworth locally and follow the
                <a
                  data-testid="ollama-readme-link"
                  href="https://github.com/phazonoverload/wordsworth#using-ollama-local-models"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium underline hover:text-amber-900"
                >instructions in the README</a>
                to use locally-hosted models with Ollama.
              </p>
            </div>
            <div v-else class="space-y-4">
              <!-- Model name input -->
              <div class="space-y-2">
                <h3 class="text-sm font-medium text-gray-700">Model</h3>
                <input
                  data-testid="ollama-model-input"
                  type="text"
                  :value="settingsStore.model"
                  :placeholder="DEFAULT_OLLAMA_MODEL"
                  class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-900"
                  @input="onModelInput"
                />
                <p class="text-xs text-gray-500">
                  The model name as shown by <code class="bg-gray-100 px-1 rounded">ollama list</code>
                </p>
              </div>

              <!-- Base URL input -->
              <div class="space-y-2">
                <h3 class="text-sm font-medium text-gray-700">Base URL</h3>
                <input
                  data-testid="ollama-base-url-input"
                  type="text"
                  :value="settingsStore.ollamaBaseUrl"
                  :placeholder="DEFAULT_OLLAMA_BASE_URL"
                  class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-900"
                  @input="onBaseUrlInput"
                />
              </div>
            </div>
          </template>
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/SettingsModal.test.ts`
Expected: ALL PASS

**Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: ALL PASS

**Step 7: Run the build**

Run: `npm run build`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add src/components/SettingsModal.vue src/components/__tests__/SettingsModal.test.ts
git commit -m "feat: show 'run locally' message for Ollama on hosted deployments"
```
