# Entering an edition

D5 replaces the uniform update/restart screen with a short passage between two recorded desktops. It uses plain colour, text, rules, a window and a recorded date. There are no images, logos, downloaded assets, sounds, particles, glitch effects, invented installers or additional fonts. Product names remain ordinary text.

## Behaviour

A different dated edition, in either direction or across tools, gets three beats: 600 ms to read the edition record, 420 ms for its frame and date to change in place, and 760 ms with the destination visible behind a small record caption. Total normal duration: **1780 ms**. CSS changes colour, corner radius and a small illustrative rule over 180 ms; it never translates, scales, spins or blinks. The rule represents the three presentation stages, not measured download progress.

The full visual closes at **2400 ms**, including when the destination renderer is still pending. The returned promise continues to await that renderer, so a late failure still reaches the caller. Timers, input listeners and the media-query listener are removed when the visual closes. Canceling an older selection prevents its delayed swap; an already-running renderer cannot be aborted by this module. The app's existing selection generation check remains responsible for selecting the current edition.

Any key or click skips immediately, including during the arrival caption. Input is captured at the document before composer/menu handlers; a skip cannot also send a prompt. A source link retains its default navigation while dismissing the visual. Focus returns to the destination input or the still-connected opener. A newly opened modal keeps focus and suppresses the arrival caption.

`prefers-reduced-motion: reduce` calls the swap directly: no overlay, caption delay, timer or focus movement. Enabling that preference during travel also removes the visual immediately. An initially hidden document skips the presentation; hiding the document during travel dismisses it. Missing or invalid desktop record dates also skip. Catalog edition years are not substituted for missing desktop evidence.

For moves of at least two calendar years, the pair of actual record dates gets slightly more space. Only the source and destination are shown. No intermediate desktops, release dates or clock times are invented. The clock uses the existing locale-aware `formatEraClock`; a record with no time shows only its date.

## Historical research and its limits

The following primary sources were read on 2026-11-16. Facts informed original geometry and restrained presentation; no vendor artwork or source-code implementation was copied.

- Apple's [2020 Big Sur announcement](https://www.apple.com/newsroom/2020/06/apple-introduces-macos-big-sur-with-a-beautiful-new-design/) describes more spacious windows and changes to corner curvature, materials and menu controls. The macOS treatment uses a compact light window and a neutral menu strip. Exact OS release, dimensions, wallpaper and update sheet for each product remain **unverified**. This is a visual reference, not evidence that every recorded Mac ran Big Sur.
- Microsoft's [Windows geometry reference](https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/geometry) specifies 8 px for top-level Windows 11 windows and dialogs. The reference is linked only for records explicitly identifying Windows 11. Generic Windows records do not become Windows 11 because of their year.
- Google's [2018 Chrome design announcement](https://blog.google/products-and-platforms/products/chrome/chromes-turning-10-heres-whats-new/) records rounder shapes and a changed palette. A generic `browser tab` record does not identify Chrome or its version, so this implementation uses a quiet browser-shaped frame without asserting a particular browser or showing a fabricated browser updater.
- The pinned [Cherry Studio update control](https://github.com/CherryHQ/cherry-studio/blob/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/components/UpdateAppButton.tsx) appears after an update downloads when automatic checks are enabled. Its presentation is small, outlined, rounded, and hidden at viewport widths at or below 1000 px. Only the 2025-06-18 edition with that exact evidence gets the short `Update Available` control label. The transition does not claim that an update has actually downloaded or simulate its dialog's unverified contents. The [recorded English locale](https://github.com/CherryHQ/cherry-studio/blob/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/i18n/locales/en-us.json) supplies that functional label.
- The fixed [GPT-2 interactive entry point](https://raw.githubusercontent.com/openai/gpt-2/9d1e704fec1726d5e051e98336b655ae8ce49242/src/interactive_conditional_samples.py) waits for a text prompt after restoring a checkpoint. The [Aider 0.5.0 entry point](https://raw.githubusercontent.com/Aider-AI/aider/v0.5.0/aider/main.py) constructs its text interface and coder. These are evidence for quiet text-oriented entry, not an installer transcript. Terminal transitions therefore use a fixed-width record and status text; the destination renderer supplies its own startup screen. No commands execute, no package names or download counters are fabricated.

The early/middle/recent colours and spacing are **Model Memento design choices**, not measured historical palette values. An unknown OS stays neutral. The scene begins in the source frame and restyles that same window and clock to the destination; it never inserts a supposed intermediate OS.

Update notices and “what's new” items retain their edition's sources and active date range. A release announcement is explicitly labelled “From this edition’s record”, rather than being represented as a verified in-product dialog. Unsourced content becomes `unverified`. The honesty line and source links remain present through all phases. English and Japanese use `tr()` and `pick()`.

## Files and integration

- `web/js/era/transition.js`: lifecycle, timings, global skip, cancellation, media preference and focus.
- `web/js/era/transition-scene.js`: validated dates, evidence selection, plain desktop/window scene and phase updates.
- `web/css/era.css`: original scene geometry, restrained colours, responsive layout, forced-colour support and reduced-motion fallback.
- `test/era/transition.test.js` and `test/era/transition-scene.test.js`: deterministic timing, interaction, language and record coverage.

The existing `createEraTransition({ host })` / `.run({ from, to, swap })` integration works unchanged. No `web/js/app.js` hook is required. `accents.js` and `frame.js` are unchanged.

## Verification

Commands actually run:

```text
node --test test/era/transition*.test.js
# tests 46
# pass 46
# fail 0

node --test test/era/*.test.js
# tests 88
# pass 88
# fail 0
```

The scene inventory covers all **283 dated desktop records** in the current 287-edition bundle: 63 terminal, 113 browser, 28 macOS, 2 Windows, 77 neutral. Every dated desktop record has source metadata. Four records without a valid desktop date bypass the effect. DOM fixtures verify state and events; they do not measure layout or browser painting.

```text
node --import ./test/era/build-output-guard.js scripts/build-web.js --offline
V1 era output verified: 287 versions, exact source fields, held in memory.
AP1 output guard: 1022 generated files held in memory; no build files written.
Exit 0
```

The guarded build ran the actual offline builder with generated writes held in memory. An earlier attempt rejected `traits.self_description.note_en`; that shared schema/data issue no longer blocks this build. A normal unguarded build was not run because it would overwrite shared generated files. Both changed JavaScript modules also passed `node --check` (exit 0, no output).

Full-suite results from the latest `npm test` run (also invoked by a Node wrapper that printed only failing test names and summary lines):

```text
# tests 899
# pass 896
# fail 2
# cancelled 0
# skipped 1
Exit 1
```

Other workers were editing the shared checkout, so these are observations of a particular run, not a claim about a fixed baseline. D5's era tests passed. Earlier i18n assertions expecting a reduced-motion caption and the previous menu label no longer fail in this latest full run; D5 did not edit those tests or `app.js`.

Remaining reviewer follow-up outside the allowed files:

`test/daily/build.test.js:68` writes a `catalog-fixture.mjs` whose `Response.json(...)` object is missing one closing `}` before `);`. The generated fixture raises `SyntaxError: Unexpected token ')'`, and the assertion at line 72 fails. Add the missing brace in that test's fixture string and rerun `npm test`.

The latest full run also failed the curated-persona validation test. The subsequent isolated command below reproduced only the checkout fixture failure; curated-persona validation now passed:

```text
node --test --test-name-pattern='fresh checkout builds|60–80 curated personas' test/daily/build.test.js test/persona/catalog.test.js
# tests 2
# pass 1
# fail 1
Exit 1: generated catalog-fixture.mjs SyntaxError
```

The full suite has **not been demonstrated passing**. No out-of-scope files were changed to hide failures. The fixture test's own offline/online build and rights diagnostics succeeded before reaching its malformed catalog fixture.

Unverified: actual browser layout, narrow/short viewport rendering, visual timing under load, source-link default navigation in a real browser, screen-reader announcements, OS shortcut conflicts, exact historical update/restart sequences, OS versions and typography beyond the supplied record evidence. No browser, app or standalone server was launched. Not all inherited source URLs were re-fetched; the new research references above were read. Failed page fetches for a 2023 Chrome refresh article and a Windows 2021 preview article were not used as evidence.
