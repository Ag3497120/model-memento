# T05 — Langflow evidence and limits

The recreation uses system fonts and original CSS boxes. It includes no product
artwork. The chat panel is shown open to make the composer visible. Node
positions and edges in the later screen are an illustrative arrangement, not a
claim about the initial flow. The early canvas is intentionally empty. The
museum's model control is placed on the illustrative model component when a
sourced control is available; model options and defaults are not invented.
The museum sends messages through its existing composer; it does not build or
execute a Langflow flow.

## Snapshots

| Catalog entry | Source revision | Visible treatment |
| --- | --- | --- |
| 2023-03-14 | [v0.0.31](https://github.com/langflow-ai/langflow/blob/v0.0.31/langflow/frontend/src/pages/FlowPage/index.tsx) | Components, Prompts, LLMs, Chains, Agents, Tools, Memories, Advanced; floating Chat, Clear, Send a message... |
| 2026-03-26 | [v1.8.3](https://github.com/langflow-ai/langflow/blob/v1.8.3/src/frontend/src/pages/FlowPage/index.tsx) | Components, Search, component categories, example Chat Input / Language Model / Chat Output, right Playground, Send a message |
| 2026-04-24 | [v1.9.1](https://github.com/langflow-ai/langflow/blob/v1.9.1/src/frontend/src/pages/FlowPage/index.tsx) | Same shell, Version History, Send a message |
| 2026-05-29 | [v1.9.5](https://github.com/langflow-ai/langflow/blob/v1.9.5/src/frontend/src/pages/FlowPage/index.tsx) | Same shell, Version History, Send a message |
| 2026-06-23 | [v1.10.1](https://github.com/langflow-ai/langflow/blob/v1.10.1/src/frontend/src/pages/FlowPage/index.tsx) | Same shell and Version History; localized placeholder Send a message... |
| 2026-07-28 | [v1.11.1](https://github.com/langflow-ai/langflow/blob/v1.11.1/src/frontend/src/pages/FlowPage/index.tsx) | Same shell, Version History, Agent navigation, Send a message... |
| 2026-08-25 | [v1.11.5](https://github.com/langflow-ai/langflow/blob/v1.11.5/src/frontend/src/pages/FlowPage/index.tsx) | Same 1.11 treatment |
| 2026-09-29 | [v1.12.4](https://github.com/langflow-ai/langflow/blob/v1.12.4/src/frontend/src/pages/FlowPage/index.tsx) | Same shell and navigation treatment |
| 2026-10-22 | [v1.13.0](https://github.com/langflow-ai/langflow/blob/v1.13.0/src/frontend/src/pages/FlowPage/index.tsx) | Same shell and navigation treatment |
| 2026-11-15 | [260cbf347cc5](https://github.com/langflow-ai/langflow/blob/260cbf347cc5563cc48c79094c175ca31532ea2b/src/frontend/src/pages/FlowPage/index.tsx) | Same shell and navigation treatment |

## Evidence for elements

- [2023 FlowPage](https://github.com/langflow-ai/langflow/blob/v0.0.31/langflow/frontend/src/pages/FlowPage/index.tsx), [sidebar](https://github.com/langflow-ai/langflow/blob/v0.0.31/langflow/frontend/src/pages/FlowPage/components/extraSidebarComponent/index.tsx), and [category names](https://github.com/langflow-ai/langflow/blob/v0.0.31/langflow/frontend/src/utils.ts) establish the canvas, Components and draggable categories. Actual available items come from an API response.
- [2023 chat source](https://github.com/langflow-ai/langflow/blob/v0.0.31/langflow/frontend/src/components/chatComponent/index.tsx) specifies a 340px bottom-right panel, a 400px message region, Chat, Clear and the input placeholder. Its send action is an icon; the reconstruction substitutes a neutral arrow.
- Each later [FlowPage, for example v1.8.3](https://github.com/langflow-ai/langflow/blob/v1.8.3/src/frontend/src/pages/FlowPage/index.tsx), specifies a 17.5rem sidebar and a 326px right sliding panel with 15–60% resize limits. [The Playground container](https://github.com/langflow-ai/langflow/blob/v1.8.3/src/frontend/src/components/core/playgroundComponent/sliding-container/components/flow-page-sliding-container.tsx) places messages above the input. At narrow widths the reconstruction compresses these sizes.
- [v1.8.3 English categories](https://github.com/langflow-ai/langflow/blob/v1.8.3/src/frontend/src/utils/styleUtils.ts) and [sidebar search](https://github.com/langflow-ai/langflow/blob/v1.8.3/src/frontend/src/pages/FlowPage/components/flowSidebarComponent/components/searchInput.tsx) supply the labels. Later category strings are in each tag's `src/frontend/src/locales/en.json`, linked in the spec. [v1.8.3 input wrapper](https://github.com/langflow-ai/langflow/blob/v1.8.3/src/frontend/src/components/core/playgroundComponent/chat-view/chat-input/components/input-wrapper.tsx), also checked in v1.9.1 and v1.9.5, says `Send a message`; [v1.10.1 input wrapper](https://github.com/langflow-ai/langflow/blob/v1.10.1/src/frontend/src/components/core/playgroundComponent/chat-view/chat-input/components/input-wrapper.tsx) uses a localization key and [English locale](https://github.com/langflow-ai/langflow/blob/v1.10.1/src/frontend/src/locales/en.json) gives `Send a message...`. The later locales were checked individually.
- [Version History in v1.9.1](https://github.com/langflow-ai/langflow/blob/v1.9.1/src/frontend/src/pages/FlowPage/components/flowSidebarComponent/components/FlowVersionSidebar/index.tsx) and [Agent navigation in v1.11.1](https://github.com/langflow-ai/langflow/blob/v1.11.1/src/frontend/src/pages/FlowPage/components/flowSidebarComponent/components/sidebar-nav-items.ts) establish the later additions. The versions between those milestones share the treatment; patch changes are not invented.
- The [v1.8.3 starter flow](https://github.com/langflow-ai/langflow/blob/v1.8.3/src/backend/base/langflow/initial_setup/starter_projects/Memory%20Chatbot.json) contains Chat Input, Language Model, Chat Output and a Language Model field; the corresponding file was checked in each later revision. These are examples, not a claim that the three form the complete starter flow. Exact available models and provider defaults are unverified. The 2023 model control is unverified.
- [v1.8.3 theme CSS](https://github.com/langflow-ai/langflow/blob/v1.8.3/src/frontend/src/style/index.css) gives light background white and foreground and primary black; later tags were checked. The placeholder foreground changes from HSL 240 5% 65% to HSL 240 5% 40% by v1.11.1. The actual default theme preference is unverified. The 2023 default theme and exact RGB values are unverified. Dots, radii, node geometry, borders, and remaining colors are reconstruction choices rather than verified values.

The complete per-version file URLs and source statements are in the spec and era JSON. No browser, app, visual capture, full test suite, or build was run. The Node DOM fixture checks markup and event wiring, not actual browser layout. The 2023 exact canvas contents and model picker, later precise toolbar geometry and initial flow, runtime feature flags, real model options, and default theme preference remain unverified.

The later composer includes a neutral disabled `+` attachment control, based on
[the v1.8.3 upload button](https://github.com/langflow-ai/langflow/blob/v1.8.3/src/frontend/src/components/core/playgroundComponent/chat-view/chat-input/components/upload-file-button.tsx)
and the corresponding file in every later revision. Its product icon and upload
behavior are not reproduced. The museum's accessible label explains that it is
unavailable.
