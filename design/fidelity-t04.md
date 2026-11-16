# T04: Chatbox evidence and limits

This is a rights-clean reconstruction written for Model Memento. It uses no
upstream artwork, icons, font files or copied implementation. Text controls
stand in for the original icons. The exhibit does not simulate image creation,
attachments, provider configuration or the full original application.

The source for each catalog entry is recorded separately in the spec and era
JSON. The first entry uses the last commit returned by GitHub's main-branch
history before 2023-03-08 UTC, `e8c8ad2b4383daba6296f65ceaf1ebad3c454057`;
this is a UTC cutoff, not proof of the exact build used on March 7 in every
local timezone. The other entries use the tag named in the catalog, or its
recorded commit. A tag is not proof that every screen or default was unchanged
throughout the period. In particular, [v1.20.3's release page](https://github.com/chatboxai/chatbox/releases/tag/v1.20.3)
contains an April 29 heading and a May 31 release timestamp; the catalog date
alone does not resolve which milestone the viewer intends.

| Editions | Evidence and reconstructed screen |
| --- | --- |
| 2023-03 | [App source](https://github.com/chatboxai/chatbox/blob/e8c8ad2b4383daba6296f65ceaf1ebad3c454057/src/devtools/App.tsx) gives a one-quarter gray sidebar, CHAT, New Chat, Settings, a white main region and Prompt/Send. [Defaults](https://github.com/chatboxai/chatbox/blob/e8c8ad2b4383daba6296f65ceaf1ebad3c454057/src/devtools/defaults.ts) provide the five shown session names. No English locale directory exists in that snapshot. The original defaults include messages; this exhibit deliberately leaves the conversation empty. |
| 2023-05 through 2023-08 | The linked `src/App.tsx` files use a 210px sidebar with Chat, New Chat, Settings and About. The input is Prompt with a send control and shortcut hint; August moves it into `src/components/InputBox.tsx`. The English locale supplies the translated labels. The model control is in Settings, documented in the era JSON. |
| 2024-09 through 2025-01 | Tagged `src/renderer/Sidebar.tsx` specifies 240px and includes New Chat, My Copilots, Settings and About. `InputBox.tsx` specifies the question placeholder, a 66px minimum textarea and conversation settings control. The provider/model settings source is linked in the era JSON. |
| 2025-09 | Sidebar has New Chat, New Images and My Copilots; `InputBox.tsx` places the model selector, attachments, web browsing and settings with the input. |
| 2025-10 and 2025-11 | Sidebar source keeps New Chat and My Copilots, but does not include the image button. The input source is now in the `InputBox/` directory. |
| 2026-02 through 2026-09 and the recorded 2026-11 commit | The sidebar contains New Chat, Create Image and My Copilots; the composer contains a model selector. From v1.18.1 the sidebar source also includes resizing. For the last entry, the English locale has moved into `packages/chatbox-i18n`. |

The 2026-09 default theme tokens are in [theme-colors.ts](https://github.com/chatboxai/chatbox/blob/v1.23.5/src/shared/theme-colors.ts):
light white, `#f3f3f3`, `#dee2e6`, blue `#228be6`; dark `#242424`,
`#3b3b3b`, `#424242`, blue `#228be6`. The March source explicitly uses
white and `#f7f7f7`. For other releases, null in the spec means the precise
value was not established from the inspected source. Approximate light colors,
spacing, responsive behavior, borders, header titles, icon-to-text substitutions
and the consistently empty conversation are reconstruction choices, not
claims that those were exact original pixels or states. Theme selection follows
the user's system in some releases, so light was not necessarily the default
appearance on every machine. Exact settings-panel appearance and complete model
lists are unverified; model choices are intentionally empty in era data.
The 2023-03 model selection location is unverified.

The source-matched model controls mount through the shared era component. For
settings-based editions its museum control is inside the collapsed disclosure;
for later editions it mounts beside the input. These controls do not reproduce
provider setup. Source content and per-version component existence were checked
with public HTTP fetches; the GitHub API was rate limited, so the tag references
were read directly. No app, server, browser, full test suite or build was run.
Browser rendering, narrow layouts and visual fidelity remain unverified.

Validation: `node --check web/js/tools/chatboxai--chatbox.js` exited 0;
`node --test test/tools/T04.test.js` exited 0: 2 tests, 2 pass, 0 fail.
The test uses a small DOM fixture and cannot establish visual fidelity.
