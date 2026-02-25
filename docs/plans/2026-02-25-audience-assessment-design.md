# AI Audience Assessment Design

## Problem

The readability tool's audience suitability heuristic is too crude. It maps reader context descriptions to a target grade level via keyword matching ("junior" → 8, "non-technical" → 6, everything else → 12). This causes false positives — a technical post at grade 14 aimed at senior developers gets flagged as "too complex" even though domain terminology is expected and appropriate.

Grade-level formulas like Flesch-Kincaid penalize long, multi-syllable words. But technical audiences expect domain vocabulary. The local heuristic can't distinguish "unnecessarily complex prose" from "appropriate use of domain terms."

## Solution

Split the readability tool into two zones:

### Instant metrics (auto-run, no AI)

- Grade level heading with colored dot + human-readable description ("corresponds to college reading level")
- Stats grid: Flesch-Kincaid, Gunning Fog, Words, Sentences, Reading Time
- Remove `audienceNote` from `ReadabilityResult` — grade-to-description mapping moves to the component

### AI audience assessment (user-triggered)

- ReaderContext selector (target audience preset + custom textarea, textarea height increased)
- "Assess for audience" button (orange)
- Sends text + audience description to AI proxy with new `audience-assessment` action
- AI returns a single `assessment` paragraph considering:
  - Whether technical jargon is appropriate for the stated audience
  - Whether sentence structure and complexity match expectations
  - Whether the writing assumes knowledge the audience would/wouldn't have
  - Brief verdict: well-matched, slightly complex, or needs simplification
- Assessment displayed in orange-50 box, replaces the button

### State behavior

- Assessment stored as component-local ref (ephemeral, not in Pinia store)
- Button reappears when audience description changes
- Assessment persists across content changes (doesn't clear on keystroke)

## Changes

### New files
- `src/tools/audience-assessment.ts` — `assessAudience(content, audienceDescription)` function calling `callAI`

### Modified files
- `netlify/functions/ai-proxy.mts` — add `audience-assessment` schema (`{ assessment: string }`)
- `src/ai/client.ts` — add `audience-assessment` to `ActionId` union
- `src/tools/types.ts` — remove `audienceNote` from `ReadabilityResult`
- `src/tools/readability.ts` — remove audience note generation logic
- `src/components/results/ReadabilityResult.vue` — restructure: inline grade description, add AI button + assessment display, increase textarea height
- `src/components/ReaderContext.vue` — increase textarea rows
- Tests for all changed files
