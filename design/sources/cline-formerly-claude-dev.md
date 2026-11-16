# Cline の画面調査

旧調査の2版と現行描画を読み、固定版の入力・会話・承認・一覧画面を比較した。主な利用面は VS Code 拡張。別OS・CLI・SDKの存在を、同じパネルの形だと解釈しない。

- 調査日: 2026-11-15（日本時間）。公開ページと公開コードの読み取りのみ。製品、サーバー、開発用の実行環境は起動していない。
- ファイル内の文章は独自の日本語要約。ロゴ、文字組みマーク、画像、動画フレーム、フォントファイル、ソースコード本文は保存していない。
- 既存IDは保持する。`from` は原則カタログの月の枠で、代表にした固定版の公開月が異なる場合はその確認済み月に直す。独立した外観の開始月を裏付けられない場合は null。`to` は次の調査枠への編集上の区切りで、旧版の提供終了日ではない。正確な公開日は sources と版固定のURLを参照。
- GitHubリリースの日付は published_at のUTC日付。コード資料の date:null は最終変更日を確認していないという意味で、URL内のタグで版を固定する。現在の文書は過去の公開日や全機能の証明に使わない。
- null は未確認、環境依存、または画面に該当しない項目。実行していないため、OS・端末の色対応・表示倍率を含む実際の最終表示は未検証。confidence は資料で裏付けられた外観の範囲であり、画素の一致率ではない。
- regions の size:null は固定幅を確認できなかったもの。端末の文字数による幅はpxに変換しない。free_fallback は再現側への提案で、製品がその書体を使ったという主張ではない。
- 公式ソースの有効な描画と呼び出しを優先し、コメント内の表示や呼ばれない補助関数から画面を作らない。複数のファイルを同じ種類として区別し、source.kind に記録した。

## 読み取るときの注意

- `palette` の16進値はすべて null。入力欄は --vscode-input-background / foreground、利用者メッセージは --vscode-badge-background、強調は --vscode-focusBorder などホストの色を参照する。固定の黒・青・黄を製品固有色として断定しない。
- 入力欄の半径2pxと、Plan / Act切替の外枠12pxは別部品。shape.radius_px は入力欄の値。v3.2.5以降の黄色い入力枠をv3.2.0へ流用しない。
- 2025-02の追加版は通常チャットを置き換えた新製品ではなく、外部ツールを探す別画面。会話関連の欄は該当しないため null。
- 2026-11枠は確認できたv4.1.26（2026-10-26）のVS Code画面の代表。11月1日固有の画面刷新は unverified。Desktop/CLI/JetBrainsの内部画面はこの枠へ混ぜていない。

## 版と根拠の対応

| 版ID | 月の枠 | 出典数 | 確信度 |
| --- | --- | ---: | ---: |
| cline-formerly-claude-dev-2024-07 | 2024-07〜2024-10 | 4 | 0.87 |
| cline-formerly-claude-dev-2024-10 | 2024-10〜2024-12 | 4 | 0.93 |
| cline-2024-12 | 2024-12〜2025-01 | 5 | 0.93 |
| cline-2025-01 | 2025-01〜2025-02 | 4 | 0.91 |
| cline-formerly-claude-dev-2025-02 | 2025-02〜2025-07 | 5 | 0.95 |
| cline-2025-07 | 2025-07〜2025-11 | 8 | 0.94 |
| cline-2025-11 | 2025-11〜2026-04 | 4 | 0.86 |
| cline-2026-04 | 2026-04〜2026-11 | 5 | 0.9 |
| cline-2026-11 | 2026-10〜現在または終了日未確認 | 6 | 0.86 |

## 出典一覧

種類は公式文書、変更履歴、リリース記録、公開ソース、公式ブログを区別。固定ソースも複数ファイルを別の証拠として列挙するが、独立した運営元の証言とは数えない。

### 1. https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/components/ChatView.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2024-07: 入力欄の形、操作、ホストの色・書体変数。

### 2. https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/components/ChatRow.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2024-07: 利用者・返答・操作結果の表示。

### 3. https://github.com/cline/cline/releases/tag/v1.0.4

- 種類: release-notes
- 公開日: 2024-07-28
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2024-07: 2024-07-28 の v1.0.4。横のパネルに加えてエディタ内のタブで開く操作と、失敗時の再試行。

### 4. https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/index.css

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2024-07: 冒頭のシステム書体と source-code-pro の指定はコメント内。実効書体とは扱わない。

### 5. https://github.com/cline/cline/blob/v2.0.0/webview-ui/src/components/chat/ChatTextArea.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2024-10: 入力欄の形、操作、ホストの色・書体変数。

### 6. https://github.com/cline/cline/blob/v2.0.0/webview-ui/src/components/chat/ChatRow.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2024-10: 利用者・返答・操作結果の表示。

### 7. https://github.com/cline/cline/blob/v2.0.0/webview-ui/src/components/chat/ChatView.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2024-10: タスク見出し、入力欄、Cancel、空画面の条件。

### 8. https://github.com/cline/cline/releases/tag/v2.0.0

- 種類: release-notes
- 公開日: 2024-10-09
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2024-10: v2.0.0 は2024-10-09。改名、逐次表示、編集中の黄色い目印、停止操作。

### 9. https://github.com/cline/cline/blob/v3.0.0/webview-ui/src/components/chat/ChatTextArea.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2024-12: 入力欄の形、操作、ホストの色・書体変数。

### 10. https://github.com/cline/cline/blob/v3.0.0/webview-ui/src/components/chat/ChatRow.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2024-12: 利用者・返答・操作結果の表示。

### 11. https://github.com/cline/cline/blob/v3.0.0/webview-ui/src/components/chat/ChatView.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2024-12: 会話・承認・入力欄と自動承認メニューの配置。

### 12. https://github.com/cline/cline/blob/v3.0.0/webview-ui/src/components/chat/AutoApproveMenu.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2024-12: 自動承認の展開メニュー、カテゴリ、上限入力。

### 13. https://github.com/cline/cline/releases/tag/v3.0.0

- 種類: release-notes
- 公開日: 2024-12-18
- 確認日: 2026-11-15
- 対象 cline-2024-12: v3.0.0 は2024-12-18。自動承認メニューと部分置換方式の編集。.clinerules は設定ファイル。

### 14. https://github.com/cline/cline/blob/v3.2.0/webview-ui/src/components/chat/ChatTextArea.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2025-01: 入力欄の形、操作、ホストの色・書体変数。

### 15. https://github.com/cline/cline/blob/v3.2.0/webview-ui/src/components/chat/ChatView.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2025-01: 会話一覧、タスク見出し、自動承認と入力欄。追加入力の正確な角丸はこの資料から確定しない。

### 16. https://github.com/cline/cline/releases/tag/v3.2.0

- 種類: release-notes
- 公開日: 2025-01-21
- 確認日: 2026-11-15
- 対象 cline-2025-01: v3.2.0 は2025-01-21。Plan / Act と入力欄下のモデル選択を追加。

### 17. https://cline.bot/blog/everyones-talking-about-r1-vs-o1-benchmarks-but-heres-what-really-matters

- 種類: blog
- 公開日: 2025-01-23
- 確認日: 2026-11-15
- 対象 cline-2025-01: 相談と実装でモードを切り替える使い方。固定色や寸法の資料ではない。

### 18. https://github.com/cline/cline/releases/tag/v3.4.0

- 種類: release-notes
- 公開日: 2025-02-19
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2025-02: v3.4.0、2025-02-19。MCP Marketplace と会話内の図表示を追加。

### 19. https://github.com/cline/cline/blob/v3.4.0/webview-ui/src/components/mcp/McpView.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2025-02: Marketplace / Installed のタブと画面切替。

### 20. https://github.com/cline/cline/blob/v3.4.0/webview-ui/src/components/mcp/marketplace/McpMarketplaceView.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2025-02: 検索、並べ替え、候補なしの状態。

### 21. https://github.com/cline/cline/blob/v3.4.0/webview-ui/src/components/mcp/marketplace/McpMarketplaceCard.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2025-02: カードの導入ボタンは Install。ブログ本文の Download と異なるため実装を優先。

### 22. https://cline.bot/blog/introducing-the-mcp-marketplace-clines-new-app-store

- 種類: blog
- 公開日: 2025-02-19
- 確認日: 2026-11-15
- 対象 cline-formerly-claude-dev-2025-02: 公開日の説明と、一覧から外部ツールを導入する流れ。製品内画面を開いた観察ではない。

### 23. https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/ChatTextArea.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2025-07: 入力欄の形、操作、ホストの色・書体変数。

### 24. https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/ChatRow.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2025-07: 利用者・返答・操作結果の表示。

### 25. https://github.com/cline/cline/releases/tag/v3.19.4

- 種類: release-notes
- 公開日: 2025-07-15
- 確認日: 2026-11-15
- 対象 cline-2025-07: v3.19.4 は2025-07-15。保存や比較機能の最初の公開日ではない。

### 26. https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/common/CheckpointControls.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2025-07: Compare / Restore と、会話・ファイル・両方を戻す選択肢。

### 27. https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/UserMessage.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2025-07: 追加入力の3px角丸、9px余白、修正操作。

### 28. https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/chat-view/components/layout/WelcomeSection.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2025-07: 空画面で HomeHeader と SuggestedTasks を使う。

### 29. https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/welcome/HomeHeader.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2025-07: 空画面の製品マークと短い見出し。マークは複製しない。

### 30. https://docs.cline.bot/core-workflows/checkpoints

- 種類: official-doc
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2025-07: 現在の説明は会話内の保存位置から比較・復元する流れ。過去版の細かな配置は固定版ソースを優先。
- 対象 cline-2025-11: 現在の比較・復元の説明。2025-11-08 のピクセル配置の証明ではない。

### 31. https://github.com/cline/cline/releases/tag/v3.36.0

- 種類: release-notes
- 公開日: 2025-11-06
- 確認日: 2026-11-15
- 対象 cline-2025-11: 2025-11-06 の v3.36.0 を11月枠の代表にする。CLI の追加と VS Code パネルの形を同一視しない。

### 32. https://github.com/cline/cline/blob/v3.36.0/webview-ui/src/components/chat/ChatTextArea.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2025-11: VS Code 内の入力欄、Plan / Act、モデル表示。

### 33. https://github.com/cline/cline/blob/v3.36.0/webview-ui/src/components/chat/ChatRow.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2025-11: 会話内の保存位置の印と完了後の See new changes。独立した横長の時間軸ではない。

### 34. https://github.com/cline/cline/releases/tag/v3.78.0

- 種類: release-notes
- 公開日: 2026-04-10
- 確認日: 2026-11-15
- 対象 cline-2026-04: v3.78.0 は2026-04-10。利用上限到達時の専用エラー表示と、read_file の行範囲表示の修正。

### 35. https://github.com/cline/cline/blob/v3.78.0/webview-ui/src/components/chat/ChatTextArea.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2026-04: 入力欄と Plan / Act。Plan はホストの警告色、Act はフォーカス色。

### 36. https://github.com/cline/cline/blob/v3.78.0/webview-ui/src/components/chat/ChatRow.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2026-04: ファイル・コマンド・推論表示の行。別OSの画面を横に並べる構成ではない。

### 37. https://github.com/cline/cline/blob/v3.78.0/webview-ui/src/components/chat/chat-view/components/layout/WelcomeSection.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2026-04: 空画面の履歴、提案、条件つきの案内。

### 38. https://docs.cline.bot/core-workflows/plan-and-act

- 種類: official-doc
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2026-04: 現在のモード切替の説明。公開月の資料ではない。

### 39. https://github.com/cline/cline/releases/tag/v4.1.26

- 種類: release-notes
- 公開日: 2026-10-26
- 確認日: 2026-11-15
- 対象 cline-2026-11: 2026-10-26 の v4.1.26 を11月枠の確認済み代表にする。Local / Cloud と遠隔実行の開始状況カード。11月1日の新配色の根拠ではない。

### 40. https://github.com/cline/cline/blob/v4.1.26/apps/vscode/webview-ui/src/components/chat/ChatTextArea.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2026-11: ローカルの Plan / Act と、遠隔作業で切替を隠す条件。2pxの入力欄。

### 41. https://github.com/cline/cline/blob/v4.1.26/apps/vscode/webview-ui/src/components/chat/ChatView.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2026-11: 会話と入力欄。遠隔作業ではローカル用の自動承認設定を適用しない。

### 42. https://github.com/cline/cline/blob/v4.1.26/apps/vscode/webview-ui/src/components/chat/UserMessage.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2026-11: バッジ色の利用者メッセージと再生成操作。

### 43. https://github.com/cline/cline/blob/v4.1.26/apps/vscode/webview-ui/src/components/chat/chat-view/components/layout/WelcomeSection.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2026-11: 履歴と遠隔実行中の作業を空画面に表示。

### 44. https://cline.bot/

- 種類: official-doc
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 cline-2026-11: ログイン前の製品紹介だけ。IDE・CLI・SDK・Desktop・Cloud が別の利用面であることの補助資料。内部の配置や11月の変更日は証明しない。

### 45. https://github.com/cline/cline/blob/main/CHANGELOG.md

- 種類: changelog
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 修正根拠: 2024-10 に Plan / Act、保存位置への復元、外部ツールの一覧をまとめて載せない。変更履歴では MCP は2.2、保存位置は3.1、Plan / Act は3.2、Marketplace は3.4。
- 対象 修正根拠: 2025-01 の v3.2.0 は1月21日公開。モードごとにモデルを記憶する更新は3.2.6。3.2.5以降の黄色い入力枠も3.2.0へ遡らせない。

## 補助資料・取得できなかった資料

下記は別記の通り限定して扱い、取得失敗を画面の証拠として数えていない。Internet Archiveの時刻指定は検索希望日時で、保存実績を確認した日時ではない。

- https://web.archive.org/web/20241001000000/https://github.com/cline/cline
  - 種類: archive。公開日: 不明。確認日: 2026-11-15。
  - 取得失敗。指定時刻のスナップショット存在・内容・見た目は unverified。
- https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/chat/CheckpointControls.tsx
  - 種類: oss-source。公開日: 不明。確認日: 2026-11-15。
  - 404。正しい配置は components/common/CheckpointControls.tsx。404のURLを根拠にしていない。
- https://github.com/cline/cline/tree/v4.1.26/webview-ui/src/components
  - 種類: oss-source。公開日: 不明。確認日: 2026-11-15。
  - 404。v4.1.26では apps/vscode/webview-ui 配下を参照した。
- https://github.com/cline/cline/blob/desktop-v0.0.49/apps/desktop/package.json
  - 種類: oss-source。公開日: 不明。確認日: 2026-11-15。
  - 404。Desktop専用の詳細外観をこのURLからは確認できず、仕様に追加していない。
- https://www.noze.it/en/insights/cline-vscode-approval-mode/
  - 種類: press。公開日: 2024-10-30。確認日: 2026-11-15。
  - 検索結果の本文と日付（2024-10-30）を確認。手動承認の長文解説。版固定のピクセル根拠には採用していない。

## 既存調査・描画への修正

- 2024-07 の renderer にある Deny は、この固定版の Reject と異なる。コマンドの主操作は Run Command。 https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/components/ChatView.tsx
- 旧調査の書体を未確定とした判断は維持する。ただし入力欄は VS Code の書体変数を参照。index.css のコメント内の書体名を実効値にしない。固定色やパネル幅も unverified。 https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/components/ChatView.tsx https://github.com/cline/cline/blob/v1.0.4/webview-ui/src/index.css
- 2024-10 に Plan / Act、保存位置への復元、外部ツールの一覧をまとめて載せない。変更履歴では MCP は2.2、保存位置は3.1、Plan / Act は3.2、Marketplace は3.4。 https://github.com/cline/cline/blob/main/CHANGELOG.md
- 2024-12 の MCP Marketplace は誤り。v3.0.0 の中心は自動承認メニュー。公開日は12月18日で、カタログの12月15日は一致しない。 https://github.com/cline/cline/releases/tag/v3.0.0 https://cline.bot/blog/introducing-the-mcp-marketplace-clines-new-app-store
- 2025-01 の v3.2.0 は1月21日公開。モードごとにモデルを記憶する更新は3.2.6。3.2.5以降の黄色い入力枠も3.2.0へ遡らせない。 https://github.com/cline/cline/releases/tag/v3.2.0 https://github.com/cline/cline/blob/main/CHANGELOG.md
- 2025-07 の独立した Shadow Git 表、Memory Bank 操作列、2025-11 の横長の保存時間軸は unverified。会話中の小さな保存位置と比較・復元を再現する。 https://github.com/cline/cline/blob/v3.19.4/webview-ui/src/components/common/CheckpointControls.tsx https://github.com/cline/cline/blob/v3.36.0/webview-ui/src/components/chat/ChatRow.tsx
- 2026-04 の JetBrains と CLI を同じ VS Code 画面へ埋め込む根拠はない。v3.78.0 の確認済み変更は利用上限エラーとファイル読み取り範囲表示など。 https://github.com/cline/cline/releases/tag/v3.78.0
- 2026-11 の SDK/CLI 表示や MCP Sandbox 承認カードは VS Code の必須外観として unverified。v4.1.26 はローカルと遠隔作業を区別し、遠隔では Plan / Act を隠す。11月の新デザインとしての開始日は unverified。 https://github.com/cline/cline/blob/v4.1.26/apps/vscode/webview-ui/src/components/chat/ChatTextArea.tsx

## レビューで残る確認

- 別OSや独立したDesktop/CLIの詳細外観を追加するなら、その利用面ごとに固定ソースを別途調べる。現在のIDE画面に混ぜない。
- 2026年11月固有の外観変更日、ホストテーマの最終16進色、各OSの実効書体・実寸は unverified。


## オフライン検証

2026-11-15に実行。終了コード0。JSONの解析、既存25件のID収録、各版の異なるURL2件以上・資料の種類2種類以上、日付・色・確信度、ノートへのURL収録を検査した。未確認の開始月は null を許容する。

実行したコマンド全文:

```sh
node --input-type=module -e 'import fs from "node:fs"; import assert from "node:assert/strict"; const ids=["cline-formerly-claude-dev","aider","opencode"]; const catalog=JSON.parse(fs.readFileSync("web/data/catalog.json","utf8")); let total=0,min=Infinity; for(const id of ids){const spec=JSON.parse(fs.readFileSync(`design/specs/${id}.json`,"utf8")); assert.equal(spec.schema,"memento.design.v1"); assert.equal(spec.tool_id,id); const seen=new Set(); const notes=fs.readFileSync(`design/sources/${id}.md`,"utf8"); for(const v of spec.versions){assert(!seen.has(v.id)); seen.add(v.id); assert(v.from===null||/^[0-9]{4}-[0-9]{2}$/.test(v.from)); assert(v.to===null||/^[0-9]{4}-[0-9]{2}$/.test(v.to)); const urls=new Set(v.sources.map(s=>s.url)); assert(urls.size>=2); assert(new Set(v.sources.map(s=>s.kind)).size>=2); min=Math.min(min,urls.size); assert(v.confidence>=0&&v.confidence<=1); for(const s of v.sources){assert(/^https:\/\//.test(s.url)); assert(notes.includes(s.url)); assert(s.shows.length>0); assert(s.date===null||/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s.date));} for(const mode of ["light","dark"])for(const color of Object.values(v.palette[mode]))assert(color===null||/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color));} const current=catalog.tools.find(t=>t.id===id); assert(current); assert(current.versions.every(v=>seen.has(v.id))); total+=spec.versions.length; console.log(`PASS ${id}: ${spec.versions.length} versions; ${current.versions.length} catalog IDs covered; notes OK`);} console.log(`PASS total: 3 JSON files; ${total} versions; minimum ${min} unique sources per version; >=2 source kinds each`);'
```

実際の出力:

```text
PASS cline-formerly-claude-dev: 9 versions; 8 catalog IDs covered; notes OK
PASS aider: 11 versions; 9 catalog IDs covered; notes OK
PASS opencode: 9 versions; 8 catalog IDs covered; notes OK
PASS total: 3 JSON files; 29 versions; minimum 3 unique sources per version; >=2 source kinds each
```

製品の起動、実機での表示比較、動画フレームの観察は実施していない。


