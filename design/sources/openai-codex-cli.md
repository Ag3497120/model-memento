# OpenAI Codex の画面調査

確認日: 2026-11-15。catalog、web/js/tools/codex.js、.work/design-out/openai-codex-cli.jsonを読んだ。既存の9 IDをすべて記録し、実際のmacOSアプリ公開月を1 ID追加した。アプリ・CLI・サーバーは起動していない。

## 調査の基準

OpenAI Docsスキルを読み、公式ドキュメントを検索して取得した。その後、ユーザーが指定した歴史的なUIを調べるため、公式GitHubの固定タグと公開記事も読んだ。端末の文字罫線とGUIの角丸は異なるためradius_pxはnull。端末の基本色と書体はホストの設定に従うので、製品側の固定HEX色として扱わない。free_fallbackは本プロジェクトへの実装候補である。

fromは資料で確認できた月。2025年4月は公開初日の固定コミット、Rust版はタグに固定した。v0.150.0とv0.159.0はカタログIDと公開月がずれるためfromを修正し、correctionsにも理由を書いた。toは終了を確認できないためnull。

## 公開日照会

- https://api.github.com/repos/openai/codex/releases/tags/rust-v0.36.0 — 200。2025-09-15T17:17:00Z。
- https://api.github.com/repos/openai/codex/releases/tags/rust-v0.101.0 — 200。2026-02-12T20:05:52Z。
- https://api.github.com/repos/openai/codex/releases/tags/rust-v0.140.0 — 200。2026-06-15T21:06:37Z。
- https://api.github.com/repos/openai/codex/releases/tags/rust-v0.150.0 — 200。2026-08-26T19:37:28Z。
- https://api.github.com/repos/openai/codex/releases/tags/rust-v0.159.0 — 200。2026-09-29T08:05:42Z。

## 根拠

- https://openai.com/index/introducing-o3-and-o4-mini/
  - 種類: blog。資料日: 2025-04-16。確認日: 2026-11-15。
  - Codex CLIの研究プレビュー公開と、端末で使うコーディング支援という製品区分。マーケティング記事の外観を端末の配色に使わない。

- https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/chat/terminal-header.tsx
  - 種類: oss-source。資料日: 2025-04-16。確認日: 2026-11-15。
  - regions・empty_state: 64列の製品情報枠と別の設定枠。通常の文字色、青、紫、許可設定ごとのANSI色名を使う。端末の具体的なRGB値は定義しない。

- https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/chat/terminal-chat-input.tsx
  - 種類: oss-source。資料日: 2025-04-16。確認日: 2026-11-15。
  - controls・input_shape・empty_state: /model、Tab案内、角丸文字罫線、処理中・確認待ちの切り替え。

- https://raw.githubusercontent.com/openai/codex/33d0d73b822abeae87cec07f2c2901ff900e434f/codex-cli/src/components/chat/terminal-chat.tsx
  - 種類: oss-source。資料日: 2025-04-16。確認日: 2026-11-15。
  - 許可設定の選択欄と経過秒、入力・履歴の構成。

- https://github.com/openai/codex/releases/tag/rust-v0.2.0
  - 種類: release-notes。資料日: 2025-06-30。確認日: 2026-11-15。
  - 対象に固定したRust 0.2.0の公開タグ。

- https://raw.githubusercontent.com/openai/codex/rust-v0.2.0/codex-rs/tui/src/history_cell.rs
  - 種類: oss-source。資料日: 2025-06-30。確認日: 2026-11-15。
  - regions・conversation・empty_state: 設定の行、user/codex/thinking/commandの表示。

- https://raw.githubusercontent.com/openai/codex/rust-v0.2.0/codex-rs/tui/src/bottom_pane/chat_composer.rs
  - 種類: oss-source。資料日: 2025-06-30。確認日: 2026-11-15。
  - controls・input_shape: 角丸文字罫線、残量、Enter/Ctrl+D/Ctrl+J。

- https://github.com/openai/codex/releases/tag/rust-v0.36.0
  - 種類: release-notes。資料日: 2025-09-15。確認日: 2026-11-15。
  - GPT-5-Codex対応と会話再開など。

- https://raw.githubusercontent.com/openai/codex/rust-v0.36.0/codex-rs/tui/src/history_cell.rs
  - 種類: oss-source。資料日: 2025-09-15。確認日: 2026-11-15。
  - regions・conversation・empty_state: 実画面用display_linesと書き出し用transcript_linesの違い。

- https://raw.githubusercontent.com/openai/codex/rust-v0.36.0/codex-rs/tui/src/bottom_pane/chat_composer.rs
  - 種類: oss-source。資料日: 2025-09-15。確認日: 2026-11-15。
  - 入力・候補・長文貼り付けと画像の仮表示。

- https://openai.com/index/introducing-the-codex-app/
  - 種類: blog。資料日: 2026-02-02。確認日: 2026-11-15。
  - macOSアプリの公開。プロジェクト別スレッド、変更の確認とコメント、分離した作業コピー、定期実行と確認待ち一覧を説明。CLIの画面ではない。

- https://learn.chatgpt.com/docs/changelog
  - 種類: changelog。資料日: 更新中のページ。該当する項目の日付を本文で確認。確認日: 2026-11-15。
  - 日付付きの履歴。2026-02-02のアプリ公開、02-03のスレッド一覧操作、04-09の補助欄とインライン／分離レビューを参照。現行ページの他の日付の機能を遡らせない。

- https://github.com/openai/codex/releases/tag/rust-v0.101.0
  - 種類: release-notes。資料日: 2026-02-12。確認日: 2026-11-15。
  - 0.101.0の修正内容。公開日は2月12日で、カタログの2月15日とは区別。

- https://raw.githubusercontent.com/openai/codex/rust-v0.101.0/codex-rs/tui/src/history_cell.rs
  - 種類: oss-source。資料日: 2026-02-12。確認日: 2026-11-15。
  - regions・user・empty_state: 見出し枠、依頼の帯と›。

- https://raw.githubusercontent.com/openai/codex/rust-v0.101.0/codex-rs/tui/src/bottom_pane/chat_composer.rs
  - 種類: oss-source。資料日: 2026-02-12。確認日: 2026-11-15。
  - 入力欄、長い貼り付けと添付の扱い。

- https://github.com/openai/codex/releases/tag/rust-v0.140.0
  - 種類: release-notes。資料日: 2026-06-15。確認日: 2026-11-15。
  - /usage、/delete、/importと@候補の変更。役割別の常設ダッシュボードを説明した資料ではない。

- https://raw.githubusercontent.com/openai/codex/rust-v0.140.0/codex-rs/tui/src/history_cell/session.rs
  - 種類: oss-source。資料日: 2026-06-15。確認日: 2026-11-15。
  - regions・empty_state: モデルとフォルダーを含む枠、/modelと/permissionsの案内。

- https://raw.githubusercontent.com/openai/codex/rust-v0.140.0/codex-rs/tui/src/history_cell/messages.rs
  - 種類: oss-source。資料日: 2026-06-15。確認日: 2026-11-15。
  - 利用者の依頼はuser_message_styleと›の印で描画。色の数値は固定しない。

- https://raw.githubusercontent.com/openai/codex/rust-v0.140.0/codex-rs/tui/src/bottom_pane/chat_composer.rs
  - 種類: oss-source。資料日: 2026-06-15。確認日: 2026-11-15。
  - 入力部品と貼り付け・添付の短い表示。

- https://github.com/openai/codex/releases/tag/rust-v0.150.0
  - 種類: release-notes。資料日: 2026-08-26。確認日: 2026-11-15。
  - タスク参照、/copyの選択欄、会話タイトルなどの変更。Realtime Sandbox Inspectorの記載は確認できない。

- https://raw.githubusercontent.com/openai/codex/rust-v0.150.0/codex-rs/tui/src/history_cell/session.rs
  - 種類: oss-source。資料日: 2026-08-26。確認日: 2026-11-15。
  - regions・empty_state: モデルとフォルダーを含む枠、/modelと/permissionsの案内。

- https://raw.githubusercontent.com/openai/codex/rust-v0.150.0/codex-rs/tui/src/history_cell/messages.rs
  - 種類: oss-source。資料日: 2026-08-26。確認日: 2026-11-15。
  - 利用者の依頼はuser_message_styleと›の印で描画。色の数値は固定しない。

- https://raw.githubusercontent.com/openai/codex/rust-v0.150.0/codex-rs/tui/src/bottom_pane/chat_composer.rs
  - 種類: oss-source。資料日: 2026-08-26。確認日: 2026-11-15。
  - 入力部品と貼り付け・添付の短い表示。

- https://github.com/openai/codex/releases/tag/rust-v0.159.0
  - 種類: release-notes。資料日: 2026-09-29。確認日: 2026-11-15。
  - 短い起動見出し、操作中の案内、警告表示、会話の描画などの変更。公開日は9月29日。

- https://raw.githubusercontent.com/openai/codex/rust-v0.159.0/codex-rs/tui/src/history_cell/session.rs
  - 種類: oss-source。資料日: 2026-09-29。確認日: 2026-11-15。
  - regions・empty_state: display_linesは枠なしの短い見出しとフォルダー。raw_linesのmodel行は書き出し用なので実画面へ戻さない。

- https://raw.githubusercontent.com/openai/codex/rust-v0.159.0/codex-rs/tui/src/bottom_pane/chat_composer/composer_layout.rs
  - 種類: oss-source。資料日: 2026-09-29。確認日: 2026-11-15。
  - 下部の入力、候補、状態案内の領域を割り当てる。画面の広さや状態によって案内の位置と高さが変わる。

- https://raw.githubusercontent.com/openai/codex/rust-v0.159.0/codex-rs/tui/src/onboarding/welcome.rs
  - 種類: oss-source。資料日: 2026-09-29。確認日: 2026-11-15。
  - サインイン時の歓迎画面は通常セッションの見出しとは別。ここにあるブランド図形は再現対象外。

## 画面表示と書き出しの区別

- 0.36.0はdisplay_linesで利用者を細い縦棒、回答を>で示す。transcript_linesのuser/codex見出しは別の出力。
- 0.159.0のsession.rsのdisplay_linesは枠なしの短い製品名・フォルダー・条件に応じたあいさつ。raw_linesはmodelとdirectoryラベルを含む書き出し用。
- https://raw.githubusercontent.com/openai/codex/rust-v0.159.0/codex-rs/tui/src/chatwidget/snapshots/codex_tui__chatwidget__tests__catalog_model_session_header_startup.snap は本文を読めたが、上記raw_linesを示すテスト用記録。テストで使われるモデル名を製品の既定モデルの証拠にしていない。

## 公式ヘルプの移転と限界

- https://developers.openai.com/codex/cli は https://learn.chatgpt.com/docs/codex/cli へ移動。現在の端末製品の説明であり、初期版のレイアウトの証拠ではない。
- https://developers.openai.com/codex/app/ は https://learn.chatgpt.com/docs/app へ移動。現行のChatGPT desktop app説明なので、2026年2月のCodex単独アプリへ逆算しない。
- https://developers.openai.com/codex/app/features/ は https://learn.chatgpt.com/docs/features へ移動。古い単独Codexアプリの寸法の根拠には使わない。
- https://developers.openai.com/codex/changelog/ は https://learn.chatgpt.com/docs/changelog へ移動。2026-02-02、2026-02-03、2026-04-09の履歴を確認した。
- https://learn.chatgpt.com/docs/codex/app/features と https://developers.openai.com/codex/changelog.md は404。

## 以前の調査との関係と残る未確認

以前の調査は4月と6月のみ。4月の別々の起動枠と6月の入力枠は公開ソースで確認し直した。rendererにある後年の固定ダッシュボードは採用しない。2025年10月macOS版はunverifiedなのでconfidence=0、空のregions・controlsを保持した。この2資料は当該版の画面証拠ではなく、日付を否定・限定する資料である。

デスクトップアプリの正確な幅・色・書体・空画面の文言、各CLIの全承認メニューの形、2026年11月という時点の最新CLI版と既定モデルはunverified。v0.159.0は9月の固定版を調べた記録で、11月の最新製品だとは主張しない。kindがterminalのファイルにmacOS IDが混在する問題は、カタログ所有者による分離が必要。

