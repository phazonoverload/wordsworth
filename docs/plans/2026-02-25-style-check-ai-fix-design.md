# Style Check: AI Fix & Merge View

## Summary

Enhance the style check tool with three capabilities:
1. Fix the highlight offset bug so clicking issue cards scrolls to the correct position
2. Add per-issue "Fix with AI" button that rewrites the flagged text and shows a diff
3. Add "Fix All with AI" button that fixes all issues in one AI call with a full-document diff

## Bug Fix: Absolute Offset

`StyleIssue.offset` is the column within the line, not the absolute document position. `findLineAndOffset()` already receives `matchIndex` (the absolute position) but discards it. Store it as `absoluteOffset` on each issue so the highlight range uses the correct position.

## Issue Card Layout

Each issue card remains clickable — clicking highlights the issue in the editor (using the corrected absolute offset). Below the card content, a "Fix with AI" button is a separate click target that triggers the AI fix flow.

Above the issue list, when there are 2+ issues, a "Fix All with AI" button triggers the batch fix flow.

## Fix with AI (Single Issue)

**AI Call:** Send the entire paragraph containing the issue line to the LLM via `generateObject()`. The prompt includes the issue details (category, message, suggestion) and marks the specific text that needs fixing. Schema: `{ editedParagraph: string }`.

**Merge View:** The editor pane swaps to a `MergePane` component using `@codemirror/merge` unified `MergeView`. It shows the full document with the original paragraph replaced by the AI edit, so the user sees the change in context.

**Accept/Reject:** A toolbar above the merge view with Accept and Reject buttons. Accept applies the edit to the document store and returns to the normal editor. Reject discards and returns.

## Fix All with AI

**AI Call:** A single `generateObject()` call with the full document text and all issues listed. Schema: `{ editedDocument: string }`. The AI fixes only the flagged issues and preserves everything else.

**Merge View:** Same swap to `MergePane`, showing original vs fully-edited document. The unified merge view handles chunk-level display.

**Accept/Reject:** Same toolbar — Accept All applies, Reject All discards.

## State Management

The tool store gains:
- `mergeOriginal: string | null` — the original document text
- `mergeModified: string | null` — the AI-edited document text

When both are non-null, `App.vue` renders `MergePane` instead of `EditorPane`. When cleared (on accept or reject), it reverts to the normal editor.

## New Dependencies

- `@codemirror/merge` — for the unified merge view
