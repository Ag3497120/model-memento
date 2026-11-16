# H1: three hero exhibits

Audit date: 2026-11-16. Changes are restricted to the three renderers,
`web/css/design-d1.css`, this audit and `test/tools/hero.test.js`.
`web/css/design-d2.css` did not need a change. Original product strings stay
English, including on a Japanese museum page. Museum explanations use `tr()`.
No images, screenshots, fonts, logos, wordmarks or product artwork are stored in
the project. Public screenshots were read as evidence only. All CSS and box
construction are new work; no third-party implementation was copied.

## Evidence and limits

| ID | Public source | What was actually checked |
| --- | --- | --- |
| G1 | [December 2022 clinical study, first submitted version](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf) | Search-index extraction of its original home-screen capture: all three headings and nine items; dark rail, centered title and bottom input. Direct PDF fetch returned 403. Not evidence of the exact November 30 build. |
| G2 | [The Art of ChatGPT Prompting, page 4](https://assets-v3.circle.so/q4k86qipr2f9s4nzzz40ykc2og4d) | Public PDF and indexed home-screen description: title, three columns, nine items and December 15 footer. A screenshot request succeeded, but the tool returned no inspectable image pixels. Not used for pixel measurements. |
| G3 | [OpenAI release notes, December 15, 2022 entry](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) | Explicitly instructs users to look for the December 15 version label at the bottom. |
| G4 | [Cornell spring 2023 lecture slides](https://www.cs.cornell.edu/courses/cs4756/2023sp/assets/slides_notes/lec1_slides.pdf) | Indexed screenshot description confirms the earlier research-preview footer wording and the nine items. Direct fetch exceeded the web tool's size limit. |
| G5 | [Interface Lineage: ChatGPT Conversation Thread](https://interfacelineage.com/chatgpt-chat-completions-ui) | Description and attribution of a December 5, 2022 light-theme capture: alternating full-width turns, avatars and bottom composer. Secondary account, not a source for exact CSS measurements. |
| G6 | [OpenAI launch post](https://openai.com/index/chatgpt/) | November 30 launch date and free research-preview status; not a capture of the launch empty state. |
| G7 | [Light-theme early ChatGPT capture in ACC presentation](https://www.acc.com/sites/default/files/program-materials/upload/Charlotte%20ACC%20May%2011%202023-Artificial%20Intelligence%20Tools%20and%20Thoughtful%20Implementation%20and%20Use%28145669977.1%29-C.pdf) | Indexed capture confirms `+ New chat`, the light main canvas and gray cards. Its footer says February 13, so it only corroborates the visual pattern, not a 2022 default. |
| G8 | [OpenAI community Discord link](https://community.openai.com/t/where-can-i-talk-to-a-human/308622/9) | July 2023 user post supplies the Discord target. Its presence as the exact November 2022 invite target is unverified. |
| C1 | [Anthropic: Claude 2](https://www.anthropic.com/news/claude-2) | July 11, 2023 publication date. The current page extraction does not establish original UI layout. |
| C2 | [Kristi Hines's first-hand July 2023 report](https://www.searchenginejournal.com/anthropic-launches-claude-2-with-100k-context-windows-file-uploads/491412/) | Explicit July 2023 captions and links to actual home and conversation captures. |
| C3 | [July home capture](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-public-beta-website-anthropic-meet-claude-64ada1d33013f-sej.png) | Visually inspected in memory: warm canvas, greeting, composer, paperclip, purple action and three stacked suggestions. The pictured Anthropic wordmark is omitted. |
| C4 | [July conversation capture](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-2-100k-pdf-analysis-public-beta-website-chat-64ada2e345f13-sej.png) | Visually inspected in memory: right beige user bubble, white assistant card, sans-serif answer, Copy/Retry, bottom composer and purple send action. No conversation content is copied. |
| T1 | [Official repository issue 1601, June 4, 2025](https://github.com/anthropics/claude-code/issues/1601) | User's literal 1.0.9/1.0.11 output: rounded welcome panel, help/status line, cwd, three tips, rounded `>` input and shortcut hint. Exact May launch-day appearance remains unverified. |
| T2 | [Official repository issue 2097](https://github.com/anthropics/claude-code/issues/2097) | 1.0.27 output corroborates welcome wording, panel and cwd. |
| T3 | [Official repository issue 4514, July 26, 2025](https://github.com/anthropics/claude-code/issues/4514) | 1.0.61 output corroborates the panel and three numbered tips, including `/init` as tip 1. This is later than the edition's existing July 1 reference date. |
| T4 | [Anthropic's published color facts](https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md) | Orange accent value `#d97757`. Read as a source of facts, not invoked as a project skill. Does not prove exact 1.0 terminal RGB values. |
| T5 | [Official repository issue 1243, May 22, 2025](https://github.com/anthropics/claude-code/issues/1243) | `Model • /model` and `Default` in 1.0.1 status output. Existing May model-switch data and behavior retained. |
| T6 | [Official repository issue 2806, July 1, 2025](https://github.com/anthropics/claude-code/issues/2806) | Existing July `/model` and Sonnet option evidence, retained without adding candidates. |

## ChatGPT: November and December 2022

Both editions now render a dedicated empty state instead of the generic modern
page. The following are short functional labels/items, not copied explanatory
paragraphs. Each row identifies its evidence.

| Change / exact visible string | Source | Status |
| --- | --- | --- |
| Large centered plain-text `ChatGPT`; remove the later greeting and museum's three introductory headings | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf), [G2](https://assets-v3.circle.so/q4k86qipr2f9s4nzzz40ykc2og4d) | Early-era pattern confirmed; exact November 30 empty state unverified |
| `Examples` / `Capabilities` / `Limitations` | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf) | Confirmed in indexed capture |
| `Explain quantum computing in simple terms` | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf) | Confirmed; clickable English request |
| `Got any creative ideas for a 10 year old’s birthday?` | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf) | Confirmed; clickable English request |
| `How do I make an HTTP request in Javascript?` | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf) | Confirmed; clickable English request |
| `Remembers what user said earlier in the conversation` | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf) | Confirmed as historical UI text, not a new capability guarantee |
| `Allows user to provide follow-up corrections` | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf) | Confirmed as historical UI text |
| `Trained to decline inappropriate requests` | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf) | Confirmed as historical UI text |
| `May occasionally generate incorrect information` | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf) | Confirmed |
| `May occasionally produce harmful instructions or biased content` | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf) | Confirmed |
| `Limited knowledge of world and events after 2021` | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf) | Confirmed as historical UI text |
| Dark left rail with working `+ New chat`; plain-text `OpenAI Discord` and `Updates & FAQ` links below | [G1](https://www.medrxiv.org/content/10.1101/2022.12.16.22283512v1.full.pdf), [G7](https://www.acc.com/sites/default/files/program-materials/upload/Charlotte%20ACC%20May%2011%202023-Artificial%20Intelligence%20Tools%20and%20Thoughtful%20Implementation%20and%20Use%28145669977.1%29-C.pdf), [G8](https://community.openai.com/t/where-can-i-talk-to-a-human/308622/9) | Labels confirmed across early captures; G1 uses `New Thread`. Exact launch-day menu and Discord target unverified. FAQ uses current official release notes. No invented history or account state. |
| Bottom rectangular composer, send arrow, full-width conversation bands | [G5](https://interfacelineage.com/chatgpt-chat-completions-ui) | Pattern confirmed; arrow is a generic glyph |
| November footer: `Free Research Preview: ChatGPT is optimized for dialogue.` | [G4](https://www.cs.cornell.edu/courses/cs4756/2023sp/assets/slides_notes/lec1_slides.pdf) | Confirmed early wording in index; November 30 exact punctuation/version label unverified |
| December footer: `ChatGPT Dec 15 Version. Free Research Preview.` | [G3](https://help.openai.com/en/articles/6825453-chatgpt-release-notes), [G2](https://assets-v3.circle.so/q4k86qipr2f9s4nzzz40ykc2og4d) | Version label confirmed; does not represent every day of December |

Visual changes: white main canvas, light gray cards and assistant bands, dark
rail, compact rectangular input, centered three-column group and generic
sun/bolt/warning symbols. The geometry follows [G2](https://assets-v3.circle.so/q4k86qipr2f9s4nzzz40ykc2og4d)
and the light conversation pattern follows [G5](https://interfacelineage.com/chatgpt-chat-completions-ui).
Light is the requested presentation; its status as the launch-day default is
**unverified**. Chosen values (`#ffffff`, `#f7f7f8`, `#343541`, `#202123`), 260px
rail, 36px title, spacing, card sizes, font fallback and radii are reconstruction
choices, not measured historical facts. Exact historical values are **unverified**.
Both avatar positions use neutral blank squares; no OpenAI mark is drawn.

The November record date remains in the bilingual sources disclosure. No
`ChatGPT Nov 30 Version` label is invented. Long footer paragraphs are omitted.
The existing English i18n test still clicks two museum-authored questions; these
remain only in the collapsed disclosure, explicitly labeled as museum questions
and excluded from the historical Examples section. The generic shared header is
absent on these editions. Existing edit/rating/retry behavior remains available.

## Claude.ai: July 2023

| Change / exact visible string | Source | Status |
| --- | --- | --- |
| Replace generic hero/avatar and modern greeting with `Meet Claude` | [C3](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-public-beta-website-anthropic-meet-claude-64ada1d33013f-sej.png) | Visually confirmed; ordinary system font, no wordmark |
| Home placeholder `Message Claude or search past chats...` | [C3](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-public-beta-website-anthropic-meet-claude-64ada1d33013f-sej.png) | Confirmed; past-chat search is a display example, not implemented |
| Purple pill action `Start a new chat` and generic paperclip | [C3](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-public-beta-website-anthropic-meet-claude-64ada1d33013f-sej.png) | Confirmed; send uses existing composer. Paperclip opens existing museum Tools; no upload claim. |
| `Try these` | [C3](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-public-beta-website-anthropic-meet-claude-64ada1d33013f-sej.png) | Confirmed |
| `Summarize this PDF document in a bullet point outline` | [C3](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-public-beta-website-anthropic-meet-claude-64ada1d33013f-sej.png) | Confirmed; sends the request without pretending a file is attached |
| `Help me practice my Spanish vocab` | [C3](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-public-beta-website-anthropic-meet-claude-64ada1d33013f-sej.png) | Confirmed; sends the request |
| `Explain how this python game works` | [C3](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-public-beta-website-anthropic-meet-claude-64ada1d33013f-sej.png) | Confirmed; sends the request without inventing an attached game |
| During conversation, `Message Claude...` and arrow send action; hide home suggestions | [C4](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-2-100k-pdf-analysis-public-beta-website-chat-64ada2e345f13-sej.png) | Confirmed distinction; shared thread observer changes wording |
| `Copy` / `Retry` under white assistant card | [C4](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-2-100k-pdf-analysis-public-beta-website-chat-64ada2e345f13-sej.png) | Confirmed; Copy uses existing clipboard path; Retry resends that answer's preceding user request |

Visual changes from [C3](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-public-beta-website-anthropic-meet-claude-64ada1d33013f-sej.png)
and [C4](https://cdn.searchenginejournal.com/wp-content/uploads/2023/07/claude-2-100k-pdf-analysis-public-beta-website-chat-64ada2e345f13-sej.png):
warm canvas, wide white pill composer beneath the greeting, beige stacked
suggestions, beige user bubbles on the right, rounded white assistant cards and
sans-serif answer text. The generic header, rail, avatar and serif answer styling
are removed for July only. Original wordmark and avatar artwork are omitted.
Existing feedback controls remain. Conversation titles and account initials are
not fabricated. Chosen `#efede7`, `#dfdace`, `#5546a2`, 760px maximum composer,
54px greeting, radii, shadows and spacing approximate the captures; exact tokens,
fonts, July 11 pixels and responsive breakpoints are **unverified**.

## Claude Code: May and July 2025

| Change / exact visible string | Source | Status |
| --- | --- | --- |
| Replace filler with `Welcome to Claude Code!` inside a rounded box-drawing panel | [T1](https://github.com/anthropics/claude-code/issues/1601), [T2](https://github.com/anthropics/claude-code/issues/2097) | Literal output confirmed. The preceding starburst is deliberately omitted, with nothing substituted. |
| `/help for help, /status for your current setup` | [T1](https://github.com/anthropics/claude-code/issues/1601) | Confirmed |
| `cwd:` line | [T1](https://github.com/anthropics/claude-code/issues/1601) | Label confirmed; `~/project` is a sanitized example, not a historical or actual working directory |
| `Tips for getting started:` with an ordered list | [T1](https://github.com/anthropics/claude-code/issues/1601), [T3](https://github.com/anthropics/claude-code/issues/4514) | Confirmed |
| May tip 1: `Ask Claude to create a new app or clone a repository` | [T1](https://github.com/anthropics/claude-code/issues/1601) | Confirmed in June 1.0 output; exact May wording **unverified** |
| July tip 1: `Run /init to create a CLAUDE.md file with instructions for Claude` | [T3](https://github.com/anthropics/claude-code/issues/4514) | Confirmed July 26; July 1 wording **unverified** |
| Tip 2: `Use Claude to help with file analysis, editing, bash commands and git` | [T1](https://github.com/anthropics/claude-code/issues/1601), [T3](https://github.com/anthropics/claude-code/issues/4514) | Confirmed short functional instruction |
| Tip 3: `Be as specific as you would with another engineer for the best results` | [T1](https://github.com/anthropics/claude-code/issues/1601), [T3](https://github.com/anthropics/claude-code/issues/4514) | Confirmed short functional instruction |
| Rounded input box containing `>`; `? for shortcuts` directly below | [T1](https://github.com/anthropics/claude-code/issues/1601) | Confirmed; Enter still submits and intercepts `/model` |
| Orange accent `#d97757` | [T4](https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md) | Published color fact; exact historical terminal value/application **unverified** |
| Keep inline numbered `/model` options | [T5](https://github.com/anthropics/claude-code/issues/1243), [T6](https://github.com/anthropics/claude-code/issues/2806) | Existing sourced May `Default` / July `Sonnet` options retained; no invented candidates |

The panel has aligned Unicode borders; its interior is 51 character cells, with
monospace fallback and horizontal overflow on narrow screens. The prompt uses a
CSS rounded outline around the live textarea. Both are original reconstruction
code. Transcript/tips/input flow from the top instead of stretching an empty
thread above the prompt. No fake tool transcript or dashboard is prefilled.
The shortcut hint stays left; the existing museum selected-model context stays
right with a museum-specific accessible label. The send button is hidden visually
in these terminal editions; Enter remains functional. Panel color application,
dark canvas, border gray, prompt radius, typography and spacing are approximate.

Bilingual reference text, sanitized-path explanation and existing `/agents` date
uncertainty are kept in the collapsed sources disclosure. Its legacy `.boot`
reference block remains compatible with the existing terminal provenance test;
the visible welcome has its own class. The old visible filler strings are removed.

## Shared behavior and validation

Recreation labels and closed sources disclosures remain in all five editions.
Existing model-switch integration is retained: the three early web editions have
no sourced model picker, and both Code editions still mount `/model` in their
terminal flow. Sources added above are also linked in the renderer disclosures.
Scoped H1 CSS affects these editions only. Narrow-screen wrapping and scrollbar
behavior are museum accommodations; historical breakpoints are **unverified**.

`test/tools/hero.test.js` adds six offline tests: all five editions' English
strings, absence of the later ChatGPT greeting, working example requests,
composer submission, aligned welcome borders, no welcome brand glyph, sources
and Recreation labels, inline numbered `/model` selection, and Claude's
conversation placeholder/retry behavior. The fixture does not measure layout.

Validation actually run:

| Command | Real result |
| --- | --- |
| `node --test test/tools/hero.test.js` | Exit 0; 6 tests, 6 pass, 0 fail, 0 skipped |
| `node --test test/tools/hero.test.js test/tools/D2.test.js test/era/terminal-renderers.test.js` | Exit 0; 32 tests, 32 pass, 0 fail |
| `node --test test/tools/hero.test.js test/i18n/E3.test.js` | Exit 0; 14 tests, 14 pass, 0 fail |
| Final `npm test` | Exit 0; 916 tests, 915 pass, 0 fail, 1 skipped; reported duration 20224.816 ms |

Earlier focused runs exposed a fixture's inability to select numbered heading
tags and a provenance-note newline mismatch; both were corrected in owned files.
The first full run had 915 tests, 913 pass, 1 fail and 1 skipped: the existing E3
test required the museum's former question buttons. Retaining those explicitly
museum-authored controls in the disclosure fixed it without changing that test
or the historical empty state. Test counts changed while other workers were
active; the table records each observed run, not a claimed fixed inventory.

No browser, app, server, agent or harness was manually launched for visual QA.
The authorized Node test suite runs its own test fixtures. First-glance fidelity,
wrapping and contrast in the reviewer's actual browser remain **unverified**.

Reviewer follow-ups: inspect the five editions in the browser; if exact November
30 UI or May 22 / July 1 terminal captures are available, reconcile the documented
date gaps. Historical source JSON lives outside this worker's file ownership and
was not edited; it still contains the earlier, more conservative evidence notes.
