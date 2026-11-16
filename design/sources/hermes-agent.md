# Hermes Agent — 版別の画面調査

調査日: 2026-11-15。対象ファイル: `design/specs/hermes-agent.json`。

## 対象と読み方

- 依頼の識別子は `hermes-agent`。現在のカタログの対応先は `nousresearch--hermes-agent`。既存 8 版の ID をすべて維持した。
- 対象: 既存8版は通常 CLI（端末の文字画面）。追加3記録は全画面 TUI、専用アプリ、専用アプリと共通のブラウザー画面。
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
| `nousresearch--hermes-agent-2026-03-0` | v2026.3.12 / 通常 CLI | 0.86 |
| `nousresearch--hermes-agent-2026-05-1` | v2026.5.29.2 / 通常 CLI | 0.87 |
| `nousresearch--hermes-agent-2026-06-2` | v2026.6.19 / 通常 CLI | 0.87 |
| `nousresearch--hermes-agent-2026-07-3` | v2026.7.30 / 通常 CLI | 0.87 |
| `nousresearch--hermes-agent-2026-08-4` | v2026.8.31 / 通常 CLI | 0.87 |
| `nousresearch--hermes-agent-2026-09-5` | v2026.9.24 / 通常 CLI | 0.87 |
| `nousresearch--hermes-agent-2026-10-6` | v0.22.5 / 通常 CLI modern | 0.90 |
| `nousresearch--hermes-agent-record` | v0.23.1+canary.20261114T064334Z / 通常 CLI modern | 0.90 |
| `hermes-agent-2026-05` | v2026.5.29.2 / 全画面 TUI（追加） | 0.90 |
| `hermes-agent-2026-06` | v2026.6.19 / 専用アプリ（追加） | 0.88 |
| `hermes-agent-2026-11` | v0.23.1+canary.20261114T064334Z / 共通ブラウザー画面（追加） | 0.82 |

信頼度は資料の充実度の評価であり、実行による検証の確率ではない。

## nousresearch--hermes-agent-2026-03-0

対象: v2026.3.12 / 通常 CLI。

金色と茶色の起動案内、下部の固定入力欄。 会話の再開時に前回の振り返りを挟む。 道具の実行名と経過時間が同じ会話内に出る。 起動時のモデル・作業場所・使える道具・追加の手順をまとめた案内と、下部の入力欄を持つ。

### 根拠

- [official-doc / 2026-03-12](https://github.com/NousResearch/hermes-agent/blob/v2026.3.12/website/docs/user-guide/cli.md) — v2026.3.12 の通常 CLI（端末の文字画面）の資料。regions・controls・conversation・empty_state の根拠。追加の全画面 TUI やデスクトップ版とは別。この日付は固定版の観測日。
- [oss-source / 2026-03-12](https://github.com/NousResearch/hermes-agent/blob/v2026.3.12/hermes_cli/skin_engine.py) — palette：標準スキンのアクセント、起動案内の控えめな文字、入力罫線の色。panel は状態欄・候補欄の背景だけを指す。回答本文や端末全体の色は未固定のため null。
- [oss-source / 2026-03-12](https://github.com/NousResearch/hermes-agent/blob/v2026.3.12/cli.py) — regions と conversation：固定入力と、回答ラベル付きの水平罫線による出力。
- [oss-source / 2026-03-12](https://github.com/NousResearch/hermes-agent/blob/v2026.3.12/hermes_cli/banner.py) — empty_state：起動案内の情報構成。図柄のコードは転記しない。
- [release-notes / 2026-03-12](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.3.12) — 公開版の対応と差分を確認。タグ名の年月や番号だけで新しい見た目を推定していない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`panel`、`text`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## nousresearch--hermes-agent-2026-05-1

対象: v2026.5.29.2 / 通常 CLI。

金色と茶色の起動案内、下部の固定入力欄。 入力欄の上に容量バー付きの状態欄がある。 道具の実行名と経過時間が同じ会話内に出る。 入力欄の上に、モデル名・会話の使用量・容量バー・費用・経過時間の状態欄がある。

### 根拠

- [official-doc / 2026-05-29](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/website/docs/user-guide/cli.md) — v2026.5.29.2 の通常 CLI（端末の文字画面）の資料。regions・controls・conversation・empty_state の根拠。追加の全画面 TUI やデスクトップ版とは別。この日付は固定版の観測日。
- [oss-source / 2026-05-29](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/hermes_cli/skin_engine.py) — palette：標準スキンのアクセント、起動案内の控えめな文字、入力罫線の色。panel は状態欄・候補欄の背景だけを指す。回答本文や端末全体の色は未固定のため null。
- [release-notes / 2026-05-29](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.5.29.2) — 公開版の対応と差分を確認。タグ名の年月や番号だけで新しい見た目を推定していない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`text`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## nousresearch--hermes-agent-2026-06-2

対象: v2026.6.19 / 通常 CLI。

金色と茶色の起動案内、下部の固定入力欄。 入力欄の上に容量バー付きの状態欄がある。 道具の実行名と経過時間が同じ会話内に出る。 通常の端末画面は5月版と同じ領域構成。専用アプリ版があることと混同しない。

### 根拠

- [official-doc / 2026-06-19](https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/website/docs/user-guide/cli.md) — v2026.6.19 の通常 CLI（端末の文字画面）の資料。regions・controls・conversation・empty_state の根拠。追加の全画面 TUI やデスクトップ版とは別。この日付は固定版の観測日。
- [oss-source / 2026-06-19](https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/hermes_cli/skin_engine.py) — palette：標準スキンのアクセント、起動案内の控えめな文字、入力罫線の色。panel は状態欄・候補欄の背景だけを指す。回答本文や端末全体の色は未固定のため null。
- [release-notes / 2026-06-19](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.6.19) — 公開版の対応と差分を確認。タグ名の年月や番号だけで新しい見た目を推定していない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`text`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## nousresearch--hermes-agent-2026-07-3

対象: v2026.7.30 / 通常 CLI。

金色と茶色の起動案内、下部の固定入力欄。 入力欄の上に容量バー付きの状態欄がある。 道具の実行名と経過時間が同じ会話内に出る。 金色と茶色の基本配色は継続。専用の推論文字色などを追加の配色設定で指定できる。

### 根拠

- [official-doc / 2026-07-30](https://github.com/NousResearch/hermes-agent/blob/v2026.7.30/website/docs/user-guide/cli.md) — v2026.7.30 の通常 CLI（端末の文字画面）の資料。regions・controls・conversation・empty_state の根拠。追加の全画面 TUI やデスクトップ版とは別。この日付は固定版の観測日。
- [oss-source / 2026-07-30](https://github.com/NousResearch/hermes-agent/blob/v2026.7.30/hermes_cli/skin_engine.py) — palette：標準スキンのアクセント、起動案内の控えめな文字、入力罫線の色。panel は状態欄・候補欄の背景だけを指す。回答本文や端末全体の色は未固定のため null。
- [release-notes / 2026-07-30](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.7.30) — 公開版の対応と差分を確認。タグ名の年月や番号だけで新しい見た目を推定していない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`text`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## nousresearch--hermes-agent-2026-08-4

対象: v2026.8.31 / 通常 CLI。

金色と茶色の起動案内、下部の固定入力欄。 入力欄の上に容量バー付きの状態欄がある。 道具の実行名と経過時間が同じ会話内に出る。 Ctrl+P のコマンド検索と、入力して絞り込むモデル一覧が加わる。会話名を状態欄の右側に出す。

### 根拠

- [official-doc / 2026-08-31](https://github.com/NousResearch/hermes-agent/blob/v2026.8.31/website/docs/user-guide/cli.md) — v2026.8.31 の通常 CLI（端末の文字画面）の資料。regions・controls・conversation・empty_state の根拠。追加の全画面 TUI やデスクトップ版とは別。この日付は固定版の観測日。
- [oss-source / 2026-08-31](https://github.com/NousResearch/hermes-agent/blob/v2026.8.31/hermes_cli/skin_engine.py) — palette：標準スキンのアクセント、起動案内の控えめな文字、入力罫線の色。panel は状態欄・候補欄の背景だけを指す。回答本文や端末全体の色は未固定のため null。
- [release-notes / 2026-08-31](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.8.31) — 公開版の対応と差分を確認。タグ名の年月や番号だけで新しい見た目を推定していない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`text`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## nousresearch--hermes-agent-2026-09-5

対象: v2026.9.24 / 通常 CLI。

金色と茶色の起動案内、下部の固定入力欄。 入力欄の上に容量バー付きの状態欄がある。 道具の実行名と経過時間が同じ会話内に出る。 入力欄の上に作業中の子エージェントや処理を並べ、詳細な作業一覧を全画面で開ける。

### 根拠

- [official-doc / 2026-09-24](https://github.com/NousResearch/hermes-agent/blob/v2026.9.24/website/docs/user-guide/cli.md) — v2026.9.24 の通常 CLI（端末の文字画面）の資料。regions・controls・conversation・empty_state の根拠。追加の全画面 TUI やデスクトップ版とは別。この日付は固定版の観測日。
- [oss-source / 2026-09-24](https://github.com/NousResearch/hermes-agent/blob/v2026.9.24/hermes_cli/skin_engine.py) — palette：標準スキンのアクセント、起動案内の控えめな文字、入力罫線の色。panel は状態欄・候補欄の背景だけを指す。回答本文や端末全体の色は未固定のため null。
- [release-notes / 2026-09-24](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.9.24) — 公開版の対応と差分を確認。タグ名の年月や番号だけで新しい見た目を推定していない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`text`、`user_bubble`。
- `palette.dark`: `bg`、`text`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## nousresearch--hermes-agent-2026-10-6

対象: v0.22.5 / 通常 CLI modern。

罫線と短い印で区切る行単位の会話。 状態欄が入力欄の下にある。 道具の実行名と経過時間が同じ会話内に出る。 modern が既定。回答と道具の結果を短い印付きの行にし、状態欄を入力欄の下へ置く。

### 根拠

- [official-doc / 2026-10-23](https://github.com/NousResearch/hermes-agent/blob/v0.22.5/website/docs/user-guide/cli.md) — v0.22.5 の通常 CLI（端末の文字画面）の資料。regions・controls・conversation・empty_state の根拠。modern が既定、classic は任意の旧配置。この日付は固定版の観測日。
- [oss-source / 2026-10-23](https://github.com/NousResearch/hermes-agent/blob/v0.22.5/hermes_cli/skin_engine.py) — palette：標準スキンのアクセント、起動案内の控えめな文字、入力罫線の色。panel は状態欄・候補欄の背景だけを指す。回答本文や端末全体の色は未固定のため null。
- [oss-source / 2026-10-23](https://github.com/NousResearch/hermes-agent/blob/v0.22.5/hermes_cli/cli_modern_layout.py) — modern の既定設定、短い罫線、道具の行、活動の表示、入力欄より下の状態表示を確認。
- [release-notes / 2026-10-23](https://github.com/NousResearch/hermes-agent/releases/tag/v0.22.5) — 公開版の対応と差分を確認。タグ名の年月や番号だけで新しい見た目を推定していない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`text`、`user_bubble`。
- `palette.dark`: `bg`、`text`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## nousresearch--hermes-agent-record

対象: v0.23.1+canary.20261114T064334Z / 通常 CLI modern。

罫線と短い印で区切る行単位の会話。 状態欄が入力欄の下にある。 道具の実行名と経過時間が同じ会話内に出る。 modern の配置を継続。過去の入力を選び直す操作と、対応する端末で画像を会話内に出す機能を持つ。

### 根拠

- [official-doc / 2026-11-14](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/website/docs/user-guide/cli.md) — v0.23.1+canary.20261114T064334Z の通常 CLI（端末の文字画面）の資料。regions・controls・conversation・empty_state の根拠。modern が既定、classic は任意の旧配置。この日付は固定版の観測日。
- [oss-source / 2026-11-14](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/hermes_cli/skin_engine.py) — palette：標準スキンのアクセント、起動案内の控えめな文字、入力罫線の色。panel は状態欄・候補欄の背景だけを指す。回答本文や端末全体の色は未固定のため null。
- [oss-source / 2026-11-14](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/hermes_cli/cli_modern_layout.py) — modern の既定設定、短い罫線、道具の行、活動の表示、入力欄より下の状態表示を確認。
- [release-notes / 2026-11-14](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.1%2Bcanary.20261114T064334Z) — 公開版の対応と差分を確認。タグ名の年月や番号だけで新しい見た目を推定していない。
- [release-notes / 2026-11-05](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.0) — 過去の入力の選び直しと端末内の画像表示を確認。画像そのものは再配布しない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`text`、`user_bubble`。
- `palette.dark`: `bg`、`text`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## hermes-agent-2026-05

対象: v2026.5.29.2 / 全画面 TUI（追加）。

通常 CLI と別の全画面表示。 道具・追加の手順・指示文・接続先を開閉できる起動案内。 モデルや許可確認を重ねた選択画面で行う。 マウスでの文字選択と、入力を止めない起動処理。

### 根拠

- [official-doc / 2026-05-29](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/website/docs/user-guide/tui.md) — regions・controls・conversation・empty_state：追加の全画面表示の操作。最初の公開日ではなく、この固定版で存在を確認。
- [oss-source / 2026-05-29](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/ui-tui/src/theme.ts) — palette の明暗と文字の役割。panel は候補・状態欄。端末全体の背景と利用者の吹き出しは未確認。
- [oss-source / 2026-05-29](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/hermes_cli/skin_engine.py) — 標準スキンから重ねる色や短い印の設定。
- [release-notes / 2026-05-28](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.5.28) — 同月の本体リリース。5月29日の修正版を観測した位置づけを確認。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`user_bubble`。
- `palette.dark`: `bg`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。

## hermes-agent-2026-06

対象: v2026.6.19 / 専用アプリ（追加）。

端末版と別の専用アプリの画面。 左の案内欄、中央の会話、必要時に開く右のプレビュー。 モデル選択は入力欄のマイクの左。 下部の状態欄に会話の使用状況と操作をまとめる。 標準 Nous 配色と別に、他の配色や利用者が追加した配色を選べる。

### 根拠

- [official-doc / 2026-06-19](https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/website/docs/user-guide/desktop.md) — regions・controls・conversation：専用アプリの左の案内欄、会話、右の表示、入力欄のモデル選択、状態欄。空の画面の正確な文言は未確認。
- [oss-source / 2026-06-19](https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/apps/desktop/src/themes/presets.ts) — palette・typography：標準 Nous 配色の colors と darkColors、DEFAULT_SKIN_NAME、書体スタック。panel は sidebarBackground、accent は primary に対応。明るい版の枠と利用者の帯は色の混合式のため HEX は null。
- [release-notes / 2026-06-19](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.6.19) — 専用アプリのショートカット、通知、右の作業表示、入力欄のモデル選択、端末ペイン、配色選択を説明。
- [release-notes / 2026-06-06](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.6.5) — 専用アプリを出した一つ前の本体版。6月19日を初公開日と断定しない。

### 確認できない値と適用範囲

- `palette.light`: `border`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 角丸のピクセル値は null。
- 空の画面の正確な文言・構成は未確認のため `empty_state: null`。

## hermes-agent-2026-11

対象: v0.23.1+canary.20261114T064334Z / 共通ブラウザー画面（追加）。

管理用の Web Dashboard とは別の、専用アプリと共通の作業画面。 会話を中心にした簡単な配置と、補助領域を並べる配置。 ファイルや変更確認、端末は必要なときに開く。 専用アプリ・端末・ブラウザーで同じ会話の続きが表示される。

### 根拠

- [official-doc / 2026-11-14](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/website/docs/user-guide/desktop.md) — regions・controls・conversation：ブラウザーで専用アプリと共通の画面を提供する機能。管理用 Web Dashboard との違い。
- [oss-source / 2026-11-14](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/apps/desktop/src/app/contrib/layout-presets.ts) — regions・shape：左の会話、中央、右の変更確認とファイル、下の端末という配置案。Simple は補助領域を閉じた配置、Advanced は並べる配置。固定幅ではなく比率と利用者の変更を使う。
- [oss-source / 2026-11-14](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/apps/shared/src/theme-presets.ts) — palette：複数の配色を共有している。ブラウザーで実際に選ばれる配色の実行確認はしていないので固定 HEX は null。
- [release-notes / 2026-11-05](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.0) — 専用アプリと同じ作業画面をブラウザーへ提供する追加を説明。
- [release-notes / 2026-11-14](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.1%2Bcanary.20261114T064334Z) — 観測対象の固定版。試験版であることを保持。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。
- 空の画面の正確な文言・構成は未確認のため `empty_state: null`。

## 修正点などの補助リンク

- [公開日未確認](https://github.com/NousResearch/hermes-agent) — 修正点で参照した補助の根拠。日付不明のページは、過去の版の見た目の主根拠にはしない。
- [公開日未確認](https://hermes-agent.nousresearch.com/docs/user-guide/desktop) — 修正点で参照した補助の根拠。日付不明のページは、過去の版の見た目の主根拠にはしない。
- [公開日未確認](https://hermes-agent.nousresearch.com/desktop) — 修正点で参照した補助の根拠。日付不明のページは、過去の版の見た目の主根拠にはしない。

## 以前の調査・描画との差分

- 依頼の hermes-agent はカタログの nousresearch--hermes-agent に対応する。既存8版の ID を維持し、全画面 TUI・専用アプリ・ブラウザー版を別の追加記録にした：https://github.com/NousResearch/hermes-agent 、https://hermes-agent.nousresearch.com/docs/user-guide/desktop
- カタログ側の terminal 分類に、web/src/App.tsx の案内欄の輪郭を合成しない。通常 CLI、追加 TUI、専用アプリ、管理 Web Dashboard は別の画面：https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/website/docs/user-guide/desktop.md
- 3月の通常 CLI は、情報のある起動案内、下部の固定入力、罫線で区切る回答。ウェブ用のカードや固定の黒い画面背景を足す根拠はない：https://github.com/NousResearch/hermes-agent/blob/v2026.3.12/cli.py 、https://github.com/NousResearch/hermes-agent/blob/v2026.3.12/hermes_cli/skin_engine.py
- 10月の固定版は modern の行単位表示が既定。旧配置の状態欄を入力欄の上に残したまま最新の既定画面として扱わない：https://github.com/NousResearch/hermes-agent/blob/v0.22.5/website/docs/user-guide/cli.md 、https://github.com/NousResearch/hermes-agent/blob/v0.22.5/hermes_cli/cli_modern_layout.py
- 全画面 TUI の文字色と専用アプリの Nous 配色を混ぜない。TUI の金色、専用アプリの明暗の青系配色は異なる根拠を持つ：https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/ui-tui/src/theme.ts 、https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/apps/desktop/src/themes/presets.ts
- 11月の共通ブラウザー画面と、以前からある管理画面を区別する。単に『ウェブ対応』という理由で以前の版へ同じチャット画面を当てはめない：https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.0
- 製品のホームページはログインしていない紹介ページとしてだけ読んだ。掲載画像から色・寸法・当時の状態は採取していない：https://hermes-agent.nousresearch.com/desktop
- kind はカタログの主対象である terminal。追加記録では領域名と出典で別の画面を明示する。日付は固定版の観測時点で、機能の初公開日とは限らない。終了日は未確認のため to は null。density は文字行や領域の構成からの分類、free_fallback は本調査側の提案：https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/website/docs/user-guide/desktop.md

## 配色を混ぜないための補足

- 通常 CLI の `palette.dark.muted` は起動案内の `banner_dim`、`border` は入力の `input_rule`。回答用の `response_border` は別の金色。本文全体へ案内用の色を一律に当てる意味ではない。[3月の定義](https://github.com/NousResearch/hermes-agent/blob/v2026.3.12/hermes_cli/skin_engine.py)。
- 状態欄を持つ版の `panel` は状態欄・補完候補の面だけ。端末全体の背景ではない。[5月の定義](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/hermes_cli/skin_engine.py)。
- 9月以降の標準スキンに明るい面向けの色の重ね合わせがある。入力罫線は暗い版の値を継ぐ。利用者の端末と選んだスキンによる補正があり、JSON は宣言値を記録している。[9月の定義](https://github.com/NousResearch/hermes-agent/blob/v2026.9.24/hermes_cli/skin_engine.py)。
- 追加 TUI の `panel` は候補・状態欄。背景全体と利用者発言の帯は未確認。標準スキンから重ねる指定があり、基礎配色と実行時の補正結果を区別する。[5月 TUI の配色](https://github.com/NousResearch/hermes-agent/blob/v2026.5.29.2/ui-tui/src/theme.ts)。
- 専用アプリは標準 Nous 配色の `primary` を accent として記録し、`sidebarBackground` を panel とした。明るい版の枠・利用者の帯は色を混ぜる式のため、HEX を作っていない。[6月の専用アプリ配色](https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/apps/desktop/src/themes/presets.ts)。
- 11月の追加ブラウザー画面には複数の配色と配置がある。実際に選択される既定の配色を起動して確認していないため固定 HEX は null。[共有する配色](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/apps/shared/src/theme-presets.ts)、[配置案](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/apps/desktop/src/app/contrib/layout-presets.ts)。

## 補助で読んだ資料

- [2026-06-19 / 公開ソース](https://github.com/NousResearch/hermes-agent/blob/v2026.6.19/ui-tui/src/theme.ts) — 5月の TUI と同じ領域の色の対応を照合。専用アプリの配色と取り違えないために使用。
- [2026-11-14 / 公開ソース](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/ui-tui/src/theme.ts) — 現行の全画面 TUI は基礎色から配色を作り、明暗・端末によって補正する。通常 CLI や6月の TUI に現行の値を遡って移していない。
- [2026-11-14 / 公式資料](https://github.com/NousResearch/hermes-agent/blob/v0.23.1%2Bcanary.20261114T064334Z/website/docs/user-guide/tui.md) — 現行の全画面 TUI の操作、前の入力の選び直し、作業一覧を補助確認。
- [公開日未確認・取得 2026-11-15 / 公式資料](https://hermes-agent.nousresearch.com/docs/user-guide/desktop) — 現行の専用アプリと、同じ作業画面を使うブラウザー版の区別。版ごとの仕様には固定タグ側を優先。
- [公開日未確認・取得 2026-11-15 / 公式サイト](https://hermes-agent.nousresearch.com/desktop) — ログインしていない紹介・配布ページ。画面の画像は取得せず、文字の説明だけを使用。掲載された対応 OS の説明にも版差があり、過去の画面の根拠として扱わない。
- [2026-10-22 / Tom's Guide の長い利用記事](https://www.tomsguide.com/ai/ditch-the-data-center-i-fired-my-cloud-chatbot-and-built-a-free-local-ai-agent-to-run-on-my-pc-and-you-can-too) — 初期設定で名前・接続するアプリ・配色を選ぶ操作を補助照合。掲載版のタグ不明。端末版の構成・色・寸法をここから採っていない。

## 取得できなかった資料

- [Internet Archive 指定時刻 2026-03-13](https://web.archive.org/web/20260313000000/https://hermes-agent.nousresearch.com/) — 取得ツールでアクセス不可。保存時刻・当時の画面は **unverified**。根拠数に含めない。

## 未確認事項・レビューで判断が必要な点

- 端末の基本背景・標準文字色・書体・行間・正確なサイズ、専用アプリの空状態の文言や角丸、実際の更新間隔は未確認。
- `sources[].date` の v0.22.5 は GitHub の公開日で10月23日。リリース本文に10月22日とあるので、同じ日として丸めていない。[公開記録](https://api.github.com/repos/NousResearch/hermes-agent/releases/tags/v0.22.5)。
- 専用アプリの6月追加記録は6月19日の観測。6月5日付の版で公開されたという、次の版からの説明を根拠にしており、初公開時の画面を6月19日の画像として装っていない。[6月19日の説明](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.6.19)。
- `.work/design-out/hermes-agent.json` はなかった。専用の `web/js/tools/` モジュールはなかった。既存 `web/data/layouts/nousresearch--hermes-agent.json` は terminal の分類にウェブの部品の輪郭を含んでおり、本体の全画面 TUI と同じものとして扱わない。
- 依頼名とカタログ名を、仕様の読み込み側でどう対応させるかは別担当の判断。カタログや描画コードは編集していない。

## 実施範囲

公開された文章・公開ソースの読み取りだけ。製品を起動していない。元の文字ロゴ、杖の図柄、顔文字の連続アニメーション、専用アプリの図柄は転記していない。インストールやサーバー・ハーネスの起動、画像・フォント・バイナリの取得はしていない。

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
