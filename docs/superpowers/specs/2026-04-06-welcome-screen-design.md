# Welcome Screen / Onboarding Design

## Overview

First-time users see a full-page welcome screen describing each tool. A `?` button in the header reopens it. State is persisted in localStorage.

## Components

### WelcomeScreen.vue (new)

- Full-page card grid replacing the editor area
- Cards grouped by category: Analysis, AI
- Each card: tool label + description from `TOOLS` array
- "Get Started" button dismisses and persists `hasSeenOnboarding` to localStorage
- Emits `dismiss` event to parent

### App.vue (modified)

- Add `showWelcome` ref
- On mount: if `!localStorage.getItem('hasSeenOnboarding')`, set `showWelcome = true`
- When `showWelcome` is true, replace editor/merge/results panes with `WelcomeScreen`
- Add `HelpCircle` icon button in header (next to Settings) that sets `showWelcome = true`
- `WelcomeScreen` `@dismiss` handler: set `showWelcome = false`, persist flag

## Data Flow

```
App.vue (mount) → check localStorage → showWelcome?
  → true: render WelcomeScreen
  → false: render editor
User clicks ? → showWelcome = true
User clicks "Get Started" → localStorage.setItem('hasSeenOnboarding', '1') → showWelcome = false
```

## Files Changed

- `src/components/WelcomeScreen.vue` — new
- `src/App.vue` — add showWelcome state, ? button, conditional rendering

## State

- localStorage key: `hasSeenOnboarding` (string `'1'`)
- No pinia/store changes
