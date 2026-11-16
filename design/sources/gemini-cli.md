# Gemini CLI の画面調査

調査日: 2026-11-15。カタログの7版をすべて保持した。web/js/tools/gemini-cli.jsを読み、.work/design-out/gemini-cli.jsonが存在しないことを確認した。既存ファイルは変更していない。

## 固定版の選び方

GitHubのコミットAPIを、対象日のUTC終わりをuntilとして各1件読んだ。以下はソースの観測点であり、同日配布のnpm版だと断定しない。23時台のコミットには日本時間の翌日となるものもある。from/toは月単位の図鑑の区切りで、全利用者の変更日ではない。

| カタログID | 選択条件 | 固定コミット | コミット日時 |
| --- | --- | --- | --- |
| gemini-cli-2025-06-25 | 2025-06-25 23:59:59 UTC以前の直近 | b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd | 2025-06-25T22:50:24Z |
| gemini-cli-2025-08 | 2025-08-14 23:59:59 UTC以前の直近 | 6037cb5d60b8e31b92315dd86fc65dbc57316376 | 2025-08-14T23:48:54Z |
| gemini-cli-2025-10 | 2025-10-15 23:59:59 UTC以前の直近 | 8c74be79c58a0c344d4eb05c72b649a49cb44cae | 2025-10-15T23:57:00Z |
| gemini-cli-2026-01 | 2026-01-22 23:59:59 UTC以前の直近 | beacc4f6fd102fd969239ffddb6c092631cd0481 | 2026-01-22T23:38:53Z |
| gemini-cli-2026-03 | 2026-03-20 23:59:59 UTC以前の直近 | fc03891a113da762175011f4e8e93acd0da49b0d | 2026-03-20T23:36:52Z |
| gemini-cli-2026-07 | 2026-07-15 23:59:59 UTC以前の直近 | 3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb | 2026-07-15T19:58:55Z |
| gemini-cli-2026-11 | 2026-11-01 23:59:59 UTC以前の直近 | 6814e00d6b148c3a1d57244d5d7040f7c541009d | 2026-10-30T21:38:47Z |

- 2025-06-25の選択に使った公開API: https://api.github.com/repos/google-gemini/gemini-cli/commits?until=2025-06-25T23%3A59%3A59Z&per_page=1
- 2025-08-14の選択に使った公開API: https://api.github.com/repos/google-gemini/gemini-cli/commits?until=2025-08-14T23%3A59%3A59Z&per_page=1
- 2025-10-15の選択に使った公開API: https://api.github.com/repos/google-gemini/gemini-cli/commits?until=2025-10-15T23%3A59%3A59Z&per_page=1
- 2026-01-22の選択に使った公開API: https://api.github.com/repos/google-gemini/gemini-cli/commits?until=2026-01-22T23%3A59%3A59Z&per_page=1
- 2026-03-20の選択に使った公開API: https://api.github.com/repos/google-gemini/gemini-cli/commits?until=2026-03-20T23%3A59%3A59Z&per_page=1
- 2026-07-15の選択に使った公開API: https://api.github.com/repos/google-gemini/gemini-cli/commits?until=2026-07-15T23%3A59%3A59Z&per_page=1
- 2026-11-01の選択に使った公開API: https://api.github.com/repos/google-gemini/gemini-cli/commits?until=2026-11-01T23%3A59%3A59Z&per_page=1

OSSソースはApache-2.0表記を読んだが、コードをコピーせず配色の数値・部品の構成だけを記録した。ソースは実際に読んだ固定コミットのファイルへリンク。起動・インストール・実画面の取得は行っていない。

## 配色の読み方

paletteはDefault / Default Lightの宣言値。bg=Background、panel=InputBackground、muted=Gray、accent=AccentPurple。2025年のborderは入力枠の色、2026-03以降はborder.defaultのDarkGrayを記録。発言の背景と入力の背景は設定や端末の能力で変わる。どの利用者の端末も同じ全面色・書体になるとは言わない。Foregroundが空文字の2025-10・2026-01はtext=null。初期版の灰色の利用者の発言はconversationに別記。

2026年3月の既定色には入力と発言の背景色が追加されていることを確認した。「追加された最初の日」は特定していない。寸法は端末の文字列・行に依存するため、幅や角丸pxを発明しない。密度compactは文字による入力・情報行からの分類。free_fallbackはこのアプリの再描画の選択で、製品が指定した書体ではない。

## 版ごとの資料

### gemini-cli-2025-06-25

- official-doc / 2025-06-25 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/docs/cli/themes.md
  - 固定コミットの操作説明。/themeで候補を開き、矢印で選び確定。公開日ではなく対象コミットの日付。
- oss-source / 2025-06-25 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/InputPrompt.tsx
  - 入力欄の文字による丸い枠・接頭記号・補完。2026-01には画像貼り付けを@相対パスへ変える実装。
- oss-source / 2025-06-25 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/messages/UserMessage.tsx
  - 利用者の発言は>付き。枠のない文字の行。
- oss-source / 2025-06-25 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/messages/GeminiMessage.tsx
  - 返答用の接頭記号と本文の領域。記号はブランド要素としてコピーしない。
- oss-source / 2025-06-25 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx
  - 道具の実行を会話内のまとまりとして描く。枠やシェル出力の条件分岐。
- oss-source / 2025-06-25 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/LoadingIndicator.tsx
  - 待機・実行表示、経過時間、Escによる取消案内。幅による表示分岐がある。
- oss-source / 2025-06-25 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/Footer.tsx
  - 下部にフォルダー・モデル・実行領域の状態など。
- oss-source / 2025-06-25 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/themes/theme.ts
  - Default / Default Lightの宣言色。bgはBackground値、panelはInputBackground、mutedはGray、accentはAccentPurple。2025年のborderは入力枠のAccentBlue、2026-03以降はDarkGray。Foregroundが空文字の版はtextをnullにした。
- oss-source / 2025-06-25 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/Tips.tsx
  - 開始時の短い使い方と/helpの案内。
- blog / 2025-06-25 / 閲覧日 2026-11-15: https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemini-cli-open-source-ai-agent/
  - 端末上の対話として公開。Webアプリとは別。

### gemini-cli-2025-08

- official-doc / 2025-08-14 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/docs/cli/themes.md
  - 固定コミットの操作説明。/themeで候補を開き、矢印で選び確定。公開日ではなく対象コミットの日付。
- oss-source / 2025-08-14 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/InputPrompt.tsx
  - 入力欄の文字による丸い枠・接頭記号・補完。2026-01には画像貼り付けを@相対パスへ変える実装。
- oss-source / 2025-08-14 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/messages/UserMessage.tsx
  - 利用者の発言は>付きの丸い枠。
- oss-source / 2025-08-14 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/messages/GeminiMessage.tsx
  - 返答用の接頭記号と本文の領域。記号はブランド要素としてコピーしない。
- oss-source / 2025-08-14 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx
  - 道具の実行を会話内のまとまりとして描く。枠やシェル出力の条件分岐。
- oss-source / 2025-08-14 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/LoadingIndicator.tsx
  - 待機・実行表示、経過時間、Escによる取消案内。幅による表示分岐がある。
- oss-source / 2025-08-14 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/Footer.tsx
  - 下部にフォルダー・モデル・実行領域の状態など。
- oss-source / 2025-08-14 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/themes/theme.ts
  - Default / Default Lightの宣言色。bgはBackground値、panelはInputBackground、mutedはGray、accentはAccentPurple。2025年のborderは入力枠のAccentBlue、2026-03以降はDarkGray。Foregroundが空文字の版はtextをnullにした。
- oss-source / 2025-08-14 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/Tips.tsx
  - 開始時の短い使い方と/helpの案内。
- oss-source / 2025-08-14 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/ContextSummaryDisplay.tsx
  - Using:に指示ファイル、開いているファイル、MCP（外部の道具をつなぐ仕組み）の件数。何もない時は出さない。

### gemini-cli-2025-10

- official-doc / 2025-10-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/docs/cli/themes.md
  - 固定コミットの操作説明。/themeで候補を開き、矢印で選び確定。公開日ではなく対象コミットの日付。
- oss-source / 2025-10-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/InputPrompt.tsx
  - 入力欄の文字による丸い枠・接頭記号・補完。2026-01には画像貼り付けを@相対パスへ変える実装。
- oss-source / 2025-10-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/messages/UserMessage.tsx
  - 利用者の発言は>付き。枠のない文字の行。
- oss-source / 2025-10-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/messages/GeminiMessage.tsx
  - 返答用の接頭記号と本文の領域。記号はブランド要素としてコピーしない。
- oss-source / 2025-10-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx
  - 道具の実行を会話内のまとまりとして描く。枠やシェル出力の条件分岐。
- oss-source / 2025-10-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/LoadingIndicator.tsx
  - 待機・実行表示、経過時間、Escによる取消案内。幅による表示分岐がある。
- oss-source / 2025-10-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/Footer.tsx
  - 下部にフォルダー・モデル・実行領域の状態など。
- oss-source / 2025-10-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/themes/theme.ts
  - Default / Default Lightの宣言色。bgはBackground値、panelはInputBackground、mutedはGray、accentはAccentPurple。2025年のborderは入力枠のAccentBlue、2026-03以降はDarkGray。Foregroundが空文字の版はtextをnullにした。
- oss-source / 2025-10-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/Tips.tsx
  - 開始時の短い使い方と/helpの案内。
- oss-source / 2025-10-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/Composer.tsx
  - 進捗、読み込み情報、入力欄を縦に配置。Headlessの常設ボタン列ではない。

### gemini-cli-2026-01

- official-doc / 2026-01-22 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/docs/cli/commands.md
  - 固定コミットの操作説明。モデル・設定・会話再開等の入口。公開日ではなく対象コミットの日付。
- oss-source / 2026-01-22 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/InputPrompt.tsx
  - 入力欄の文字による丸い枠・接頭記号・補完。2026-01には画像貼り付けを@相対パスへ変える実装。
- oss-source / 2026-01-22 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/messages/UserMessage.tsx
  - 利用者の発言は>付き。枠のない文字の行。
- oss-source / 2026-01-22 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/messages/GeminiMessage.tsx
  - 返答用の接頭記号と本文の領域。記号はブランド要素としてコピーしない。
- oss-source / 2026-01-22 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx
  - 道具の実行を会話内のまとまりとして描く。枠やシェル出力の条件分岐。
- oss-source / 2026-01-22 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/LoadingIndicator.tsx
  - 待機・実行表示、経過時間、Escによる取消案内。幅による表示分岐がある。
- oss-source / 2026-01-22 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/Footer.tsx
  - 下部にフォルダー・モデル・実行領域の状態など。
- oss-source / 2026-01-22 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/themes/theme.ts
  - Default / Default Lightの宣言色。bgはBackground値、panelはInputBackground、mutedはGray、accentはAccentPurple。2025年のborderは入力枠のAccentBlue、2026-03以降はDarkGray。Foregroundが空文字の版はtextをnullにした。
- oss-source / 2026-01-22 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/Tips.tsx
  - 開始時の短い使い方と/helpの案内。

### gemini-cli-2026-03

- official-doc / 2026-03-20 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/docs/reference/commands.md
  - 固定コミットの操作説明。モデル・設定・会話再開等の入口。公開日ではなく対象コミットの日付。
- oss-source / 2026-03-20 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/InputPrompt.tsx
  - 入力欄の文字による丸い枠・接頭記号・補完。2026-01には画像貼り付けを@相対パスへ変える実装。
- oss-source / 2026-03-20 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/messages/UserMessage.tsx
  - 利用者の発言は>付き。背景色の適用は設定等の条件付き。
- oss-source / 2026-03-20 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/messages/GeminiMessage.tsx
  - 返答用の接頭記号と本文の領域。記号はブランド要素としてコピーしない。
- oss-source / 2026-03-20 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx
  - 道具の実行を会話内のまとまりとして描く。枠やシェル出力の条件分岐。
- oss-source / 2026-03-20 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/LoadingIndicator.tsx
  - 待機・実行表示、経過時間、Escによる取消案内。幅による表示分岐がある。
- oss-source / 2026-03-20 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/Footer.tsx
  - 設定できる下部の情報行。フォルダー、モデル、使用量、安全な実行領域の状態など。
- oss-source / 2026-03-20 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/themes/theme.ts
  - Default / Default Lightの宣言色。bgはBackground値、panelはInputBackground、mutedはGray、accentはAccentPurple。2025年のborderは入力枠のAccentBlue、2026-03以降はDarkGray。Foregroundが空文字の版はtextをnullにした。
- oss-source / 2026-03-20 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/fc03891a113da762175011f4e8e93acd0da49b0d/packages/cli/src/ui/components/Tips.tsx
  - 開始時の短い使い方と/helpの案内。

### gemini-cli-2026-07

- official-doc / 2026-07-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/docs/reference/commands.md
  - 固定コミットの操作説明。モデル・設定・会話再開等の入口。公開日ではなく対象コミットの日付。
- oss-source / 2026-07-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/InputPrompt.tsx
  - 入力欄の文字による丸い枠・接頭記号・補完。2026-01には画像貼り付けを@相対パスへ変える実装。
- oss-source / 2026-07-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/messages/UserMessage.tsx
  - 利用者の発言は>付き。背景色の適用は設定等の条件付き。
- oss-source / 2026-07-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/messages/GeminiMessage.tsx
  - 返答用の接頭記号と本文の領域。記号はブランド要素としてコピーしない。
- oss-source / 2026-07-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx
  - 道具の実行を会話内のまとまりとして描く。枠やシェル出力の条件分岐。
- oss-source / 2026-07-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/LoadingIndicator.tsx
  - 待機・実行表示、経過時間、Escによる取消案内。幅による表示分岐がある。
- oss-source / 2026-07-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/Footer.tsx
  - 設定できる下部の情報行。フォルダー、モデル、使用量、安全な実行領域の状態など。
- oss-source / 2026-07-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/themes/theme.ts
  - Default / Default Lightの宣言色。bgはBackground値、panelはInputBackground、mutedはGray、accentはAccentPurple。2025年のborderは入力枠のAccentBlue、2026-03以降はDarkGray。Foregroundが空文字の版はtextをnullにした。
- oss-source / 2026-07-15 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/3ff5ba20fc1ad7d867218bbdb34756eb54d6eccb/packages/cli/src/ui/components/Tips.tsx
  - 開始時の短い使い方と/helpの案内。
- blog / 2026-05-19 / 閲覧日 2026-11-15: https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/
  - 6月18日から個人プラン等をAntigravity CLIへ移行する案内。常設バナーの形の根拠ではない。

### gemini-cli-2026-11

- official-doc / 2026-11-01 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/docs/reference/commands.md
  - 固定コミットの操作説明。モデル・設定・会話再開等の入口。公開日ではなく対象コミットの日付。
- oss-source / 2026-11-01 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/InputPrompt.tsx
  - 入力欄の文字による丸い枠・接頭記号・補完。2026-01には画像貼り付けを@相対パスへ変える実装。
- oss-source / 2026-11-01 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/messages/UserMessage.tsx
  - 利用者の発言は>付き。背景色の適用は設定等の条件付き。
- oss-source / 2026-11-01 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/messages/GeminiMessage.tsx
  - 返答用の接頭記号と本文の領域。記号はブランド要素としてコピーしない。
- oss-source / 2026-11-01 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/messages/ToolGroupMessage.tsx
  - 道具の実行を会話内のまとまりとして描く。枠やシェル出力の条件分岐。
- oss-source / 2026-11-01 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/LoadingIndicator.tsx
  - 待機・実行表示、経過時間、Escによる取消案内。幅による表示分岐がある。
- oss-source / 2026-11-01 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/Footer.tsx
  - 設定できる下部の情報行。フォルダー、モデル、使用量、安全な実行領域の状態など。
- oss-source / 2026-11-01 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/themes/theme.ts
  - Default / Default Lightの宣言色。bgはBackground値、panelはInputBackground、mutedはGray、accentはAccentPurple。2025年のborderは入力枠のAccentBlue、2026-03以降はDarkGray。Foregroundが空文字の版はtextをnullにした。
- oss-source / 2026-11-01 / 閲覧日 2026-11-15: https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/Tips.tsx
  - 開始時の短い使い方と/helpの案内。
- blog / 2026-05-19 / 閲覧日 2026-11-15: https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/
  - 6月18日から個人プラン等をAntigravity CLIへ移行する案内。常設バナーの形の根拠ではない。

## 修正点・未確認

- 描画コードの文字絵バナーはコピーしない。配色名は文字絵を再利用する許可ではない（https://github.com/google-gemini/gemini-cli/blob/b6b9923dc3b80a73fdee3a3ccd6070c8cfb551cd/packages/cli/src/ui/components/InputPrompt.tsx）
- 2025年8月のGitHub Actionsはリポジトリ上の別の利用形態。CLI内の常設のPR例・ツリー図・バッジの根拠は unverified。実装には件数の情報行がある（https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/ContextSummaryDisplay.tsx）
- 2025年10月のHeadless・MCP用ボタン列は unverified。対話入力と状態行を用いる（https://github.com/google-gemini/gemini-cli/blob/8c74be79c58a0c344d4eb05c72b649a49cb44cae/packages/cli/src/ui/components/Composer.tsx）
- 2026年1月の画像貼り付けは@相対パスを本文へ挿入する。@clipboard-imageピルや画面寸法の常設表は unverified（https://github.com/google-gemini/gemini-cli/blob/beacc4f6fd102fd969239ffddb6c092631cd0481/packages/cli/src/ui/components/InputPrompt.tsx）
- 2026年3月にToken Heatmapを常設する根拠は unverified。/stats heatmapの追加を確認できる公開記録は2026年11月10日のv0.69.0-preview.0（https://github.com/google-gemini/gemini-cli/releases/tag/v0.69.0-preview.0）
- 移行告知は2026年5月19日公開で6月18日の対象利用者への変更を記す。7月版の常設バナー・専用のmacOSウィンドウバー・Sandbox Bridgeボタンは unverified（https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/）
- 2026年11月のRestore Snapshot / Discardカードや常設の容量計は unverified。実装で確認できるのは設定可能な情報行（https://github.com/google-gemini/gemini-cli/blob/6814e00d6b148c3a1d57244d5d7040f7c541009d/packages/cli/src/ui/components/Footer.tsx）
- 2025年8月の利用者の発言には枠がある。10月・2026年1月は枠のない行。全時期を同じ吹き出しにしない（https://github.com/google-gemini/gemini-cli/blob/6037cb5d60b8e31b92315dd86fc65dbc57316376/packages/cli/src/ui/components/messages/UserMessage.tsx）
- 色はDefault / Default Lightという選べるテーマの宣言値。OSの端末全体が常にこの背景色になるという断定ではない。2025年10月と2026年1月の既定文字色は空文字のためnull。
- カタログの各日付に近い固定コミットを参照した。配布済みの版番号との一致、Gemini 4各モデルの利用可否、@file:line、クラッシュ復旧表示、MCP OAuth接続バッジは unverified。

## 補助資料・取得失敗

- https://github.com/google-gemini/gemini-cli/releases — 2026-11-15閲覧。11月10日のv0.69.0-preview.0に/stats heatmap追加の記録。既存版の見た目へ遡らせない。
- https://github.com/google-gemini/gemini-cli/releases/tag/v0.69.0-preview.0 — 公開日2026-11-10。上記一覧のリンク先。独立した別証拠ではない。
- https://developers.googleblog.com/en/new-in-gemini-code-assist/ — 公開日2025-08-21。GitHub ActionsとIDE連携の説明。8月14日のCLIに専用PRカードが常設される証拠ではない。
- https://developers.googleblog.com/introducing-gemini-cli-github-actions/ — 取得不可。正しい記事と混同しない。
- https://raw.githubusercontent.com/google-gemini/gemini-cli/v0.1.0/packages/cli/src/ui/themes/default.ts と https://raw.githubusercontent.com/google-gemini/gemini-cli/v0.1.0/packages/cli/src/ui/components/InputPrompt.tsx — 404。v0.1.0を初日固定版として採用しない。
- https://github.com/google-gemini/gemini-cli/releases/tag/v0.1.1 — 404。代わりにコミットで固定した。
- mainのdefault.tsは移動済みだった。mainを過去版に流用しない。2026年のテーマ部品はbuiltin配下だが、色の宣言は各固定コミットのtheme.tsを読む。
- 2026-03以降のdocs/cli/commands.mdは取得不可。実在するdocs/reference/commands.mdを読んだ。
- スクリーンショット・ロゴ・文字絵・動物の顔・アプリのアイコンは保存していない。
