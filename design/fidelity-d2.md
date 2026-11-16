# D2 renderer fidelity record

Checked on 2026-11-16. This pass improves the six priority renderer families across all 92 recorded versions. It also collects reference notices and adds a small bilingual Recreation label in the 14 assigned renderers. Only owned files were changed.

## Evidence and limits

This is a drawing from public records, not a pixel match. The per-version specs, their existing region/control records, official release notes, public product articles and tagged public source files were consulted. One relevant source was fetched for each priority spec version; repeated URLs were reused. Direct Node requests to OpenAI pages returned HTTP 403, so the official release notes, macOS notes, launch, Canvas, research and Codex app pages were read through the web reader. A 200 response establishes availability of a document, not a historical screenshot or precise layout measurement.

Exact colors, widths, typography metrics, radii, launch-day wording and responsive breakpoints remain **unverified** unless an explicit source value is called out. Existing null palette measurements remain null. CSS values below are intentional approximation choices. No images, screenshots, fonts, logos, emblems, mascots or brand paths were added. Names use ordinary system text. Generic arrows, plus, copy, edit, feedback and activity glyphs are UI controls.

The 2025-10 macOS Codex record remains **unverified**. The official app announcement is dated 2026-02-02: [Codex app announcement](https://openai.com/index/introducing-the-codex-app/). The legacy ID is preserved because changing the catalog is outside this worker's files.

The Claude style-help URL returned 404 from both support.anthropic.com and support.claude.com; the renderer's inherited style menu is retained, with its exact historical geometry **unverified**. [Original source URL](https://support.anthropic.com/en/articles/10181068-configuring-and-using-styles).

## Implementation choices

| Family | Deliberate approximation values | Reason / evidence boundary |
| --- | --- | --- |
| ChatGPT | Classic #343541 page / #444654 reply / #202123 rail; later white page / #f4f4f4 input; 252px rail, 768px reading width, 16px body, 32px send | Preserve the turn-band versus later open-page distinction. Exact hex/spacing values unverified; feature-era references are listed per edition below. |
| Claude.ai / desktop | #faf9f5 page / #f0eee6 rail / white input; 228px rail, 704px reading width, 17px serif assistant text, 16px composer radius | Separate document-like reading from compact UI. ui-serif, Noto Serif, Liberation Serif and system-ui are fallbacks; original font identity and exact values unverified. Artifact region evidence: [3.5 Sonnet announcement](https://www.anthropic.com/news/claude-3-5-sonnet). |
| Claude Code | #191919 page, #e8e6df text, #d4977c accent, 13px monospace; thin prompt rules | Terminal colors depend on user theme; these neutral values are unverified. Keep real command/region distinctions: [interactive mode](https://code.claude.com/docs/en/interactive-mode). |
| Cursor | #1e1e1e editor / #181818 rails / #252526 composer; 44px activity rail, 170px explorer, 34% chat pane, 12px code | Restore recognizable editor hierarchy. Numeric values unverified. Sidebar Composer: [0.43](https://cursor.com/changelog/0-43-x); agent layout: [2.0](https://cursor.com/changelog/2-0). |
| Codex | #151515 terminal / #242424 prompt; 13px monospace; light app rail 230px, composer radius 16px | CLI theme and app measurements unverified. The April 2025 two startup boxes are both **64 columns** in [terminal-header.tsx](https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/chat/terminal-header.tsx). This is the one new measured spec correction. |
| Gemini | White page / #f0f4f9 rail and composer; 232px rail, 760px reading width, 32px composer radius | Cool, open chat layout; exact numbers unverified. [Gemini launch](https://blog.google/products-and-platforms/products/gemini/bard-gemini-advanced-app/) and [Canvas announcement](https://blog.google/products-and-platforms/products/gemini/gemini-collaboration-features/) supply era/region context. |

At widths below 760px the priority chat rails are omitted and reading/composer margins shrink. Cursor keeps the code/chat stack; terminal examples retain horizontal text-box scrolling. These breakpoints are our responsive choices, not product claims. Browser layout QA has **not been run**: the worker rules prohibit starting apps, servers or browser harnesses.

Reference caveats are moved as existing DOM nodes into the existing Sources disclosure, rather than deleted or hidden with CSS. Each renderer keeps one small Recreation label. Unverified model-selection positions remain explicit in their model panels, since that uncertainty is part of the model-switch contract.

ChatGPT gains edit, Copy, feedback and retry; Claude and modern Gemini gain Copy and feedback; Bard retains its draft/verification actions. Feedback only updates this example locally. Retry sends the preceding question through the existing send callback; it is not an implementation of the original service's response branching. Copy depends on browser clipboard permission. No extra network calls are introduced.

Thinking/streaming/completed states continue through the shared stream engine. A neutral progress dot replaces the visual emblem; action rows disappear while a response is active. Generated throughput, token and diff figures from the host are suppressed on the priority surfaces because they do not establish real product telemetry. Reduced-motion preference disables the added animation/transitions. These choices approximate behavior; original timing and exact spinner states are **unverified**.

The August 2024 Cursor workspace previously created one detached Chat node and a separate mounted Chat node. Its Composer toggle was attached to the detached node. The toggle now lives in the actual workspace, so the floating Composer can be closed and reopened. The historical Composer availability is documented in [0.40](https://cursor.com/changelog/0-40-x); this was a local mounting bug.

## Per-edition audit

Every edition below receives its family's shared visual treatment plus the specific treatment listed. Sources establish the named feature/region or provide the prior research context. Exact appearance remains unverified where not explicitly measured. The complete inherited source lists remain in each renderer's disclosure.

### ChatGPT (22 versions)

Dark bands for classic editions; white page, bounded reading column and quiet gray rail for later editions. Compact circular send button, lower source disclosure, editable questions and a Copy / feedback / retry row.

| Edition | Treatment and preserved distinction | Source |
| --- | --- | --- |
| chatgpt-2022-11 | Three starter columns follow the heading; they disappear after the first message. Launch-day exact composition remains unverified. | [Record](https://openai.com/index/chatgpt/) |
| chatgpt-2022-12 | Full-width alternating turns, square composer and question edit affordance. | [Record](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2023-03 | Classic shell; keep the top model slot. | [Record](https://openai.com/index/gpt-4-research/) |
| chatgpt-2023-05 | Classic shell; keep nested beta/plugin controls. | [Record](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2023-07 | Classic shell; keep file-entry and interpreter controls. | [Record](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2023-09 | Classic shell; retain image entry rather than adding a voice dashboard. | [Record](https://openai.com/index/chatgpt-can-now-see-hear-and-speak/) |
| chatgpt-2023-11 | Classic shell; retain the GPT creation entry. | [Record](https://openai.com/index/introducing-gpts/) |
| chatgpt-2024-05 | White open conversation, inset rail and a round send control. | [Record](https://openai.com/index/gpt-4o-and-more-tools-to-chatgpt-free/) |
| chatgpt-2024-05-macos | Sidebar-free native conversation with a round send control. | [Record](https://openai.com/index/gpt-4o-and-more-tools-to-chatgpt-free/) |
| chatgpt-2024-08-macos | Compact companion keeps its independent framing. | [Record](https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes) |
| chatgpt-2024-09 | White reading column; keep the text-only o1 branch. | [Record](https://openai.com/index/introducing-openai-o1-preview/) |
| chatgpt-2024-10 | White chat plus optional editable document; no permanent split when closed. | [Record](https://openai.com/index/introducing-canvas/) |
| chatgpt-2024-11-macos | Modern flat replies; preserve the edition-specific navigation and input slot. | [Record](https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes) |
| chatgpt-2024-11 | Modern flat replies; preserve the edition-specific navigation and input slot. | [Record](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2024-12 | Modern flat replies with project entry retained. | [Record](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2025-02 | Research activity remains opt-in beside the reading column. | [Record](https://openai.com/index/introducing-deep-research/) |
| chatgpt-2025-04 | Library entry and input model slot retained. | [Record](https://openai.com/index/introducing-o3-and-o4-mini/) |
| chatgpt-2025-06-macos | Recording summary example stays opt-in in the macOS view. | [Record](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2025-08 | Top model slot retained; no speculative extra selector. | [Record](https://openai.com/index/introducing-gpt-5/) |
| chatgpt-2026-02 | Research plan opens beside the bounded conversation. | [Record](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2026-04 | Project entry and input model slot retained. | [Record](https://help.openai.com/en/articles/10169521-projects-in-chatgpt) |
| chatgpt-2026-11 | Profile task entry retained; no invented permanent inspector. | [Record](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot) |

### Claude.ai (19 versions)

Warm page and slightly darker rail, serif greeting and assistant prose using free serif/system fallbacks, sans-serif UI and user turns, a white multiline composer with a small warm send button. Copy / local feedback controls sit below answers.

| Edition | Treatment and preserved distinction | Source |
| --- | --- | --- |
| claude.ai-2023-07 | Keep the rail-free early view; remove the generic AI badge from the hero. Product name remains ordinary UI text. | [Record](https://www.anthropic.com/news/claude-2) |
| claude.ai-2023-11 | Keep the rail-free conversation; no API-only settings added. | [Record](https://www.anthropic.com/news/claude-2-1) |
| claude.ai-2024-03 | Keep the model slot at the composer. | [Record](https://www.anthropic.com/news/claude-3-family) |
| claude.ai-2024-06 | Warm chat and optional artifact pane with a quiet document toolbar. | [Record](https://www.anthropic.com/news/claude-3-5-sonnet) |
| claude.ai-2024-09 | Keep the project entry and optional artifact. | [Record](https://claude.com/resources/articles/claude-for-enterprise) |
| claude.ai-2024-10 | Move the date-specific analysis caveat into Sources; retain profile experiment controls. | [Record](https://claude.com/resources/articles/analysis-tool) |
| claude.ai-2024-11 | Keep style controls by the composer; the old official help URL now returns 404, so exact historical placement remains unverified. | [Record](https://support.anthropic.com/en/articles/10181068-configuring-and-using-styles) |
| claude.ai-2025-02 | Keep the thinking mode control; no made-up reasoning budget or timing. | [Record](https://www.anthropic.com/news/claude-3-7-sonnet) |
| claude.ai-2025-03 | Keep web-search entry under profile. | [Record](https://claude.com/resources/articles/web-search) |
| claude.ai-2025-04 | Retain Research near the composer. | [Record](https://claude.com/resources/articles/research) |
| claude.ai-2025-05 | Retain Research without adding a permanent report view. | [Record](https://www.anthropic.com/news/claude-4) |
| claude.ai-2025-07 | Keep artifact library behind its existing entry. | [Record](https://claude.com/resources/articles/build-artifacts) |
| claude.ai-2025-09 | Warm conversation without invented telemetry. | [Record](https://www.anthropic.com/news/claude-sonnet-4-5) |
| claude.ai-2026-02 | Warm base shell; no API context meter. | [Record](https://www.anthropic.com/news/claude-opus-4-6) |
| claude.ai-2026-04 | Warm base shell; no invented fixed connector dock. | [Record](https://claude.com/resources/articles/research) |
| claude.ai-2026-06 | Optional draft beside the chat. | [Record](https://support.claude.com/en/articles/12138966-release-notes) |
| claude.ai-2026-07 | Use the conservative base shell; no new low-confidence milestone invented. | [Record](https://support.claude.com/en/articles/12138966-release-notes) |
| claude.ai-2026-09 | Move integration caveat into Sources; keep optional document. | [Record](https://support.claude.com/en/articles/12138966-release-notes) |
| claude.ai-2026-11 | Retain output controls and the on-demand artifact pane. | [Record](https://claude.com/resources/articles/sheets-whiteboards-data) |

### Claude Code (14 versions)

Monospace flat transcript, sparse warm terminal accent, a ruled prompt, subdued command hints and no decorative assistant emblem. Startup caveats are retained inside Sources, including the existing reference-welcome hook used by tests.

| Edition | Treatment and preserved distinction | Source |
| --- | --- | --- |
| claude-code-2025-02 | Terminal transcript and prompt; exact initial welcome box remains unverified. | [Record](https://www.anthropic.com/news/claude-3-7-sonnet) |
| claude-code-2025-04 | Terminal transcript; exact April welcome remains unverified. | [Record](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md) |
| claude-code-2025-05 | Keep the sourced 1.0.27 character box, work folder and nested tool-output example. Move duplicate caveats into Sources. | [Record](https://www.anthropic.com/news/claude-4) |
| claude-code-2025-07 | Keep the 1.0-series header and the availability caveat in Sources. | [Record](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md) |
| claude-code-2025-09 | Keep rewind/history guidance and optional IDE example; no web/desktop dashboard added to the terminal. | [Record](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously) |
| claude-code-2025-10 | Web task conversation keeps its existing nonterminal layout; warm shared shell and controls apply. | [Record](https://claude.com/resources/articles/claude-code-on-the-web) |
| claude-code-2025-11 | Keep the conservative reference terminal; native Desktop geometry is unverified for this record. | [Record](https://www.anthropic.com/news/claude-opus-4-5) |
| claude-code-2025-12 | Keep theme/syntax hints and the flat terminal layout. | [Record](https://www.anthropic.com/news/claude-opus-4-5) |
| claude-code-2026-02 | Keep model command and readable model status. | [Record](https://code.claude.com/docs/en/remote-control) |
| claude-code-2026-04-macos | Desktop workspace keeps its movable chat/diff/preview/terminal/editor panels; no terminal styling applied. | [Record](https://claude.com/resources/articles/claude-code-desktop-redesign) |
| claude-code-2026-05 | Keep plugin inspection as a disclosure. | [Record](https://code.claude.com/docs/en/interactive-mode) |
| claude-code-2026-08 | Keep wrapping permission example in the transcript. | [Record](https://code.claude.com/docs/en/whats-new) |
| claude-code-2026-10 | Keep fullscreen and diff hints; fullscreen introduction date remains unverified. | [Record](https://code.claude.com/docs/en/fullscreen) |
| claude-code-2026-11 | Keep the working-directory welcome and command hints; exact wording unverified. | [Record](https://code.claude.com/docs/en/fullscreen) |

### Cursor (14 versions)

Dense dark editor, 38px top bar, narrow generic activity rail, explorer, tab strip, numbered example code, integrated terminal and a separate assistant pane. Smaller multiline prompt and restrained borders distinguish it from a chat website.

| Edition | Treatment and preserved distinction | Source |
| --- | --- | --- |
| cursor-2023-03 | Keep the early two-pane editor; do not add the later activity rail. Exact CodeMirror geometry remains unverified. | [Record](https://cursor.com/changelog/0-1-12) |
| cursor-2023-04 | Explorer/editor/chat split, with generic file/search/source-control/settings glyphs. | [Record](https://cursor.com/changelog/0-2-0) |
| cursor-2023-10 | Same editor split; retain terminal command and context controls. | [Record](https://cursor.com/changelog/0-12-0) |
| cursor-2024-03 | Keep inline chat and the existing model slot. | [Record](https://cursor.com/changelog/0-29-x) |
| cursor-2024-07 | Keep optional code example and Apply action. | [Record](https://cursor.com/changelog/0-36-x) |
| cursor-2024-08 | Floating Composer and separate Chat remain distinct. Fix the invisible toggle by mounting it in the actual workspace Chat panel. | [Record](https://cursor.com/changelog/0-40-x) |
| cursor-2024-11 | Sidebar Composer with context controls; no floating Composer substitution. | [Record](https://cursor.com/changelog/0-43-x) |
| cursor-2025-02 | Agent prompt and mode menu stay in the sidebar. | [Record](https://cursor.com/changelog/0-46-x) |
| cursor-2025-03 | Keep chat tabs and Agent / Ask / Manual modes. | [Record](https://cursor.com/changelog/0-48-x) |
| cursor-2025-06 | Web task view keeps its different layout. | [Record](https://forum.cursor.com/t/introducing-cursor-on-web-mobile/111183) |
| cursor-2025-10 | Agent list, central conversation, optional file/browser region. | [Record](https://cursor.com/changelog/2-0) |
| cursor-2026-01-macos | Preserve layout switcher and keyboard model access. | [Record](https://cursor.com/changelog/2-3) |
| cursor-2026-04 | Preserve Agents Window and nested model panel. | [Record](https://cursor.com/blog/cursor-3) |
| cursor-2026-11 | Preserve voice/text/busy control switching; do not replace the voice control with a send-arrow pseudo-element. | [Record](https://cursor.com/changelog/voice-chat) |

### Codex (10 versions)

CLI stays a monospace terminal with release-specific startup and input shapes. Desktop editions use a light project rail, centered task column and white multiline composer. Example directory/session values are disclosed rather than repeated above the transcript.

| Edition | Treatment and preserved distinction | Source |
| --- | --- | --- |
| openai-codex-cli-2025-04 | Correct BOTH startup boxes to 64 cells, as specified in terminal-header.tsx; keep the character-framed input. Version uncertainty goes in Sources. | [Record](https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/chat/terminal-header.tsx) |
| openai-codex-cli-2025-06 | Keep the 0.2.0 plain startup, user/codex labels and full input frame. Provider/approval/safety uncertainty goes in Sources. | [Record](https://raw.githubusercontent.com/openai/codex/rust-v0.2.0/codex-rs/tui/src/history_cell.rs) |
| openai-codex-cli-2025-09 | Keep the 0.36 transcript markers and open prompt. | [Record](https://raw.githubusercontent.com/openai/codex/rust-v0.36.0/codex-rs/tui/src/history_cell.rs) |
| openai-codex-macos-2025-10 | Preserve compatibility for the unverified macOS record, move the unsupported-date caveat into Sources and hide the speculative inspector. This does not verify the record. | [Record](https://openai.com/index/introducing-the-codex-app/) |
| openai-codex-macos-2026-02 | CLI: bordered welcome and shaded prompt. macOS: project rail and centered task conversation. | [Record](https://openai.com/index/introducing-the-codex-app/) |
| openai-codex-cli-2026-02 | CLI: bordered welcome and shaded prompt. macOS: project rail and centered task conversation. | [Record](https://raw.githubusercontent.com/openai/codex/rust-v0.101.0/codex-rs/tui/src/history_cell.rs) |
| openai-codex-macos-2026-04 | Light app shell; retain inline/detached review control. | [Record](https://openai.com/index/introducing-the-codex-app/) |
| openai-codex-cli-2026-06 | CLI: retain the tag-specific welcome and command hints. | [Record](https://raw.githubusercontent.com/openai/codex/rust-v0.140.0/codex-rs/tui/src/history_cell/session.rs) |
| openai-codex-cli-2026-09 | CLI: retain the recorded 0.150 layout, without relabeling its release date. | [Record](https://raw.githubusercontent.com/openai/codex/rust-v0.150.0/codex-rs/tui/src/history_cell/session.rs) |
| openai-codex-cli-2026-11 | CLI: retain the short frameless 0.159 welcome. | [Record](https://raw.githubusercontent.com/openai/codex/rust-v0.159.0/codex-rs/tui/src/history_cell/session.rs) |

### Bard / Gemini (13 versions)

Cool sidebar, generous bounded reading column, pill-shaped composer and flat assistant replies. The modern empty state uses an ordinary blue greeting, with no product mark or brand gradient. Local rating controls stay below answers.

| Edition | Treatment and preserved distinction | Source |
| --- | --- | --- |
| google-bard-gemini-2023-03 | Keep reset/activity/help, the early warning, draft and search actions. | [Record](https://blog.google/innovation-and-ai/products/try-bard/) |
| google-bard-gemini-2023-07 | Keep pinned/recent headings, read-aloud and adjustment controls. | [Record](https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-july-2023/) |
| google-bard-gemini-2023-09 | Keep answer verification by request. | [Record](https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-sept-2023/) |
| google-bard-gemini-2023-12 | Keep Bard framing; do not add a permanent model badge. | [Record](https://blog.google/products-and-platforms/products/gemini/google-bard-try-gemini-ai/) |
| google-bard-gemini-2024-02 | Place own starter cards below the greeting; remove them after messages appear. Keep the top model slot. | [Record](https://blog.google/products-and-platforms/products/gemini/bard-gemini-advanced-app/) |
| google-bard-gemini-2024-05 | Keep device/Drive file controls near the rounded composer. | [Record](https://blog.google/products-and-platforms/products/gemini/google-gemini-update-may-2024/) |
| google-bard-gemini-2024-08 | Keep Gems entry; move the launch-date caveat into Sources. | [Record](https://blog.google/products-and-platforms/products/gemini/google-gemini-update-august-2024/) |
| google-bard-gemini-2024-09 | Keep the simplified start without a card grid. Exact experiment assignment unverified. | [Record](https://9to5google.com/2024/09/11/gemini-homepage-redesign/) |
| google-bard-gemini-2024-12 | Keep plan-before-report interaction and microphone control. | [Record](https://blog.google/products-and-platforms/products/gemini/google-gemini-deep-research/) |
| google-bard-gemini-2025-03 | Keep Canvas beside chat only after opening it. | [Record](https://blog.google/products-and-platforms/products/gemini/gemini-collaboration-features/) |
| google-bard-gemini-2025-06 | Keep creation controls inside Canvas, not a fixed audio player. | [Record](https://blog.google/products-and-platforms/products/gemini/gemini-app-updates-io-2025/) |
| google-bard-gemini-2025-12 | Keep the input-right model slot. | [Record](https://blog.google/products-and-platforms/products/gemini/gemini-3-flash-gemini-app/) |
| google-bard-gemini-2026-11 | Keep memory settings in the lower-left settings disclosure and model slot by the input. | [Record](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/) |

## Other owned renderers

Claude Desktop shares the warm desktop treatment. Gemini CLI moves its example-directory / sandbox caveat into Sources. OpenCode moves unsupported native-screen caveats into Sources. Copilot, Windsurf, Playground, Antigravity and DeepSeek receive the small Recreation label and disclosure handling; their product-specific geometry is retained. This pass does not claim a new detailed fidelity audit of these secondary families. All 14 have an individual media-free renderer test covering every spec edition.

## Verification

- Node syntax: all 14 assigned renderer modules pass `node --check` (exit 0, summary: `14 renderer modules: node --check passed.`).
- `node --test test/tools/D2.test.js`: 19 tests, 19 pass, 0 fail. Every spec version is rendered. Renderer output has no img/svg/canvas elements. With browser-style SVG support enabled, host stream decoration allows only explicitly enumerated generic line/circle/hexagon glyphs, with no path, image or use elements. Also covers 54 mounted model entries, local feedback, question edit/retry, live thinking→streaming→complete, the Cursor toggle and both 64-cell Codex startup boxes.
- `node --test test/era/terminal-renderers.test.js test/era/model-switch.test.js test/tools/D2.test.js test/i18n/E3.test.js`: final targeted run: 48 tests, 48 pass, 0 fail. Terminal inventory: 89 spec versions / 67 terminal surfaces; 49 slash-command editions; 12 restart editions.
- `node --test test/i18n/E3.test.js`: 8 pass, 0 fail; English inventory: 163 spec editions / 15 renderers.
- Full `npm test` ran three times while other workers edited the shared tree. Final result: **900 tests, 899 pass, 0 fail, 1 skipped; exit 0**. Earlier runs encountered transient failures in other workers' files (836 tests / 15 failures, then 860 tests / 14 failures).

## Shared-suite changes during verification

The earlier full-suite failures originated in persona catalog validation and related consumers (build/smoke, persona catalog/derive/play, browser persona cards), plus two E1 expectations for transition/menu wording. A read-only Persona.safeParse diagnostic at that time found two invalid persona files: `openai-chatgpt-3.5-20221130.json` (traits.self_description.note_en) and `openai-gpt-2.json` (traits.knowledge_cutoff.note_en). The then-current strict trait schema rejected the added note_en key. Those files/schema and E1 files are outside the allowed list and were not edited by D2. The final full-suite run passed after the shared tree changed.

Please review browser layout at narrow, split and full width, especially open artifact panes and long model names. Exact proprietary-font metrics, historical theme selection, early launch-day geometry, date-specific welcome wording and original stream timing remain **unverified**.
