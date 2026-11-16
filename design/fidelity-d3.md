# D3 fidelity work

Research fetch audit, 2026-11-16. Public text only; no assets or upstream implementation code stored. A successful fetch establishes availability, not pixel accuracy. Exact dimensions without direct evidence remain reconstruction choices. Failed URLs and date-specific gaps remain unverified.


## What changed and why

These are independent redraws using HTML, CSS, plain text names, and system font fallbacks. No screenshots, image files, fonts, logos, mascots, wordmarks, or upstream implementation blocks were added. The edition audit below covers all 126 records in the fifteen owned tools. It records two public references per edition (252 checks, 233 unique URLs): 248 HTTP 200 results and four HTTP 403 results. GitHub blob references were fetched through their equivalent raw text URLs. HTTP availability does not verify historical pixels.

| Renderer / editions covered | Change and rationale | Design evidence |
| --- | --- | --- |
| Aider / all 11 | Terminal editions keep scrollback, a file-prefixed prompt, small command hints, and compact startup text. Browser editions use a wider, spaced file sidebar, a single transcript column and a simple Streamlit-like input. Removed the inherited 300px empty transcript padding so the first task remains visible in the available frame. That padding adjustment is a viewport accommodation, not a historical measurement. | [Terminal I/O v0.59.0](https://github.com/Aider-AI/aider/blob/v0.59.0/aider/io.py), [browser v0.31.0](https://github.com/Aider-AI/aider/blob/v0.31.0/aider/gui.py), [browser documentation](https://aider.chat/docs/usage/browser.html) |
| Bing / all 12 | Compact centered tone controls, right-hand history, modest white answer cards and a constrained composer for early editions; horizontal text prompt cards for February 2024; two-column Notebook retained; rounder companion composer for later editions. No prompt artwork. Existing palette retained, with purple/blue/green tone-dependent chrome from the March release notes. The added purple/green HEX shades, radii and type measurements are unverified reconstruction choices. | [March tones](https://blogs.bing.com/search/2023/3/Bing-Preview-Release-Notes-Tone-Changes-and-More/), [May history](https://blogs.bing.com/search/2023/5/Bing-Preview-Release-Notes-Chat-History,-Charts,-Export,-and-more/), [February carousel](https://blogs.microsoft.com/blog/2024/02/07/delivering-copilot-for-everyone/), [October companion](https://blogs.microsoft.com/blog/2024/10/01/an-ai-companion-for-everyone/) |
| Cherry Studio / all 6 | Narrow text navigation rail, denser assistant list, separate topic/header bars, multiline composer and unboxed assistant replies. Preserved the existing sourced 55/245px early rail/list and 50/275px later rail/list values, optional topics and model controls. | [v0.5.0 home](https://github.com/CherryHQ/cherry-studio/blob/v0.5.0/src/renderer/src/pages/home/HomePage.tsx), [2025 home](https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/pages/home/HomePage.tsx) |
| Cline / all 9 | Compact VS Code task pane and code gutter, small task statistics, multiline input with attachment row, restrained Plan/Act segmented buttons, and compact marketplace search. Preserved the 2px input corner and edition-specific settings/marketplace locations. Empty tool catalogs and unknown usage stay honest. | [early ChatView](https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/components/ChatView.tsx), [v3.19.4 input](https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/ChatTextArea.tsx), [marketplace](https://github.com/cline/cline/blob/v3.4.0/webview-ui/src/components/mcp/McpMarketplaceView.tsx), [Plan/Act](https://docs.cline.bot/core-workflows/plan-and-act) |
| Continue / all 8 | Compact editor/panel proportions, line-number gutter, small footer controls, taller drafting space, and early step cards; later context/mode/model controls stay in their original edition slots. | [early step container](https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/components/StepContainer.tsx), [chat documentation](https://docs.continue.dev/ide-extensions/chat/basics) |
| GPT-2 / all 4 | Plain monospace prompt, no invented startup log, chat controls or assistant avatars. Preserved completed-sample reveal and the script's sample separators. Reference caveat moved into a new collapsed source disclosure because this renderer previously had only an inline reference. | [interactive script](https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py), [developer instructions](https://raw.githubusercontent.com/openai/gpt-2/master/DEVELOPERS.md) |
| Hermes Agent / all 11 | CLI gets monospace history, a simple bordered startup facts area and a prompt band; TUI keeps a distinct boxed section; desktop/web keep their sidebar and readable chat column. The startup artwork is omitted. Preserved the existing sourced skins and real display differences. | [CLI v2026.3.12](https://github.com/NousResearch/hermes-agent/blob/v2026.3.12/website/docs/user-guide/cli.md), [TUI v2026.5.29.2](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/website/docs/user-guide/tui.md), [desktop presets](https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/apps/desktop/src/themes/presets.ts) |
| HuggingChat / all 8 | Calmer gradient sidebar footer, introduction/model-card proportions, constrained composer and subtle rounded assistant frame. Model badge shows only the supplied selected model; routing uncertainty moved to its tooltip and common disclosure. The paused edition stays paused. | [early introduction](https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatIntroduction.svelte), [early messages](https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatMessage.svelte) |
| LM Studio / all 11 | Small text activity rail, restrained model/settings inspector, readable transcript and larger composer. Optional split views/settings retain their behavior. Unknown early and mobile layout notices now live in the disclosure; no mobile layout is invented. | [0.3.0 desktop redesign](https://lmstudio.ai/blog/lmstudio-v0.3.0), [0.4.0 panes](https://lmstudio.ai/blog/0.4.0) |
| n8n / all 7 | Dot-grid canvas, editor tab strip, small ports, selection outline, centered run controls, and a model subnode branching below the agent rather than a false third sequential output. The 2023 OpenAI node stays in the two-node path. The detail drawer and model settings still open from the node. | [NodeView 2023](https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/editor-ui/src/views/NodeView.vue), [node detail view](https://github.com/n8n-io/n8n/blob/n8n@1.28.0/packages/editor-ui/src/components/NodeDetailsView.vue), [agent/subnode docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/) |
| Ollama / all 6 | Early CLI is unboxed scrollback with the original prompt and no visible send button. Later chat has a quiet sidebar and wide rounded composer; thinking/search controls stay conditional on the supplied capability/settings. | [CLI v0.1.24](https://github.com/ollama/ollama/blob/v0.1.24/cmd/interactive.go), [app announcement](https://ollama.com/blog/new-app), [v0.16.0 composer](https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/ChatForm.tsx) |
| OpenClaw / all 9 | Denser control navigation, compact session header, drafting area with a lower action row, and a separate native-style menu edition. Kept warelay, control UI and native chat as distinct displays, with the existing model slots and command flows. | [control layout](https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/layout.css), [native menu](https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/apps/macos/Sources/OpenClaw/MenuContentView.swift) |
| Open WebUI / all 9 | Quiet searchable sidebar, central drafting space in the 2025 empty state, unboxed assistant replies and compact response action row from September 2024 onward. Copy uses the browser clipboard when available; thumbs open the host's rating panel; regenerate resends the actual preceding question. Earlier full-width message bands remain. | [v0.3.21 input](https://github.com/open-webui/open-webui/blob/v0.3.21/src/lib/components/chat/MessageInput.svelte), [response actions](https://github.com/open-webui/open-webui/blob/v0.3.21/src/lib/components/chat/Messages/ResponseMessage.svelte), [v0.6.0 placeholder](https://github.com/open-webui/open-webui/blob/v0.6.0/src/lib/components/chat/Placeholder.svelte) |
| Pi / all 8 | Monospace transcript, flat input band, small status line and settings hint. Preserved the earlier scrollback and later fullscreen defaults, reasoning border settings and model commands. No unmeasured token/cost values are invented. | [v0.12.0 light theme](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/src/theme/light.json), [interactive mode](https://github.com/earendil-works/pi/blob/v0.80.3/packages/coding-agent/src/modes/interactive/interactive-mode.ts) |
| Zed / all 7 | Denser editor tabs/gutter, role separators and monospace request buffer for early Assistant editions, compact review row and drafting area for Agent editions. Preserved 240px project pane and 640px assistant basis, and later parallel thread arrangement. | [conversation editor](https://zed.dev/blog/assistant), [Zed AI](https://zed.dev/blog/zed-ai), [agent panel 2025](https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/docs/src/ai/agent-panel.md) |

## Shared behavior and review limits

- Each surface has one small bilingual Recreation label. Existing reference/unverified notices move into the collapsed sources disclosure; operational unknowns such as unmeasured usage are retained where needed.
- The shared D3 finishing function lives in the owned Continue module. Other D3 renderers import it. This avoids changing the shared host or adding an unowned utility file. It preserves model markers and host message data.
- A renderer observer removes the host's decorative streaming header/footer, shows localized generating text while thinking, uses a simple text caret while streaming, and updates aria-busy. No fake speed, elapsed-time or routing badge is shown. GPT-2 retains completed samples instead of live typing.
- Every new pixel size, gap, proportion adjustment and corner choice is an unverified reconstruction measurement unless it was already sourced in the edition spec. New colors generally derive from the existing sourced palette tokens; Bing tone purple/green shades are explicitly marked unverified approximations of the documented color families. Original null fields remain null; this pass does not promote estimates into spec facts.
- This work does not add actual filesystem, workflow execution, uploading, voice, clipboard fallback or generation cancellation services. The host does not provide a stop callback in its current render context; existing unsupported Stop controls remain disabled. A reviewer would need to add that callback in the unowned app host to enable cancellation.
- No browser, native app, server, third-party runner or screenshot process was started. DOM tests do not establish visual/pixel accuracy. Reviewer browser inspection remains necessary at desktop and narrow widths.
- The four HTTP 403 results below are OpenAI article pages. Those article reads are unverified in this session; the public GPT-2 source script returned HTTP 200 and supplies the implemented prompt/sample behavior.

## Validation

- Syntax: Node --check was run for all fifteen owned renderers; all returned syntax OK.
- Existing terminal renderer tests: node --test test/era/terminal-renderers.test.js — 7 tests passed, 0 failed; inventory 89 versions / 67 terminal surfaces, 49 command editions and 12 restart editions.
- New D3 tests: node --test test/tools/D3.test.js — 20 tests passed, 0 failed. Includes a no-image/no-SVG test per renderer across 126 spec editions and simulated later host decoration; 126 era editions, 70 sourced model slots and 24 slash-command flows; n8n branching/settings, gutter/file selection, actual-question regeneration, GPT-2 empty input.
- Focused combined command: node --test test/era/terminal-renderers.test.js test/tools/D3.test.js test/i18n/E3.test.js test/i18n/E4.test.js — 42 tests passed, 0 failed.
- Full suite: npm test (also re-run through a Node wrapper to capture failures) — exit 1; 861 tests, 846 passed, 14 failed, 1 skipped. This shared working copy is being edited by other workers. Failures were in unowned files: persona catalog/build validation rejects traits.self_description.note_en (lib/persona/catalog.js:12 and downstream build/persona tests); E1 transition expected Conversation-first layout but received an empty caption; E1 menu expected Settings and records but the current menu contains updated wording. test/app/smoke.test.js exited 7. These are recorded for the reviewer; no unowned files were changed to address them.
- Review needed outside D3: align the persona schema with bilingual note_en data, investigate smoke startup, and reconcile E1 transition/menu expectations with the current implementation. Full-suite success is not claimed.
- Final npm test rerun after the D3 changes: exit 1; 897 tests, 882 passed, 14 failed, 1 skipped (12628 ms). The same 14 unowned failures remained; the count increased as other workers added tests.

## Edition source audit

| Tool / edition | Source fetched | HTTP |
| --- | --- | --- |
| aider / aider-2023-05 | [Reference](https://github.com/Aider-AI/aider/blob/v0.5.0/aider/io.py) | 200 |
| aider / aider-2023-05 | [Reference](https://github.com/Aider-AI/aider/releases/tag/v0.5.0) | 200 |
| aider / aider-2023-11 | [Reference](https://github.com/Aider-AI/aider/blob/v0.18.0/aider/io.py) | 200 |
| aider / aider-2023-11 | [Reference](https://github.com/Aider-AI/aider/releases/tag/v0.18.0) | 200 |
| aider / aider-2023-12 | [Reference](https://github.com/Aider-AI/aider/blob/v0.19.0/aider/coders/udiff_coder.py) | 200 |
| aider / aider-2023-12 | [Reference](https://github.com/Aider-AI/aider/releases/tag/v0.19.0) | 200 |
| aider / aider-2024-05 | [Reference](https://github.com/Aider-AI/aider/blob/v0.31.0/aider/gui.py) | 200 |
| aider / aider-2024-05 | [Reference](https://github.com/Aider-AI/aider/releases/tag/v0.31.0) | 200 |
| aider / aider-2024-06 | [Reference](https://github.com/Aider-AI/aider/blob/v0.39.0/aider/io.py) | 200 |
| aider / aider-2024-06 | [Reference](https://github.com/Aider-AI/aider/releases/tag/v0.39.0) | 200 |
| aider / aider-2024-10 | [Reference](https://github.com/Aider-AI/aider/blob/v0.59.0/aider/io.py) | 200 |
| aider / aider-2024-10 | [Reference](https://github.com/Aider-AI/aider/releases/tag/v0.59.0) | 200 |
| aider / aider-2025-01 | [Reference](https://github.com/Aider-AI/aider/blob/v0.72.0/aider/io.py) | 200 |
| aider / aider-2025-01 | [Reference](https://github.com/Aider-AI/aider/releases/tag/v0.72.0) | 200 |
| aider / aider-2025-04 | [Reference](https://github.com/Aider-AI/aider/blob/v0.82.0/aider/io.py) | 200 |
| aider / aider-2025-04 | [Reference](https://github.com/Aider-AI/aider/releases/tag/v0.82.0) | 200 |
| aider / aider-2025-09 | [Reference](https://github.com/Aider-AI/aider/blob/v0.86.0/aider/gui.py) | 200 |
| aider / aider-2025-09 | [Reference](https://github.com/Aider-AI/aider/releases/tag/v0.86.0) | 200 |
| aider / aider-2026-03 | [Reference](https://github.com/Aider-AI/aider/blob/v0.86.0/aider/io.py) | 200 |
| aider / aider-2026-03 | [Reference](https://github.com/Aider-AI/aider/releases/tag/v0.86.0) | 200 |
| aider / aider-2026-11 | [Reference](https://github.com/Aider-AI/aider/blob/v0.86.0/aider/io.py) | 200 |
| aider / aider-2026-11 | [Reference](https://github.com/Aider-AI/aider/releases/tag/v0.86.0) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2023-02 | [Reference](https://blogs.microsoft.com/blog/2023/02/07/reinventing-search-with-a-new-ai-powered-microsoft-bing-and-edge-your-copilot-for-the-web/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2023-02 | [Reference](https://news.microsoft.com/wp-content/uploads/prod/sites/652/2023/02/Experience-Guide.pdf) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2023-03 | [Reference](https://www.windowscentral.com/software-apps/bing-chat-can-now-switch-between-tones-at-the-switch-of-a-toggle) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2023-03 | [Reference](https://blogs.bing.com/search/2023/3/Bing-Preview-Release-Notes-Tone-Changes-and-More/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2023-05 | [Reference](https://blogs.microsoft.com/blog/2023/05/04/announcing-the-next-wave-of-ai-innovation-with-microsoft-bing-and-edge/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2023-05 | [Reference](https://blogs.bing.com/search/2023/5/Bing-Preview-Release-Notes-Chat-History,-Charts,-Export,-and-more/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2023-07 | [Reference](https://blogs.bing.com/search/2023/5/Bing-Preview-Release-Notes-Chat-History,-Charts,-Export,-and-more/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2023-07 | [Reference](https://blogs.bing.com/search/2023/7/Bing-Chat-Enterprise-announced,-multimodal-Visual-Search-rolling-out-to-Bing-Chat/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2023-11 | [Reference](https://blogs.bing.com/search/2023/11/our-vision-to-bring-microsoft-copilot-to-everyone-and-more/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2023-11 | [Reference](https://blogs.bing.com/search/2023/12/Microsoft-Copilot-is-now-generally-available/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2024-02 | [Reference](https://blogs.microsoft.com/blog/2024/02/07/delivering-copilot-for-everyone/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2024-02 | [Reference](https://www.sammobile.com/news/microsoft-launches-new-ui-copilot-android-ios-web/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2024-03 | [Reference](https://www.windowscentral.com/software-apps/microsoft-copilots-new-feature-can-finally-handle-complex-projects-and-supports-up-to-18000-characters-but-it-has-one-major-downside) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2024-03 | [Reference](https://blogs.microsoft.com/blog/2024/01/15/bringing-the-full-power-of-copilot-to-more-people-and-businesses/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2024-10 | [Reference](https://blogs.microsoft.com/blog/2024/10/01/an-ai-companion-for-everyone/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2024-10 | [Reference](https://www.theverge.com/2024/10/1/24259187/microsoft-copilot-redesign-vision-voice-features-inflection-ai) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2025-03-macos | [Reference](https://support.microsoft.com/en-us/microsoft-365-copilot/getting-started-with-copilot-on-macos) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2025-03-macos | [Reference](https://www.tomshardware.com/software/macos/copilot-gets-its-own-app-for-the-mac) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2025-04 | [Reference](https://blogs.microsoft.com/blog/2025/04/04/your-ai-companion/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2025-04 | [Reference](https://www.tomsguide.com/ai/microsoft-copilot-has-just-got-a-massive-ai-overhaul-heres-everything-new) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2026-03 | [Reference](https://support.microsoft.com/en-us/microsoft-365-copilot/conversation-modes-in-microsoft-copilot) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2026-03 | [Reference](https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-microsoft-365-copilot-pages) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2026-11 | [Reference](https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/) | 200 |
| bing-chat-microsoft-copilot / bing-chat-microsoft-copilot-2026-11 | [Reference](https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/what%E2%80%99s-new-in-microsoft-copilot--october-2026/4568528) | 200 |
| cherry-studio / cherry-studio-2024-06 | [Reference](https://raw.githubusercontent.com/CherryHQ/cherry-studio/f866387862f2f92bd4768d4611ded6fd90405313/src/renderer/src/pages/home/HomePage.tsx) | 200 |
| cherry-studio / cherry-studio-2024-06 | [Reference](https://raw.githubusercontent.com/CherryHQ/cherry-studio/f866387862f2f92bd4768d4611ded6fd90405313/src/renderer/src/pages/home/components/Chat.tsx) | 200 |
| cherry-studio / cherry-studio-2024-08 | [Reference](https://raw.githubusercontent.com/CherryHQ/cherry-studio/v0.5.0/src/renderer/src/assets/styles/index.scss) | 200 |
| cherry-studio / cherry-studio-2024-08 | [Reference](https://github.com/CherryHQ/cherry-studio/releases/tag/v0.5.0) | 200 |
| cherry-studio / cherry-studio-2025-01 | [Reference](https://raw.githubusercontent.com/CherryHQ/cherry-studio/446499287348c61e403d1ea0b253cfc46fc7e6c2/package.json) | 200 |
| cherry-studio / cherry-studio-2025-01 | [Reference](https://github.com/CherryHQ/cherry-studio/releases/tag/v0.9.17) | 200 |
| cherry-studio / cherry-studio-2025-06-macos | [Reference](https://raw.githubusercontent.com/CherryHQ/cherry-studio/8c9822cc713d52d79eb99f278bd331d04e269618/package.json) | 200 |
| cherry-studio / cherry-studio-2025-06-macos | [Reference](https://github.com/CherryHQ/cherry-studio/releases/tag/v1.4.0) | 200 |
| cherry-studio / cherry-studio-2026-03-macos | [Reference](https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/src/renderer/src/pages/home/HomePage.tsx) | 200 |
| cherry-studio / cherry-studio-2026-03-macos | [Reference](https://raw.githubusercontent.com/CherryHQ/cherry-studio/f0f04eeda03868ea75f8d5219baad8afec7a38e3/package.json) | 200 |
| cherry-studio / cherry-studio-2026-11-macos | [Reference](https://raw.githubusercontent.com/CherryHQ/cherry-studio/2292fdd739266df12518e4f706de1aa99f66015f/package.json) | 200 |
| cherry-studio / cherry-studio-2026-11-macos | [Reference](https://raw.githubusercontent.com/CherryHQ/cherry-studio/2292fdd739266df12518e4f706de1aa99f66015f/src/renderer/pages/home/HomePage.tsx) | 200 |
| cline-formerly-claude-dev / cline-2024-12 | [Reference](https://github.com/cline/cline/blob/v3.0.0/webview-ui/src/components/chat/ChatTextArea.tsx) | 200 |
| cline-formerly-claude-dev / cline-2024-12 | [Reference](https://github.com/cline/cline/blob/v3.0.0/webview-ui/src/components/chat/ChatRow.tsx) | 200 |
| cline-formerly-claude-dev / cline-2025-01 | [Reference](https://github.com/cline/cline/blob/v3.2.0/webview-ui/src/components/chat/ChatTextArea.tsx) | 200 |
| cline-formerly-claude-dev / cline-2025-01 | [Reference](https://github.com/cline/cline/blob/v3.2.0/webview-ui/src/components/chat/ChatView.tsx) | 200 |
| cline-formerly-claude-dev / cline-2025-07 | [Reference](https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/ChatRow.tsx) | 200 |
| cline-formerly-claude-dev / cline-2025-07 | [Reference](https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/ChatTextArea.tsx) | 200 |
| cline-formerly-claude-dev / cline-2025-11 | [Reference](https://github.com/cline/cline/blob/v3.36.0/webview-ui/src/components/chat/ChatTextArea.tsx) | 200 |
| cline-formerly-claude-dev / cline-2025-11 | [Reference](https://github.com/cline/cline/releases/tag/v3.36.0) | 200 |
| cline-formerly-claude-dev / cline-2026-04 | [Reference](https://github.com/cline/cline/blob/v3.78.0/webview-ui/src/components/chat/ChatTextArea.tsx) | 200 |
| cline-formerly-claude-dev / cline-2026-04 | [Reference](https://github.com/cline/cline/releases/tag/v3.78.0) | 200 |
| cline-formerly-claude-dev / cline-2026-11 | [Reference](https://github.com/cline/cline/blob/v4.1.26/apps/vscode/webview-ui/src/components/chat/ChatTextArea.tsx) | 200 |
| cline-formerly-claude-dev / cline-2026-11 | [Reference](https://github.com/cline/cline/releases/tag/v4.1.26) | 200 |
| cline-formerly-claude-dev / cline-formerly-claude-dev-2024-07 | [Reference](https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/components/ChatView.tsx) | 200 |
| cline-formerly-claude-dev / cline-formerly-claude-dev-2024-07 | [Reference](https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/components/ChatRow.tsx) | 200 |
| cline-formerly-claude-dev / cline-formerly-claude-dev-2024-10 | [Reference](https://github.com/cline/cline/blob/v2.0.0/webview-ui/src/components/chat/ChatTextArea.tsx) | 200 |
| cline-formerly-claude-dev / cline-formerly-claude-dev-2024-10 | [Reference](https://github.com/cline/cline/blob/v2.0.0/webview-ui/src/components/chat/ChatRow.tsx) | 200 |
| cline-formerly-claude-dev / cline-formerly-claude-dev-2025-02 | [Reference](https://github.com/cline/cline/blob/v3.4.0/webview-ui/src/components/mcp/McpView.tsx) | 200 |
| cline-formerly-claude-dev / cline-formerly-claude-dev-2025-02 | [Reference](https://github.com/cline/cline/releases/tag/v3.4.0) | 200 |
| continue / continue-2023-06 | [Reference](https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/components/StepContainer.tsx) | 200 |
| continue / continue-2023-06 | [Reference](https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/tabs/gui.tsx) | 200 |
| continue / continue-2024-05 | [Reference](https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/pages/gui.tsx) | 200 |
| continue / continue-2024-05 | [Reference](https://github.com/continuedev/continue/releases/tag/v0.9.132-vscode) | 200 |
| continue / continue-2024-11 | [Reference](https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/pages/gui/Chat.tsx) | 200 |
| continue / continue-2024-11 | [Reference](https://web.archive.org/web/20241112175452id_/https://docs.continue.dev/) | 200 |
| continue / continue-2025-02 | [Reference](https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/components/mainInput/InputToolbar.tsx) | 200 |
| continue / continue-2025-02 | [Reference](https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/pages/gui/Chat.tsx) | 200 |
| continue / continue-2025-10 | [Reference](https://raw.githubusercontent.com/continuedev/continue/v1.3.19-vscode/gui/src/components/ModeSelect/ModeSelect.tsx) | 200 |
| continue / continue-2025-10 | [Reference](https://github.com/continuedev/continue/releases/tag/v1.3.19-vscode) | 200 |
| continue / continue-2026-05 | [Reference](https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/components/mainInput/InputToolbar.tsx) | 200 |
| continue / continue-2026-05 | [Reference](https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/components/ModeSelect/ModeSelect.tsx) | 200 |
| continue / continue-2026-06 | [Reference](https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/components/mainInput/InputToolbar.tsx) | 200 |
| continue / continue-2026-06 | [Reference](https://github.com/continuedev/continue/releases/tag/v2.0.0-vscode) | 200 |
| continue / continue-2026-11 | [Reference](https://raw.githubusercontent.com/continuedev/continue/5522c6f44ca0ac3528b37244818fbfa39b5af470/README.md) | 200 |
| continue / continue-2026-11 | [Reference](https://github.com/continuedev/continue/releases/tag/v2.0.0-vscode) | 200 |
| openai-gpt-2-interactive / openai-gpt-2-2019-02 | [Reference](https://openai.com/index/better-language-models/) | 403 |
| openai-gpt-2-interactive / openai-gpt-2-2019-02 | [Reference](https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py) | 200 |
| openai-gpt-2-interactive / openai-gpt-2-2019-05 | [Reference](https://openai.com/index/gpt-2-6-month-follow-up/) | 403 |
| openai-gpt-2-interactive / openai-gpt-2-2019-05 | [Reference](https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py) | 200 |
| openai-gpt-2-interactive / openai-gpt-2-2019-08 | [Reference](https://openai.com/index/gpt-2-6-month-follow-up/) | 403 |
| openai-gpt-2-interactive / openai-gpt-2-2019-08 | [Reference](https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py) | 200 |
| openai-gpt-2-interactive / openai-gpt-2-2019-11 | [Reference](https://raw.githubusercontent.com/openai/gpt-2/master/src/interactive_conditional_samples.py) | 200 |
| openai-gpt-2-interactive / openai-gpt-2-2019-11 | [Reference](https://openai.com/index/gpt-2-1-5b-release/) | 403 |
| hermes-agent / hermes-agent-2026-05 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/website/docs/user-guide/tui.md) | 200 |
| hermes-agent / hermes-agent-2026-05 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/ui-tui/src/theme.ts) | 200 |
| hermes-agent / hermes-agent-2026-06 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/website/docs/user-guide/desktop.md) | 200 |
| hermes-agent / hermes-agent-2026-06 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/apps/desktop/src/themes/presets.ts) | 200 |
| hermes-agent / hermes-agent-2026-11 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/apps/desktop/src/app/contrib/layout-presets.ts) | 200 |
| hermes-agent / hermes-agent-2026-11 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/website/docs/user-guide/desktop.md) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-03-0 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.3.12/website/docs/user-guide/cli.md) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-03-0 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.3.12/hermes_cli/skin_engine.py) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-05-1 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/hermes_cli/skin_engine.py) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-05-1 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/website/docs/user-guide/cli.md) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-06-2 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/website/docs/user-guide/cli.md) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-06-2 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/hermes_cli/skin_engine.py) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-07-3 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.7.30/website/docs/user-guide/cli.md) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-07-3 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.7.30/hermes_cli/skin_engine.py) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-08-4 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.8.31/website/docs/user-guide/cli.md) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-08-4 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.8.31/hermes_cli/skin_engine.py) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-09-5 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.9.24/website/docs/user-guide/cli.md) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-09-5 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v2026.9.24/hermes_cli/skin_engine.py) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-10-6 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v0.22.5/hermes_cli/skin_engine.py) | 200 |
| hermes-agent / nousresearch--hermes-agent-2026-10-6 | [Reference](https://github.com/NousResearch/hermes-agent/blob/v0.22.5/website/docs/user-guide/cli.md) | 200 |
| hermes-agent / nousresearch--hermes-agent-record | [Reference](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/website/docs/user-guide/cli.md) | 200 |
| hermes-agent / nousresearch--hermes-agent-record | [Reference](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/hermes_cli/skin_engine.py) | 200 |
| huggingchat / huggingchat-2023-04 | [Reference](https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/NavMenu.svelte) | 200 |
| huggingchat / huggingchat-2023-04 | [Reference](https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatIntroduction.svelte) | 200 |
| huggingchat / huggingchat-2023-08 | [Reference](https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/chat/ChatWindow.svelte) | 200 |
| huggingchat / huggingchat-2023-08 | [Reference](https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/WebSearchToggle.svelte) | 200 |
| huggingchat / huggingchat-2024-02 | [Reference](https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/lib/components/NavMenu.svelte) | 200 |
| huggingchat / huggingchat-2024-02 | [Reference](https://huggingface.co/spaces/huggingchat/chat-ui/discussions/357?expand=true) | 200 |
| huggingchat / huggingchat-2024-09 | [Reference](https://github.com/huggingface/chat-ui/blob/bb38bf54d76f2862955754045c66dc73213e50a5/src/lib/components/NavMenu.svelte) | 200 |
| huggingchat / huggingchat-2024-09 | [Reference](https://huggingface.co/blog/community-tools) | 200 |
| huggingchat / huggingchat-2025-07 | [Reference](https://huggingface.co/spaces/huggingchat/chat-ui/discussions/764) | 200 |
| huggingchat / huggingchat-2025-07 | [Reference](https://huggingface.co/spaces/huggingchat/chat-ui/discussions/747?expand=true) | 200 |
| huggingchat / huggingchat-2025-10 | [Reference](https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/NavMenu.svelte) | 200 |
| huggingchat / huggingchat-2025-10 | [Reference](https://huggingface.co/spaces/huggingchat/chat-ui/discussions/764) | 200 |
| huggingchat / huggingchat-2026-04 | [Reference](https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/src/lib/components/NavMenu.svelte) | 200 |
| huggingchat / huggingchat-2026-04 | [Reference](https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/src/lib/components/chat/ChatWindow.svelte) | 200 |
| huggingchat / huggingchat-2026-11 | [Reference](https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/NavMenu.svelte) | 200 |
| huggingchat / huggingchat-2026-11 | [Reference](https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/chat/ChatWindow.svelte) | 200 |
| lm-studio / lm-studio-2023-05 | [Reference](https://lmstudio.ai/blog/free-for-work) | 200 |
| lm-studio / lm-studio-2023-05 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.0) | 200 |
| lm-studio / lm-studio-2023-11 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.0) | 200 |
| lm-studio / lm-studio-2023-11 | [Reference](https://github.com/lahoramaker/awesome-lmstudio/wiki/Troubleshooting-most-common-problems) | 200 |
| lm-studio / lm-studio-2024-04 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.0) | 200 |
| lm-studio / lm-studio-2024-04 | [Reference](https://github.com/lahoramaker/awesome-lmstudio/wiki/Troubleshooting-most-common-problems) | 200 |
| lm-studio / lm-studio-2024-08 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.0) | 200 |
| lm-studio / lm-studio-2024-08 | [Reference](https://lmstudio.ai/docs/app/user-interface/themes) | 200 |
| lm-studio / lm-studio-2025-01 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.8) | 200 |
| lm-studio / lm-studio-2025-01 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.6) | 200 |
| lm-studio / lm-studio-2025-02 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.8) | 200 |
| lm-studio / lm-studio-2025-02 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.10) | 200 |
| lm-studio / lm-studio-2025-06 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.6) | 200 |
| lm-studio / lm-studio-2025-06 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.17) | 200 |
| lm-studio / lm-studio-2025-10 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.30) | 200 |
| lm-studio / lm-studio-2025-10 | [Reference](https://lmstudio.ai/blog/lmstudio-v0.3.17) | 200 |
| lm-studio / lm-studio-2026-02 | [Reference](https://lmstudio.ai/docs/app/basics/chat) | 200 |
| lm-studio / lm-studio-2026-02 | [Reference](https://lmstudio.ai/blog/0.4.0) | 200 |
| lm-studio / lm-studio-2026-11 | [Reference](https://lmstudio.ai/docs/bionic) | 200 |
| lm-studio / lm-studio-2026-11 | [Reference](https://lmstudio.ai/docs/bionic/projects-and-sessions) | 200 |
| lm-studio / lm-studio-lmlink-mobile-2026-06-04 | [Reference](https://lmstudio.ai/blog/locally-lm-link) | 200 |
| lm-studio / lm-studio-lmlink-mobile-2026-06-04 | [Reference](https://lmstudio.ai/blog/0.4.0) | 200 |
| n8n / n8n-2023-10 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/cli/package.json) | 200 |
| n8n / n8n-2023-10 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/editor-ui/src/views/NodeView.vue) | 200 |
| n8n / n8n-2024-02 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/2b9391a9758041f09c2e948eab942c45a9919aad/packages/editor-ui/src/components/NodeDetailsView.vue) | 200 |
| n8n / n8n-2024-02 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/2b9391a9758041f09c2e948eab942c45a9919aad/packages/cli/package.json) | 200 |
| n8n / n8n-2024-09 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/ee7147c6b3b053ac8fc317319ab257204e599f16/packages/editor-ui/src/views/NodeView.vue) | 200 |
| n8n / n8n-2024-09 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/ee7147c6b3b053ac8fc317319ab257204e599f16/packages/cli/package.json) | 200 |
| n8n / n8n-2025 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/da8aafc0e3a1b5d862f0723d0d53d2c38bcaebc3/packages/cli/package.json) | 200 |
| n8n / n8n-2025 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/da8aafc0e3a1b5d862f0723d0d53d2c38bcaebc3/packages/editor-ui/src/views/NodeView.vue) | 200 |
| n8n / n8n-2025-08 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/cli/package.json) | 200 |
| n8n / n8n-2025-08 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/604b936d8f69d450116b4d255a365bf448d359ae/packages/frontend/editor-ui/src/views/NodeView.vue) | 200 |
| n8n / n8n-2026-04 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/e4fc7539674730212cfbb325c36d38f83b2f77ee/packages/frontend/editor-ui/src/app/views/NodeView.vue) | 200 |
| n8n / n8n-2026-04 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/e4fc7539674730212cfbb325c36d38f83b2f77ee/packages/cli/package.json) | 200 |
| n8n / n8n-2026-11 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/28f60cebe5d5303e13867c2afe15d44b35b9e9d7/packages/cli/package.json) | 200 |
| n8n / n8n-2026-11 | [Reference](https://raw.githubusercontent.com/n8n-io/n8n/28f60cebe5d5303e13867c2afe15d44b35b9e9d7/packages/frontend/editor-ui/src/app/views/NodeView.vue) | 200 |
| ollama / ollama-2023-07 | [Reference](https://github.com/ollama/ollama/blob/e7a393de5405e7c12e4ca59493cb4c6037fe3b57/cmd/cmd.go) | 200 |
| ollama / ollama-2023-07 | [Reference](https://ollama.com/blog/run-llama2-uncensored-locally) | 200 |
| ollama / ollama-2024-02 | [Reference](https://github.com/ollama/ollama/blob/v0.1.24/cmd/interactive.go) | 200 |
| ollama / ollama-2024-02 | [Reference](https://ollama.com/blog/openai-compatibility) | 200 |
| ollama / ollama-2024-09-macos | [Reference](https://github.com/ollama/ollama/blob/v0.3.12/macapp/src/index.ts) | 200 |
| ollama / ollama-2024-09-macos | [Reference](https://ollama.com/blog/llama3.2) | 200 |
| ollama / ollama-2025-07-macos | [Reference](https://www.windowscentral.com/artificial-intelligence/ollamas-new-app-makes-using-local-ai-llms-on-your-windows-11-pc-a-breeze-no-more-need-to-chat-in-the-terminal) | 200 |
| ollama / ollama-2025-07-macos | [Reference](https://ollama.com/blog/new-app) | 200 |
| ollama / ollama-2026-03-macos | [Reference](https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/Chat.tsx) | 200 |
| ollama / ollama-2026-03-macos | [Reference](https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/ChatForm.tsx) | 200 |
| ollama / ollama-2026-11-macos | [Reference](https://github.com/ollama/ollama/blob/main/app/ui/app/src/components/Chat.tsx) | 200 |
| ollama / ollama-2026-11-macos | [Reference](https://github.com/ollama/ollama/blob/main/app/ui/app/src/components/AppSidebar.tsx) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-2026-03-macos | [Reference](https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/platforms/mac/menu-bar.md) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-2026-03-macos | [Reference](https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/apps/macos/Sources/OpenClaw/MenuContentView.swift) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-2026-06 | [Reference](https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/ui/src/styles/base.css) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-2026-06 | [Reference](https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/docs/web/control-ui.md) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-2026-09 | [Reference](https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/docs/web/control-ui.md) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-2026-09 | [Reference](https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/ui/src/styles/base.css) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-2026-11 | [Reference](https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/ui/src/styles/base.css) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-2026-11 | [Reference](https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/docs/web/control-ui.md) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-clawdbot-2026-01 | [Reference](https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/docs/control-ui.md) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-clawdbot-2026-01 | [Reference](https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/ui/src/styles/base.css) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-formerly-clawdbot-moltbot-2025-11 | [Reference](https://github.com/openclaw/openclaw/blob/v0.1.1/README.md) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-formerly-clawdbot-moltbot-2025-11 | [Reference](https://github.com/openclaw/openclaw/releases/tag/v0.1.1) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-formerly-clawdbot-moltbot-2026-01 | [Reference](https://github.com/openclaw/openclaw/blob/v2026.1.30/docs/web/control-ui.md) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-formerly-clawdbot-moltbot-2026-01 | [Reference](https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/base.css) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-formerly-clawdbot-moltbot-2026-08 | [Reference](https://github.com/openclaw/openclaw/blob/v2026.8.1/ui/src/styles/base.css) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-formerly-clawdbot-moltbot-2026-08 | [Reference](https://github.com/openclaw/openclaw/blob/v2026.8.1/docs/web/control-ui.md) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-moltbot-2026-01 | [Reference](https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/docs/web/control-ui.md) | 200 |
| openclaw-formerly-clawdbot-moltbot / openclaw-moltbot-2026-01 | [Reference](https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/ui/src/styles/base.css) | 200 |
| open-webui / open-webui-2023-10 | [Reference](https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/src/routes/+page.svelte) | 200 |
| open-webui / open-webui-2023-10 | [Reference](https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/src/lib/components/layout/Navbar.svelte) | 200 |
| open-webui / open-webui-2024-02 | [Reference](https://github.com/open-webui/open-webui/blob/v0.1.102/tailwind.config.js) | 200 |
| open-webui / open-webui-2024-02 | [Reference](https://github.com/open-webui/open-webui/blob/v0.1.102/src/lib/components/layout/Sidebar.svelte) | 200 |
| open-webui / open-webui-2024-09 | [Reference](https://github.com/open-webui/open-webui/blob/v0.3.21/CHANGELOG.md) | 200 |
| open-webui / open-webui-2024-09 | [Reference](https://github.com/open-webui/open-webui/blob/v0.3.21/src/lib/components/layout/Sidebar.svelte) | 200 |
| open-webui / open-webui-2025-04 | [Reference](https://github.com/open-webui/open-webui/blob/v0.6.0/src/lib/components/layout/Sidebar.svelte) | 200 |
| open-webui / open-webui-2025-04 | [Reference](https://github.com/open-webui/open-webui/releases/tag/v0.6.0) | 200 |
| open-webui / open-webui-2025-09 | [Reference](https://github.com/open-webui/open-webui/blob/v0.6.29/CHANGELOG.md) | 200 |
| open-webui / open-webui-2025-09 | [Reference](https://github.com/open-webui/open-webui/releases/tag/v0.6.29) | 200 |
| open-webui / open-webui-2025-11 | [Reference](https://github.com/open-webui/open-webui/blob/v0.6.35/src/lib/components/chat/MessageInput.svelte) | 200 |
| open-webui / open-webui-2025-11 | [Reference](https://github.com/open-webui/open-webui/blob/v0.6.35/CHANGELOG.md) | 200 |
| open-webui / open-webui-2026-07 | [Reference](https://github.com/open-webui/open-webui/blob/v0.11.0/src/lib/components/layout/Sidebar.svelte) | 200 |
| open-webui / open-webui-2026-07 | [Reference](https://github.com/open-webui/open-webui/releases/tag/v0.11.0) | 200 |
| open-webui / open-webui-2026-10 | [Reference](https://github.com/open-webui/open-webui/blob/v0.12.0/src/lib/components/chat/MessageInput.svelte) | 200 |
| open-webui / open-webui-2026-10 | [Reference](https://github.com/open-webui/open-webui/releases/tag/v0.12.0) | 200 |
| open-webui / open-webui-2026-11 | [Reference](https://github.com/open-webui/open-webui/blob/v0.13.0/src/lib/components/chat/Navbar.svelte) | 200 |
| open-webui / open-webui-2026-11 | [Reference](https://github.com/open-webui/open-webui/releases/tag/v0.13.0) | 200 |
| pi-coding-agent / earendil-works--pi-2025-12-0 | [Reference](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/README.md) | 200 |
| pi-coding-agent / earendil-works--pi-2025-12-0 | [Reference](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/src/tui/tool-execution.ts) | 200 |
| pi-coding-agent / earendil-works--pi-2026-06-1 | [Reference](https://github.com/earendil-works/pi/blob/v0.80.3/packages/coding-agent/docs/settings.md) | 200 |
| pi-coding-agent / earendil-works--pi-2026-06-1 | [Reference](https://github.com/earendil-works/pi/blob/v0.80.3/packages/coding-agent/README.md) | 200 |
| pi-coding-agent / earendil-works--pi-2026-07-2 | [Reference](https://github.com/earendil-works/pi/blob/v0.83.0/packages/coding-agent/README.md) | 200 |
| pi-coding-agent / earendil-works--pi-2026-07-2 | [Reference](https://github.com/earendil-works/pi/blob/v0.83.0/packages/coding-agent/docs/settings.md) | 200 |
| pi-coding-agent / earendil-works--pi-2026-08-3 | [Reference](https://github.com/earendil-works/pi/blob/v0.84.4/packages/coding-agent/docs/settings.md) | 200 |
| pi-coding-agent / earendil-works--pi-2026-08-3 | [Reference](https://github.com/earendil-works/pi/blob/v0.84.4/packages/coding-agent/README.md) | 200 |
| pi-coding-agent / earendil-works--pi-2026-09-4 | [Reference](https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/docs/settings.md) | 200 |
| pi-coding-agent / earendil-works--pi-2026-09-4 | [Reference](https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/docs/usage.md) | 200 |
| pi-coding-agent / earendil-works--pi-2026-10-5 | [Reference](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/usage.md) | 200 |
| pi-coding-agent / earendil-works--pi-2026-10-5 | [Reference](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/settings.md) | 200 |
| pi-coding-agent / earendil-works--pi-2026-10-6 | [Reference](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/usage.md) | 200 |
| pi-coding-agent / earendil-works--pi-2026-10-6 | [Reference](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/settings.md) | 200 |
| pi-coding-agent / earendil-works--pi-record | [Reference](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/docs/usage.md) | 200 |
| pi-coding-agent / earendil-works--pi-record | [Reference](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/docs/settings.md) | 200 |
| zed / zed-2024-05-macos | [Reference](https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/assets/settings/default.json) | 200 |
| zed / zed-2024-05-macos | [Reference](https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/docs/src/assistant-panel.md) | 200 |
| zed / zed-2024-08-macos | [Reference](https://raw.githubusercontent.com/zed-industries/zed/a3672d96d4a8f776f32ffb6d830130d54d418bf4/docs/src/assistant/assistant-panel.md) | 200 |
| zed / zed-2024-08-macos | [Reference](https://zed.dev/blog/zed-ai) | 200 |
| zed / zed-2025-04-macos | [Reference](https://github.com/zed-industries/zed/discussions/24028) | 200 |
| zed / zed-2025-04-macos | [Reference](https://web.archive.org/web/20250331193917id_/https://zed.dev/ai/agent) | 200 |
| zed / zed-2025-05 | [Reference](https://zed.dev/blog/fastest-ai-code-editor) | 200 |
| zed / zed-2025-05 | [Reference](https://zed.dev/ai) | 200 |
| zed / zed-2025-09-macos | [Reference](https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/docs/src/ai/agent-panel.md) | 200 |
| zed / zed-2025-09-macos | [Reference](https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/docs/src/ai/external-agents.md) | 200 |
| zed / zed-2026-04 | [Reference](https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/docs/src/ai/parallel-agents.md) | 200 |
| zed / zed-2026-04 | [Reference](https://zed.dev/blog/parallel-agents) | 200 |
| zed / zed-2026-11-macos | [Reference](https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/docs/src/ai/parallel-agents.md) | 200 |
| zed / zed-2026-11-macos | [Reference](https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/docs/src/ai/agent-panel.md) | 200 |
