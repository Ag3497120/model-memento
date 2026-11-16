# V3：モデル操作の位置の印

対象は8つの描画ファイル、計80版。参照したのは各 `design/era/<tool-id>.json` の `model_switch`。各行の資料URLはその項目の `sources` に対応する。今回は資料URLへ再アクセスせず、供給されたJSONと描画結果の対応を確認した。

描画側は空の `data-era-slot` と入力の `data-era-input` を提供する。選択候補・選択の保存・終了と再起動の再現はV1が担当する。Mementoのモデル一覧へ直接送っていたボタンを削除した。Copilotの「実行方式を選ぶ」はモデルとは別の操作なので、既存の作業画面へつなぎ直した。

`none` の2版と、配置・操作が未確認の `other` の14版にはモデル用slotを作らない。モデル名、全候補、既定値を新しく推定していない。入力印の数は実際に描画した要素の数であり、設定の検索欄やコメント欄は数えない。

| 作業項目 | 状態 | 確認 |
| --- | --- | --- |
| 80版の位置・入力への印 | done | 下表とオフライン描画確認 |
| 描画側のMemento用モデル切替を削除 | done | 8ファイルにS.picker呼出とmodelsへの直結なし |
| 必要な設定・会話・一覧の開閉先 | done | 設定、キー操作、会話の往復をオフラインで確認 |
| 各JSの構文確認 | done | node --check：8/8、終了コード0 |
| 版ごとの記録 | done | このファイルに80行 |
| V1との完全な操作接続 | partly | 下記の共有ファイル側の未対応あり |
| 実ブラウザーの見た目、全体ビルド | not done | アプリ・サーバー起動と担当外ファイルへの出力を避けるため実行せず |

## 版ごとの印

「入力」は `data-era-input` の数。「未確認」は元JSONの空欄・null・unverifiedをそのまま扱う。候補が記録されている場合も、その完全性や利用者ごとの提供状況を今回再調査していない。

### web/js/tools/codex.js

元データ：`design/era/openai-codex-cli.json`

| 版 | model_switch.where | data-era-slot | 入力 | 記した場所・未確認項目 | 資料 |
| --- | --- | --- | ---: | --- | --- |
| `openai-codex-cli-2025-04` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 | [1](https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/model-overlay.tsx) [2](https://github.com/openai/codex/commit/33d0d73b822abeae87cec07f2c2901ff900e434f) [3](https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/utils/model-utils.ts) [4](https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/README.md) [5](https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/chat/terminal-chat-input.tsx) |
| `openai-codex-cli-2025-06` | `cli-flag` | `input-right` | 1 | 端末入力の脇。終了・--model指定・再起動の画面内再現をV1が表示する場所。 | [1](https://raw.githubusercontent.com/openai/codex/rust-v0.2.0/codex-rs/tui/src/cli.rs) [2](https://github.com/openai/codex/releases/tag/rust-v0.2.0) [3](https://raw.githubusercontent.com/openai/codex/rust-v0.2.0/codex-rs/core/src/flags.rs) |
| `openai-codex-cli-2025-09` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：既定値。 | [1](https://raw.githubusercontent.com/openai/codex/rust-v0.36.0/codex-rs/tui/src/slash_command.rs) [2](https://github.com/openai/codex/releases/tag/rust-v0.36.0) [3](https://raw.githubusercontent.com/openai/codex/rust-v0.36.0/codex-rs/common/src/model_presets.rs) |
| `openai-codex-macos-2025-10` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://openai.com/index/introducing-the-codex-app/) |
| `openai-codex-macos-2026-02` | `input-bar` | `input-left` | 1 | 会話の入力欄の左。 未確認：共通の表示名・既定値。 | [1](https://learn.chatgpt.com/docs/changelog) |
| `openai-codex-cli-2026-02` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：既定値。 | [1](https://raw.githubusercontent.com/openai/codex/rust-v0.101.0/codex-rs/tui/src/slash_command.rs) [2](https://github.com/openai/codex/releases/tag/rust-v0.101.0) [3](https://raw.githubusercontent.com/openai/codex/rust-v0.101.0/codex-rs/core/models.json) [4](https://learn.chatgpt.com/docs/changelog) |
| `openai-codex-macos-2026-04` | `input-bar` | `input-left` | 1 | 会話の入力欄の左。 未確認：共通の表示名・既定値。 | [1](https://learn.chatgpt.com/docs/changelog) |
| `openai-codex-cli-2026-06` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：既定値。 | [1](https://raw.githubusercontent.com/openai/codex/rust-v0.140.0/codex-rs/tui/src/slash_command.rs) [2](https://github.com/openai/codex/releases/tag/rust-v0.140.0) [3](https://raw.githubusercontent.com/openai/codex/rust-v0.140.0/codex-rs/models-manager/models.json) |
| `openai-codex-cli-2026-09` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：既定値。 | [1](https://raw.githubusercontent.com/openai/codex/rust-v0.150.0/codex-rs/tui/src/slash_command.rs) [2](https://github.com/openai/codex/releases/tag/rust-v0.150.0) [3](https://raw.githubusercontent.com/openai/codex/rust-v0.150.0/codex-rs/models-manager/models.json) |
| `openai-codex-cli-2026-11` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：既定値。 | [1](https://raw.githubusercontent.com/openai/codex/rust-v0.159.0/codex-rs/tui/src/slash_command.rs) [2](https://github.com/openai/codex/releases/tag/rust-v0.159.0) [3](https://raw.githubusercontent.com/openai/codex/rust-v0.159.0/codex-rs/models-manager/models.json) |

### web/js/tools/opencode.js

元データ：`design/era/opencode.json`

| 版 | model_switch.where | data-era-slot | 入力 | 記した場所・未確認項目 | 資料 |
| --- | --- | --- | ---: | --- | --- |
| `opencode-2025-06` | `other` | `panel` | 1 | Ctrl+Oで開く一覧用のpanel。キーと見出しから開く。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/anomalyco/opencode/v0.0.55/packages/tui/internal/tui/tui.go) [2](https://raw.githubusercontent.com/anomalyco/opencode/v0.0.55/packages/tui/internal/tui/components/dialog/models.go) [3](https://github.com/anomalyco/opencode/releases/tag/v0.0.55) |
| `opencode-2025-09` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/anomalyco/opencode/v0.9.1/packages/tui/internal/commands/command.go) [2](https://github.com/anomalyco/opencode/releases/tag/v0.9.1) |
| `opencode-2025-10` | `other` | `panel` | 1 | Ctrl+Pの操作一覧内のpanel。Switch modelの中身はV1が担当。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/anomalyco/opencode/v1.0.0/packages/opencode/src/cli/cmd/tui/app.tsx) [2](https://github.com/anomalyco/opencode/releases/tag/v1.0.0) |
| `opencode-2025-11-macos` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://github.com/anomalyco/opencode/releases/tag/v1.0.75) |
| `opencode-2025-12` | `input-bar` | `input-left` | 1 | 入力欄の下の操作列。Choose modelのMemento用ボタンを削除。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/anomalyco/opencode/v1.0.218/packages/app/src/components/prompt-input.tsx) [2](https://github.com/anomalyco/opencode/releases/tag/v1.0.218) |
| `opencode-2026-02` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/anomalyco/opencode/v1.1.54/packages/opencode/src/cli/cmd/tui/app.tsx) [2](https://github.com/anomalyco/opencode/releases/tag/v1.1.54) |
| `opencode-2026-04` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/anomalyco/opencode/v1.4.6/packages/opencode/src/cli/cmd/tui/app.tsx) [2](https://github.com/anomalyco/opencode/releases/tag/v1.4.6) |
| `opencode-2026-08` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/anomalyco/opencode/v1.18.19/packages/tui/src/app.tsx) [2](https://github.com/anomalyco/opencode/releases/tag/v1.18.19) |
| `opencode-2026-11` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/anomalyco/opencode/v2.3.0/packages/tui/src/app.tsx) [2](https://github.com/anomalyco/opencode/releases/tag/v2.3.0) |

### web/js/tools/openclaw.js

元データ：`design/era/openclaw-formerly-clawdbot-moltbot.json`

| 版 | model_switch.where | data-era-slot | 入力 | 記した場所・未確認項目 | 資料 |
| --- | --- | --- | ---: | --- | --- |
| `openclaw-formerly-clawdbot-moltbot-2025-11` | `none` | なし | 1 | 切替なし。モデル用slotを作らない。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://raw.githubusercontent.com/openclaw/openclaw/v0.1.1/README.md) |
| `openclaw-clawdbot-2026-01` | `settings` | `settings` | 1 | 左のConfig入口に小さく開閉する設定を追加し、その中。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/openclaw/openclaw/aa45f512f4bb376a060b4642b4b27b358573f710/docs/control-ui.md) [2](https://raw.githubusercontent.com/openclaw/openclaw/aa45f512f4bb376a060b4642b4b27b358573f710/docs/configuration.md) |
| `openclaw-moltbot-2026-01` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/openclaw/openclaw/fdcac0ccf44704f384f891f8c1016af531e88cb9/docs/tools/slash-commands.md) [2](https://raw.githubusercontent.com/openclaw/openclaw/fdcac0ccf44704f384f891f8c1016af531e88cb9/docs/web/control-ui.md) |
| `openclaw-formerly-clawdbot-moltbot-2026-01` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/openclaw/openclaw/v2026.1.30/docs/tools/slash-commands.md) [2](https://raw.githubusercontent.com/openclaw/openclaw/v2026.1.30/docs/web/control-ui.md) |
| `openclaw-2026-03-macos` | `other` | `input-right` | 2 | 「会話を開く」で表示する別会話の入力脇。音声入力の文章にも入力印。メニューバーにモデル一覧を置かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/openclaw/openclaw/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/platforms/mac/menu-bar.md) [2](https://raw.githubusercontent.com/openclaw/openclaw/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/platforms/mac/webchat.md) [3](https://raw.githubusercontent.com/openclaw/openclaw/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/tools/slash-commands.md) |
| `openclaw-2026-06` | `top-dropdown` | `top` | 1 | 会話の上部の操作列。既存のMemento用Modelボタンを削除。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/openclaw/openclaw/fd806ada649a124d44bffa4850b0da19b739e6e4/docs/web/control-ui.md) |
| `openclaw-formerly-clawdbot-moltbot-2026-08` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://raw.githubusercontent.com/openclaw/openclaw/v2026.8.1/docs/web/control-ui.md) |
| `openclaw-2026-09` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://raw.githubusercontent.com/openclaw/openclaw/52823e567a69f7a6447f0246fd1c9989373103da/docs/web/control-ui/chat.md) [2](https://raw.githubusercontent.com/openclaw/openclaw/52823e567a69f7a6447f0246fd1c9989373103da/docs/web/control-ui.md) [3](https://raw.githubusercontent.com/openclaw/openclaw/52823e567a69f7a6447f0246fd1c9989373103da/ui/src/pages/chat/chat-pane-session-controls.ts) |
| `openclaw-2026-11` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://raw.githubusercontent.com/openclaw/openclaw/ecaefd29e7f1a23657de41a7eb217ba083c477be/docs/web/control-ui.md) |

### web/js/tools/aider.js

元データ：`design/era/aider.json`

| 版 | model_switch.where | data-era-slot | 入力 | 記した場所・未確認項目 | 資料 |
| --- | --- | --- | ---: | --- | --- |
| `aider-2023-05` | `cli-flag` | `input-right` | 1 | 端末入力の脇。終了・--model指定・再起動の画面内再現をV1が表示する場所。 | [1](https://raw.githubusercontent.com/Aider-AI/aider/v0.5.0/aider/main.py) [2](https://github.com/Aider-AI/aider/releases/tag/v0.5.0) |
| `aider-2023-11` | `cli-flag` | `input-right` | 1 | 端末入力の脇。終了・--model指定・再起動の画面内再現をV1が表示する場所。 | [1](https://raw.githubusercontent.com/Aider-AI/aider/v0.18.0/aider/main.py) [2](https://github.com/Aider-AI/aider/releases/tag/v0.18.0) |
| `aider-2023-12` | `cli-flag` | `input-right` | 1 | 端末入力の脇。終了・--model指定・再起動の画面内再現をV1が表示する場所。 | [1](https://raw.githubusercontent.com/Aider-AI/aider/v0.19.0/aider/main.py) [2](https://github.com/Aider-AI/aider/releases/tag/v0.19.0) |
| `aider-2024-05` | `cli-flag` | `panel` | 1 | 起動元の端末（再現）を開く場所の中。ブラウザー内に常設の選択欄を作らない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/Aider-AI/aider/v0.31.0/aider/gui.py) [2](https://github.com/Aider-AI/aider/releases/tag/v0.31.0) [3](https://raw.githubusercontent.com/Aider-AI/aider/v0.31.0/aider/main.py) |
| `aider-2024-06` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧。 | [1](https://raw.githubusercontent.com/Aider-AI/aider/v0.39.0/aider/commands.py) [2](https://github.com/Aider-AI/aider/releases/tag/v0.39.0) [3](https://raw.githubusercontent.com/Aider-AI/aider/v0.39.0/aider/models.py) |
| `aider-2024-10` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/Aider-AI/aider/v0.59.0/aider/commands.py) [2](https://github.com/Aider-AI/aider/releases/tag/v0.59.0) |
| `aider-2025-01` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/Aider-AI/aider/v0.72.0/aider/commands.py) [2](https://github.com/Aider-AI/aider/releases/tag/v0.72.0) |
| `aider-2025-04` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/Aider-AI/aider/v0.82.0/aider/commands.py) [2](https://github.com/Aider-AI/aider/releases/tag/v0.82.0) |
| `aider-2025-09` | `cli-flag` | `panel` | 1 | 起動元の端末（再現）を開く場所の中。ブラウザー内に常設の選択欄を作らない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/Aider-AI/aider/v0.86.0/aider/gui.py) [2](https://github.com/Aider-AI/aider/releases/tag/v0.86.0) [3](https://raw.githubusercontent.com/Aider-AI/aider/v0.86.0/aider/main.py) |
| `aider-2026-03` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://github.com/Aider-AI/aider/releases/tag/v0.86.0) |
| `aider-2026-11` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://github.com/Aider-AI/aider/releases/tag/v0.86.0) |

### web/js/tools/gemini-cli.js

元データ：`design/era/gemini-cli.json`

| 版 | model_switch.where | data-era-slot | 入力 | 記した場所・未確認項目 | 資料 |
| --- | --- | --- | ---: | --- | --- |
| `gemini-cli-2025-06-25` | `cli-flag` | `input-right` | 1 | 端末入力の脇。終了・--model指定・再起動の画面内再現をV1が表示する場所。 | [1](https://raw.githubusercontent.com/google-gemini/gemini-cli/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/docs/cli/configuration.md) [2](https://raw.githubusercontent.com/google-gemini/gemini-cli/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/core/src/config/models.ts) [3](https://github.com/google-gemini/gemini-cli/commit/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd) |
| `gemini-cli-2025-08` | `cli-flag` | `input-right` | 1 | 端末入力の脇。終了・--model指定・再起動の画面内再現をV1が表示する場所。 | [1](https://raw.githubusercontent.com/google-gemini/gemini-cli/6037cb5d60b8e31b92315dd86fc65dbc57316376/docs/cli/configuration.md) [2](https://raw.githubusercontent.com/google-gemini/gemini-cli/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/core/src/config/models.ts) [3](https://github.com/google-gemini/gemini-cli/commit/6037cb5d60b8e31b92315dd86fc65dbc57316376) |
| `gemini-cli-2025-10` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：既定値。 | [1](https://raw.githubusercontent.com/google-gemini/gemini-cli/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/ModelDialog.tsx) [2](https://raw.githubusercontent.com/google-gemini/gemini-cli/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/core/src/config/models.ts) [3](https://github.com/google-gemini/gemini-cli/commit/8c74be79c58a0c344d4eb05c72b649a49cb44cae) |
| `gemini-cli-2026-01` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：既定値。 | [1](https://raw.githubusercontent.com/google-gemini/gemini-cli/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/ModelDialog.tsx) [2](https://raw.githubusercontent.com/google-gemini/gemini-cli/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/core/src/config/models.ts) [3](https://raw.githubusercontent.com/google-gemini/gemini-cli/beacc4f6fd102fd969239ffddb6c092631cd0481/docs/cli/commands.md) [4](https://github.com/google-gemini/gemini-cli/commit/beacc4f6fd102fd969239ffddb6c092631cd0481) |
| `gemini-cli-2026-03` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/google-gemini/gemini-cli/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/ModelDialog.tsx) [2](https://raw.githubusercontent.com/google-gemini/gemini-cli/fc03891a113da762175011f4e8e93acd0da49b0d/packages/core/src/config/models.ts) [3](https://raw.githubusercontent.com/google-gemini/gemini-cli/fc03891a113da762175011f4e8e93acd0da49b0d/docs/reference/commands.md) [4](https://github.com/google-gemini/gemini-cli/commit/fc03891a113da762175011f4e8e93acd0da49b0d) |
| `gemini-cli-2026-07` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/google-gemini/gemini-cli/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/ModelDialog.tsx) [2](https://raw.githubusercontent.com/google-gemini/gemini-cli/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/core/src/config/models.ts) [3](https://raw.githubusercontent.com/google-gemini/gemini-cli/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/docs/reference/commands.md) [4](https://github.com/google-gemini/gemini-cli/commit/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb) |
| `gemini-cli-2026-11` | `slash-command` | `input-right` | 1 | 端末・会話の入力に入力印。input-rightは一覧を出すための空の受け皿で、常設ボタンは描かない。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/google-gemini/gemini-cli/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/ModelDialog.tsx) [2](https://raw.githubusercontent.com/google-gemini/gemini-cli/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/core/src/config/models.ts) [3](https://raw.githubusercontent.com/google-gemini/gemini-cli/6814e00d6b148c3a1d57244d5d7040f7c541009d/docs/reference/commands.md) [4](https://github.com/google-gemini/gemini-cli/commit/6814e00d6b148c3a1d57244d5d7040f7c541009d) |

### web/js/tools/cursor.js

元データ：`design/era/cursor.json`

| 版 | model_switch.where | data-era-slot | 入力 | 記した場所・未確認項目 | 資料 |
| --- | --- | --- | ---: | --- | --- |
| `cursor-2023-03` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://cursor.com/changelog/0-1-12) |
| `cursor-2023-04` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://cursor.com/changelog/0-2-0) |
| `cursor-2023-10` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://cursor.com/changelog/0-12-0) |
| `cursor-2024-03` | `input-bar` | `input-left` | 2 | 右の会話入力の下。コード内の質問欄にも入力印。追加候補の設定は既存の設定入口を維持。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://cursor.com/changelog/0-30-x) [2](https://forum.cursor.com/t/multiple-ux-improvements-windows/4409) |
| `cursor-2024-07` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：共通の表示名・既定値。 | [1](https://web.archive.org/web/20240717223634id_/https://docs.cursor.com/advanced/models) |
| `cursor-2024-08` | `input-bar` | `input-left` | 2 | 右の「会話」入力の下。浮遊Composerの位置はunverifiedのため、そこにslotを付けない。両方の入力に印。 未確認：共通の表示名・既定値。 | [1](https://web.archive.org/web/20240823050942id_/https://docs.cursor.com/advanced/models) |
| `cursor-2024-11` | `input-bar` | `input-left` | 2 | 既存Composer内に最小の「会話」を開く場所を追加し、その入力の下に配置。Composer Agentの候補を推定しない。 未確認：共通の表示名・既定値。 | [1](https://web.archive.org/web/20250116152422id_/https://docs.cursor.com/advanced/models) |
| `cursor-2025-02` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://cursor.com/changelog/0-46-x) |
| `cursor-2025-03` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：候補一覧・既定値。 | [1](https://web.archive.org/web/20250323232600id_/https://docs.cursor.com/settings/models) |
| `cursor-2025-06` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://forum.cursor.com/t/introducing-cursor-on-web-mobile/111183) |
| `cursor-2025-10` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://cursor.com/changelog/2-0) |
| `cursor-2026-01-macos` | `other` | `panel` | 1 | Cmd+/またはCtrl+/で開く一覧用のpanel。配置はunverifiedと明記した仮の入口。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://forum.cursor.com/t/shortcuts-to-quickly-change-model/148400) |
| `cursor-2026-04` | `other` | `panel` | 1 | 配置未確認の入口→考える量と設定→モデルの一覧、という開閉先のpanel。実画面上の起点はunverified。 未確認：候補一覧・既定値。 | [1](https://forum.cursor.com/t/model-selector-in-chat-is-worse-with-new-update/167298/9) |
| `cursor-2026-11` | `input-bar` | `input-left` | 1 | 会話入力の上端。元の音声・送信の切替を維持。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://cursor.com/docs/agent/prompting) |

### web/js/tools/copilot.js

元データ：`design/era/github-copilot-vs-code.json`

| 版 | model_switch.where | data-era-slot | 入力 | 記した場所・未確認項目 | 資料 |
| --- | --- | --- | ---: | --- | --- |
| `github-copilot-vs-code-2021-06` | `other` | なし | 0 | 元のコード補完だけの画面を維持。入力欄を描いていないため入力印もslotもなし。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/) |
| `github-copilot-vs-code-2023-03` | `other` | なし | 2 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://github.blog/news-insights/product-news/github-copilot-x-the-ai-powered-developer-experience/) |
| `github-copilot-vs-code-2023-07` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://github.blog/news-insights/product-news/github-copilot-chat-beta-now-available-for-every-organization/) |
| `github-copilot-vs-code-2024-05` | `other` | なし | 1 | 配置・操作はunverified。後年の切替欄を付けず、入力印だけ付ける。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://github.blog/news-insights/product-news/introducing-github-copilot-extensions/) |
| `github-copilot-vs-code-2024-10` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：共通の表示名・既定値。 | [1](https://github.blog/news-insights/product-news/bringing-developer-choice-to-copilot/) [2](https://raw.githubusercontent.com/microsoft/vscode/1.95.0/src/vs/workbench/contrib/chat/browser/chatInputPart.ts) |
| `github-copilot-vs-code-2025-02` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：共通の表示名・既定値。 | [1](https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode) [2](https://raw.githubusercontent.com/microsoft/vscode/1.97.0/src/vs/workbench/contrib/chat/browser/chatInputPart.ts) |
| `github-copilot-vs-code-2025-04` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://code.visualstudio.com/blogs/2025/04/07/agentMode) [2](https://raw.githubusercontent.com/microsoft/vscode/1.99.0/src/vs/workbench/contrib/chat/browser/chatInputPart.ts) |
| `github-copilot-vs-code-2025-07` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://code.visualstudio.com/updates/v1_102) [2](https://raw.githubusercontent.com/microsoft/vscode/1.102.0/src/vs/workbench/contrib/chat/browser/chatInputPart.ts) |
| `github-copilot-vs-code-2026-02` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://code.visualstudio.com/updates/v1_109) [2](https://raw.githubusercontent.com/microsoft/vscode/1.109.0/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts) |
| `github-copilot-vs-code-2026-05` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://code.visualstudio.com/updates/v1_120) [2](https://raw.githubusercontent.com/microsoft/vscode/1.120.0/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts) |
| `github-copilot-vs-code-2026-11` | `input-bar` | `input-left` | 1 | 会話入力の下の操作列。既存のMemento用モデルボタンを削除。 未確認：共通の表示名・候補一覧・既定値。 | [1](https://code.visualstudio.com/updates/v1_145) [2](https://raw.githubusercontent.com/microsoft/vscode/1.145.0/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts) |

### web/js/tools/cline.js

元データ：`design/era/cline-formerly-claude-dev.json`

| 版 | model_switch.where | data-era-slot | 入力 | 記した場所・未確認項目 | 資料 |
| --- | --- | --- | ---: | --- | --- |
| `cline-formerly-claude-dev-2024-07` | `none` | なし | 1 | 切替なし。モデル用slotを作らない。 未確認：共通の表示名・候補一覧。 | [1](https://raw.githubusercontent.com/cline/cline/v1.0.4/src/ClaudeDev.ts) [2](https://raw.githubusercontent.com/cline/cline/v1.0.4/webview-ui/src/components/SettingsView.tsx) |
| `cline-formerly-claude-dev-2024-10` | `settings` | `settings` | 1 | Cline見出しの歯車が開く小さな設定内。 未確認：既定値。 | [1](https://raw.githubusercontent.com/cline/cline/v2.0.0/webview-ui/src/components/settings/ApiOptions.tsx) [2](https://raw.githubusercontent.com/cline/cline/v2.0.0/src/shared/api.ts) |
| `cline-2024-12` | `settings` | `settings` | 1 | Cline見出しの歯車が開く小さな設定内。 未確認：既定値。 | [1](https://raw.githubusercontent.com/cline/cline/v3.0.0/webview-ui/src/components/settings/ApiOptions.tsx) [2](https://raw.githubusercontent.com/cline/cline/v3.0.0/src/shared/api.ts) |
| `cline-2025-01` | `input-bar` | `input-left` | 1 | 入力欄の下、Plan/Actと同じ列。Memento用の切替を削除。 未確認：共通の表示名・既定値。 | [1](https://github.com/cline/cline/releases/tag/v3.2.0) [2](https://raw.githubusercontent.com/cline/cline/v3.2.0/webview-ui/src/components/chat/ChatTextArea.tsx) [3](https://raw.githubusercontent.com/cline/cline/v3.2.0/src/shared/api.ts) |
| `cline-formerly-claude-dev-2025-02` | `input-bar` | `input-left` | 1 | 外部ツール一覧から「会話に戻る」で開く最小の会話を追加。入力の下に配置し、一覧へ戻れる。 未確認：共通の表示名・既定値。 | [1](https://raw.githubusercontent.com/cline/cline/v3.4.0/webview-ui/src/components/chat/ChatTextArea.tsx) [2](https://raw.githubusercontent.com/cline/cline/v3.4.0/src/shared/api.ts) |
| `cline-2025-07` | `input-bar` | `input-left` | 1 | 入力欄の下、Plan/Actと同じ列。Memento用の切替を削除。 未確認：既定値。 | [1](https://raw.githubusercontent.com/cline/cline/v3.19.4/webview-ui/src/components/chat/ChatTextArea.tsx) [2](https://raw.githubusercontent.com/cline/cline/v3.19.4/src/shared/api.ts) |
| `cline-2025-11` | `input-bar` | `input-left` | 1 | 入力欄の下、Plan/Actと同じ列。Memento用の切替を削除。 未確認：既定値。 | [1](https://raw.githubusercontent.com/cline/cline/v3.36.0/webview-ui/src/components/chat/ChatTextArea.tsx) [2](https://raw.githubusercontent.com/cline/cline/v3.36.0/src/shared/api.ts) |
| `cline-2026-04` | `settings` | `settings` | 1 | 入力欄下のモデル名が開く設定内。見出しの歯車からも開く。 未確認：候補一覧・既定値。 | [1](https://raw.githubusercontent.com/cline/cline/v3.78.0/webview-ui/src/components/chat/ChatTextArea.tsx) |
| `cline-2026-11` | `settings` | `settings` | 1 | 入力欄下のモデル名が開く設定内。既存Local/Cloudの切替と同じ設定に配置。 未確認：候補一覧・既定値。 | [1](https://github.com/cline/cline/releases/tag/v4.1.26) [2](https://raw.githubusercontent.com/cline/cline/v4.1.26/apps/vscode/webview-ui/src/components/chat/ChatTextArea.tsx) |

## レビュアーへの引継ぎ

確認時点の `web/js/era/model-switch.js` は、以下をまだ接続していない。この共有ファイルは担当外のため編集していない。

- OpenCodeの `/models`：`handleCommand('/models')` はfalse。2025-09、2026-02、2026-04、2026-08、2026-11が対象。V1が各版のlabelを見て入力を処理する必要がある。根拠URLは各版の表の行を参照。
- `other` の既知の手順：`opencode-2025-06`、`opencode-2025-10`、`openclaw-2026-03-macos`、`cursor-2026-01-macos`、`cursor-2026-04`。描画側の開閉先・印はあるが、V1の `mounted` はfalse。OpenClawのmacOS版は「会話を開く」後の入力で `/model` を扱う必要がある。Cursorの2版は位置が未確認なので、仮の入口を実画面の確認済み配置と解釈しないこと。
- 再起動の表示はV1が `era.tool_id + ' --model'` から組み立てている。確認出力はCodexで `openai-codex-cli --model`、Gemini CLIで `gemini-cli --model`。実際の起動名としては未検証。Aiderのブラウザー2版は元データの手順にある `--browser` がV1の再起動表示から落ちる。V1側で起動手順を保持してほしい。
- 全体側の「threadとformは必ず1つ」という旧い構造検査を使う場合、複数の入力を持つCursor、外部ツールから会話へ戻れるCline、会話を別に開くOpenClawも扱えるか確認が必要。

## 実行した確認

構文確認コマンド（実行済み、終了コード0）：

```sh
for candidate in web/js/tools/codex.js web/js/tools/opencode.js web/js/tools/openclaw.js web/js/tools/aider.js web/js/tools/gemini-cli.js web/js/tools/cursor.js web/js/tools/copilot.js web/js/tools/cline.js; do node --check "$candidate" && printf 'PASS %s\n' "$candidate"; done
```

実出力：

```text
PASS web/js/tools/codex.js
PASS web/js/tools/opencode.js
PASS web/js/tools/openclaw.js
PASS web/js/tools/aider.js
PASS web/js/tools/gemini-cli.js
PASS web/js/tools/cursor.js
PASS web/js/tools/copilot.js
PASS web/js/tools/cline.js
```

標準ライブラリーだけのNode確認を下記の入力で実行した。通信は例外にし、描画80版、設定の開閉、Ctrl+O/Ctrl+P/Cmd+/・Ctrl+/、会話への往復、V1の標準方式への接続、実行コマンドを起動しない再起動の再現を検査した。実ブラウザーの描画検査ではない。

最初の試行は15件中12件成功・3件失敗。仮DOMのappendがnullを受ける処理と、ClawdbotにもClineと同じ入口があるとした検査を直した。製品コードの不具合として扱っていない。修正後の最終実行は終了コード0、実出力の集計は以下。

```text
1..17
# tests 17
# suites 0
# pass 17
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

再実行用の同じコマンド：

```sh
node --input-type=module <<'NODE'
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

class Element {
  constructor(tag = '#text', text = '') {
    this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.listeners = {};
    this.className = ''; this._text = text; this.style = {}; this.value = ''; this.open = false; this.hidden = false;
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      toggle: (name, force) => {
        const on = force ?? !this.classList.contains(name);
        const names = this.className.split(/\s+/).filter(n => n && n !== name);
        if (on) names.push(name); this.className = names.join(' '); return on;
      }
    };
  }
  setAttribute(key, value) { this.attrs[key] = String(value); if (key === 'hidden') this.hidden = true; }
  getAttribute(key) { return this.attrs[key] ?? null; }
  hasAttribute(key) { return Object.hasOwn(this.attrs, key); }
  addEventListener(type, fn, capture = false) { (this.listeners[type] ||= []).push({fn, capture}); }
  removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter(item => item.fn !== fn); }
  append(...nodes) { for (let node of nodes) { if (!(node instanceof Element)) node = new Element('#text', String(node)); node.remove(); node.parentNode = this; this.children.push(node); } }
  prepend(...nodes) { for (const node of [...nodes].reverse()) { node.remove(); node.parentNode = this; this.children.unshift(node); } }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(node => node !== this); this.parentNode = null; }
  before(...nodes) { if (!this.parentNode) return; const p = this.parentNode; for (const node of nodes) { node.remove(); const index = p.children.indexOf(this); p.children.splice(index, 0, node); node.parentNode = p; } }
  after(...nodes) { if (!this.parentNode) return; const p = this.parentNode; for (const node of [...nodes].reverse()) { node.remove(); const index = p.children.indexOf(this); p.children.splice(index + 1, 0, node); node.parentNode = p; } }
  replaceChildren(...nodes) { for (const child of [...this.children]) child.remove(); this._text = ''; this.append(...nodes); }
  get textContent() { return this._text + this.children.map(node => node.textContent).join(''); }
  set textContent(value) { this.replaceChildren(); this._text = String(value); }
  matches(selector) {
    const attr = selector.match(/\[([^=\]]+)(?:=["']?([^"'\]]*)["']?)?\]/);
    if (attr && (!this.hasAttribute(attr[1]) || (attr[2] !== undefined && this.getAttribute(attr[1]) !== attr[2]))) return false;
    const clean = selector.replace(/\[[^\]]+\]/g, '');
    const tag = clean.match(/^[a-zA-Z]+/);
    if (tag && this.tagName !== tag[0].toUpperCase()) return false;
    return [...clean.matchAll(/\.([\w-]+)/g)].every(match => this.classList.contains(match[1]));
  }
  querySelectorAll(selector) {
    const parts = selector.trim().split(/\s+/);
    return this.children.flatMap(node => [node, ...node.querySelectorAll('*')]).filter(node => {
      if (!node.matches(parts.at(-1))) return false;
      let p = node.parentNode;
      for (let i = parts.length - 2; i >= 0; i--) { while (p && !p.matches(parts[i])) p = p.parentNode; if (!p) return false; p = p.parentNode; }
      return true;
    });
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { for (let p = this; p; p = p.parentNode) if (p.matches(selector)) return p; return null; }
  emit(type, fields = {}) {
    const event = { target: this, key: '', preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...fields };
    const handlers = [...(this.listeners[type] || [])].sort((a,b) => Number(b.capture) - Number(a.capture));
    for (const {fn} of handlers) { fn(event); if (event.stopped) break; }
    return event;
  }
  focus() { document.activeElement = this; }
  click() { this.emit('click'); }
  showModal() { this.open = true; }
  close() { this.open = false; }
}
globalThis.Node = Element;
globalThis.document = { createElement: tag => new Element(tag), createTextNode: text => new Element('#text', text), activeElement: null };
globalThis.fetch = () => { throw new Error('Network is disabled in this check'); };
const tools = {
  codex: 'openai-codex-cli', opencode: 'opencode', openclaw: 'openclaw-formerly-clawdbot-moltbot',
  aider: 'aider', 'gemini-cli': 'gemini-cli', cursor: 'cursor', copilot: 'github-copilot-vs-code', cline: 'cline-formerly-claude-dev'
};
const rendered = new Map(), inventory = [];
let versionCount = 0;
for (const [name, toolId] of Object.entries(tools)) {
  const {render} = await import('./web/js/tools/' + name + '.js');
  const data = JSON.parse(fs.readFileSync('design/era/' + toolId + '.json', 'utf8'));
  test(name + ': all ' + data.versions.length + ' era records render with matching markers', () => {
    const source = fs.readFileSync('web/js/tools/' + name + '.js', 'utf8');
    assert.doesNotMatch(source, /S\.picker\s*\(/);
    assert.doesNotMatch(source, /['"]models['"]/);
    for (const version of data.versions) {
      const opened = [], sent = [];
      const root = render({tool: {id: toolId, name}, version: {...version, from: version.id.match(/\d{4}-\d{2}/)?.[0]},
        model: {name:'検証用'}, messages: [], open: route => opened.push(route), send: text => sent.push(text)});
      assert.equal(root.getAttribute('data-spec'), version.id);
      const inputs = root.querySelectorAll('[data-era-input]');
      const slots = root.querySelectorAll('[data-era-slot]').map(node => node.getAttribute('data-era-slot'));
      assert.ok(root.querySelectorAll('.composer textarea').every(node => node.hasAttribute('data-era-input')), version.id);
      if (version.id !== 'github-copilot-vs-code-2021-06') assert.ok(inputs.length > 0, version.id);
      const where = version.model_switch.where;
      if (where === 'input-bar') assert.ok(slots.includes('input-left') || slots.includes('input-right'), version.id);
      if (where === 'settings') assert.ok(slots.includes('settings'), version.id);
      if (where === 'top-dropdown') assert.ok(slots.includes('top'), version.id);
      if (where === 'cli-flag') assert.ok(slots.some(slot => ['input-left', 'input-right', 'panel'].includes(slot)), version.id);
      if (where === 'none') assert.equal(slots.length, 0, version.id);
      if (where === 'other' && !['opencode-2025-06', 'opencode-2025-10', 'openclaw-2026-03-macos', 'cursor-2026-01-macos', 'cursor-2026-04'].includes(version.id)) assert.equal(slots.length, 0, version.id);
      rendered.set(version.id, {root, version: {...version, tool_id:toolId}, opened, sent});
      inventory.push({id:version.id, where, slots, inputs:inputs.length});
      versionCount++;
    }
  });
}
test('settings slots stay inside expandable settings and model-name entrances open them', () => {
  for (const id of ['cline-formerly-claude-dev-2024-10','cline-2024-12','cline-2026-04','cline-2026-11','openclaw-clawdbot-2026-01']) {
    const {root} = rendered.get(id);
    const settings = root.querySelector('[data-era-slot="settings"]').closest('details');
    assert.ok(settings, id); assert.equal(settings.open, false);
    if (id.startsWith('cline-2026-')) {
      const entrance = root.querySelectorAll('button').find(node => node.textContent === '検証用');
      entrance.click(); assert.equal(settings.open, true, id);
    }
  }
});
test('OpenCode and Cursor keyboard paths reveal their model panels', () => {
  for (const [id, key, modifier] of [['opencode-2025-06','o','ctrlKey'],['opencode-2025-10','p','ctrlKey'],['cursor-2026-01-macos','/','metaKey'],['cursor-2026-01-macos','/','ctrlKey']]) {
    const {root} = rendered.get(id);
    const panel = root.querySelector('[data-era-slot="panel"]').closest('details');
    panel.open = false;
    assert.equal(root.emit('keydown', {key, [modifier]:true}).defaultPrevented, true);
    assert.equal(panel.open, true, id);
  }
});
test('OpenClaw opens and closes a chat with a marked prompt', () => {
  const {root} = rendered.get('openclaw-2026-03-macos');
  const chat = root.querySelector('.composer').closest('section');
  assert.equal(chat.hidden, true);
  root.querySelectorAll('button').find(node => node.textContent === '会話を開く').click();
  assert.equal(chat.hidden, false); assert.equal(document.activeElement, chat.querySelector('textarea'));
  chat.querySelector('button').click(); assert.equal(chat.hidden, true);
});
test('Cline tools view returns to chat and back without opening Memento models', () => {
  const {root, opened} = rendered.get('cline-formerly-claude-dev-2025-02');
  const market = root.querySelector('.d2-marketplace');
  const chat = root.querySelector('[data-era-input]').closest('section');
  assert.equal(chat.hidden, true);
  market.querySelectorAll('button').find(node => node.textContent === '会話に戻る').click();
  assert.equal(chat.hidden, false); assert.equal(market.hidden, true);
  chat.querySelector('button').click(); assert.equal(chat.hidden, true); assert.equal(market.hidden, false);
  assert.deepEqual(opened, []);
});
test('Cursor floating Composer has no inferred control; confirmed Chat has the slot', () => {
  const august = rendered.get('cursor-2024-08').root;
  assert.equal(august.querySelector('.cursor-cmdi-overlay').querySelectorAll('[data-era-slot]').length, 0);
  assert.equal(august.querySelector('[data-era-slot]').closest('section').querySelector('.panel-header').textContent, '会話');
  const november = rendered.get('cursor-2024-11').root;
  assert.ok(november.querySelector('[data-era-slot]').closest('details'));
  const latest = rendered.get('cursor-2026-11').root;
  assert.equal(latest.querySelector('.composer').children[0].getAttribute('data-era-slot'), 'input-left');
});
test('shared V1 control mounts standard controls and consumes /model before sending', async () => {
  const {mountModelSwitch} = await import('./web/js/era/model-switch.js');
  for (const {root, version, sent} of rendered.values()) {
    const where = version.model_switch.where;
    if (where === 'other' || where === 'none') continue;
    const mounted = mountModelSwitch(root, {era:version, currentModel:{name:'検証用'}, onPick() {}});
    assert.equal(mounted.mounted, true, version.id);
    if (where === 'slash-command') {
      const input = root.querySelector('[data-era-input]');
      input.value = '/model';
      const event = input.emit('keydown', {key:'Enter'});
      assert.equal(event.defaultPrevented, true, version.id);
      assert.deepEqual(sent, [], version.id);
      assert.ok(root.querySelector('dialog').open, version.id);
    }
    mounted.dispose();
  }
});
test('inventory summary', () => { assert.equal(versionCount, 80); console.log('ERA_INVENTORY ' + JSON.stringify(inventory)); });

test('report current V1 gaps without altering the shared module', async () => {
  const {mountModelSwitch} = await import('./web/js/era/model-switch.js');
  const gaps = [];
  for (const id of ['opencode-2025-06','opencode-2025-10','openclaw-2026-03-macos','cursor-2026-01-macos','cursor-2026-04']) {
    const {root, version} = rendered.get(id);
    const control = mountModelSwitch(root, {era:version, currentModel:{}, onPick() {}});
    if (!control.mounted) gaps.push(id + ': other flow does not mount');
    control.dispose();
  }
  const {root, version} = rendered.get('opencode-2025-09');
  const control = mountModelSwitch(root, {era:version, currentModel:{}, onPick() {}});
  if (!control.handleCommand('/models')) gaps.push('OpenCode: /models is not recognized');
  control.dispose();
  console.log('V1_LIMITATIONS ' + JSON.stringify(gaps));
});

test('CLI model choice uses only the in-screen restart sequence', async () => {
  const {mountModelSwitch} = await import('./web/js/era/model-switch.js');
  const restartText = [];
  for (const {root, version, sent} of rendered.values()) {
    if (version.model_switch.where !== 'cli-flag') continue;
    const picked = [];
    const control = mountModelSwitch(root, {era:version, currentModel:{}, onPick:name => picked.push(name)});
    root.querySelector('[data-era-model-control]').click();
    root.querySelector('dialog').querySelectorAll('button').find(node => node.textContent === '会話を終了する（再現）').click();
    const stopped = root.querySelector('[data-era-restart]');
    assert.ok(stopped, version.id);
    restartText.push({id:version.id, text:stopped.textContent});
    const field = root.querySelector('dialog').querySelector('select');
    if (field) {
      const name = version.model_switch.options.find(name => name && name !== 'unverified');
      field.value = name;
      root.querySelector('dialog').querySelectorAll('button').find(node => node.textContent === '指定して再起動（再現）').click();
      assert.deepEqual(picked, [name], version.id);
    }
    assert.deepEqual(sent, [], version.id);
    control.dispose();
  }
  console.log('V1_RESTART_TEXT ' + JSON.stringify(restartText));
});
NODE
```

