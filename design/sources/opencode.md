# OpenCode の画面調査

旧調査の2版と現行描画を読み、初期端末、中央配置の端末、1.0以降、デスクトップ、2.3の表示を比較した。root の kind は主な利用面 terminal。デスクトップは各版の領域説明に明示する。

- 調査日: 2026-11-15（日本時間）。公開ページと公開コードの読み取りのみ。製品、サーバー、開発用の実行環境は起動していない。
- ファイル内の文章は独自の日本語要約。ロゴ、文字組みマーク、画像、動画フレーム、フォントファイル、ソースコード本文は保存していない。
- 既存IDは保持する。`from` は原則カタログの月の枠で、代表にした固定版の公開月が異なる場合はその確認済み月に直す。独立した外観の開始月を裏付けられない場合は null。`to` は次の調査枠への編集上の区切りで、旧版の提供終了日ではない。正確な公開日は sources と版固定のURLを参照。
- GitHubリリースの日付は published_at のUTC日付。コード資料の date:null は最終変更日を確認していないという意味で、URL内のタグで版を固定する。現在の文書は過去の公開日や全機能の証明に使わない。
- null は未確認、環境依存、または画面に該当しない項目。実行していないため、OS・端末の色対応・表示倍率を含む実際の最終表示は未検証。confidence は資料で裏付けられた外観の範囲であり、画素の一致率ではない。
- regions の size:null は固定幅を確認できなかったもの。端末の文字数による幅はpxに変換しない。free_fallback は再現側への提案で、製品がその書体を使ったという主張ではない。
- 公式ソースの有効な描画と呼び出しを優先し、コメント内の表示や呼ばれない補助関数から画面を作らない。複数のファイルを同じ種類として区別し、source.kind に記録した。

## 読み取るときの注意

- 初期テーマの palette.accent は PrimaryColor、後の旧形式JSONでは primary の色を収録する。テーマ内に別名accentもあるので混同しない。例: v0.9.1の暗色 primary=#fab283、secondary=#5c9cf5、テーマ内accent=#9d7cd8。
- 端末の書体は指定しない。42、75、80、120という幅は端末の文字数でありpxではない。右欄の初期表示は版により変わる。
- 2025-11-macos はカタログ枠を残した未確認レコード。11月のウェブコードや12月のTauri記録だけでは、11月20日のmacOS専用画面を裏付けられない。regions/controls/distinctiveを空にしたのは外観を捏造しないため。
- 2025-12のpaletteは bg=background-base、panel=background-weak、text=text-base、muted=text-weak、accent=text-interactive-base、border=border-base、user_bubble=surface-inset-base として変数を解決したもの。8桁色は透過を含む合成前のCSS値で、画面から測った色ではない。ユーザー本文は4px角丸、入力の外枠は0.375rem。
- 2026-11枠はv2.3.0（11月13日）の時点を採用。月初から同じ外観だったとはしない。新しい意味別の色の解決結果は未確認で、残っている旧形式JSONを最終色として転記していない。

## 版と根拠の対応

| 版ID | 月の枠 | 出典数 | 確信度 |
| --- | --- | ---: | ---: |
| opencode-2025-06 | 2025-06〜2025-09 | 7 | 0.86 |
| opencode-2025-09 | 2025-09〜2025-10 | 6 | 0.94 |
| opencode-2025-10 | 2025-10〜2026-02 | 6 | 0.96 |
| opencode-2025-11-macos | 開始月未確認〜終了日未確認 | 4 | 0.12 |
| opencode-2025-12 | 2025-12〜現在または終了日未確認 | 9 | 0.94 |
| opencode-2026-02 | 2026-02〜2026-04 | 5 | 0.92 |
| opencode-2026-04 | 2026-04〜2026-08 | 5 | 0.91 |
| opencode-2026-08 | 2026-08〜2026-11 | 5 | 0.85 |
| opencode-2026-11 | 2026-11〜現在または終了日未確認 | 7 | 0.85 |

## 出典一覧

種類は公式文書、変更履歴、リリース記録、公開ソース、公式ブログを区別。固定ソースも複数ファイルを別の証拠として列挙するが、独立した運営元の証言とは数えない。

### 1. https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/page/chat.go

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-06: 会話を開始・選択すると右側欄を設定する。新規時は取り除く。

### 2. https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/components/chat/chat.go

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-06: 空画面の左上の配置、固定 v0.0.1、LSP Servers。診断一覧部分はコメント内。

### 3. https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/components/chat/editor.go

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-06: > の入力、添付、文字による区切り。

### 4. https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/components/chat/sidebar.go

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-06: 右の作業情報と共有先の表示。

### 5. https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/components/core/status.go

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-06: 最下部の操作案内、利用量、モデル名。診断値の一部は無効なコードであり、動作中の診断一覧と断定しない。

### 6. https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/theme/opencode.go

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-06: 組み込み OpenCode テーマの明暗色。accent 欄は PrimaryColor、panel は BackgroundSecondaryColor に対応。

### 7. https://github.com/anomalyco/opencode/blob/v0.0.55/README.md

- 種類: official-doc
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-06: 当時の README は端末で使う製品と説明。実装と一致しない箇所があるため、配置は固定版コードを優先。

### 8. https://github.com/anomalyco/opencode/releases/tag/v0.9.1

- 種類: release-notes
- 公開日: 2025-09-15
- 確認日: 2026-11-15
- 対象 opencode-2025-09: v0.9.1 は2025-09-15。

### 9. https://github.com/anomalyco/opencode/blob/v0.9.1/packages/tui/internal/tui/tui.go

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-09: home と chat の別描画。中央寄せの空画面、版番号、候補、期間限定の案内。

### 10. https://github.com/anomalyco/opencode/blob/v0.9.1/packages/tui/internal/components/chat/editor.go

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-09: 最大80文字幅、> / !、左右の太い枠、操作案内。

### 11. https://github.com/anomalyco/opencode/blob/v0.9.1/packages/tui/internal/components/chat/message.go

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-09: 利用者の枠、考え中の背景、通常返答の枠なし表示。

### 12. https://github.com/anomalyco/opencode/blob/v0.9.1/packages/opencode/src/config/config.ts

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-09: agent_cycle の既定値は tab、逆順は shift+tab。

### 13. https://github.com/anomalyco/opencode/blob/v0.9.1/packages/tui/internal/theme/themes/opencode.json

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-09: 組み込みテーマの色。accent 欄は primary の色。

### 14. https://github.com/anomalyco/opencode/blob/v1.0.0/packages/opencode/src/cli/cmd/tui/routes/home.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-10: 空画面の配置と入力。

### 15. https://github.com/anomalyco/opencode/blob/v1.0.0/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-10: 会話、利用者行、作業記録、右欄の表示条件。

### 16. https://github.com/anomalyco/opencode/blob/v1.0.0/packages/tui/internal/theme/themes/opencode.json

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-10: 組み込み OpenCode テーマの色。accent 欄は primary。利用者の背景は backgroundPanel。

### 17. https://github.com/anomalyco/opencode/releases/tag/v1.0.0

- 種類: release-notes
- 公開日: 2025-10-31
- 確認日: 2026-11-15
- 対象 opencode-2025-10: v1.0.0 は2025-10-31。端末画面を全面改稿。短い作業記録、Ctrl+P の操作メニュー、切替可能な右欄。

### 18. https://github.com/anomalyco/opencode/blob/v1.0.0/packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-10: 入力欄、添付、操作メニューの案内。

### 19. https://github.com/anomalyco/opencode/blob/v1.0.0/packages/opencode/src/cli/cmd/tui/context/theme.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-10: 当該版のテーマ定義の取り込み先。

### 20. https://github.com/anomalyco/opencode/releases/tag/v1.0.75

- 種類: release-notes
- 公開日: 2025-11-18
- 確認日: 2026-11-15
- 対象 opencode-2025-11-macos: 2025-11-18 に desktop application の修正はあるが、macOS専用の Tauri 公開日やウィンドウの装飾は示さない。

### 21. https://github.com/anomalyco/opencode/blob/v1.0.75/packages/desktop/package.json

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-11-macos: v1.0.75 の desktop は Vite / Solid のウェブ画面。パッケージ内に Tauri 依存がないだけではネイティブ配布の不存在も証明できない。

### 22. https://github.com/anomalyco/opencode/blob/v1.0.75/packages/desktop/src/pages/home.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-11-macos: このタグの home はプロジェクトへのボタン一覧。macOSの壁紙、半透明装飾、専用メニューの証拠ではない。

### 23. https://opencode.ai/changelog/v1.0.218

- 種類: changelog
- 公開日: 2025-12-30
- 確認日: 2026-11-15
- 対象 opencode-2025-11-macos: 12月には Tauri と desktop の変更を確認。これを11月20日へ遡らせる根拠はない。
- 対象 opencode-2025-12: Desktop、サーバー状態、Tauriへの対応を含む更新。最初のデスクトップ公開日そのものではない。

### 24. https://github.com/anomalyco/opencode/blob/v1.0.218/packages/app/src/pages/layout.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-12: プロジェクトごとの会話一覧、折りたたみ可能な左欄。幅は状態に依存。

### 25. https://github.com/anomalyco/opencode/blob/v1.0.218/packages/app/src/pages/home.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-12: プロジェクト未選択時の最近の作業と Open project、接続先の状態。

### 26. https://github.com/anomalyco/opencode/blob/v1.0.218/packages/app/src/pages/session.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-12: 会話、右の変更確認・ファイルタブ、任意のターミナル。

### 27. https://github.com/anomalyco/opencode/blob/v1.0.218/packages/app/src/components/prompt-input.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-12: 入力と添付、作業役・モデル、動作中の停止操作。

### 28. https://github.com/anomalyco/opencode/blob/v1.0.218/packages/ui/src/styles/theme.css

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-12: 通常書体 Inter、コード IBM Plex Mono、14px基準、角丸と明暗の色変数。

### 29. https://github.com/anomalyco/opencode/blob/v1.0.218/packages/ui/src/styles/colors.css

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-12: 色変数の具体値。半透明の8桁値を合成前のまま記録。

### 30. https://github.com/anomalyco/opencode/blob/v1.0.218/packages/ui/src/components/message-part.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-12: 利用者と返答の別表示、添付と作業記録。

### 31. https://github.com/anomalyco/opencode/blob/v1.0.218/packages/ui/src/components/message-part.css

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2025-12: 利用者本文は surface-inset-base 背景、4px角丸。添付は6px角丸。

### 32. https://github.com/anomalyco/opencode/blob/v1.1.54/packages/opencode/src/cli/cmd/tui/routes/home.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-02: 空画面の配置と入力。

### 33. https://github.com/anomalyco/opencode/blob/v1.1.54/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-02: 会話、利用者行、作業記録、右欄の表示条件。

### 34. https://github.com/anomalyco/opencode/blob/v1.1.54/packages/opencode/src/cli/cmd/tui/context/theme/opencode.json

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-02: 組み込み OpenCode テーマの色。accent 欄は primary。利用者の背景は backgroundPanel。

### 35. https://github.com/anomalyco/opencode/releases/tag/v1.1.54

- 種類: release-notes
- 公開日: 2026-02-10
- 確認日: 2026-11-15
- 対象 opencode-2026-02: 固定版の公開日と変更内容。

### 36. https://opencode.ai/v1/docs/tui/

- 種類: official-doc
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-02: V1の公開文書。入力・ファイル添付・操作メニューの補助資料。現在のV1文書の全機能が2月時点にあるとはしない。
- 対象 opencode-2026-04: V1の端末操作の説明。サーバー専用ダッシュボードの説明ではない。
- 対象 opencode-2026-08: 公開されているV1の説明。Consoleという管理サイトと端末画面は分ける。

### 37. https://github.com/anomalyco/opencode/blob/v1.4.6/packages/opencode/src/cli/cmd/tui/routes/home.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-04: 空画面の配置と入力。

### 38. https://github.com/anomalyco/opencode/blob/v1.4.6/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-04: 会話、利用者行、作業記録、右欄の表示条件。

### 39. https://github.com/anomalyco/opencode/blob/v1.4.6/packages/opencode/src/cli/cmd/tui/context/theme/opencode.json

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-04: 組み込み OpenCode テーマの色。accent 欄は primary。利用者の背景は backgroundPanel。

### 40. https://opencode.ai/changelog/v1.4.6

- 種類: changelog
- 公開日: 2026-04-15
- 確認日: 2026-11-15
- 対象 opencode-2026-04: v1.4.6 の更新内容は保存処理やDesktopの入力・見出し修正など。serve機能を初めて追加したという内容ではない。

### 41. https://github.com/anomalyco/opencode/blob/v1.18.19/packages/tui/src/app.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-08: 当該版の端末全体と画面切替。新しい空画面の細部は未確認。

### 42. https://github.com/anomalyco/opencode/blob/v1.18.19/packages/tui/src/routes/session/index.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-08: 会話、利用者行、作業記録、右欄の表示条件。

### 43. https://github.com/anomalyco/opencode/blob/v1.18.19/packages/tui/src/theme/assets/opencode.json

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-08: 組み込み OpenCode テーマの色。accent 欄は primary。利用者の背景は backgroundPanel。

### 44. https://opencode.ai/changelog/v1.18.19

- 種類: changelog
- 公開日: 2026-08-20
- 確認日: 2026-11-15
- 対象 opencode-2026-08: 認証済み接続先の表示、接続先URLなどの修正。Console v2や複数ペインの新設をこのリリースの画面としては確認できない。

### 45. https://github.com/anomalyco/opencode/releases/tag/v2.3.0

- 種類: release-notes
- 公開日: 2026-11-13
- 確認日: 2026-11-15
- 対象 opencode-2026-11: 2026-11-13 の v2.3.0。処理と考え中の記録を開閉式の作業行にまとめる初期設定。11月1日ではなく月内の更新。

### 46. https://github.com/anomalyco/opencode/blob/v2.3.0/packages/tui/src/routes/session/index.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-11: 新しい会話の記録、開閉式の表示、利用者行と補助欄。

### 47. https://github.com/anomalyco/opencode/blob/v2.3.0/packages/tui/src/app.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-11: 横・縦の会話タブと未読切替。

### 48. https://github.com/anomalyco/opencode/blob/v2.3.0/packages/tui/src/routes/home.tsx

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-11: 中央の空画面、入力と更新案内。

### 49. https://github.com/anomalyco/opencode/blob/v2.3.0/packages/tui/src/theme/assets/opencode.json

- 種類: oss-source
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-11: 旧形式の組み込み色ファイルは残るが、意味別の新しい色を使う描画へ単純転記できないため具体色を null にする。

### 50. https://opencode.ai/docs/themes/

- 種類: official-doc
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-11: 現在のV2は意味別の色設定を使用。端末の明暗や選択テーマで表示が変わる。

### 51. https://opencode.ai/

- 種類: official-doc
- 公開日: 不明（null）。固定版はURLのタグを参照
- 確認日: 2026-11-15
- 対象 opencode-2026-11: ログイン前の紹介ページだけ。Desktop、Terminal、Mobile、SDK は別の利用面。内部画面の詳細は固定版コードを優先。

## 補助資料・取得できなかった資料

下記は別記の通り限定して扱い、取得失敗を画面の証拠として数えていない。Internet Archiveの時刻指定は検索希望日時で、保存実績を確認した日時ではない。

- https://web.archive.org/web/20250920000000/https://opencode.ai
  - 種類: archive。公開日: 不明。確認日: 2026-11-15。
  - 取得失敗。過去のマーケティングページの見た目を根拠にしていない。
- https://github.com/anomalyco/opencode/releases/tag/v0.0.55
  - 種類: release-notes。公開日: 不明。確認日: 2026-11-15。
  - GitHubコネクタのリリースAPIは404。タグのファイルは取得できる。タグの存在とGitHub Releaseの存在を分け、日付を未確認のままにした。
- https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/theme/opencode.go
  - 種類: oss-source。公開日: 不明。確認日: 2026-11-15。
  - 404。正しくは internal/tui/theme/opencode.go。
- https://github.com/anomalyco/opencode/blob/v0.9.1/packages/tui/internal/tui/page/chat.go
  - 種類: oss-source。公開日: 不明。確認日: 2026-11-15。
  - 404。この版はinternal/tui/tui.goとinternal/components/chatを参照。
- https://github.com/anomalyco/opencode/blob/v1.18.19/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx
  - 種類: oss-source。公開日: 不明。確認日: 2026-11-15。
  - 404。この版はpackages/tui/src/routes/session/index.tsx。
- https://github.com/anomalyco/opencode/tree/v2.3.0/packages/opencode/src/cli/cmd/tui
  - 種類: oss-source。公開日: 不明。確認日: 2026-11-15。
  - 404。この版はpackages/tui/srcを参照。
- https://opencode.ai/changelog/v0.9.1
  - 種類: changelog。公開日: 不明。確認日: 2026-11-15。
  - 読み取り不能。公開日はGitHub Releaseのpublished_atで確認。
- https://opencode.ai/changelog/v1.0.0
  - 種類: changelog。公開日: 不明。確認日: 2026-11-15。
  - 読み取り不能。書き直しの説明と公開日はGitHub Release本文で確認。
- https://opencode.ai/changelog/v1.0.75
  - 種類: changelog。公開日: 不明。確認日: 2026-11-15。
  - 読み取り不能。11月のdesktop修正はGitHub Releaseで確認。
- https://opencode.ai/docs/1-0/
  - 種類: official-doc。公開日: 不明。確認日: 2026-11-15。
  - 404。V1の資料は /v1/docs/tui/ を参照。
- https://cloudparts.dev/technologies/opencode/
  - 種類: press。公開日: 不明。確認日: 2026-11-15。
  - 検索結果の長文の沿革を補助的に確認。公開日不明。バージョン1.0の書き直しは公式リリースに戻って確認した。

## 既存調査・描画への修正

- 2025-06 に Build / Plan のタブ、@general、Ctrl+P の現行メニューを載せる根拠はない。この固定版は左上の空画面、> 入力、最下部の操作案内とモデル名。 https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/components/chat/chat.go https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/components/core/status.go
- 旧調査の LSP Servers という見出しは正しいが、コード上の一覧や診断処理にはコメントが多い。見出しの存在から動く診断一覧を推定しない。v0.0.1は画面側の固定値で、取得したタグ名v0.0.55と区別する。 https://github.com/anomalyco/opencode/blob/v0.0.55/packages/tui/internal/tui/components/chat/chat.go
- 2025-09 は中央の空画面、左右の太線、> / ! を使う入力が特徴。renderer の常設のルーター表、Build / Plan のボタン列、LSP Status のタブは unverified。Tab の作業役切替は設定で確認。 https://github.com/anomalyco/opencode/blob/v0.9.1/packages/tui/internal/tui/tui.go https://github.com/anomalyco/opencode/blob/v0.9.1/packages/tui/internal/components/chat/editor.go https://github.com/anomalyco/opencode/blob/v0.9.1/packages/opencode/src/config/config.ts
- 2025-10-31 の v1.0.0 を独立した版として追加。端末画面の書き直しに伴い、作業記録の圧縮、Ctrl+P の操作メニュー、切替可能な右欄が明記される。 https://github.com/anomalyco/opencode/releases/tag/v1.0.0
- 2025-11-20 の macOS Tauri 専用画面、半透明の外枠、壁紙、専用メニューは unverified。11月のdesktopコードはウェブ画面を確認できるにとどまる。後日の Tauri 対応を遡って当てはめない。 https://github.com/anomalyco/opencode/blob/v1.0.75/packages/desktop/package.json https://opencode.ai/changelog/v1.0.218
- 2025-12 の旧調査の画面区分と書体はおおむね維持。左のプロジェクト別会話、右の任意の変更確認を具体化。色は theme.css と colors.css の変数を解決した値で、透過色は合成前の8桁値。 https://github.com/anomalyco/opencode/blob/v1.0.218/packages/app/src/pages/layout.tsx https://github.com/anomalyco/opencode/blob/v1.0.218/packages/ui/src/styles/theme.css https://github.com/anomalyco/opencode/blob/v1.0.218/packages/ui/src/styles/colors.css
- 2026-02 の接続方式の表、2026-04 のサーバー状態ダッシュボードを会話の常設画面にする根拠はない。2月の右欄の初期値は非表示、4月は広い端末で自動表示という実際の差を優先。 https://github.com/anomalyco/opencode/blob/v1.1.54/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx https://github.com/anomalyco/opencode/blob/v1.4.6/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx
- 2026-08 の Console v2、複数ペイン、使用量ゲージはこの版の新外観として unverified。管理サイトの機能を端末の上部へ常設表示しない。 https://opencode.ai/changelog/v1.18.19 https://github.com/anomalyco/opencode/blob/v1.18.19/packages/tui/src/app.tsx
- 2026-11 は最新の確認済み v2.3.0 の処理をまとめた行と会話タブを記録する。renderer の Zen / Go / OpenClaw の固定ボタン列は unverified。組み込みの古い色ファイルだけからV2の最終的な色を決めない。 https://github.com/anomalyco/opencode/releases/tag/v2.3.0 https://github.com/anomalyco/opencode/blob/v2.3.0/packages/tui/src/app.tsx https://opencode.ai/docs/themes/

## レビューで残る確認

- 2025年11月20日のmacOS専用配布と画面を示す一次資料があれば、未確認レコードを埋める。
- v2.3.0の意味別の色を最後まで解決するか、再現側で自由な代替色を使うかは別途判断が必要。現在の具体値は null。
- 旧版の実機表示、端末の実効書体、OSごとのウィンドウ装飾と最初のDesktop公開日は unverified。


## オフライン検証

2026-11-15に実行。終了コード0。JSONの解析、既存25件のID収録、各版の異なるURL2件以上・資料の種類2種類以上、日付・色・確信度、ノートへのURL収録を検査した。未確認の開始月は null を許容する。

コマンド全文は [Clineの同じ3件一括検証](cline-formerly-claude-dev.md#オフライン検証) に記載。

実際の出力:

```text
PASS cline-formerly-claude-dev: 9 versions; 8 catalog IDs covered; notes OK
PASS aider: 11 versions; 9 catalog IDs covered; notes OK
PASS opencode: 9 versions; 8 catalog IDs covered; notes OK
PASS total: 3 JSON files; 29 versions; minimum 3 unique sources per version; >=2 source kinds each
```

製品の起動、実機での表示比較、動画フレームの観察は実施していない。


