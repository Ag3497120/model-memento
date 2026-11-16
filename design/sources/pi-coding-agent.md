# Pi Coding Agent — 版別の画面調査

調査日: 2026-11-15。対象ファイル: `design/specs/pi-coding-agent.json`。

## 対象と読み方

- 依頼の識別子は `pi-coding-agent`。現在のカタログの対応先は `earendil-works--pi`。既存 8 版の ID をすべて維持した。
- 対象: 端末の通常表示と全画面表示。利用者の追加機能による配置変更は標準の画面と分ける。
- カタログの年月は分類用。JSON の `from` は月までにそろえ、`to` は終了を確認できないため null。これは観測した固定版の記録であり、必ずしも新機能の初公開日ではない。
- ソースの日付は、記事・リリースなら確認できた公開日、固定タグやコミットの資料ならその版の観測日。ファイル自体の最終編集日と区別する。日付のない公開ページは null とし、取得日はこの調査日。
- `sources[].shows` に領域・操作・会話・形・空の状態の根拠となる項目名を記載。`palette.source` は色の項目ごとの直接の参照先。書体名は公開コードの宣言で、実際に読み込めたかを実行した証拠ではない。
- `density` は領域と文字行からの調査上の分類。`free_fallback` は再描画に使う代替案で、製品の事実ではない。端末の角丸ピクセル値は定義できないので null。
- null は「未確認」のほか、端末設定に従う色、混色や未変換の色を含む。下記で区別する。数値を推測して埋めていない。

用語: タグは名前を付けた公開版、コミットはソースの保存時点。Gateway は会話と接続の中継役、スキンは色や短い表示の設定。CLI / TUI は端末で扱う文字の画面を指す。

## 使用した資料の種類

公式の操作資料、同じ固定版の公開ソース、変更履歴・公開版の記録を主に照合した。ブログや長い利用記事は時期・用途・追加画面の補助確認に用い、別の版へ寸法や色を遡って移さない。Internet Archive の取得は末尾に記載。公式動画の説明文だけで対象版の配置を固定できた根拠は採用していない。動画のフレームは見ていない。

## 版の対応

| 既存 ID または追加 ID | 観測対象 | 信頼度 |
| --- | --- | --- |
| `earendil-works--pi-2025-12-0` | v0.12.0 / 2025-12-02 | 0.87 |
| `earendil-works--pi-2026-06-1` | v0.80.3 / 2026-06-30 | 0.90 |
| `earendil-works--pi-2026-07-2` | v0.83.0 / 2026-07-29 | 0.90 |
| `earendil-works--pi-2026-08-3` | v0.84.4 / 2026-08-28 | 0.90 |
| `earendil-works--pi-2026-09-4` | v0.99.2 / 2026-09-30 | 0.86 |
| `earendil-works--pi-2026-10-5` | v1.0.0 / 2026-10-01 | 0.86 |
| `earendil-works--pi-2026-10-6` | v1.4.0 / 2026-10-21 | 0.86 |
| `earendil-works--pi-record` | v1.5.2 / 2026-11-10 | 0.86 |

信頼度は資料の充実度の評価であり、実行による検証の確率ではない。

## earendil-works--pi-2025-12-0

対象: v0.12.0 / 2025-12-02。

端末の通常の履歴に会話を積み重ねる。 利用者の入力は横長の色付き帯、回答は塗りのない本文。 入力枠の色が推論の強さを示す。 下部に作業場所・使用量・モデルをまとめる。 初期の通常表示。モデル選択と配色選択は入力欄から開く。

### 根拠

- [official-doc / 2025-12-02](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/README.md) — v0.12.0 の操作資料。regions・controls・empty_state・入力中の操作の根拠。版の切り替わりごとに固定した資料を読み、最新の説明を過去へ流用していない。
- [oss-source / 2025-12-02](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/src/tui/tool-execution.ts) — conversation.tool_calls：実行中・成功・失敗の背景と、出力を開閉する実装。
- [oss-source / 2025-12-02](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/src/tui/user-message.ts) — conversation.user：背景付きの利用者メッセージ。ピクセルの吹き出しではなく端末の文字行。
- [oss-source / 2025-12-02](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/src/tui/assistant-message.ts) — conversation.assistant：同じ固定版の実装で、背景を塗らない本文と別色の推論を確認。
- [oss-source / 2025-12-02](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/src/theme/dark.json) — palette.dark：役割ごとの文字色と背景色。画面全体の背景を設定する値はなく、HTML 書き出し用の背景は流用しない。
- [oss-source / 2025-12-02](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/src/theme/light.json) — palette.light：固定 light の文字色、枠色、利用者の帯の色。
- [release-notes / 2025-12-02](https://github.com/earendil-works/pi/releases/tag/v0.12.0) — 版の公開日と差分の確認。すべてのリリースが画面の刷新を意味するわけではない。
- [blog / 2025-11-30](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) — 作者による初期設計の説明。通常の端末履歴を使う方式、文字中心の縦並び、差分更新の根拠。11月30日の説明なので12月2日版の操作は固定版の資料を優先。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`。
- `palette.dark`: `bg`、`panel`、`text`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## earendil-works--pi-2026-06-1

対象: v0.80.3 / 2026-06-30。

端末の通常の履歴に会話を積み重ねる。 利用者の入力は横長の色付き帯、回答は塗りのない本文。 入力枠の色が推論の強さを示す。 下部に作業場所・使用量・モデルをまとめる。 左右の余白を設定できる。起動時の読み込み一覧と下部の使用量表示を持つ。

### 根拠

- [official-doc / 2026-06-30](https://github.com/earendil-works/pi/blob/v0.80.3/packages/coding-agent/README.md) — v0.80.3 の操作資料。regions・controls・empty_state・入力中の操作の根拠。版の切り替わりごとに固定した資料を読み、最新の説明を過去へ流用していない。
- [official-doc / 2026-06-30](https://github.com/earendil-works/pi/blob/v0.80.3/packages/coding-agent/docs/settings.md) — palette の既定と表示設定。端末の通常の履歴に会話を積み重ねる。
- [oss-source / 2026-06-30](https://github.com/earendil-works/pi/blob/v0.80.3/packages/coding-agent/src/modes/interactive/components/tool-execution.ts) — conversation.tool_calls：実行中・成功・失敗の背景と、出力を開閉する実装。
- [oss-source / 2026-06-30](https://github.com/earendil-works/pi/blob/v0.80.3/packages/coding-agent/src/modes/interactive/components/user-message.ts) — conversation.user：背景付きの利用者メッセージ。ピクセルの吹き出しではなく端末の文字行。
- [oss-source / 2026-06-30](https://github.com/earendil-works/pi/blob/v0.80.3/packages/coding-agent/src/modes/interactive/components/assistant-message.ts) — conversation.assistant：同じ固定版の実装で、背景を塗らない本文と別色の推論を確認。
- [oss-source / 2026-06-30](https://github.com/earendil-works/pi/blob/v0.80.3/packages/coding-agent/src/modes/interactive/theme/dark.json) — palette.dark：役割ごとの文字色と背景色。画面全体の背景を設定する値はなく、HTML 書き出し用の背景は流用しない。
- [oss-source / 2026-06-30](https://github.com/earendil-works/pi/blob/v0.80.3/packages/coding-agent/src/modes/interactive/theme/light.json) — palette.light：固定 light の文字色、枠色、利用者の帯の色。
- [release-notes / 2026-06-30](https://github.com/earendil-works/pi/releases/tag/v0.80.3) — 版の公開日と差分の確認。すべてのリリースが画面の刷新を意味するわけではない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`。
- `palette.dark`: `bg`、`panel`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## earendil-works--pi-2026-07-2

対象: v0.83.0 / 2026-07-29。

端末の通常の履歴に会話を積み重ねる。 利用者の入力は横長の色付き帯、回答は塗りのない本文。 入力枠の色が推論の強さを示す。 下部に作業場所・使用量・モデルをまとめる。 基本の領域と青緑の配色は6月版と共通。新しい専用ペインへの変更は確認できない。

### 根拠

- [official-doc / 2026-07-29](https://github.com/earendil-works/pi/blob/v0.83.0/packages/coding-agent/README.md) — v0.83.0 の操作資料。regions・controls・empty_state・入力中の操作の根拠。版の切り替わりごとに固定した資料を読み、最新の説明を過去へ流用していない。
- [official-doc / 2026-07-29](https://github.com/earendil-works/pi/blob/v0.83.0/packages/coding-agent/docs/settings.md) — palette の既定と表示設定。端末の通常の履歴に会話を積み重ねる。
- [oss-source / 2026-07-29](https://github.com/earendil-works/pi/blob/v0.83.0/packages/coding-agent/src/modes/interactive/components/tool-execution.ts) — conversation.tool_calls：実行中・成功・失敗の背景と、出力を開閉する実装。
- [oss-source / 2026-07-29](https://github.com/earendil-works/pi/blob/v0.83.0/packages/coding-agent/src/modes/interactive/components/user-message.ts) — conversation.user：背景付きの利用者メッセージ。ピクセルの吹き出しではなく端末の文字行。
- [oss-source / 2026-07-29](https://github.com/earendil-works/pi/blob/v0.83.0/packages/coding-agent/src/modes/interactive/components/assistant-message.ts) — conversation.assistant：同じ固定版の実装で、背景を塗らない本文と別色の推論を確認。
- [oss-source / 2026-07-29](https://github.com/earendil-works/pi/blob/v0.83.0/packages/coding-agent/src/modes/interactive/theme/dark.json) — palette.dark：役割ごとの文字色と背景色。画面全体の背景を設定する値はなく、HTML 書き出し用の背景は流用しない。
- [oss-source / 2026-07-29](https://github.com/earendil-works/pi/blob/v0.83.0/packages/coding-agent/src/modes/interactive/theme/light.json) — palette.light：固定 light の文字色、枠色、利用者の帯の色。
- [release-notes / 2026-07-29](https://github.com/earendil-works/pi/releases/tag/v0.83.0) — 版の公開日と差分の確認。すべてのリリースが画面の刷新を意味するわけではない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`。
- `palette.dark`: `bg`、`panel`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## earendil-works--pi-2026-08-3

対象: v0.84.4 / 2026-08-28。

通常表示が既定。設定で全画面表示にすると、入力欄と状態欄を下に固定できる。 利用者の入力は横長の色付き帯、回答は塗りのない本文。 入力枠の色が推論の強さを示す。 下部に作業場所・使用量・モデルをまとめる。 通常表示と追加の全画面表示を切り替えられる。全画面側は会話のスクロールバーと選択コピーを持つ。

### 根拠

- [official-doc / 2026-08-28](https://github.com/earendil-works/pi/blob/v0.84.4/packages/coding-agent/README.md) — v0.84.4 の操作資料。regions・controls・empty_state・入力中の操作の根拠。版の切り替わりごとに固定した資料を読み、最新の説明を過去へ流用していない。
- [official-doc / 2026-08-28](https://github.com/earendil-works/pi/blob/v0.84.4/packages/coding-agent/docs/settings.md) — palette の既定と表示設定。通常表示が既定。設定で全画面表示にすると、入力欄と状態欄を下に固定できる。
- [oss-source / 2026-08-28](https://github.com/earendil-works/pi/blob/v0.84.4/packages/coding-agent/src/modes/interactive/components/tool-execution.ts) — conversation.tool_calls：実行中・成功・失敗の背景と、出力を開閉する実装。
- [oss-source / 2026-08-28](https://github.com/earendil-works/pi/blob/v0.84.4/packages/coding-agent/src/modes/interactive/components/user-message.ts) — conversation.user：背景付きの利用者メッセージ。ピクセルの吹き出しではなく端末の文字行。
- [oss-source / 2026-08-28](https://github.com/earendil-works/pi/blob/v0.84.4/packages/coding-agent/src/modes/interactive/components/assistant-message.ts) — conversation.assistant：同じ固定版の実装で、背景を塗らない本文と別色の推論を確認。
- [oss-source / 2026-08-28](https://github.com/earendil-works/pi/blob/v0.84.4/packages/coding-agent/src/modes/interactive/theme/dark.json) — palette.dark：役割ごとの文字色と背景色。画面全体の背景を設定する値はなく、HTML 書き出し用の背景は流用しない。
- [oss-source / 2026-08-28](https://github.com/earendil-works/pi/blob/v0.84.4/packages/coding-agent/src/modes/interactive/theme/light.json) — palette.light：固定 light の文字色、枠色、利用者の帯の色。
- [release-notes / 2026-08-28](https://github.com/earendil-works/pi/releases/tag/v0.84.4) — 版の公開日と差分の確認。すべてのリリースが画面の刷新を意味するわけではない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`。
- `palette.dark`: `bg`、`panel`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## earendil-works--pi-2026-09-4

対象: v0.99.2 / 2026-09-30。

通常表示が既定。設定で全画面表示にすると、入力欄と状態欄を下に固定できる。 利用者の入力は横長の色付き帯、回答は塗りのない本文。 入力枠の色が推論の強さを示す。 下部に作業場所・使用量・モデルをまとめる。 端末の配色から色を作る system が既定。固定の dark/light は別に選べる。

### 根拠

- [official-doc / 2026-09-30](https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/docs/usage.md) — v0.99.2 の操作資料。regions・controls・empty_state・入力中の操作の根拠。版の切り替わりごとに固定した資料を読み、最新の説明を過去へ流用していない。
- [official-doc / 2026-09-30](https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/docs/settings.md) — palette の既定と表示設定。通常表示が既定。設定で全画面表示にすると、入力欄と状態欄を下に固定できる。 system 配色は端末の設定に従うため固定 HEX は定めない。
- [oss-source / 2026-09-30](https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/src/modes/interactive/components/tool-execution.ts) — conversation.tool_calls：実行中・成功・失敗の背景と、出力を開閉する実装。
- [oss-source / 2026-09-30](https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/src/modes/interactive/components/user-message.ts) — conversation.user：背景付きの利用者メッセージ。ピクセルの吹き出しではなく端末の文字行。
- [oss-source / 2026-09-30](https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/src/modes/interactive/components/assistant-message.ts) — conversation.assistant：同じ固定版の実装で、背景を塗らない本文と別色の推論を確認。
- [oss-source / 2026-09-30](https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/src/modes/interactive/theme/dark.json) — palette.dark：固定 dark の色は OKHSL（色を数式で指定する形式）。HEX へは変換していないため値は null。これは既定の system 配色とは別。
- [oss-source / 2026-09-30](https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/src/modes/interactive/theme/light.json) — palette.light：固定 light の OKHSL 値。未変換の HEX 値は null。
- [release-notes / 2026-09-30](https://github.com/earendil-works/pi/releases/tag/v0.99.2) — 版の公開日と差分の確認。すべてのリリースが画面の刷新を意味するわけではない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## earendil-works--pi-2026-10-5

対象: v1.0.0 / 2026-10-01。

全画面表示が既定。会話だけを上下に動かせ、入力欄と状態欄は下に残る。 利用者の入力は横長の色付き帯、回答は塗りのない本文。 入力枠の色が推論の強さを示す。 下部に作業場所・使用量・モデルをまとめる。 全画面表示が既定へ変わる。版番号と操作案内だけを残す起動設定もある。

### 根拠

- [official-doc / 2026-10-01](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/usage.md) — v1.0.0 の操作資料。regions・controls・empty_state・入力中の操作の根拠。版の切り替わりごとに固定した資料を読み、最新の説明を過去へ流用していない。
- [official-doc / 2026-10-01](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/settings.md) — palette の既定と表示設定。全画面表示が既定。会話だけを上下に動かせ、入力欄と状態欄は下に残る。 system 配色は端末の設定に従うため固定 HEX は定めない。
- [oss-source / 2026-10-01](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/src/modes/interactive/components/tool-execution.ts) — conversation.tool_calls：実行中・成功・失敗の背景と、出力を開閉する実装。
- [oss-source / 2026-10-01](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/src/modes/interactive/components/user-message.ts) — conversation.user：背景付きの利用者メッセージ。ピクセルの吹き出しではなく端末の文字行。
- [oss-source / 2026-10-01](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/src/modes/interactive/components/assistant-message.ts) — conversation.assistant：同じ固定版の実装で、背景を塗らない本文と別色の推論を確認。
- [oss-source / 2026-10-01](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/src/modes/interactive/theme/dark.json) — palette.dark：固定 dark の色は OKHSL（色を数式で指定する形式）。HEX へは変換していないため値は null。これは既定の system 配色とは別。
- [oss-source / 2026-10-01](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/src/modes/interactive/theme/light.json) — palette.light：固定 light の OKHSL 値。未変換の HEX 値は null。
- [release-notes / 2026-10-01](https://github.com/earendil-works/pi/releases/tag/v1.0.0) — 版の公開日と差分の確認。すべてのリリースが画面の刷新を意味するわけではない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## earendil-works--pi-2026-10-6

対象: v1.4.0 / 2026-10-21。

全画面表示が既定。会話だけを上下に動かせ、入力欄と状態欄は下に残る。 利用者の入力は横長の色付き帯、回答は塗りのない本文。 入力枠の色が推論の強さを示す。 下部に作業場所・使用量・モデルをまとめる。 全画面の基本配置は1.0.0と共通。選択画面を重ねて開いたときの復帰が修正された。

### 根拠

- [official-doc / 2026-10-21](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/usage.md) — v1.4.0 の操作資料。regions・controls・empty_state・入力中の操作の根拠。版の切り替わりごとに固定した資料を読み、最新の説明を過去へ流用していない。
- [official-doc / 2026-10-21](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/settings.md) — palette の既定と表示設定。全画面表示が既定。会話だけを上下に動かせ、入力欄と状態欄は下に残る。 system 配色は端末の設定に従うため固定 HEX は定めない。
- [oss-source / 2026-10-21](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/modes/interactive/components/tool-execution.ts) — conversation.tool_calls：実行中・成功・失敗の背景と、出力を開閉する実装。
- [oss-source / 2026-10-21](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/modes/interactive/components/user-message.ts) — conversation.user：背景付きの利用者メッセージ。ピクセルの吹き出しではなく端末の文字行。
- [oss-source / 2026-10-21](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/modes/interactive/components/assistant-message.ts) — conversation.assistant：同じ固定版の実装で、背景を塗らない本文と別色の推論を確認。
- [oss-source / 2026-10-21](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/modes/interactive/theme/dark.json) — palette.dark：固定 dark の色は OKHSL（色を数式で指定する形式）。HEX へは変換していないため値は null。これは既定の system 配色とは別。
- [oss-source / 2026-10-21](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/modes/interactive/theme/light.json) — palette.light：固定 light の OKHSL 値。未変換の HEX 値は null。
- [release-notes / 2026-10-21](https://github.com/earendil-works/pi/releases/tag/v1.4.0) — 版の公開日と差分の確認。すべてのリリースが画面の刷新を意味するわけではない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## earendil-works--pi-record

対象: v1.5.2 / 2026-11-10。

全画面表示が既定。会話だけを上下に動かせ、入力欄と状態欄は下に残る。 利用者の入力は横長の色付き帯、回答は塗りのない本文。 入力枠の色が推論の強さを示す。 下部に作業場所・使用量・モデルをまとめる。 全画面の基本配置を継続。元の作業フォルダーがなくなった会話を、今のフォルダーへ分ける選択肢が加わる。

### 根拠

- [official-doc / 2026-11-10](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/docs/usage.md) — v1.5.2 の操作資料。regions・controls・empty_state・入力中の操作の根拠。版の切り替わりごとに固定した資料を読み、最新の説明を過去へ流用していない。
- [official-doc / 2026-11-10](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/docs/settings.md) — palette の既定と表示設定。全画面表示が既定。会話だけを上下に動かせ、入力欄と状態欄は下に残る。 system 配色は端末の設定に従うため固定 HEX は定めない。
- [oss-source / 2026-11-10](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/src/modes/interactive/components/tool-execution.ts) — conversation.tool_calls：実行中・成功・失敗の背景と、出力を開閉する実装。
- [oss-source / 2026-11-10](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/src/modes/interactive/components/user-message.ts) — conversation.user：背景付きの利用者メッセージ。ピクセルの吹き出しではなく端末の文字行。
- [oss-source / 2026-11-10](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/src/modes/interactive/components/assistant-message.ts) — conversation.assistant：同じ固定版の実装で、背景を塗らない本文と別色の推論を確認。
- [oss-source / 2026-11-10](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/src/modes/interactive/theme/dark.json) — palette.dark：固定 dark の色は OKHSL（色を数式で指定する形式）。HEX へは変換していないため値は null。これは既定の system 配色とは別。
- [oss-source / 2026-11-10](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/src/modes/interactive/theme/light.json) — palette.light：固定 light の OKHSL 値。未変換の HEX 値は null。
- [release-notes / 2026-11-10](https://github.com/earendil-works/pi/releases/tag/v1.5.2) — 版の公開日と差分の確認。すべてのリリースが画面の刷新を意味するわけではない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## 修正点などの補助リンク

- [公開日未確認](https://github.com/earendil-works/pi) — 修正点で参照した補助の根拠。日付不明のページは、過去の版の見た目の主根拠にはしない。
- [公開日未確認](https://github.com/earendil-works/pi/releases/tag/v0.84.0) — 修正点で参照した補助の根拠。日付不明のページは、過去の版の見た目の主根拠にはしない。
- [公開日未確認](https://lucumr.pocoo.org/2026/1/31/pi/) — 修正点で参照した補助の根拠。日付不明のページは、過去の版の見た目の主根拠にはしない。

## 以前の調査・描画との差分

- 依頼の pi-coding-agent はカタログの earendil-works--pi に対応する。8個の既存版 ID を維持した。作者の初期説明と現在の公式リポジトリで同じ製品を確認：https://mariozechner.at/posts/2025-11-30-pi-coding-agent/ 、https://github.com/earendil-works/pi
- 初期版を常時全画面の端末画面として描かない。作者の初期設計は端末の通常履歴を使う方式：https://mariozechner.at/posts/2025-11-30-pi-coding-agent/
- 全画面表示の追加は v0.84.0（2026-08-06）、既定への変更は v1.0.0（2026-10-01）。8月版と10月版を同じ既定表示にしない：https://github.com/earendil-works/pi/releases/tag/v0.84.0 、https://github.com/earendil-works/pi/releases/tag/v1.0.0
- テーマの export.pageBg / export.cardBg は HTML 書き出し用。端末の画面背景として塗らない：https://github.com/earendil-works/pi/blob/v0.80.3/packages/coding-agent/src/modes/interactive/theme/dark.json
- 9月の固定版では system 配色が既定で、固定 dark/light の色定義も OKHSL に変わっている。以前の青緑の HEX 値を11月版の既定色として固定しない：https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/docs/settings.md 、https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/src/modes/interactive/theme/dark.json
- 独自の /answer・/todos・/review の画面は利用者の追加機能の例であり、標準の常設領域ではない：https://lucumr.pocoo.org/2026/1/31/pi/
- 書体は端末側の設定に従う。typography の代替書体は本調査側の再描画案で、製品指定ではない。radius_px は端末のため null、density は文字行の構成からの分類。版の日付は観測対象の固定版で、終了日が確認できないため to は null：https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/docs/usage.md

## 色の扱い

- 初期の `text: ""` は端末の標準文字色を使う指定。黒や白を本体の固定色と断定せず null にした。[v0.12.0 dark](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/src/theme/dark.json)、[v0.12.0 light](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/src/theme/light.json)。
- 6〜8月の `palette.border` は配色ファイルの `border`。推論の強さを示す編集欄には `thinkingOff` から `thinkingMax` など別の値が使われるため、すべての枠を同じ青に塗らない。[v0.83.0 dark](https://github.com/earendil-works/pi/blob/v0.83.0/packages/coding-agent/src/modes/interactive/theme/dark.json)。
- 9月以降の既定は system、つまり端末の配色から作るもの。下表は任意に選べる固定 dark/light の宣言で、既定の実行結果ではない。OKHSL は色を数値で指定する形式。HEX（6桁の色番号）への変換は実装・実行していない。

| 固定版 | dark の text / accent / userMessageBg | light の text / accent / userMessageBg |
| --- | --- | --- |
| v0.99.2 | `okhsl(234 3% 89%)` / `okhsl(295 50% 67%)` / `okhsl(233 41% 24%)` [定義](https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/src/modes/interactive/theme/dark.json) | `okhsl(225 5% 27%)` / `okhsl(295 60% 46%)` / `okhsl(235 19% 91%)` [定義](https://github.com/earendil-works/pi/blob/v0.99.2/packages/coding-agent/src/modes/interactive/theme/light.json) |
| v1.0.0 | `okhsl(234 3% 89%)` / `okhsl(295 50% 67%)` / `okhsl(233 41% 24%)` [定義](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/src/modes/interactive/theme/dark.json) | `okhsl(225 5% 27%)` / `okhsl(295 60% 46%)` / `okhsl(235 19% 91%)` [定義](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/src/modes/interactive/theme/light.json) |
| v1.4.0 | `okhsl(234 3% 89%)` / `okhsl(295 50% 67%)` / `okhsl(233 41% 24%)` [定義](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/modes/interactive/theme/dark.json) | `okhsl(225 5% 27%)` / `okhsl(295 60% 46%)` / `okhsl(235 19% 91%)` [定義](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/src/modes/interactive/theme/light.json) |
| v1.5.2 | `okhsl(234 3% 89%)` / `okhsl(295 50% 67%)` / `okhsl(233 41% 24%)` [定義](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/src/modes/interactive/theme/dark.json) | `okhsl(225 5% 27%)` / `okhsl(295 60% 46%)` / `okhsl(235 19% 91%)` [定義](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/src/modes/interactive/theme/light.json) |

## 補助で読んだ資料

- [2025-12-02 / 公開ソース](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/src/tui/tui-renderer.ts) — 起動案内、会話、待ち行列、状態、編集欄、フッターを縦に置く順序を確認。
- [2025-12-02 / 公開ソース](https://github.com/earendil-works/pi/blob/v0.12.0/packages/coding-agent/src/tui/footer.ts) — 作業フォルダー、使用量、モデル名の配置を確認。
- [2026-11-10 / 公開ソース](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/src/modes/interactive/interactive-mode.ts) — 起動案内が設定や端末の対応によって変わることを確認。製品のロゴ描画は取り込んでいない。
- [2026-11-10 / 公式資料](https://github.com/earendil-works/pi/blob/v1.5.2/packages/coding-agent/README.md) — 現行の全体像と個別資料への導線。過去版の見た目の根拠にはしない。
- [2026-01-31 / 作者側の長い利用説明](https://lucumr.pocoo.org/2026/1/31/pi/) — 個人が作った追加コマンドの画面例。標準の機能や常設の領域と誤認しないために使用。埋め込み動画のフレーム・画像は採取していない。
- [公開日未確認・取得 2026-11-15 / 公式サイト](https://pi.dev/) — ログインしていない紹介ページ。Earendil と本体の案内を確認。ページ自体の配置・図柄・装飾文字は端末のデザイン事実にしない。

## 取得できなかった資料

- [Internet Archive 指定時刻 2025-12-01](https://web.archive.org/web/20251201000000/https://github.com/badlogic/pi-mono) — web の取得ツールでアクセス不可。実際の保存時刻・画面は **unverified**。指定時刻を保存済みスナップショットの日時と扱わず、根拠数に含めない。
- [最初に試した作者記事の URL](https://mariozechner.at/2025/11/30/pi-coding-agent/) — アクセス不可。正しい `/posts/2025-11-30-pi-coding-agent/` の記事を別途読んだ。

## 未確認事項・レビューで判断が必要な点

- 端末の書体、背景、文字の画素サイズ、正確な行間、実行時の表示速度、利用者が入れた配色や追加機能は未測定。
- 9月以降の固定配色の HEX は未変換。端末の system 配色を固定の色へ置き換えない。
- `.work/design-out/pi-coding-agent.json` はなかった。`web/js/tools/index.js` に専用モジュールの登録はなく、個別レンダラーの修正は行っていない。
- 依頼名とカタログ名の対応は本文に記録した。仕様の読み込み側で `pi-coding-agent` と `earendil-works--pi` を対応させる必要があれば、担当者が別ファイルで扱う。

## 実施範囲

公開された文章・公開ソースの読み取りだけ。インストール、製品起動、外部モデルへの送信、サーバーや検証ハーネスの起動はしていない。画像、動画、フォント、バイナリ、ロゴのデータ、他製品のコードはプロジェクトに入れていない。

## オフラインの最終確認コマンド

以下はこの作業のデータ確認用コード。製品やサーバーは起動しない。別途、カタログの既存24版がすべてあること、重複 ID、年月の形式、色番号、必須キーも標準ライブラリーの検査で確認した。

```sh
node --input-type=module -e 'import fs from "node:fs";
import assert from "node:assert/strict";
const files = ["openclaw-formerly-clawdbot-moltbot", "hermes-agent", "pi-coding-agent"];
let total = 0;
for (const id of files) {
  const spec = JSON.parse(fs.readFileSync("design/specs/" + id + ".json", "utf8"));
  assert.equal(spec.schema, "memento.design.v1");
  const notes = fs.readFileSync("design/sources/" + id + ".md", "utf8");
  for (const version of spec.versions) {
    assert(new Set(version.sources.map(source => source.url)).size >= 2);
    assert(new Set(version.sources.map(source => source.kind)).size >= 3);
    for (const source of version.sources) assert(notes.includes(source.url));
  }
  total += spec.versions.length;
  console.log(id + ": " + spec.versions.length + " versions; JSON OK; sources OK");
}
console.log("PASS: 3 JSON files; 3 notes; " + total + " versions");'
```
