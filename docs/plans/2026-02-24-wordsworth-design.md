# Wordsworth Design

A client-side web application: a collection of small tools for technical writers. BYO API keys for AI features.

## Tools (MVP)

Five tools split into two categories:

### Analysis tools (no AI, pure JS)

1. **Readability Scorer** -- Flesch-Kincaid, Gunning Fog, grade level, word count, reading time. Contextualizes scores against the stated target reader.
2. **Style Guide Checker** -- Flags passive voice, jargon (calibrated to audience), wordy phrases, and inconsistent terminology. Clicking an issue highlights it in the editor.
3. **Pronoun Checker** -- Counts and highlights we/I/you/they usage. Shows percentage breakdown and tone assessment (author-focused vs reader-focused).

### Transform tools (AI-powered, require API key)

4. **Cut by 20%** -- Ruthlessly edits text to ~80% of original length without losing meaning. Returns a diff with per-chunk accept/reject. Each chunk shows what was cut and why.
5. **Promise Tracker** -- Reads the intro, identifies implicit promises to the reader, then checks whether the conclusion delivers on each one. Returns a two-panel report: promises found + delivery verdicts.

## Architecture

Fully client-side SPA. No backend. Deployed as a static site.

### Tech stack

- Vite + Vue 3 + TypeScript
- shadcn-vue + Tailwind CSS for UI
- CodeMirror 6 for the editor (Markdown mode)
- Pinia for state management
- Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`) for AI features
- Vitest + Vue Test Utils for testing

### AI providers

- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic (Claude Sonnet, Haiku)
- Google (Gemini 2.0 Flash, Gemini 2.5 Pro)

Each key is optional. You only need one configured provider to use AI tools. Provider instances are created client-side using the user's BYO keys.

## Layout

Three-column workspace:

```
+------------------------------------------------------------+
| Wordsworth                                   [Settings]     |
| Reader: [Junior frontend developer       v presets]         |
+---------------------+----------+---------------------------+
|                     |          |                           |
|   Editor Pane       |  Tools   |   Results Pane            |
|                     |          |                           |
|   Markdown text     | [Readab] |   Contextual output:      |
|   input with        | [Style ] |   - Metrics dashboard     |
|   syntax            | [Pronns] |   - Issue list            |
|   highlighting      |  ------  |   - Diff with accept/     |
|                     | [Cut20*] |     reject per chunk      |
|                     | [Proms*] |   - Promise report        |
|                     |          |                           |
|                     |  * = key |                           |
+---------------------+----------+---------------------------+
```

- **Editor pane (left):** CodeMirror 6 with Markdown mode. Supports paste, type, select. Auto-saves to localStorage (debounced 1s).
- **Tool column (middle):** ~80-100px wide. Vertically stacked icon+label buttons. Analysis tools grouped above a divider, AI tools below (with sparkle indicator). AI tools disabled until at least one API key is configured.
- **Results pane (right):** Renders differently per tool type. Empty state prompts user to pick a tool. Active tool highlighted in the middle column.
- **Resizable split** between editor and results panes via draggable divider.

### Reader context

A persistent "Who is the reader?" input above the workspace. Freeform text field with a presets dropdown (e.g., "Beginner developer", "Experienced engineer", "Non-technical stakeholder"). Persisted to localStorage.

Passed as context to AI tools and used to calibrate jargon sensitivity in the Style Guide Checker. Readability scorer contextualizes grade level output against the stated audience.

## Results rendering by tool

| Tool | Results pane content |
|------|---------------------|
| Readability | Metrics cards: Flesch-Kincaid, Gunning Fog, grade level, word count, sentence count, reading time. Audience context note. |
| Style Check | Scrollable issue list with severity, description, line number. Click to highlight in editor. Grouped by category (passive voice, jargon, wordiness). |
| Pronouns | Bar chart or breakdown of pronoun frequencies. Highlights pronouns in the editor. Tone assessment label. |
| Cut 20% | Diff view with original vs edited text. Per-chunk accept/reject buttons. "Accept all" / "Reject all" buttons. Each chunk includes a brief reason for the cut. Applying updates the editor text. |
| Promise Tracker | Two-section report. Top: bulleted list of promises identified in the intro. Bottom: each promise with pass/fail/partial verdict and evidence quoted from the text. |

## State management

Three Pinia stores:

### documentStore
- `content: string` -- editor text
- `readerContext: { description: string, preset?: string }`
- Auto-save to localStorage on changes (debounced 1s)

### toolStore
- `activeTool: ToolId | null`
- `isRunning: boolean`
- `results: ToolResult | null`
- `history: ToolRun[]` -- last N runs for reference

### settingsStore
- `keys: { openai?: string, anthropic?: string, google?: string }`
- `provider: string` -- default provider
- `model: string` -- default model

### localStorage keys

| Key | Value |
|-----|-------|
| `wordsworth:document` | `{ content, updatedAt }` |
| `wordsworth:reader` | `{ description, preset? }` |
| `wordsworth:keys` | `{ openai?, anthropic?, google? }` |
| `wordsworth:settings` | `{ provider, model }` |
| `wordsworth:history` | `ToolRun[]` |

API keys stored as plain text in localStorage. This is standard for BYO-key client-side apps. The settings UI will display a clear warning about this.

## AI integration

Uses the Vercel AI SDK for all AI features:

```typescript
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, generateObject } from 'ai'
```

- Provider instances created client-side with user's keys
- `streamText` for progressive result display
- `generateObject` with Zod schemas for structured output (diff chunks, promise reports)
- Each tool has a dedicated prompt template that includes the text, reader context, and structured output instructions

### Error handling

- Missing API key: tool button disabled with tooltip
- Auth/rate limit errors: toast notification with clear message
- Network errors: retry button in results pane

## Project structure

```
wordsworth/
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  src/
    App.vue
    main.ts
    components/
      EditorPane.vue
      ToolBar.vue
      ResultsPane.vue
      ReaderContext.vue
      SettingsModal.vue
      DiffView.vue
      results/
        ReadabilityResult.vue
        StyleCheckResult.vue
        PronounResult.vue
        CutResult.vue
        PromiseResult.vue
    stores/
      document.ts
      tools.ts
      settings.ts
    tools/
      types.ts
      readability.ts
      style-check.ts
      pronouns.ts
      cut-twenty.ts
      promise-tracker.ts
    ai/
      client.ts
    lib/
      storage.ts
      text-utils.ts
  test/
    tools/
    components/
```

## Testing

- Vitest for unit tests, Vue Test Utils for component tests
- Analysis tools (readability, style check, pronouns) are pure functions -- straightforward to test
- AI tools tested with mocked provider responses
- Focus test coverage on tool logic and store behavior

## Deployment

Vite build produces a static site. Deploy to Vercel, Netlify, Cloudflare Pages, or any static host.

## Future tools (out of scope for MVP)

- Title Tester -- generate and score title options
- Jargon Buster -- identify and explain domain terms
- "So What?" Machine -- recursive reader-value drill-down
- AI Rewriter -- tone/clarity/brevity rewrites
- Markdown preview/converter
- Text diff/compare
