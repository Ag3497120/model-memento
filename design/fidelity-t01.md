# U07: Sourcegraph Cody VS Code panel

The six catalog dates are represented using their named release tags. The
renderer is a reconstruction, with a small example editor and an adjustable
panel width; neither is a measurement from the historical product. The
original art, icons, logos and fonts are omitted. Labeled text substitutes for
icon-only controls; inactive controls are disabled. Enter and Send use the
museum's message handler; New Chat uses its reset handler. The 2023 recipe buttons are disabled because the reconstruction has no selected editor code.

* July 2023: [Chat.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v0.4.3/vscode/webviews/Chat.tsx), [shared Chat.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v0.4.3/lib/ui/src/Chat.tsx), and [NavBar.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v0.4.3/vscode/webviews/NavBar.tsx) supply the greeting, Getting Started, three recipes and Chat/Recipes tabs.
* March 2025: [Chat.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v1.80.1/vscode/webviews/Chat.tsx), [WelcomeMessage.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v1.80.1/vscode/webviews/chat/components/WelcomeMessage.tsx) and [TabsBar.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v1.80.1/vscode/webviews/tabs/TabsBar.tsx) supply welcome, prompts and tabs. The actual welcome items are dynamic; the representation shows the source's loading state, not fabricated suggestions.
* April 2025: [TabsBar.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v1.86.1/vscode/webviews/tabs/TabsBar.tsx) separates New Chat and Open in Editor. [Chat.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v1.86.1/vscode/webviews/Chat.tsx) still includes the welcome component.
* May 2025: [TabsBar.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v1.98.0/vscode/webviews/tabs/TabsBar.tsx) no longer contains the Prompts tab; [Chat.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v1.98.0/vscode/webviews/Chat.tsx) still renders the welcome component.
* June and July 2025: [June Chat.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v1.106.2/vscode/webviews/Chat.tsx) and [July Chat.tsx](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v1.116.0/vscode/webviews/Chat.tsx) no longer render WelcomeMessage; the blank conversation area remains above the input.

Each 2025 tag's `HumanMessageCell.tsx` provides the first-message placeholder;
its `Toolbar.tsx`, `ModeSelectorButton.tsx`, `SubmitButton.tsx`, and
`ModelSelectField.tsx` specify the composer controls and model location. The
spec links to the individual tag's files. [The March input CSS](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v1.80.1/vscode/webviews/chat/cells/messageCell/human/editor/HumanMessageEditor.module.css)
sets a 4px radius. Sourcegraph's [index CSS](https://github.com/sourcegraph/cody-public-snapshot/blob/vscode-v1.80.1/vscode/webviews/index.css)
uses editor theme variables, so a single universal Cody palette does not exist.
The 2025 color approximation uses [VS Code 1.98 Dark Modern](https://github.com/microsoft/vscode/blob/1.98.0/extensions/theme-defaults/themes/dark_modern.json).
Exact 2023 colors, all panel widths, prompt items, model choices, and account-
dependent defaults are unverified. The modern palette is also only a visual
approximation for 2023. No claim is made that a loading prompt list stays visible
indefinitely in the actual application.

Evidence examples: [first layout widths](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/packages/client/ui-layout/src/client/columns.ts),
[first composer width](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.7/packages/client/ui-conversation/src/client/skeleton/ConversationRoot.module.css),
[second composer width](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.2-alpha.3/packages/client/ui-conversation/src/client/skeleton/ConversationRoot.module.css),
[September composer](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/client/ui-conversation/src/client/skeleton/InputBar.module.css),
[September English labels](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/client/ui-conversation/src/client/locales.ts),
[system theme preference](https://github.com/deepseek-ai/deepseek-harness/blob/39163dd30f703a79079e2d2446545cff3c453738/packages/client/ui-theme/src/theme-settings.ts).
The sender's blue is an approximation based on a published static color token;
its assignment to the original send control is unverified.

Validation: `node --test test/tools/U08.test.js` passed one test with no
failures or skips; `node --check web/js/tools/deepseek-ai--deepseek-harness.js`
exited 0 with no output. The test uses the project's offline DOM fixture and
does not verify visual layout in a browser.
