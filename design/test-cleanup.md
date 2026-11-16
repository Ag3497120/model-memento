# Test cleanup after record-quality changes

## Expectation corrections (2026-11-16)

- `test/cross/stereo.test.js` and `test/i18n/E2.test.js`: change the expected Claude Opus 4.6 release date from 2026-02-04 to 2026-02-05. Anthropic's [announcement](https://www.anthropic.com/news/claude-opus-4-6) is dated February 5 and says the model is available that day. The changed answer is supported by this primary source.
- `eval/cross/english.json`, `en38`: change the expected personality answer back to unknown. The exact `claude-opus-5-5` persona now wins over the provider-prefixed match and has no recorded tone. It is safer to abstain than to attach a different record's trait. Its unverified tone remains unverified; this is not an independent audit of either persona's other claims. The fixture contains the correction history.
- `test/persona/derive.test.js`: `gpt-3.5-turbo` and `gpt-4o` now have exact researched records; expecting family heuristics for those IDs was obsolete. Other assertions still exercise family heuristics, confidence, inheritance and unknown cutoff.

## Other changes

- First-pass S1/S2 cases for replaced renderers were removed; T01–T10 cover the ten assigned rewrites. Bolt's S2 cases remain and now check its current source container and workbench state.
- The era English check now escapes filenames before creating file URLs. All Japanese official/researched persona values inspected by that test already have English siblings. The NextChat English trend entries now translate the Japanese text and retain exactly the same source URLs.
- The catalog check covers both researched and inherited records, validates each populated trait's source, confidence, basis and note, and checks inherited path links. Multiple source links may document the same path edge. Records without a known trait remain unknown rather than receiving invented content.

## Concurrent renderer changes

- Bolt's and Tabnine's source containers changed; the existing evidence checks still require links. Bolt's workbench now opens through its started state. S4 now checks the applicable model slot from the era record instead of assuming an input-right slot on every terminal screen. Smolagents' sidebar expects Shift+Enter, so S5 checks that shortcut and that plain Enter does not send. Updated DeepSeek and Cody era records document selectors with source links; S5 now checks the recorded slots, sources, and whether each selector mounts.
- During this cleanup, the Tabnine completion example was replaced with a static example and the CC Switch provider selection with an add-provider dialog. The pre-existing tests for accepting a completion and selecting a provider have been retained. Restoring those behaviors requires changes in `web/js/tools/codota--tabnine.js` and `web/js/tools/farion1231--cc-switch.js`, outside this task's assigned files, unless the reviewer determines that removing these interactions was an intentional product change.
