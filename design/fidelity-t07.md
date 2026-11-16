# T07: Goose source audit

The catalog's release tags are used for the nine dated releases; the final
record uses its catalog commit. The inspected desktop files are linked per
edition in the spec and era JSON. The repository has since moved from
`block/goose` to `aaif-goose/goose`; the latter URLs resolve for these refs.

| Edition | Source and screen represented |
| --- | --- |
| 2024-09, v0.9.0 | [Prompt implementation](https://github.com/aaif-goose/goose/blob/v0.9.0/src/goose/cli/prompt/goose_prompt_session.py), [session](https://github.com/aaif-goose/goose/blob/v0.9.0/src/goose/cli/session.py), [README](https://github.com/aaif-goose/goose/blob/v0.9.0/README.md): terminal invocation and cyan `G❯` input. |
| 2026-03, v1.29.0 | [Hub](https://github.com/aaif-goose/goose/blob/v1.29.0/ui/desktop/src/components/Hub.tsx), [statistics](https://github.com/aaif-goose/goose/blob/v1.29.0/ui/desktop/src/components/sessions/SessionsInsights.tsx), [navigation](https://github.com/aaif-goose/goose/blob/v1.29.0/ui/desktop/src/hooks/useNavigationItems.ts): Home/Chat navigation, greeting, two statistic cards, recent chats, bottom composer. |
| 2026-04, v1.33.1 | [Hub](https://github.com/aaif-goose/goose/blob/v1.33.1/ui/desktop/src/components/Hub.tsx), [statistics](https://github.com/aaif-goose/goose/blob/v1.33.1/ui/desktop/src/components/sessions/SessionsInsights.tsx), [navigation](https://github.com/aaif-goose/goose/blob/v1.33.1/ui/desktop/src/hooks/useNavigationItems.ts): same dashboard family, with Skills in navigation. |
| 2026-05, v1.36.0 | [Hub](https://github.com/aaif-goose/goose/blob/v1.36.0/ui/desktop/src/components/Hub.tsx), [navigation](https://github.com/aaif-goose/goose/blob/v1.36.0/ui/desktop/src/hooks/useNavigationItems.ts), [input card](https://github.com/aaif-goose/goose/blob/v1.36.0/ui/desktop/src/components/ChatInputCard.tsx): clock and time-sensitive greeting over a centered composer; a bordered sidebar with New Chat and session history. |
| 2026-06, v1.39.0 | [Hub](https://github.com/aaif-goose/goose/blob/v1.39.0/ui/desktop/src/components/Hub.tsx), [navigation](https://github.com/aaif-goose/goose/blob/v1.39.0/ui/desktop/src/hooks/useNavigationItems.ts): clock, greeting, centered composer and sidebar. |
| 2026-07, v1.45.0 | [Hub](https://github.com/aaif-goose/goose/blob/v1.45.0/ui/desktop/src/components/Hub.tsx), [navigation](https://github.com/aaif-goose/goose/blob/v1.45.0/ui/desktop/src/hooks/useNavigationItems.ts): same represented home structure. |
| 2026-08, v1.48.0 | [Hub](https://github.com/aaif-goose/goose/blob/v1.48.0/ui/desktop/src/components/Hub.tsx), [navigation](https://github.com/aaif-goose/goose/blob/v1.48.0/ui/desktop/src/hooks/useNavigationItems.ts): same represented home structure. |
| 2026-09, v1.52.0 | [Hub](https://github.com/aaif-goose/goose/blob/v1.52.0/ui/desktop/src/components/Hub.tsx), [navigation](https://github.com/aaif-goose/goose/blob/v1.52.0/ui/desktop/src/hooks/useNavigationItems.ts): same represented home structure. |
| 2026-10, v1.57.0 | [Hub](https://github.com/aaif-goose/goose/blob/v1.57.0/ui/desktop/src/components/Hub.tsx), [navigation](https://github.com/aaif-goose/goose/blob/v1.57.0/ui/desktop/src/hooks/useNavigationItems.ts): same represented home structure. |
| 2026-11, 2365bc5 | [Hub](https://github.com/aaif-goose/goose/blob/2365bc5e898a38133c373eef2d1357416acd66e2/ui/desktop/src/components/Hub.tsx), [navigation](https://github.com/aaif-goose/goose/blob/2365bc5e898a38133c373eef2d1357416acd66e2/ui/desktop/src/hooks/useNavigationItems.ts): same represented home structure. |

Each desktop spec links that edition's palette, layout, composer and model
control source. The light tokens are white `#ffffff`, secondary `#f4f6f7`,
text `#3f434b`, muted `#878787` and border `#e3e6ea`; for example see
[v1.29.0 tokens](https://github.com/aaif-goose/goose/blob/v1.29.0/ui/desktop/src/theme/theme-tokens.ts).
[ThemeContext](https://github.com/aaif-goose/goose/blob/v1.29.0/ui/desktop/src/contexts/ThemeContext.tsx)
initializes light and then loads user/system settings, so this exhibit depicts
light, not a claim that every installed instance used light. The early terminal
background is a reconstruction choice; only the prompt color is sourced.
Navigation dimensions are in each edition's linked `constants.ts`: the later
240px sidebar includes its 8px outer padding; narrow-screen adaptation is a
museum accommodation.

The composer retains the shared museum submission behavior. The source places
the model selector in the bottom bar and calls its menu item `Change Model`
([v1.29.0](https://github.com/aaif-goose/goose/blob/v1.29.0/ui/desktop/src/components/settings/models/bottom_bar/ModelsBottomBar.tsx),
[v1.36.0](https://github.com/aaif-goose/goose/blob/v1.36.0/ui/desktop/src/components/settings/models/bottom_bar/ModelsBottomBar.tsx)).
Available models and a universal default depend on configuration and are not
asserted. The museum era control mounts at that position and presents its own
recorded-options interface. Attach file is a disabled text substitute for the
source's icon, and non-home navigation is display-only; New Chat, Settings,
and sending use museum callbacks. Icons, logos and proprietary font assets are
omitted; CSS uses system fallbacks. The greeting and zero counts are example
empty-state data. The clock is read at render time and does not tick.

The 2024 session source takes input immediately; conditional save, resume,
error and provider messages do not all appear together. Consequently this
screen has two verified visible strings, and the test does **not** meet the
requested six-string minimum for that edition. It asserts at least six source
strings in each desktop edition. Adding unrelated CLI output to reach six would
misrepresent the screen.

Unverified: exact terminal background and host font; initial user/system theme;
precise rendering and responsive geometry in the browser; complete per-release
changes beyond the inspected home, navigation, composer, theme and model files;
model choices/defaults; reconstructed control styling and whether the selected
empty-state user configuration (zero counts, no recent chats, enabled Apps)
matched a particular installation. No browser, app, server or harness was
started. The test DOM does not measure layout.
