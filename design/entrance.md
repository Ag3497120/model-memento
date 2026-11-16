# R1: the time machine first

First visits open ChatGPT's November 2022 exhibit with no modal guide. The single notice can be dismissed; `museum.entrance-notice-v1` remembers dismissal through the existing guarded localStorage helpers. URL selections take precedence over saved selections. A saved selection still restores, while `?tour=1` starts at November 2022 regardless of saved state.

The permanent timeline is a sibling of the historical window, with its own neutral museum styling. It has three plain-text exhibit buttons, year markers, previous/next controls, a native range input, and the current recorded date. Dates retain month-only precision. Range movement previews a date and commits once on release; clicking a year or pressing a key uses the same `selectTool()` and existing era transition. The app returns focus to the timeline after timeline navigation so another arrow key can continue travelling, rather than editing the historical composer. The existing reduced-motion, skip, and cancellation behavior remains. Arrow keys in text fields, IME composition, modified keys, and open dialogs keep their existing behavior.

The small question shelf sits immediately above the composer. It is explicitly labelled Model Memento, uses the museum's own colours and font, and asks about the selected model's history. No historical renderer was edited. The three Japanese questions explicitly say “you” so that a preceding successor question does not make a later chip follow the successor. The English “What replaced you?” is routed to the archive's existing successor intent while the conversation retains the question as written. Responses retain referenced records and source links.

The panel and command palette remain the previous workers' shared navigation surface. Find, Learn, and Try entries are grouped under one More disclosure. World, news, guides, combine, the model catalog, and other tools remain there and searchable in the palette. Preferences, this screen, About, back navigation, and keyboard shortcuts remain available. Help is an explicit, single-page explanation of the timeline, rather than an automatic three-step welcome.

## Recorded identity and persona hooks

The November 2022 edition has `defaultModel: null` in the source records. That remains null: this change does not identify its backend as a later API snapshot. For this exhibit only, answers use a minimal ChatGPT identity, developer, and release date, with empty specifications and no inferred cutoff or successor. These three facts are sourced to [OpenAI's launch article](https://openai.com/index/chatgpt/) (read on 2026-11-16). This is museum identity data, not an API model ID. Exact backend snapshot, exact cutoff, and replacement remain **unverified**. Other editions with no identified model retain the existing model-selection fallback.

The D4 hooks are wired: an initial and on-switch sourced greeting, semantic `aside > small` museum notes after streaming and when restoring messages, and `relayAllowed !== false` before relay fallback. Speech, museum notes, voice metadata, facts, and model ID survive conversation persistence. The initial greeting does not assert that it is a transcript from the real model.

## Featured bootstrap

`web/js/entrance/featured.js` is a pure shared builder. After writing the normal manifest, `scripts/build-web.js` writes `web/data/featured.json`, with the complete records for ChatGPT, claude.ai, and Claude Code, their matching/default models and immediate referenced relationships, and their exact version-keyed era entries. It does not introduce another factual catalog. It retains sources and both languages. The shared-styles block automatically discovers `web/css/entrance.css`; the source HTML also links it.

The normal entrance awaits this one payload. The full models, closed models, core catalog, research, counts, memories, instructions, captured-source metadata, era index, and then the extra catalog load after the first render. The first screen also no longer awaits local-app API detection. Background loading preserves selection and messages, refreshes palette results, and can be retried after failure. Non-featured deep links or saved selections load the full catalog before resolving. A missing/invalid featured payload falls back to the old full-data path so a partly updated deployment still opens.

No generated public data was written in the shared working copy: those paths are outside R1's assigned files. The reviewer needs the normal web build to publish `featured.json` and refresh the module import map. The guarded build below exercised that exact build code with all writes in memory.

## Offline measurements

Command: `node test/entrance/measure.js` (exit 0). This compares the saved public JSON on this copy with a featured payload derived from the same records. Thirty samples follow one warm-up; the reported time is median Node file I/O plus JSON parsing. It excludes HTML, CSS, JS, network latency, rendering, and event-loop scheduling. It is **not browser time to interactivity**.

| Metric | Before | After |
| --- | ---: | ---: |
| Entrance JSON bytes | 7,994,774 | 1,098,287 |
| Including personas and real-links awaited by closure.js | 8,188,097 | 1,291,610 |
| Warm-file I/O + JSON parse median | 33.33 ms | 5.47 ms |

The featured JSON's gzip size was 245,233 bytes; whether the host applies gzip is **unverified**. Main entrance JSON decreased by 86.26%; including the common module records, by 84.23%. The complete guarded build from the current curated inputs separately produced **1,090,228 bytes**; it differs from the saved-public-data proxy and is not substituted into that proxy's timing.

For browser measurement, the reviewer should build and serve the before and after copies using the same hosting path, empty site storage, disabled cache, identical network/CPU throttling, and both `?lang=ja` and `?lang=en`. Record a Performance trace and Network log through the first interactive exhibit. This version creates a `museum-first-interactive` performance mark after the first historical surface, timeline, composer, and questions have handlers. Read `performance.getEntriesByName('museum-first-interactive')[0].startTime`; for the before copy use a Performance observer/trace at its first `museum-ready` event, which follows the same surface readiness. Count the finished JSON resources before that point, including personas and real-links, and report `encodedBodySize`, `decodedBodySize`, and `transferSize` separately. Background requests should be visible after the initial mark. Confirm a chip sends and a timeline step works while deliberately blocking the full-data responses. Repeat several cold runs and report the median, with browser/device and throttling stated. Neither these browser timings nor the visual layout were measured here.

## Rights and corrections

About includes the short unofficial / no affiliation / report concern link to the repository's issue form. `.github/ISSUE_TEMPLATE/correction.yml` accepts factual corrections, rights concerns, the affected location, requested change, and public evidence or relationship to the rights. Both languages are included. No image, logo, font file, screenshot, or third-party artwork was added. The issue form's hosted GitHub rendering remains **unverified** until it is published.

## Verification on this copy

Commands and actual results:

```text
node --check web/js/app.js
exit 0

node --test test/entrance/*.test.js test/app/navigation.test.js test/i18n/E1.test.js
tests 23 / pass 23 / fail 0 / skipped 0 / exit 0

node --import ./test/entrance/build-guard.js scripts/build-web.js --offline
R1 featured build verified: 1090228 bytes; 1026 generated files held in memory; no build files written.
exit 0 (expected closedCatalog offline fallback)

npm test
tests 916 / pass 915 / fail 0 / skipped 1 / exit 0
duration_ms 20555.083083 (final rerun after the timeline focus fix)
```

The new tests cover first selection, saved/URL precedence, the tour's initial selection, dismissible storage and blocked storage, both languages, native range preview/commit, year clicks, bounds, featured switching, global and range keys, text/IME/modifier exclusions, exact chip questions and answer kinds, source links, museum-note rendering, on-switch greetings, relay refusal, an incomplete background load, full-data retry/fallback, and the real offline build with protected output. The existing navigation and English tests still pass; their explicit Help fixture now opens Help itself, rather than relying on automatic onboarding.

D6's world-client fix checks an aborted signal before creating a cached manifest promise; a regression test checks zero fetches and no orphan rejection. `scripts/check-web.js` now uses the unified panel, preference page ID, navigation entries, and source toggle's `aria-pressed`, and waits for background data before its broad catalog audit. It also checks the new first exhibit. That script was **not run**, because it launches a server/browser and captures screenshots. Browser layout at 390 px, real pointer dragging, screen-reader behavior, perceived transitions, timed tour playback, live relay, and browser performance remain **unverified** under the task's no-apps rule. The existing third-party records were not independently re-researched.

## Task status and reviewer follow-up

1. First visit: done in code and offline state tests.
2. Permanent timeline: done in code and event tests; browser/phone presentation unverified.
3. Three featured exhibits and More: done; shared navigation tests pass.
4. History questions and sources: done in Japanese and English; era notes and relay boundary also covered.
5. Featured build and background loading: done; bytes and Node proxy measured; actual browser interactive time unverified.
6. Rights/corrections link and issue form: done; GitHub publication unverified.
7. Tour starts in November 2022 and follows the same timeline/transition selection path: done in code; initial selection tested; timed visual playback unverified. `npm test` passes.

Reviewer: regenerate public artifacts, run the browser checks outside this sandbox, inspect the small question shelf near the phone composer, and collect the before/after browser timing. There are no required edits requested in another worker's files. `web/js/nav.js` did not require a change.
