---
name: wordsworth
description: Use when editing technical writing and needing feedback on readability, style, tone, structure, or prose quality. Covers diagnostics (readability scores, style checks, hedging, pronouns, parallel lists, acronyms, promise tracking).
---

# Wordsworth

Microtools for technical writing. Paste your Markdown, get instant feedback on readability, style, tone, and structure. Code blocks are excluded from analysis to avoid false positives.

## General Rules

- All analysis tools are **read-only** — they flag issues without modifying text.
- Code blocks (fenced ``` ... ``` and inline `code`) are masked before analysis so they produce no false positives.
- Markdown syntax (headings, bold, italic, links, images, blockquotes, list markers) is stripped for plain-text analysis where relevant.
- When both inconsistency types exist (spelling + terminology), report both.
- "Dominant" = most frequent usage. All minority occurrences are flagged.
- Only flag lists with **2 or more items** in parallel structure analysis.

---

## Diagnose

### Readability

Calculates three standard readability metrics from the text, plus word count, sentence count, and estimated reading time (at ~238 WPM).

#### Formulas

**Flesch-Kincaid Reading Ease**: `206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord`
- Higher score = easier to read (90-100 = easily understood by 11-year-old; 0-30 = college graduate level)

**Gunning Fog Index**: `0.4 * (avgWordsPerSentence + 100 * complexWordRatio)`
- `complexWordRatio = complexWords / wordCount` where complex words = those with 3+ syllables
- Result approximates years of formal education needed to understand the text

**Grade Level**: `0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59`
- Maps to a school grade (e.g., 8.5 = eighth grade)

#### Calculations

- `avgWordsPerSentence = wordCount / sentenceCount`
- `avgSyllablesPerWord = totalSyllables / wordCount`

**Syllable counting rules**:
1. Count each group of consecutive vowels (a, e, i, o, u, y) as one syllable
2. Words with 2 or fewer characters always count as 1 syllable
3. Subtract 1 for silent final -e (if count > 1)
4. Add 1 for -le ending only when preceded by a consonant and the word is > 3 chars

**Sentence splitting**:
- Split on `.`, `!`, `?` characters
- **Skip abbreviations** that end in a period: mr, mrs, ms, dr, prof, sr, jr, st, vs, etc, inc, ltd, dept, est, approx, e.g, i.e, fig, vol, no
- Leading whitespace is trimmed before splitting

**Input**: Text in any format (will strip Markdown formatting for analysis).

**Output**: `{ fleschKincaid, gunningFog, gradeLevel, wordCount, sentenceCount, readingTimeMinutes }`

---

### Style Check

Scans prose for **passive voice**, **wordy phrases**, and **inconsistencies** (spelling and terminology). Text in code blocks is masked (replaced with spaces) so regex positions stay valid.

#### Passive Voice Detection

Pattern: `was/were/is/are/been/being/be` + past participle (ends in -ed or irregular form).

Matches: `written, built, made, done, seen, given, taken, found, known, shown, told, sent, kept, left`

Severity: **warning** — these weaken technical writing. Flag the exact phrase and suggest rewriting in active voice.

#### Wordy Phrases

The following multi-word or verbose constructions should be replaced with their concise alternatives. All matches are case-insensitive whole-word.

| Phrase to detect | Replace with | Severity |
|---|---|---|
| `in order to` | `to` | info |
| `at this point in time` | `now` | info |
| `due to the fact that` | `because` | info |
| `in the event that` | `if` | info |
| `for the purpose of` | `to` | info |
| `in the process of` | (omit) | info |
| `it is important to note that` | (omit) | info |
| `as a matter of fact` | `in fact` | info |
| `a large number of` | `many` | info |
| `utilize` | `use` | info |
| `leverage` | `use` | info |
| `facilitate` | `help / enable` | info |

#### Inconsistency Detection

**Spelling variants** (US/UK pairs). Only flag if both variants appear in the same document. Each occurrence of the minority variant is flagged individually.

| US | UK |
|---|---|
| color | colour |
| favor | favour |
| honor | honour |
| humor | humour |
| labor | labour |
| neighbor | neighbour |
| behavior | behaviour |
| organize | organise |
| realize | realise |
| recognize | recognise |
| analyze | analyse |
| apologize | apologise |
| customize | customise |
| center | centre |
| meter | metre |
| theater | theatre |
| defense | defence |
| offense | offence |
| license | licence |
| catalog | catalogue |
| dialog | dialogue |
| program | programme |
| gray | grey |
| canceled | cancelled |
| traveled | travelled |
| modeling | modelling |
| judgment | judgement |
| acknowledgment | acknowledgement |
| fulfill | fulfil |

**Term variants** (synonyms used inconsistently). Same rule: flag the minority variant when two or more from the same group appear.

| Variant group |
|---|
| user, customer, client |
| app, application |
| e-mail, email |
| login, log in, log-in |
| setup, set up, set-up |
| database, data base |
| website, web site, web-site |
| ok, okay |
| percent, per cent |
| afterward, afterwards |
| toward, towards |
| among, amongst |
| while, whilst |

**How it works**:
1. Count case-insensitive whole-word occurrences of each term in the group
2. If two or more variants are found, the one with the most occurrences is dominant
3. Every occurrence of each non-dominant variant is flagged with the dominant term as suggestion
4. Severity: **info** (not warning — style convention, not correctness)

---

### Pronouns

Counts personal pronouns across three groups and assesses the resulting tone. Code blocks are masked before analysis.

#### Pronoun Groups

**"I" group** (first person singular): `I`, `me`, `my`, `mine`
**"You" group** (second person): `you`, `your`, `yours`
**"We" group** (first person plural): `we`, `us`, `our`, `ours`

All matches are case-insensitive whole-word.

#### Tone Assessment

Based on the proportion of "you" vs "I/we" among total pronoun count:

| Condition | Assessment |
|---|---|
| "You" > 50% | Strongly reader-focused — addresses the reader directly |
| "You" > "I/we" total | Mostly reader-focused |
| "I/we" > 50% | Strongly author-focused — centered on the writer/team |
| "I/we" > "You" | Mostly author-focused |
| Equal proportions | Balanced between author and reader |
| Zero pronouns | No pronouns detected — neutral/impersonal tone |

#### Technical Documentation Tone

Technical documentation benefits from a reader-focused "you" voice. This tool makes the balance visible without counting manually. Flag if the tone is "strongly author-focused" in documentation that should be reader-facing.

---

### Hedge Words

Finds hedging language that weakens confident technical writing. Three groups, three tone tiers based on density (hedge words as % of total word count). Excludes code blocks.

#### Hedge Groups

**Uncertainty hedges** — words that express doubt or speculation:
`might`, `could`, `may`, `perhaps`, `possibly`, `conceivably`, `presumably`

**Frequency hedges** — words that soften frequency claims:
`generally`, `usually`, `often`, `sometimes`, `occasionally`, `typically`, `normally`, `frequently`, `rarely`, `seldom`

**Softeners** — words that diminish the strength of assertions:
`somewhat`, `fairly`, `rather`, `quite`, `slightly`, `relatively`, `arguably`, `practically`, `essentially`, `basically`, `virtually`

All matches are case-insensitive whole-word.

#### Tone Assessment

Based on hedge density (hedge words / total words × 100%):

| Density | Tone |
|---|---|
| 0% | Fully assertive — no hedging language detected |
| < 1% | Assertive — minimal hedging |
| 1–3% | Balanced — moderate hedging |
| 3–5% | Cautious — noticeable hedging throughout |
| 5%+ | Heavily hedged — hedging language may undermine confidence |

#### Reporting

For each flagged hedge word, report:
- The word and its group (uncertainty/frequency/softener)
- The line number
- Group-level counts, percentages within total hedge count, and percentage of total words

---

### Parallel Structure

Analyzes every Markdown list (both ordered and unordered) for grammatical consistency. Code blocks are masked.

#### List Detection

Recognized markers:
- Unordered: `-`, `*`, `+` (with optional leading whitespace/indentation)
- Ordered: `1.`, `2.`, `3.`, etc. (digits followed by period and space, with optional leading whitespace)

A non-list line breaks the current list group. Only groups with **2+ items** are analyzed.

#### Pattern Classification

Each item's text (after the marker) is classified by its first word (case-insensitive):

**Imperative verb** — first word is a known command verb:
`install`, `run`, `click`, `open`, `create`, `delete`, `update`, `configure`, `set`, `add`, `remove`, `enable`, `disable`, `start`, `stop`, `restart`, `build`, `deploy`, `test`, `check`, `verify`, `select`, `enter`, `type`, `copy`, `paste`, `navigate`, `go`, `use`, `download`, `upload`, `import`, `export`, `save`, `load`, `read`, `write`, `connect`, `disconnect`, `log`, `sign`, `submit`, `cancel`, `confirm`, `accept`, `reject`, `approve`, `deny`, `allow`, `block`, `grant`, `revoke`, `assign`, `unassign`, `close`, `send`, `receive`, `define`, `declare`, `initialize`, `call`, `invoke`, `return`, `pass`, `throw`, `catch`, `handle`, `validate`, `parse`, `format`, `convert`, `transform`, `merge`, `split`, `sort`, `filter`, `map`, `reduce`, `bind`, `attach`, `detach`, `mount`, `unmount`, `render`, `fetch`, `push`, `pull`, `commit`, `clone`, `fork`, `publish`, `subscribe`, `unsubscribe`, `register`, `deregister`, `wrap`, `unwrap`, `encode`, `decode`, `encrypt`, `decrypt`, `compress`, `decompress`, `scroll`, `drag`, `drop`, `hover`, `focus`, `blur`, `toggle`, `switch`, `swap`, `reset`, `clear`, `flush`, `purge`, `refresh`, `reload`, `retry`, `skip`, `abort`, `pause`, `resume`, `lock`, `unlock`, `pin`, `unpin`, `archive`, `restore`, `backup`, `migrate`, `upgrade`, `downgrade`, `patch`, `debug`, `trace`, `monitor`, `profile`, `benchmark`, `audit`, `scan`, `lint`, `specify`, `ensure`, `include`, `exclude`, `extend`, `override`, `implement`, `annotate`, `tag`, `label`, `name`, `list`, `describe`, `show`, `display`, `print`, `output`, `note`, `document`, `comment`, `mark`, `highlight`, `flag`, `indicate`, `point`, `reference`, `link`, `embed`, `insert`, `append`, `prepend`, `inject`, `eject`, `require`, `need`, `want`, `expect`, `assert`, `assume`

**Gerund** — first word ends in `-ing` and is longer than 4 characters (e.g., "Installing", "Configuring", "Running").

**Infinitive** — first word is `to` AND second word is a known imperative verb, OR second word ends in `-ate`, `-ize`, or `-ify` (verbal suffixes).

**Noun phrase** — first word is a determiner/article: `the`, `a`, `an`, `this`, `that`, `these`, `those`, `each`, `every`, `some`, `any`, `all`, `no`, `your`, `our`, `their`, `its`, `my`, `his`, `her`.

**Sentence** — first word is a subject pronoun or technical noun: `you`, `we`, `they`, `it`, `he`, `she`, `users`, `developers`, `administrators`, `clients`, `servers`, `applications`, `systems`, `services`, `components`, `modules`, `functions`, `methods`, `classes`, `objects`, `files`, `directories`, `endpoints`, `requests`, `responses`. Also catches: a capitalized word followed by a common verb (`is`, `are`, `was`, `were`, `has`, `have`, `had`, `can`, `could`, `will`, `would`, `should`, `may`, `might`, `must`, `shall`, `do`, `does`, `did`, `need`, `needs`).

**Other** — doesn't match any of the above.

#### Punctuation & Capitalization

**Trailing punctuation** checked for: `.`, `;`, `:`, or none.

**Capitalization** checks whether the first character is uppercase.

#### Dominant Pattern Computation

For each list, determine the dominant value for all three dimensions:
- **Pattern**: the most frequently occurring pattern (mode). No tiebreaker — just pick the first one with the highest count.
- **Capitalization**: if tied, prefer capitalized (true).
- **Punctuation**: if tied, prefer no punctuation (empty string).

Each item not matching the dominant value for any dimension is flagged separately as a **pattern**, **capitalization**, or **punctuation** issue.

---

### Acronym Checker

Finds acronyms (sequences of 2+ uppercase letters as whole words) that are not expanded on first use.

#### Skip List

The following abbreviations are **always skipped** (too well-known to require expansion):
`OK`, `US`, `AM`, `PM`, `ID`, `TV`, `UK`, `EU`, `UN`, `DC`, `AD`, `BC`, `CE`, `IT`, `OR`, `AN`, `AT`, `IF`, `IN`, `IS`, `NO`, `OF`, `ON`, `SO`, `TO`, `UP`, `VS`

#### Expansion Patterns

An acronym is considered **expanded** if ANY of these three patterns exist in the document for that acronym:

1. **Parenthetical definition**: `Full Phrase (ACR)` — the acronym appears inside parentheses immediately after its expansion
2. **Reverse parenthetical**: `ACR (Full Phrase)` — the acronym comes first, followed by its expansion in parentheses
3. **Inline "or" definition**: `ACR, or Full Phrase` or `ACR — or Full Phrase` — the acronym is followed by a comma/whitespace + "or" + the expansion

Each pattern is searched across the entire document. If any match is found, the acronym is not flagged.

#### Reporting

Report for each unexpanded acronym:
- The acronym text
- The line number of its first occurrence
- How many times it appears in the document
- That it has no expansion

Flag the first occurrence of each unexpanded acronym only.

---

### Promise Tracker

AI-powered: reads the introduction of the document to identify promises and claims, then checks whether each promise is fulfilled in the body and conclusion.

#### Promise Identification

Promises are forward-looking statements in the introduction that commit the document to covering specific content. Common patterns:
- "this guide will show you how to..."
- "you will learn..."
- "this article covers..."
- "we will demonstrate..."
- "in this section, you'll see..."
- "this tutorial walks you through..."

The model should identify each distinct promise as a separate claim.

#### Verdict Types

Each promise receives one of three verdicts:

- **pass**: the promise is fully fulfilled somewhere in the body or conclusion. Evidence directly supports the claim.
- **partial**: the promise is addressed only in part — some aspects are covered but others are missing or superficial.
- **fail**: the promise is not addressed at all, or the content contradicts what was promised.

#### Reporting

For each promise:
- The original promise text (what was claimed)
- The verdict (pass/partial/fail)
- Evidence from the text supporting the verdict — quote relevant passages

If any promises receive a "fail" verdict, flag this prominently — it indicates the document's introduction sets up expectations it doesn't deliver on.
