# V4 モデル選択の設置場所

対象：13レンダラー・100版。変更したJavaScriptは下記13ファイルだけ。`design/era/<tool-id>.json` の `model_switch` を読み、表示場所の目印を付けた。新たな歴史調査や外部資料の再取得は行っていない。出典は各行に示す。

- `data-era-input` は実際の会話入力のtextareaだけに付けた。検索・設定・道具への引数には付けない。休止中のHuggingChatと、画面未確認のLocallyには入力欄を追加しない。
- `data-era-slot` の中は、レンダラーから主モデルを選ぶ操作を外し、V1が選択器を置ける状態にした。命令を入力する版には常設の選択器を置かない。
- `other` で設置場所が未確認の18版は、位置を推測せず目印なしとした。操作が分かっている場合も手順は元JSONに残る。
- `none` の4版にもモデル選択器を置かない。
- LM Studioのモデル探し・読込のやり直し・補助モデル、Zedの外部の作業用アプリの選択、Cherry Studioの追加モデル・考える程度など、主モデルとは別の入口は既存のまま。

| 時代データ | レンダラー |
| --- | --- |
| [continue](era/continue.json) | [continue.js](../web/js/tools/continue.js) |
| [windsurf](era/windsurf.json) | [windsurf.js](../web/js/tools/windsurf.js) |
| [huggingchat](era/huggingchat.json) | [huggingchat.js](../web/js/tools/huggingchat.js) |
| [lm-studio](era/lm-studio.json) | [lmstudio.js](../web/js/tools/lmstudio.js) |
| [open-webui](era/open-webui.json) | [openwebui.js](../web/js/tools/openwebui.js) |
| [n8n](era/n8n.json) | [n8n.js](../web/js/tools/n8n.js) |
| [ollama](era/ollama.json) | [ollama.js](../web/js/tools/ollama.js) |
| [zed](era/zed.json) | [zed.js](../web/js/tools/zed.js) |
| [cherry-studio](era/cherry-studio.json) | [cherry-studio.js](../web/js/tools/cherry-studio.js) |
| [antigravity](era/antigravity.json) | [antigravity.js](../web/js/tools/antigravity.js) |
| [deepseek](era/deepseek.json) | [deepseek.js](../web/js/tools/deepseek.js) |
| [hermes-agent](era/hermes-agent.json) | [hermes-agent.js](../web/js/tools/hermes-agent.js) |
| [pi-coding-agent](era/pi-coding-agent.json) | [pi-coding-agent.js](../web/js/tools/pi-coding-agent.js) |

## 版ごとの目印

「入力あり」は `data-era-input` を示す。「—」は `data-era-slot` を置かないことを示す。下表の元の分類は時代データの値。

| 版 | 元の分類 | 設置場所 | 入力欄 | 記録 | 出典 |
| --- | --- | --- | --- | --- | --- |
| continue-2023-06 | side-panel | panel | あり | 会話欄の末尾。二者の切替はV1が担当。 | [資料1](https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/tabs/gui.tsx) |
| continue-2024-05 | side-panel | panel | あり | 入力欄とは別の末尾の操作列。 | [資料1](https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/components/Layout.tsx)・[資料2](https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/gui/src/components/modelSelection/ModelSelect.tsx)・[資料3](https://raw.githubusercontent.com/continuedev/continue/v0.9.132-vscode/core/config/default.ts) |
| continue-2024-11 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/components/mainInput/InputToolbar.tsx)・[資料2](https://raw.githubusercontent.com/continuedev/continue/544c5d36823e04a1edc86c698594e2f5d589266e/gui/src/components/modelSelection/ModelSelect.tsx) |
| continue-2025-02 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/continuedev/continue/52dc6f961d88b23f718ad9db8776913179c3d7c8/gui/src/components/mainInput/InputToolbar.tsx) |
| continue-2025-10 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/continuedev/continue/v1.3.19-vscode/gui/src/components/mainInput/InputToolbar.tsx)・[資料2](https://raw.githubusercontent.com/continuedev/continue/v1.3.19-vscode/gui/src/components/modelSelection/ModelSelect.tsx) |
| continue-2026-05 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/continuedev/continue/cb273098d968906d25ee737b454f0b5f13ea2482/gui/src/components/mainInput/InputToolbar.tsx) |
| continue-2026-06 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/components/mainInput/InputToolbar.tsx)・[資料2](https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/components/modelSelection/ModelSelect.tsx) |
| continue-2026-11 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/components/mainInput/InputToolbar.tsx)・[資料2](https://raw.githubusercontent.com/continuedev/continue/v2.0.0-vscode/gui/src/components/modelSelection/ModelSelect.tsx)・[資料3](https://raw.githubusercontent.com/continuedev/continue/5522c6f44ca0ac3528b37244818fbfa39b5af470/README.md) |
| windsurf-2023-09 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://devin.ai/blog/changelist-may23) |
| windsurf-2024-11 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://devin.ai/blog/windsurf-launch) |
| windsurf-2025-01 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://web.archive.org/web/20250201034429id_/https://docs.codeium.com/windsurf/models) |
| windsurf-2025-03 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://web.archive.org/web/20250304093900id_/https://docs.codeium.com/windsurf/models) |
| windsurf-2025-07 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://web.archive.org/web/20250729031645id_/https://docs.windsurf.com/windsurf/models) |
| windsurf-2025-08 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://web.archive.org/web/20250916073552id_/https://docs.windsurf.com/windsurf/models) |
| windsurf-2025-11 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://web.archive.org/web/20251105163921id_/https://docs.windsurf.com/windsurf/models) |
| windsurf-2026-01 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://devin.ai/blog/windsurf-wave-14)・[資料2](https://docs.devin.ai/desktop/changelog) |
| windsurf-2026-06 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://devin.ai/blog/windsurf-is-now-devin-desktop) |
| windsurf-2026-09 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://docs.progress.com/bundle/openedge-ai-coding-assistant-128/page/Cascade-and-Devin-Local-models.html) |
| windsurf-2026-11 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://docs.progress.com/bundle/openedge-ai-coding-assistant-128/page/Cascade-and-Devin-Local-models.html)・[資料2](https://docs.devin.ai/desktop/models) |
| huggingchat-2023-04 | none | — | あり | 選択器なし。 | [資料1](https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatIntroduction.svelte)・[資料2](https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/.env) |
| huggingchat-2023-08 | other | panel | あり | 中央カードから開くモデル設定欄の中。 | [資料1](https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/chat/ChatIntroduction.svelte)・[資料2](https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/ModelsModal.svelte) |
| huggingchat-2024-02 | settings | settings | あり | 中央カードまたは左下の設定から開く欄の中。 | [資料1](https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/lib/components/chat/ChatIntroduction.svelte)・[資料2](https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/routes/settings/[...model]/+page.svelte)・[資料3](https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/routes/settings/+layout.svelte)・[資料4](https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/lib/components/NavMenu.svelte) |
| huggingchat-2024-09 | settings | settings | あり | 中央カードまたは左下の設定から開く欄の中。 | [資料1](https://github.com/huggingface/chat-ui/blob/bb38bf54d76f2862955754045c66dc73213e50a5/src/lib/components/chat/ChatIntroduction.svelte) |
| huggingchat-2025-07 | none | — | なし | 選択器なし。 | [資料1](https://huggingface.co/spaces/huggingchat/chat-ui/discussions/747?expand=true) |
| huggingchat-2025-10 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/chat/ChatWindow.svelte)・[資料2](https://huggingface.co/spaces/huggingchat/chat-ui/discussions/764) |
| huggingchat-2026-04 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/src/lib/components/chat/ChatWindow.svelte) |
| huggingchat-2026-11 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/chat/ChatWindow.svelte) |
| lm-studio-2023-05 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://lmstudio.ai/blog/free-for-work) |
| lm-studio-2023-11 | top-dropdown | top | あり | 会話の上部。 | [資料1](https://www.muycomputer.com/2024/03/12/lleva-la-inteligencia-artificial-a-tu-pc-con-lm-studio/) |
| lm-studio-2024-04 | top-dropdown | top | あり | 会話の上部。 | [資料1](https://www.interadictos.es/2024/05/13/lm-studio-ejecutar-modelos-de-ia-llm-en-un-portatil-o-pc-y-offline-para-crear-tu-chatbot-local/) |
| lm-studio-2024-08 | top-dropdown | top | あり | 会話の上部。 | [資料1](https://zenn.dev/isi00141/articles/548aee6b1863fc)・[資料2](https://lmstudio.ai/blog/lmstudio-v0.3.0) |
| lm-studio-2025-01 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://lmstudio.ai/blog/lmstudio-v0.3.8) |
| lm-studio-2025-02 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://lmstudio.ai/blog/lmstudio-v0.3.10) |
| lm-studio-2025-06 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://lmstudio.ai/blog/lmstudio-v0.3.17) |
| lm-studio-2025-10 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://lmstudio.ai/blog/lmstudio-v0.3.30) |
| lm-studio-2026-02 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://lmstudio.ai/blog/0.4.0) |
| lm-studio-lmlink-mobile-2026-06-04 | other | — | なし | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://lmstudio.ai/blog/locally-lm-link) |
| lm-studio-2026-11 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://lmstudio.ai/docs/bionic/models)・[資料2](https://lmstudio.ai/docs/bionic) |
| open-webui-2023-10 | top-dropdown | top | あり | 会話の上部。 | [資料1](https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/src/routes/+page.svelte)・[資料2](https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/src/routes/+page.svelte) |
| open-webui-2024-02 | top-dropdown | top | あり | 会話の上部。 | [資料1](https://github.com/open-webui/open-webui/blob/4a47833f838088a0309edad2f85ff247b2ad6e00/src/routes/(app)/+page.svelte)・[資料2](https://github.com/open-webui/open-webui/blob/4a47833f838088a0309edad2f85ff247b2ad6e00/src/lib/components/chat/ModelSelector.svelte)・[資料3](https://github.com/open-webui/open-webui/blob/4a47833f838088a0309edad2f85ff247b2ad6e00/src/lib/components/chat/ModelSelector.svelte) |
| open-webui-2024-09 | top-dropdown | top | あり | 会話の上部。 | [資料1](https://github.com/open-webui/open-webui/blob/50db51ebe08c018bf46acfaf55985ff998da50bc/src/lib/components/layout/Navbar.svelte)・[資料2](https://github.com/open-webui/open-webui/blob/50db51ebe08c018bf46acfaf55985ff998da50bc/src/lib/components/chat/ModelSelector.svelte) |
| open-webui-2025-04 | top-dropdown | top | あり | 会話の上部。 | [資料1](https://github.com/open-webui/open-webui/blob/04799f1f95f958674d35ba4854ef62754a4d332e/src/lib/components/layout/Navbar.svelte)・[資料2](https://github.com/open-webui/open-webui/blob/04799f1f95f958674d35ba4854ef62754a4d332e/src/lib/components/chat/ModelSelector.svelte) |
| open-webui-2025-09 | top-dropdown | top | あり | 会話の上部。 | [資料1](https://github.com/open-webui/open-webui/blob/dddd1e44f37e0b489d10abbc21667e16d62722f6/src/lib/components/chat/Navbar.svelte)・[資料2](https://github.com/open-webui/open-webui/blob/dddd1e44f37e0b489d10abbc21667e16d62722f6/src/lib/components/chat/ModelSelector.svelte) |
| open-webui-2025-11 | top-dropdown | top | あり | 会話の上部。 | [資料1](https://github.com/open-webui/open-webui/blob/e85c7f79310f351672fe967a102396b6f3f5e88b/src/lib/components/chat/Navbar.svelte)・[資料2](https://github.com/open-webui/open-webui/blob/e85c7f79310f351672fe967a102396b6f3f5e88b/src/lib/components/chat/ModelSelector.svelte) |
| open-webui-2026-07 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://github.com/open-webui/open-webui/blob/f9590b8017199e56d5e953657e6498e3cef1d246/src/lib/components/chat/MessageInput.svelte)・[資料2](https://github.com/open-webui/open-webui/blob/f9590b8017199e56d5e953657e6498e3cef1d246/src/lib/components/chat/ModelSelector.svelte) |
| open-webui-2026-10 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://github.com/open-webui/open-webui/blob/15818d88fd7bde1b73de33590f50d15d21e8d7c1/src/lib/components/chat/MessageInput.svelte)・[資料2](https://github.com/open-webui/open-webui/blob/15818d88fd7bde1b73de33590f50d15d21e8d7c1/src/lib/components/chat/ModelSelector.svelte) |
| open-webui-2026-11 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://github.com/open-webui/open-webui/blob/c38885a1a737da4968f157092f304f3b5481d0bf/src/lib/components/chat/MessageInput.svelte)・[資料2](https://github.com/open-webui/open-webui/blob/c38885a1a737da4968f157092f304f3b5481d0bf/src/lib/components/chat/ModelSelector.svelte) |
| n8n-2023-10 | settings | settings | あり | モデルの処理を開いた設定欄の中。 | [資料1](https://github.com/n8n-io/n8n/blob/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/nodes-base/nodes/OpenAi/ChatDescription.ts)・[資料2](https://github.com/n8n-io/n8n/blob/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/editor-ui/src/components/NodeDetailsView.vue) |
| n8n-2024-02 | settings | settings | あり | モデルの処理を開いた設定欄の中。 | [資料1](https://github.com/n8n-io/n8n/blob/2b9391a9758041f09c2e948eab942c45a9919aad/packages/@n8n/nodes-langchain/nodes/llms/LMChatOpenAi/LmChatOpenAi.node.ts)・[資料2](https://github.com/n8n-io/n8n/blob/2b9391a9758041f09c2e948eab942c45a9919aad/packages/editor-ui/src/components/NodeDetailsView.vue) |
| n8n-2024-09 | settings | settings | あり | モデルの処理を開いた設定欄の中。 | [資料1](https://github.com/n8n-io/n8n/blob/ee7147c6b3b053ac8fc317319ab257204e599f16/packages/@n8n/nodes-langchain/nodes/llms/LMChatOpenAi/LmChatOpenAi.node.ts)・[資料2](https://github.com/n8n-io/n8n/blob/ee7147c6b3b053ac8fc317319ab257204e599f16/packages/editor-ui/src/components/NodeDetailsView.vue) |
| n8n-2025 | settings | settings | あり | モデルの処理を開いた設定欄の中。 | [資料1](https://github.com/n8n-io/n8n/blob/da8aafc0e3a1b5d862f0723d0d53d2c38bcaebc3/packages/@n8n/nodes-langchain/nodes/llms/LMChatOpenAi/LmChatOpenAi.node.ts)・[資料2](https://github.com/n8n-io/n8n/blob/da8aafc0e3a1b5d862f0723d0d53d2c38bcaebc3/packages/editor-ui/src/components/NodeDetailsView.vue) |
| n8n-2025-08 | settings | settings | あり | モデルの処理を開いた設定欄の中。 | [資料1](https://github.com/n8n-io/n8n/blob/604b936d8f69d450116b4d255a365bf448d359ae/packages/@n8n/nodes-langchain/nodes/llms/LMChatOpenAi/LmChatOpenAi.node.ts)・[資料2](https://github.com/n8n-io/n8n/blob/604b936d8f69d450116b4d255a365bf448d359ae/packages/frontend/editor-ui/src/views/NodeView.vue) |
| n8n-2026-04 | settings | settings | あり | モデルの処理を開いた設定欄の中。 | [資料1](https://github.com/n8n-io/n8n/blob/e4fc7539674730212cfbb325c36d38f83b2f77ee/packages/@n8n/nodes-langchain/nodes/llms/LMChatOpenAi/LmChatOpenAi.node.ts)・[資料2](https://github.com/n8n-io/n8n/blob/e4fc7539674730212cfbb325c36d38f83b2f77ee/packages/frontend/editor-ui/src/app/views/NodeView.vue) |
| n8n-2026-11 | settings | settings | あり | モデルの処理を開いた設定欄の中。 | [資料1](https://github.com/n8n-io/n8n/blob/28f60cebe5d5303e13867c2afe15d44b35b9e9d7/packages/@n8n/nodes-langchain/nodes/llms/LMChatOpenAi/LmChatOpenAi.node.ts)・[資料2](https://github.com/n8n-io/n8n/blob/28f60cebe5d5303e13867c2afe15d44b35b9e9d7/packages/frontend/editor-ui/src/app/views/NodeView.vue) |
| ollama-2023-07 | other | input-left | あり | 端末入力の横。/byeの後にollama runへモデル名を渡す手順の受け口。--modelではない。 | [資料1](https://github.com/ollama/ollama/blob/e7a393de5405e7c12e4ca59493cb4c6037fe3b57/cmd/cmd.go)・[資料2](https://ollama.com/blog/run-llama2-uncensored-locally) |
| ollama-2024-02 | slash-command | — | あり | 入力欄のみ。/load <model> の命令はV1が扱う。 | [資料1](https://github.com/ollama/ollama/blob/69f392c9b7ea7c5cc3d46c29774e37fdef51abd8/cmd/interactive.go) |
| ollama-2024-09-macos | none | — | あり | 選択器なし。 | [資料1](https://github.com/ollama/ollama/blob/e9e9bdb8d904f009e8b1e54af9f77624d481cfb2/macapp/src/index.ts) |
| ollama-2025-07-macos | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://ollama.com/blog/new-app) |
| ollama-2026-03-macos | input-bar | input-right | あり | 入力部の右側。候補の検索・選択はV1が担当。 | [資料1](https://github.com/ollama/ollama/blob/f8dc7c9f54a753d2c6d3410936e73486f9bf463d/app/ui/app/src/components/ChatForm.tsx)・[資料2](https://github.com/ollama/ollama/blob/f8dc7c9f54a753d2c6d3410936e73486f9bf463d/app/ui/app/src/components/ModelPicker.tsx) |
| ollama-2026-11-macos | input-bar | input-right | あり | 会話の入力部の右側。Appsの接続先とは別。 | [資料1](https://github.com/ollama/ollama/blob/a5864fcb33969705de3c0ebfedf4b2a16c970bcc/app/ui/app/src/components/ChatForm.tsx)・[資料2](https://github.com/ollama/ollama/blob/a5864fcb33969705de3c0ebfedf4b2a16c970bcc/app/ui/app/src/components/ModelPicker.tsx)・[資料3](https://github.com/ollama/ollama/blob/a5864fcb33969705de3c0ebfedf4b2a16c970bcc/app/ui/app/src/components/AppSidebar.tsx) |
| zed-2024-05-macos | other | top | あり | 会話欄の題名の横。順送りの切替はV1が担当。 | [資料1](https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/crates/assistant/src/assistant_panel.rs)・[資料2](https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/crates/open_ai/src/open_ai.rs)・[資料3](https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/assets/settings/default.json) |
| zed-2024-08-macos | top-dropdown | top | あり | 会話の上部。 | [資料1](https://raw.githubusercontent.com/zed-industries/zed/a3672d96d4a8f776f32ffb6d830130d54d418bf4/crates/assistant/src/assistant_panel.rs)・[資料2](https://zed.dev/blog/zed-ai) |
| zed-2025-04-macos | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://github.com/zed-industries/zed/discussions/24028) |
| zed-2025-05 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/zed-industries/zed/37010aac6b340e058ef9c5a3c783802af90e5b9f/docs/src/ai/agent-panel.md)・[資料2](https://raw.githubusercontent.com/zed-industries/zed/37010aac6b340e058ef9c5a3c783802af90e5b9f/docs/src/ai/models.md) |
| zed-2025-09-macos | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/docs/src/ai/agent-panel.md)・[資料2](https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/docs/src/ai/external-agents.md) |
| zed-2026-04 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/zed-industries/zed/f939ec604925667ea8281e1fa74600688d482706/docs/src/ai/agent-panel.md) |
| zed-2026-11-macos | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/docs/src/ai/agent-panel.md) |
| cherry-studio-2024-06 | none | — | あり | 選択器なし。 | [資料1](https://github.com/CherryHQ/cherry-studio/blob/f866387862f2f92bd4768d4611ded6fd90405313/src/renderer/src/pages/home/HomePage.tsx) |
| cherry-studio-2024-08 | top-dropdown | top | あり | 会話上部の題名の横。 | [資料1](https://github.com/CherryHQ/cherry-studio/blob/f7ef895ce60298639d09e65d06f5c1c1d277d614/src/renderer/src/pages/home/components/NavigationCenter.tsx)・[資料2](https://github.com/CherryHQ/cherry-studio/blob/f7ef895ce60298639d09e65d06f5c1c1d277d614/src/renderer/src/pages/home/components/SelectModelDropdown.tsx) |
| cherry-studio-2025-01 | top-dropdown | top | あり | 会話上部の題名の横。 | [資料1](https://github.com/CherryHQ/cherry-studio/blob/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/pages/home/Navbar.tsx)・[資料2](https://github.com/CherryHQ/cherry-studio/blob/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/pages/home/components/SelectModelButton.tsx)・[資料3](https://github.com/CherryHQ/cherry-studio/blob/446499287348c61e403d1ea0b253cfc46fc7e6c2/src/renderer/src/i18n/locales/en-us.json) |
| cherry-studio-2025-06-macos | top-dropdown | top | あり | 会話上部の題名の横。 | [資料1](https://github.com/CherryHQ/cherry-studio/blob/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/Navbar.tsx)・[資料2](https://github.com/CherryHQ/cherry-studio/blob/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/pages/home/components/SelectModelButton.tsx)・[資料3](https://github.com/CherryHQ/cherry-studio/blob/8c9822cc713d52d79eb99f278bd331d04e269618/src/renderer/src/i18n/locales/en-us.json) |
| cherry-studio-2026-03-macos | top-dropdown | top | あり | 会話上部の題名の横。 | [資料1](https://github.com/CherryHQ/cherry-studio/blob/f0f04eeda03868ea75f8d5219baad8afec7a38e3/src/renderer/src/pages/home/components/ChatNavBar/ChatNavbarContent/TopicContent.tsx)・[資料2](https://github.com/CherryHQ/cherry-studio/blob/f0f04eeda03868ea75f8d5219baad8afec7a38e3/src/renderer/src/pages/home/Chat.tsx) |
| cherry-studio-2026-11-macos | top-dropdown | top | あり | 会話上部の題名の横。 | [資料1](https://cherryai.com/docs/en/cherrystudio/preview/chat/)・[資料2](https://github.com/CherryHQ/cherry-studio/blob/2292fdd739266df12518e4f706de1aa99f66015f/src/renderer/pages/home/components/ChatNavbar.tsx) |
| antigravity-2025-11 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://antigravity.google/blog/introducing-google-antigravity) |
| antigravity-2026-05 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://antigravity.google/blog/introducing-google-antigravity-2)・[資料2](https://antigravity.google/docs/changelog?tab=hub) |
| antigravity-2026-10 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://web.archive.org/web/20261014220936id_/https://antigravity.google/docs/models/) |
| antigravity-2026-11 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://antigravity.google/docs/models) |
| deepseek-2024-11 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://api-docs.deepseek.com/news/news1120/)・[資料2](https://www.datacamp.com/blog/deepseek-r1-lite-preview) |
| deepseek-2025-01 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://api-docs.deepseek.com/news/news250120/)・[資料2](https://indianexpress.com/article/technology/techook/deepseek-how-to-use-for-free-smartphone-laptop-pc-9805383/) |
| deepseek-2025-08 | other | — | あり | 一部：設置場所が unverified。位置を推測しない。 | [資料1](https://api-docs.deepseek.com/news/news250821/) |
| deepseek-2026-07 | other | top | あり | 会話上部。モード選択の形は未確認なのでドロップダウンと断定しない。 | [資料1](https://api-docs.deepseek.com/news/news260424/)・[資料2](https://www.techradar.com/pro/deepseek-ai-review) |
| nousresearch--hermes-agent-2026-03-0 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/NousResearch/hermes-agent/v2026.3.12/website/docs/user-guide/cli.md)・[資料2](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.3.12) |
| nousresearch--hermes-agent-2026-05-1 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/NousResearch/hermes-agent/v2026.5.29.2/website/docs/user-guide/cli.md)・[資料2](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.5.29.2) |
| nousresearch--hermes-agent-2026-06-2 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/NousResearch/hermes-agent/v2026.6.19/website/docs/user-guide/cli.md)・[資料2](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.6.19) |
| nousresearch--hermes-agent-2026-07-3 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/NousResearch/hermes-agent/v2026.7.30/website/docs/user-guide/cli.md)・[資料2](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.7.30) |
| nousresearch--hermes-agent-2026-08-4 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/NousResearch/hermes-agent/v2026.8.31/website/docs/user-guide/cli.md)・[資料2](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.8.31) |
| nousresearch--hermes-agent-2026-09-5 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/NousResearch/hermes-agent/v2026.9.24/website/docs/user-guide/cli.md)・[資料2](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.9.24) |
| nousresearch--hermes-agent-2026-10-6 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/NousResearch/hermes-agent/v0.22.5/website/docs/user-guide/cli.md)・[資料2](https://github.com/NousResearch/hermes-agent/releases/tag/v0.22.5) |
| nousresearch--hermes-agent-record | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/NousResearch/hermes-agent/v0.23.1%2Bcanary.20261114T064334Z/website/docs/user-guide/cli.md)・[資料2](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.1%2Bcanary.20261114T064334Z) |
| hermes-agent-2026-05 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/NousResearch/hermes-agent/v2026.5.29.2/website/docs/user-guide/tui.md)・[資料2](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.5.28) |
| hermes-agent-2026-06 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/NousResearch/hermes-agent/v2026.6.19/website/docs/user-guide/desktop.md)・[資料2](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.6.19) |
| hermes-agent-2026-11 | input-bar | input-left | あり | 会話入力の操作列。 | [資料1](https://raw.githubusercontent.com/NousResearch/hermes-agent/v0.23.1%2Bcanary.20261114T064334Z/website/docs/user-guide/desktop.md)・[資料2](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.0) |
| earendil-works--pi-2025-12-0 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/earendil-works/pi/v0.12.0/packages/coding-agent/README.md)・[資料2](https://github.com/earendil-works/pi/releases/tag/v0.12.0) |
| earendil-works--pi-2026-06-1 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/earendil-works/pi/v0.80.3/packages/coding-agent/README.md)・[資料2](https://github.com/earendil-works/pi/releases/tag/v0.80.3) |
| earendil-works--pi-2026-07-2 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/earendil-works/pi/v0.83.0/packages/coding-agent/README.md)・[資料2](https://github.com/earendil-works/pi/releases/tag/v0.83.0) |
| earendil-works--pi-2026-08-3 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/earendil-works/pi/v0.84.4/packages/coding-agent/README.md)・[資料2](https://github.com/earendil-works/pi/releases/tag/v0.84.4) |
| earendil-works--pi-2026-09-4 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/earendil-works/pi/v0.99.2/packages/coding-agent/docs/usage.md)・[資料2](https://github.com/earendil-works/pi/releases/tag/v0.99.2) |
| earendil-works--pi-2026-10-5 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/earendil-works/pi/v1.0.0/packages/coding-agent/docs/usage.md)・[資料2](https://github.com/earendil-works/pi/releases/tag/v1.0.0) |
| earendil-works--pi-2026-10-6 | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/earendil-works/pi/v1.4.0/packages/coding-agent/docs/usage.md)・[資料2](https://github.com/earendil-works/pi/releases/tag/v1.4.0) |
| earendil-works--pi-record | slash-command | — | あり | 入力欄のみ。/model の命令はV1が扱う。 | [資料1](https://raw.githubusercontent.com/earendil-works/pi/v1.5.2/packages/coding-agent/docs/usage.md)・[資料2](https://github.com/earendil-works/pi/releases/tag/v1.5.2) |

## 設定欄と引継ぎ

HuggingChatの2023年8月・2024年2月・9月は、中央カードと左下の設定から同じ小さな欄を開閉できる。目印はその欄の中に置き、開閉しても作り直さない。2023年8月のApply、2024年2月のActivateの操作はV1側の手順に従う。9月の確定ラベルは未確認のまま扱う。[2023年の選択画面](https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/ModelsModal.svelte)、[2024年2月の設定画面](https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/routes/settings/[...model]/+page.svelte)、[2024年9月の入口](https://github.com/huggingface/chat-ui/blob/bb38bf54d76f2862955754045c66dc73213e50a5/src/lib/components/chat/ChatIntroduction.svelte)。

n8nは「最初の処理を追加」からモデルの箱を開くと設定欄を表示する。2023年10月はOpenAIのChat / Complete、それ以降はOpenAI Chat Modelの箱を入口とした。設定欄を閉じたり別の処理を開いたりしても、V1が置いた選択器の受け口を保持する。[2023年の処理の設定](https://github.com/n8n-io/n8n/blob/ec141416e29540a2bf6ce99be1b13d76517eca13/packages/nodes-base/nodes/OpenAi/ChatDescription.ts)、[2024年のモデルの箱](https://github.com/n8n-io/n8n/blob/2b9391a9758041f09c2e948eab942c45a9919aad/packages/@n8n/nodes-langchain/nodes/llms/LMChatOpenAi/LmChatOpenAi.node.ts)。複数のモデルの箱を持つ手順と、その箱ごとの状態保存は、この最小の画面には追加していない。

Open WebUIの2023年10月の選択不可の処理は、空のfieldsetを受け口にして残した。後からV1が入れたボタンや選択欄にもfieldsetの無効化が及ぶ。2024年2月の「会話後は変更不可」は元データにあるが既存レンダラーには実装がなく、今回も動作を追加していない。V1との結合時に確認が必要。[2023年の会話画面](https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/src/routes/+page.svelte)、[2024年2月の会話画面](https://github.com/open-webui/open-webui/blob/4a47833f838088a0309edad2f85ff247b2ad6e00/src/routes/(app)/+page.svelte)。

V1への確認事項：Ollamaの2024年2月は /model でなく /load、2023年7月は --model でなく ollama run の引数。初期ContinueとZedは順送り、DeepSeekは思考や応答モードであり架空のモデル一覧を作らない。Windsurf Arenaは比較の操作は確認済みだが、画面の起点は未確認。上表の目印とJSONのstepsを使って扱う。[Ollamaの起動例](https://ollama.com/blog/run-llama2-uncensored-locally)、[Ollamaの命令](https://github.com/ollama/ollama/blob/69f392c9b7ea7c5cc3d46c29774e37fdef51abd8/cmd/interactive.go)、[Continueの切替](https://raw.githubusercontent.com/continuedev/continue/9913b4fd46275f9185bf6a6896931bc38bd7d3d0/extension/react-app/src/tabs/gui.tsx)、[Zedの切替](https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/crates/assistant/src/assistant_panel.rs)、[DeepSeekのモード](https://api-docs.deepseek.com/news/news250821/)、[Arenaの説明](https://devin.ai/blog/windsurf-wave-14)。

既存のOllamaの2024年9月の画面には端末欄があるが、この版のデータは常駐メニューを対象としている。今回の変更では既存の端末欄に入力の目印だけを付け、モデルの目印は置かなかった。常駐メニューだけへ画面を整理する場合は別の描画変更としてレビューが必要。[常駐メニューのソース](https://github.com/ollama/ollama/blob/e9e9bdb8d904f009e8b1e54af9f77624d481cfb2/macapp/src/index.ts)。

未確認：18版の設置場所、各JSON内で未確認とされる候補・既定値・正確なラベル・配布時点との差・端末やOSの細部。新設した設定欄の寸法・見た目の一致、実ブラウザーでの配置、V1による選択器の設置と命令処理は未検証。外部アプリ・ブラウザー・サーバーは起動していない。ビルドは担当外のファイルを書き換えるため実行していない。

## 実行した確認

構文確認：

```sh
for taskFile in web/js/tools/{continue,windsurf,huggingchat,lmstudio,openwebui,n8n,ollama,zed,cherry-studio,antigravity,deepseek,hermes-agent,pi-coding-agent}.js; do node --check "$taskFile" || exit; done
```

オフラインの構造・開閉確認（以下のコードをこの作業フォルダーから実行）：

```sh
node --input-type=module -e 'import {readFileSync} from "node:fs"; const text=readFileSync("design/era-slots-v4.md","utf8"); const match=text.match(/^<!-- v4-check:start -->\n```js\n([\s\S]*?)\n```\n<!-- v4-check:end -->$/m); if(!match) throw Error("missing V4 check"); console.log(match[1]);' | node --input-type=module
```

<!-- v4-check:start -->
```js
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
const base = pathToFileURL(`${process.cwd()}/`);
const { TestNode } = await import(new URL('test/news/fixtures/dom.js', base));
// A small element tree: no browser, layout engine, network, or real observer.
class Element extends TestNode {
  constructor(tag, text = '') {
    super(tag, text);
    this.className = ''; this.dataset = {}; this.hidden = false;
    this.style = { setProperty() {} }; this.listeners = {};
  }
  setAttribute(key, value) {
    super.setAttribute(key, String(value));
    if (['hidden', 'disabled', 'open'].includes(key)) this[key] = true;
  }
  get classList() {
    const contains = value => this.className.split(/\s+/).includes(value);
    return { contains,
      add: (...values) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...values])].join(' '); },
      remove: (...values) => { this.className = this.className.split(/\s+/).filter(value => !values.includes(value)).join(' '); },
      toggle: (value, force) => {
        const enabled = force ?? !contains(value);
        if (enabled) this.classList.add(value); else this.classList.remove(value);
        return enabled;
      }
    };
  }
  append(...children) {
    for (const child of children) { child.remove(); this.children.push(child); child.parent = this; child.parentNode = this; }
  }
  prepend(...children) {
    for (const child of [...children].reverse()) { child.remove(); this.children.unshift(child); child.parent = this; child.parentNode = this; }
  }
  remove() { super.remove(); this.parent = null; this.parentNode = null; }
  replaceChildren(...children) { for (const child of [...this.children]) child.remove(); this._text = ''; this.append(...children); }
  insertBefore(child, before) {
    if (!before) { this.append(child); return; }
    child.remove();
    const index = this.children.indexOf(before);
    assert.ok(index >= 0, 'insertBefore reference must belong to the parent');
    this.children.splice(index, 0, child); child.parent = this; child.parentNode = this;
  }
  matches(selector) {
    if (selector.startsWith('.')) return selector.slice(1).split('.').every(value => this.classList.contains(value));
    const attr = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attr) return Object.hasOwn(this.attrs, attr[1]) && (attr[2] === undefined || this.attrs[attr[1]] === attr[2]);
    return this.tagName === selector.toLowerCase();
  }
  querySelectorAll(selector) {
    const result = [];
    const walk = node => {
      for (const child of node.children) {
        if (selector.split(',').some(part => {
          const bits = part.trim().split(/\s+/); let current = child;
          if (!current.matches(bits.pop())) return false;
          while (bits.length) {
            const bit = bits.pop(); current = current.parent;
            while (current && !current.matches(bit)) current = current.parent;
            if (!current) return false;
          }
          return true;
        })) result.push(child);
        walk(child);
      }
    };
    walk(this); return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { for (let node = this; node; node = node.parent) if (node.matches(selector)) return node; return null; }
  addEventListener(type, handler, capture = false) { (this.listeners[type] ||= []).push({ handler, capture }); }
  fire(type, fields = {}) {
    const event = { target: this, currentTarget: this, preventDefault() {}, stopImmediatePropagation() {}, ...fields };
    for (const { handler } of [...(this.listeners[type] || [])].sort((a, b) => Number(b.capture) - Number(a.capture))) handler(event);
  }
  focus() { document.activeElement = this; }
}
const previous = { Node: globalThis.Node, document: globalThis.document, MutationObserver: globalThis.MutationObserver, fetch: globalThis.fetch };
globalThis.Node = Element;
globalThis.document = { createElement: tag => new Element(tag), createTextNode: text => new Element('#text', text) };
globalThis.MutationObserver = class { observe() {} };
globalThis.fetch = () => { throw Error('No network allowed in V4 checks'); };
const tools = [['continue','continue'],['windsurf','windsurf'],['huggingchat','huggingchat'],['lm-studio','lmstudio'],['open-webui','openwebui'],['n8n','n8n'],['ollama','ollama'],['zed','zed'],['cherry-studio','cherry-studio'],['antigravity','antigravity'],['deepseek','deepseek'],['hermes-agent','hermes-agent'],['pi-coding-agent','pi-coding-agent']];
const documentText = fs.readFileSync('design/era-slots-v4.md', 'utf8');
const rows = documentText.split('\n').filter(line => /^\| [a-z0-9].* \| (?:side-panel|top-dropdown|input-bar|settings|slash-command|none|other) \|/.test(line)).map(line => line.split('|').slice(1, 5).map(cell => cell.trim()));
const expected = new Map(rows.map(([id, where, slot, input]) => [id, { where, slot, input }]));
assert.equal(expected.size, 100);
const trees = new Map();
let totalSlots = 0, totalInputs = 0;
for (const [id, file] of tools) {
  const { render } = await import(new URL(`web/js/tools/${file}.js`, base));
  await test(`${id}: every era version has the documented slots and real input markers`, () => {
    const spec = JSON.parse(fs.readFileSync(`design/specs/${id}.json`, 'utf8'));
    const era = JSON.parse(fs.readFileSync(`design/era/${id}.json`, 'utf8'));
    assert.deepEqual(spec.versions.map(v => v.id), era.versions.map(v => v.id));
    for (const version of spec.versions) {
      const root = render({ tool: { id, name: id }, version, model: { name: '記録のモデル' }, messages: [], open() {}, newChat() {}, send() {} });
      trees.set(version.id, root);
      const row = expected.get(version.id);
      assert.equal(row.where, era.versions.find(v => v.id === version.id).model_switch.where);
      assert.equal(root.attrs['data-spec-version'], version.id);
      const slots = root.querySelectorAll('[data-era-slot]');
      assert.deepEqual(slots.map(node => node.attrs['data-era-slot']), row.slot === '—' ? [] : [row.slot], version.id);
      assert.ok(slots.every(node => node.querySelectorAll('select').length === 0 && node.querySelectorAll('button').length === 0), 'V1 owns model controls');
      const inputs = root.querySelectorAll('[data-era-input]');
      assert.equal(inputs.length, row.input === 'あり' ? 1 : 0, version.id);
      assert.ok(inputs.every(node => node.tagName === 'textarea' && node.closest('.composer')));
      assert.equal(root.querySelectorAll('.composer textarea').length, inputs.length, version.id);
      assert.equal(root.querySelectorAll('.model-control').length, 0);
      assert.equal(root.querySelectorAll('[data-native-model]').length, 0);
      totalSlots += slots.length; totalInputs += inputs.length;
    }
  });
}
const clickLabel = (root, label) => {
  const node = root.querySelectorAll('button').find(button => button.textContent === label);
  assert.ok(node, label); node.fire('click'); return node;
};
await test('HuggingChat: card and settings open the same persistent model region', () => {
  for (const id of ['huggingchat-2023-08', 'huggingchat-2024-02', 'huggingchat-2024-09']) {
    const root = trees.get(id), slot = root.querySelector('[data-era-slot]'), region = slot.parent;
    assert.equal(region.hidden, true);
    const mounted = new Element('button', 'V1の選択器'); slot.append(mounted);
    const card = clickLabel(root, 'モデルを選ぶ');
    assert.equal(region.hidden, false); assert.equal(card.attrs['aria-expanded'], 'true');
    clickLabel(region, '閉じる');
    assert.equal(region.hidden, true); assert.equal(document.activeElement, card);
    clickLabel(root, '⚙ 設定'); assert.equal(region.hidden, false);
    assert.equal(root.querySelector('[data-era-slot]'), slot); assert.equal(slot.children[0], mounted);
  }
});
await test('n8n: node settings retain the mounted slot across closing and selecting nodes', () => {
  for (const [id, root] of trees) {
    if (!id.startsWith('n8n-')) continue;
    const slot = root.querySelector('[data-era-slot]');
    const mounted = new Element('button', 'V1の選択器'); slot.append(mounted);
    clickLabel(root, '最初の処理を追加');
    clickLabel(root, id === 'n8n-2023-10' ? 'OpenAI' : 'OpenAI Chat Model');
    assert.equal(root.querySelector('.d3-node-details').hidden, false); assert.equal(slot.parent.hidden, false);
    clickLabel(root, '閉じる'); assert.equal(root.querySelector('.d3-node-details').hidden, true);
    clickLabel(root, '会話の開始'); assert.equal(slot.parent.hidden, true);
    clickLabel(root, id === 'n8n-2023-10' ? 'OpenAI' : 'OpenAI Chat Model');
    assert.equal(slot.parent.hidden, false); assert.equal(root.querySelector('[data-era-slot]'), slot);
    assert.equal(slot.children[0], mounted);
  }
});
await test('Windsurf Arena: dynamically added comparison input also has a marker', () => {
  const root = trees.get('windsurf-2026-01');
  const mode = root.querySelectorAll('select').find(node => node.attrs['aria-label'] === '会話の送り方');
  mode.value = '別々に進める'; mode.fire('change');
  assert.equal(root.querySelectorAll('[data-era-input]').length, 2);
  assert.equal(root.querySelectorAll('.composer textarea').length, 2);
  mode.value = '同時に送る'; mode.fire('change');
  assert.equal(root.querySelectorAll('[data-era-input]').length, 1);
});
await test('Open WebUI: the early fieldset can disable a later-mounted control', () => {
  const root = trees.get('open-webui-2023-10'), slot = root.querySelector('[data-era-slot]');
  assert.equal(slot.tagName, 'fieldset');
  slot.append(new Element('select'));
  root.querySelector('[data-era-input]').value = '質問';
  root.querySelector('.composer').fire('keydown', { key: 'Enter', shiftKey: false, isComposing: false });
  assert.equal(slot.disabled, true);
});
await test('all 13 renderers delegate the primary picker; documentation covers all 100 versions', () => {
  for (const [, file] of tools) assert.doesNotMatch(fs.readFileSync(`web/js/tools/${file}.js`, 'utf8'), /S\.picker\(|pickNative/);
  assert.equal(trees.size, 100); assert.equal(totalSlots, 58); assert.equal(totalInputs, 98);
  assert.equal(rows.filter(row => row[1] === 'slash-command').length, 20);
  assert.equal(rows.filter(row => row[1] === 'none').length, 4);
  assert.equal(rows.filter(row => row[1] === 'other' && row[2] === '—').length, 18);
});
console.log(`V4 coverage: ${tools.length} renderers, ${trees.size} versions, ${totalSlots} slots, ${totalInputs} marked inputs`);
for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
```
<!-- v4-check:end -->

## 確認結果と状態

- 完了：13ファイルの構文確認、主モデル選択の委譲、入力の目印、既知の場所への目印、必要な設定欄、100版の記録。
- 一部：18版の設置場所は元資料でも unverified のため、推測せず記録だけを残した。
- 未実施：ブラウザーでの見た目の確認、V1を含む結合確認、ビルド。禁止されたアプリやサーバーは起動していない。

最終の構文確認は上記のfor文を実行。終了コード0、標準出力なし。実行環境のエラー表示は Node.js v22.17.0。

オフライン検査は上記の抽出コマンドで実行。最初は検査用の仮のdocumentを早く片付ける問題を修正。次の実行ではDeepSeekの受け口に検索ボタンが含まれる点を検出し、受け口を分けた。その後の最終結果は終了コード0：

```text
V4 coverage: 13 renderers, 100 versions, 58 slots, 98 marked inputs
1..18
# tests 18
# suites 0
# pass 18
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

この検査は小さな要素ツリーで属性・開閉処理・受け口の保持を確認する。ブラウザーの寸法、実際のMutationObserverによる更新、fieldsetの子要素の無効化の見た目、V1の選択器や命令の実行は検証しない。
