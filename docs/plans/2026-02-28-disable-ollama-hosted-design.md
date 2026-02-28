# Design: Disable Ollama on Hosted Deployments

**Date:** 2026-02-28

## Problem

When Wordsworth is hosted on Netlify, the Ollama provider option is non-functional because Ollama requires a local server (`localhost:11434`). Users who select Ollama on the hosted version see configuration inputs that can't work, with no guidance on what to do instead.

## Solution

Use a build-time environment variable `VITE_DISABLE_OLLAMA` to conditionally replace the Ollama configuration UI with a message directing users to run locally.

## Mechanism

- **Env var:** `VITE_DISABLE_OLLAMA` -- any truthy value (e.g. `"true"`) disables Ollama config.
- Set in Netlify's environment variables dashboard. Not committed in `.env` files.
- Vite inlines `import.meta.env.VITE_DISABLE_OLLAMA` at build time -- zero runtime overhead.

## Changes

### `src/stores/settings.ts`
- Export `OLLAMA_DISABLED = !!import.meta.env.VITE_DISABLE_OLLAMA` as a centralized, testable constant.
- When `OLLAMA_DISABLED` is true, `isConfigured` returns `false` for the Ollama provider (prevents running AI tools).

### `src/components/SettingsModal.vue`
- Ollama stays in the provider dropdown.
- When `OLLAMA_DISABLED` is true and Ollama is selected: replace model/URL inputs with a message: "Ollama requires a local server. Please run Wordsworth locally and follow the instructions in the README to use locally-hosted models with Ollama." with a link to the GitHub README's Ollama section.

### `src/vite-env.d.ts`
- Add `VITE_DISABLE_OLLAMA` to `ImportMetaEnv` interface for type safety.

### Tests
- `SettingsModal.test.ts`: verify message shown and inputs hidden when disabled.
- `settings.test.ts`: verify `isConfigured` returns `false` for Ollama when disabled.

## What doesn't change
- Provider list -- Ollama still appears as a selectable option.
- `client.ts` -- no changes. The `isConfigured` guard at the UI level prevents tool execution.
- No URL detection or runtime environment sniffing.
