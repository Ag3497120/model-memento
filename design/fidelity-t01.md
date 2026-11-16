# V11: MaxKB source audit

This exhibit is incomplete and should be reviewed before registration. It uses the
chat surface for a configured application, not the administration screens. The
application title is user-configurable; “MaxKB” is an exhibit example, not a
claimed default app name. No product imagery or fonts are included.

The 19 catalog labels map directly to the tags or commit named in each
`design/specs/1panel-dev--maxkb.json` entry. For every ref the desktop chat,
chat component, English locale (except 0.9), theme variables, and application
setting source returned HTTP 200; for v2 the history panel did as well. This
checks file availability, not the equivalence of every detail at every date.
The GitHub API tree request was rate-limited (HTTP 403); tag paths were found
through GitHub's HTML tree and the files read directly.

* [v0.9.0 chat](https://github.com/1Panel-dev/MaxKB/blob/v0.9.0/ui/src/views/chat/index.vue) and [theme](https://github.com/1Panel-dev/MaxKB/blob/v0.9.0/ui/src/styles/variables.scss) show the centered 860px area and 56px gradient header. [Composer source](https://github.com/1Panel-dev/MaxKB/blob/v0.9.0/ui/src/components/ai-chat/index.vue) uses `请输入`. No English locale directory was found at this ref; the source uses Chinese. The prologue is configured per app, so no welcome text is invented.
* The v1.10 LTS tags show a full-width gradient header, 280px history rail, and question area: [v1.10.8 desktop](https://github.com/1Panel-dev/MaxKB/blob/v1.10.8-lts/ui/src/views/chat/pc/index.vue), [English chat locale](https://github.com/1Panel-dev/MaxKB/blob/v1.10.8-lts/ui/src/locales/lang/en-US/ai-chat.ts).
* The v2 tags show a history panel beside the chat, with a clear-history action: [v2.0 desktop](https://github.com/1Panel-dev/MaxKB/blob/v2.0.0/ui/src/views/chat/pc/index.vue), [history panel](https://github.com/1Panel-dev/MaxKB/blob/v2.0.0/ui/src/views/chat/component/HistoryPanel.vue), [English locale](https://github.com/1Panel-dev/MaxKB/blob/v2.0.0/ui/src/locales/lang/en-US/ai-chat.ts). The clear action is disabled in this exhibit because clearing MaxKB's history is not implemented.
* The later [v2.8.1 desktop source](https://github.com/1Panel-dev/MaxKB/blob/v2.8.1/ui/src/views/chat/pc/index.vue) includes conditional sharing and PDF export for existing conversations. These later controls are **not yet represented** in the renderer. Dates of introduction between catalog tags are unverified.
* Model selection is in the administrator's application settings: [v0.9 settings](https://github.com/1Panel-dev/MaxKB/blob/v0.9.0/ui/src/views/application/CreateAndSetting.vue), [v2 settings](https://github.com/1Panel-dev/MaxKB/blob/v2.0.0/ui/src/views/application/ApplicationSetting.vue). A slot is retained in the museum sources disclosure; a product model selector is not invented in the user chat.

The task's requirement to assert six product-specific strings in the main view
for every version is **not met**. The focused test checks the actual empty-state
strings and placeholder. In v0.9 the source makes the prologue configurable and
response controls conditional on an existing response. Showing six fixed labels
on the empty screen would require inventing a state. A follow-up can implement
and test sourced populated conversation states without misrepresenting the empty
state. The current renderer also omits upload, voice, response actions, history
management, sharing, and export. Thus it is a source-backed starting point, not
an adequately complete exhibit.

Exact composer geometry, responsive behavior, configured backgrounds, default
application name, release date/tag correspondence, and first-glance fidelity are
unverified. Colors and layout beyond cited values are approximations. No browser,
server, app, build, or full test suite was started.

Validation run: `node --check web/js/tools/1panel-dev--maxkb.js` exited 0;
`node --test test/tools/V11.test.js` exited 0 with 20 tests, 20 passed, 0 failed.

## V12: RAGFlow versioned chat

The catalog has 19 named tags; the per-version spec and era records link to the
actual file at each tag. The exhibit chooses the legacy `/chat` route through
v0.19.1 and the `next-chats` detail route from v0.20.4. The routes coexist in
some releases, so this is an exhibit route choice, not a claim that one route
was removed when the other appeared. A selected chat is represented without
inventing an assistant name, model, chat history, or assistant greeting.

* v0.1.0: the [legacy chat](https://github.com/infiniflow/ragflow/blob/v0.1.0/web/src/pages/chat/index.tsx), [widths](https://github.com/infiniflow/ragflow/blob/v0.1.0/web/src/pages/chat/index.less), [composer](https://github.com/infiniflow/ragflow/blob/v0.1.0/web/src/pages/chat/chat-container/index.tsx), and [English locale](https://github.com/infiniflow/ragflow/blob/v0.1.0/web/src/locales/en.ts) supply the 288px assistant list, 220px conversation list, Create an Assistant, New chat, Send, and the Resume Assistant placeholder. Model selection is in [chat configuration](https://github.com/infiniflow/ragflow/blob/v0.1.0/web/src/pages/chat/chat-configuration-modal/model-setting.tsx).
* v0.17.2, v0.18.0, v0.19.0 and v0.19.1: the same source-backed legacy regions retain the `Message the assistant...` composer; the header includes Search, Agent, and File Management. See the [v0.17.2 chat](https://github.com/infiniflow/ragflow/blob/v0.17.2/web/src/pages/chat/index.tsx), [header](https://github.com/infiniflow/ragflow/blob/v0.17.2/web/src/layouts/components/header/index.tsx), and [locale](https://github.com/infiniflow/ragflow/blob/v0.17.2/web/src/locales/en.ts). The corresponding tag-specific links are in each version's JSON.
* v0.20.4: the selected [redesigned chat](https://github.com/infiniflow/ragflow/blob/v0.20.4/web/src/pages/next-chats/chat/index.tsx) uses a [296px Conversations rail](https://github.com/infiniflow/ragflow/blob/v0.20.4/web/src/pages/next-chats/chat/sessions.tsx), message area, and optional 440px [Chat setting](https://github.com/infiniflow/ragflow/blob/v0.20.4/web/src/pages/next-chats/chat/app-settings/chat-settings.tsx) model field. The [composer](https://github.com/infiniflow/ragflow/blob/v0.20.4/web/src/components/message-input/next.tsx) provides attachment and send controls. The untranslated Multiple Models key in this tag is not presented as a verified English label.
* v0.20.5: the same redesigned layout adds the sourced `Multiple Models` English label and localized `Type your message here...` placeholder. [Locale](https://github.com/infiniflow/ragflow/blob/v0.20.5/web/src/locales/en.ts), [input](https://github.com/infiniflow/ragflow/blob/v0.20.5/web/src/components/message-input/next.tsx).
* v0.21.1 and v0.22.1: retain that layout and label, with the configured dark default in [v0.21.1 app.tsx](https://github.com/infiniflow/ragflow/blob/v0.21.1/web/src/app.tsx). Saved user preference can override the default.
* v0.23.1 and v0.24.0: the English label becomes `Multiple models`, and File Management becomes `File`; see the [v0.23.1 locale](https://github.com/infiniflow/ragflow/blob/v0.23.1/web/src/locales/en.ts). v0.24.0 adds the more compact session spacing represented here; [sessions](https://github.com/infiniflow/ragflow/blob/v0.24.0/web/src/pages/next-chats/chat/sessions.tsx).
* v0.25.1, v0.25.6, v0.26.2 and v0.26.4: the compact dark chat and collapsible setting area continue. See [v0.25.1 chat](https://github.com/infiniflow/ragflow/blob/v0.25.1/web/src/pages/next-chats/chat/index.tsx), [sessions](https://github.com/infiniflow/ragflow/blob/v0.25.1/web/src/pages/next-chats/chat/sessions.tsx), and [settings](https://github.com/infiniflow/ragflow/blob/v0.25.1/web/src/pages/next-chats/chat/app-settings/chat-settings.tsx).
* v0.27.1, v1.0.0-rc1, v1.0.0-rc3 and v1.0.0: the same compact screen adds a `Web search` example from the conditional [input control](https://github.com/infiniflow/ragflow/blob/v0.27.1/web/src/components/message-input/next.tsx) and [locale](https://github.com/infiniflow/ragflow/blob/v0.27.1/web/src/locales/en.ts); it is disabled here because the exhibit has no actual web-search backend.

The [v0.20.4 color tokens](https://github.com/infiniflow/ragflow/blob/v0.20.4/web/tailwind.css) and [v0.23.1 color tokens](https://github.com/infiniflow/ragflow/blob/v0.23.1/web/tailwind.css) provide the light and dark base, text, muted, border and teal accent values. The spec records each tag's token file. Applying these tokens to individual reconstructed controls, early Ant Design colors, exact historical empty states, model choices, selected-chat data, and narrow-screen behavior remain unverified. The 2024 theme default is also unverified. The legacy settings disclosure and modern right-hand settings panel are accommodations for the museum's model control rather than full settings implementations. Attachment, Multiple models and Web search are disabled examples; New chat and sending use the existing museum handlers.

Validation actually run: `node --test test/tools/V12.test.js` exited 0 with 3 tests, 3 passed, 0 failed, 0 skipped. `node --check web/js/tools/infiniflow--ragflow.js` exited 0 with no output. The test uses an offline DOM fixture; no browser, app, server, or visual test was run. A first focused test run had one failure because the fixture's `querySelector` excludes the root; changing the assertion to `classList.contains` resolved it.

Reviewer follow-up: inspect each era in a browser and compare the selected-chat view and exact token application to the cited tagged sources. Registration is intentionally outside the owned files and still needs the two index lines specified in the handoff.
