# OpenClaw（旧 Clawdbot / Moltbot） — 版別の画面調査

調査日: 2026-11-15。対象ファイル: `design/specs/openclaw-formerly-clawdbot-moltbot.json`。

## 対象と読み方

- 依頼の識別子は `openclaw-formerly-clawdbot-moltbot`。現在のカタログの対応先は `openclaw-formerly-clawdbot-moltbot`。既存 8 版の ID をすべて維持した。
- 対象: 初期は warelay の端末。1月4日・28日・31日と6月・8月・9月・11月はブラウザーの Control UI を主対象とする。3月は macOS メニュー。既存の WhatsApp などの見た目とは混ぜない。
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
| `openclaw-formerly-clawdbot-moltbot-2025-11` | v0.1.1 / warelay 端末 | 0.88 |
| `openclaw-clawdbot-2026-01` | 2026-01-04 UTC の公開コード / Control UI | 0.83 |
| `openclaw-moltbot-2026-01` | 2026-01-28 UTC の公開コード / Control UI | 0.88 |
| `openclaw-formerly-clawdbot-moltbot-2026-01` | v2026.1.30（公開 2026-01-31）/ Control UI | 0.88 |
| `openclaw-2026-03-macos` | 2026-03-18 UTC の公開コード / macOS メニュー | 0.90 |
| `openclaw-2026-06` | 2026-06-15 UTC の公開コード / Control UI | 0.88 |
| `openclaw-formerly-clawdbot-moltbot-2026-08` | v2026.8.1（公開 2026-08-31）/ Control UI（追加） | 0.92 |
| `openclaw-2026-09` | 2026-09-12 UTC の公開コード / Control UI | 0.88 |
| `openclaw-2026-11` | 2026-11-10 UTC の公開コード / Control UI | 0.89 |

信頼度は資料の充実度の評価であり、実行による検証の確率ではない。

## openclaw-formerly-clawdbot-moltbot-2025-11

対象: v0.1.1 / warelay 端末。

WhatsApp と外部コマンドをつなぐ端末の道具。 接続は QR 読み取りか Twilio の設定。 色付きのヘルプと、実行例の案内。 会話の見た目は既存のメッセージアプリに従う。

### 根拠

- [official-doc / 2025-11-25](https://github.com/openclaw/openclaw/blob/v0.1.1/README.md) — regions・controls・conversation・empty_state：端末と WhatsApp の役割、QR 接続、ログ、外部コマンドでの返信、Twilio の入力中表示。
- [release-notes / 2025-11-25](https://github.com/openclaw/openclaw/releases/tag/v0.1.1) — ヘルプの名称・説明・実行例に色を使う変更。具体的な色番号・書体・間隔は書かれていない。
- [blog / 2026-01-29](https://openclaw.ai/blog/introducing-openclaw) — WhatsApp Relay から Clawd / Moltbot / OpenClaw へ続く名称の経緯。過去の画面の色や配置の証拠には使わない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。
- `conversation.tool_calls` はこの対象画面で未確認、または会話本文のない表示。

## openclaw-clawdbot-2026-01

対象: 2026-01-04 UTC の公開コード / Control UI。

暗い青系の面と暖色のアクセント、明るい版は生成りの面。 左の管理一覧と、右の会話。 会話の上に Session Key と Refresh。 下に Message と Send。

### 根拠

- [official-doc / 2026-01-04](https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/docs/control-ui.md) — Clawdbot の Control UI。regions・controls・接続と会話の役割の根拠。この日以前の最後の公開コミットを固定した開発中の画面であり、同日の製品リリースを意味しない。
- [oss-source / 2026-01-04](https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/ui/src/styles/base.css) — palette・typography・shape.radius_px：標準 Claw 系の明暗の基礎値。panel は CSS の --panel、accent は --accent。透明度や混色を含む利用者の面色は HEX として作らず null。
- [oss-source / 2026-01-04](https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/ui/src/styles/layout.css) — regions：左欄の幅、上帯の高さ、折りたたみ状態。広い画面の基準値で、狭い画面や利用者の設定では変わる。density は本調査での分類。
- [oss-source / 2026-01-04](https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/ui/src/ui/views/chat.ts) — conversation・empty_state・controls：Session Key、Refresh、Message、Send、時刻、回答と道具のカード。
- [oss-source / 2026-01-04](https://api.github.com/repos/openclaw/openclaw/commits?until=2026-01-04T23%3A59%3A59Z&per_page=1) — 観測する公開コミット aa45f512f4bb376a060b4642b4b27b358573f710 の選定根拠。UTC の同日末以前で取得。指定日の名前のタグを推定していない。
- [changelog / 2026-01-04](https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/CHANGELOG.md) — 当時の更新履歴を参照。日付名のタグが見つからないため、未公開項目をリリース済み機能と扱わない。

### 確認できない値と適用範囲

- `palette.light`: `panel`、`text`、`muted`、`border`、`user_bubble`。
- `palette.dark`: `panel`、`text`、`muted`、`border`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 角丸のピクセル値は null。

## openclaw-moltbot-2026-01

対象: 2026-01-28 UTC の公開コード / Control UI。

左の管理一覧と上の接続・表示の帯。 Space Grotesk と赤いアクセント。 右の利用者発言と、左の回答カード。 送信・停止・追加入力を下部へまとめる。

### 根拠

- [official-doc / 2026-01-28](https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/docs/web/control-ui.md) — Moltbot の Control UI。regions・controls・接続と会話の役割の根拠。この日以前の最後の公開コミットを固定した開発中の画面であり、同日の製品リリースを意味しない。
- [oss-source / 2026-01-28](https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/ui/src/styles/base.css) — palette・typography・shape.radius_px：標準 Claw 系の明暗の基礎値。panel は CSS の --panel、accent は --accent。透明度や混色を含む利用者の面色は HEX として作らず null。
- [oss-source / 2026-01-28](https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/ui/src/styles/layout.css) — regions：左欄の幅、上帯の高さ、折りたたみ状態。広い画面の基準値で、狭い画面や利用者の設定では変わる。density は本調査での分類。
- [oss-source / 2026-01-28](https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/ui/src/styles/chat/grouped.css) — conversation・shape：利用者の右寄せ、回答のカードまたは平らな本文、道具用の面、実行中の表示。
- [oss-source / 2026-01-28](https://api.github.com/repos/openclaw/openclaw/commits?until=2026-01-28T23%3A59%3A59Z&per_page=1) — 観測する公開コミット fdcac0ccf44704f384f891f8c1016af531e88cb9 の選定根拠。UTC の同日末以前で取得。指定日の名前のタグを推定していない。
- [changelog / 2026-01-28](https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/CHANGELOG.md) — 当時の更新履歴を参照。日付名のタグが見つからないため、未公開項目をリリース済み機能と扱わない。
- [oss-source / 2026-01-28](https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/ui/src/ui/views/chat.ts) — controls：同日の実装で New session / Stop、Send / Queue の切り替えを確認。

### 確認できない値と適用範囲

- `palette.light`: `user_bubble`。
- `palette.dark`: `user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 空の画面の正確な文言・構成は未確認のため `empty_state: null`。

## openclaw-formerly-clawdbot-moltbot-2026-01

対象: v2026.1.30（公開 2026-01-31）/ Control UI。

左の管理一覧と上の接続・表示の帯。 Space Grotesk と赤いアクセント。 右の利用者発言と、左の回答カード。 送信・停止・追加入力を下部へまとめる。

### 根拠

- [official-doc / 2026-01-31](https://github.com/openclaw/openclaw/blob/v2026.1.30/docs/web/control-ui.md) — OpenClaw の Control UI。regions・controls・接続と会話の役割の根拠。
- [oss-source / 2026-01-31](https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/base.css) — palette・typography・shape.radius_px：標準 Claw 系の明暗の基礎値。panel は CSS の --panel、accent は --accent。透明度や混色を含む利用者の面色は HEX として作らず null。
- [oss-source / 2026-01-31](https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/layout.css) — regions：左欄の幅、上帯の高さ、折りたたみ状態。広い画面の基準値で、狭い画面や利用者の設定では変わる。density は本調査での分類。
- [oss-source / 2026-01-31](https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/chat/grouped.css) — conversation・shape：利用者の右寄せ、回答のカードまたは平らな本文、道具用の面、実行中の表示。
- [release-notes / 2026-01-31](https://github.com/openclaw/openclaw/releases/tag/v2026.1.30) — 固定タグの公開日は1月31日。会話一覧や表示名の改善を確認。
- [oss-source / 2026-01-31](https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/ui/views/chat.ts) — controls：New session / Stop と Send / Queue の切り替え。
- [official-doc / 2026-01-31](https://github.com/openclaw/openclaw/blob/v2026.1.30/docs/tui.md) — 別の端末用画面も存在する。上に接続先・エージェント・セッション、中央に履歴、下に入力と状態欄。ブラウザーの領域と合成しない。

### 確認できない値と適用範囲

- `palette.light`: `user_bubble`。
- `palette.dark`: `user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 空の画面の正確な文言・構成は未確認のため `empty_state: null`。

## openclaw-2026-03-macos

対象: 2026-03-18 UTC の公開コード / macOS メニュー。

常駐する小さな状態表示から開く操作メニュー。 作業中の表示が、待機時の接続状態より優先される。 音声入力は別の重ねた表示で扱う。 チャット、ブラウザー管理画面、設定をそれぞれ開く。

### 根拠

- [official-doc / 2026-03-18](https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/platforms/mac/menu-bar.md) — regions・conversation・empty_state：メニュー先頭の活動、待機時の状態、接続デバイスの一覧。
- [oss-source / 2026-03-18](https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/apps/macos/Sources/OpenClaw/MenuContentView.swift) — regions・controls：スイッチ、実行許可の選択、Open Chat、Open Dashboard、設定、終了。固定の色番号や幅を持つ模倣メニューにはしない。
- [official-doc / 2026-03-18](https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/platforms/mac/webchat.md) — Open Chat は別の会話表示を開き、セッションを切り替えられる。メニュー内へチャット本文を合成しない。
- [official-doc / 2026-03-18](https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/platforms/mac/voice-overlay.md) — 音声で起動した表示と押しながら話す操作の関係。認識中の文の引き継ぎと、離した時の送信。
- [oss-source / 2026-03-18](https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/apps/macos/Sources/OpenClaw/VoiceWakeOverlayView.swift) — 音声の別表示の文章、編集、音量帯、操作。外側の角丸12、内側8はこの別表示の値であり、メニュー全体の radius_px には流用しない。
- [changelog / 2026-03-18](https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/CHANGELOG.md) — この日の開発中の変更。日付名のタグがないため、メニューの初公開日とは扱わない。
- [official-doc / 2026-01-31](https://github.com/openclaw/openclaw/blob/v2026.1.30/docs/platforms/macos.md) — メニューバー型のコンパニオンは1月の固定版にも記載がある。3月18日を初登場日と断定しない。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`panel`、`text`、`muted`、`accent`、`border`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 指定書体を確認できない、または端末・OS 側へ委ねる欄の書体名は null。
- 角丸のピクセル値は null。
- `conversation.user` はこの対象画面で未確認、または会話本文のない表示。
- `conversation.assistant` はこの対象画面で未確認、または会話本文のない表示。

## openclaw-2026-06

対象: 2026-06-15 UTC の公開コード / Control UI。

左欄258pxと、折りたたみ時の細い移動欄。 Inter の本文と赤いアクセント。 モデルと推論の強さを会話単位で設定する。 チャット内の道具の結果と、入力付近の容量表示。 追加の手順を提案として確認する Skill Workshop があり、通常の会話とは別に見直せる。

### 根拠

- [official-doc / 2026-06-15](https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/docs/web/control-ui.md) — OpenClaw の Control UI。regions・controls・接続と会話の役割の根拠。この日以前の最後の公開コミットを固定した開発中の画面であり、同日の製品リリースを意味しない。
- [oss-source / 2026-06-15](https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/ui/src/styles/base.css) — palette・typography・shape.radius_px：標準 Claw 系の明暗の基礎値。panel は CSS の --panel、accent は --accent。透明度や混色を含む利用者の面色は HEX として作らず null。
- [oss-source / 2026-06-15](https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/ui/src/styles/layout.css) — regions：左欄の幅、上帯の高さ、折りたたみ状態。広い画面の基準値で、狭い画面や利用者の設定では変わる。density は本調査での分類。
- [oss-source / 2026-06-15](https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/ui/src/styles/chat/grouped.css) — conversation・shape：利用者の右寄せ、回答のカードまたは平らな本文、道具用の面、実行中の表示。
- [oss-source / 2026-06-15](https://api.github.com/repos/openclaw/openclaw/commits?until=2026-06-15T23%3A59%3A59Z&per_page=1) — 観測する公開コミット fd806ada649a124d44bffa4850b0da19b739e6e4 の選定根拠。UTC の同日末以前で取得。指定日の名前のタグを推定していない。
- [blog / 2026-06-03](https://openclaw.ai/blog/openclaw-agent-skill-workshop) — Skill Workshop の別ページに、状態別の提案一覧、選択した提案、適用・修正・却下の操作がある。記事本文と画像の説明文だけで確認し、画像は取得しない。通常チャットの常設領域として合成しない。

### 確認できない値と適用範囲

- `palette.light`: `user_bubble`。
- `palette.dark`: `user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 空の画面の正確な文言・構成は未確認のため `empty_state: null`。

## openclaw-formerly-clawdbot-moltbot-2026-08

対象: v2026.8.1（公開 2026-08-31）/ Control UI（追加）。

会話を中心に組み直したブラウザー画面。 左のエージェント選択と保存した会話。 独立した常設の上帯をなくし、左欄と会話見出しへ操作をまとめる。 Instrument Sans と、背景を外した通常の回答本文。

### 根拠

- [official-doc / 2026-08-31](https://github.com/openclaw/openclaw/blob/v2026.8.1/docs/web/control-ui.md) — OpenClaw の Control UI。regions・controls・接続と会話の役割の根拠。
- [oss-source / 2026-08-31](https://github.com/openclaw/openclaw/blob/v2026.8.1/ui/src/styles/base.css) — palette・typography・shape.radius_px：標準 Claw 系の明暗の基礎値。panel は CSS の --panel、accent は --accent。透明度や混色を含む利用者の面色は HEX として作らず null。
- [oss-source / 2026-08-31](https://github.com/openclaw/openclaw/blob/v2026.8.1/ui/src/styles/layout.css) — regions：左欄の幅、上帯の高さ、折りたたみ状態。広い画面の基準値で、狭い画面や利用者の設定では変わる。density は本調査での分類。
- [oss-source / 2026-08-31](https://github.com/openclaw/openclaw/blob/v2026.8.1/ui/src/styles/chat/grouped.css) — conversation・shape：利用者の右寄せ、回答のカードまたは平らな本文、道具用の面、実行中の表示。
- [release-notes / 2026-08-31](https://github.com/openclaw/openclaw/releases/tag/v2026.8.1) — OpenClaw 2.0 に対応する固定リリース。タグ名の8月1日を公開日としない。
- [blog / 2026-08-30](https://openclaw.ai/blog/openclaw-2-accidentally) — 会話中心のブラウザー版への組み直しを公式に説明。掲載画像は取得せず、本文と画像の説明文だけを読む。

### 確認できない値と適用範囲

- `palette.light`: `user_bubble`。
- `palette.dark`: `user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。

## openclaw-2026-09

対象: 2026-09-12 UTC の公開コード / Control UI。

会話を中心に組み直したブラウザー画面。 左のエージェント選択と保存した会話。 独立した常設の上帯をなくし、左欄と会話見出しへ操作をまとめる。 Instrument Sans と、背景を外した通常の回答本文。

### 根拠

- [official-doc / 2026-09-12](https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/docs/web/control-ui.md) — OpenClaw の Control UI。regions・controls・接続と会話の役割の根拠。この日以前の最後の公開コミットを固定した開発中の画面であり、同日の製品リリースを意味しない。
- [oss-source / 2026-09-12](https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/ui/src/styles/base.css) — palette・typography・shape.radius_px：標準 Claw 系の明暗の基礎値。panel は CSS の --panel、accent は --accent。透明度や混色を含む利用者の面色は HEX として作らず null。
- [oss-source / 2026-09-12](https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/ui/src/styles/layout.css) — regions：左欄の幅、上帯の高さ、折りたたみ状態。広い画面の基準値で、狭い画面や利用者の設定では変わる。density は本調査での分類。
- [oss-source / 2026-09-12](https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/ui/src/styles/chat/grouped.css) — conversation・shape：利用者の右寄せ、回答のカードまたは平らな本文、道具用の面、実行中の表示。
- [official-doc / 2026-09-12](https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/docs/web/control-ui/chat.md) — controls・conversation：会話の補助欄、入力横の +、実行の進行と道具の表示。
- [official-doc / 2026-09-12](https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/docs/web/control-ui/sessions-and-sidebar.md) — regions・controls・empty_state：左欄の構成、会話の下書き画面、左欄の開閉と操作の検索。
- [oss-source / 2026-09-12](https://api.github.com/repos/openclaw/openclaw/commits?until=2026-09-12T23%3A59%3A59Z&per_page=1) — 観測する公開コミット 52823e567a69f7a6447f0246fd1c9989373103da の選定根拠。UTC の同日末以前で取得。指定日の名前のタグを推定していない。

- [changelog / 2026-09-12](https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/CHANGELOG/2026.9.4.md) — 固定した保存時点に含まれる9.4の変更履歴。会話から再利用する手順を作る操作などの説明を確認。発売日や寸法はこのファイル名から推定しない。

### 確認できない値と適用範囲

- `palette.light`: `user_bubble`。
- `palette.dark`: `user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。

## openclaw-2026-11

対象: 2026-11-10 UTC の公開コード / Control UI。

左の移動用の細い帯から Pages・Sessions・Users を切り替える。 左欄を折りたたむと会話を広く使える。 Instrument Sans の本文と、平らな回答表示。 新しい会話の下書きで実行先と作業場所を選ぶ。

### 根拠

- [official-doc / 2026-11-10](https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/docs/web/control-ui.md) — OpenClaw の Control UI。regions・controls・接続と会話の役割の根拠。この日以前の最後の公開コミットを固定した開発中の画面であり、同日の製品リリースを意味しない。
- [oss-source / 2026-11-10](https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/ui/src/styles/base.css) — palette・typography：標準 Claw の data-theme=dark/light を優先し、後段の面色の指定まで確認。bg と border、明るい版の panel は混色の式なので未変換の HEX は null。root の古い値をそのまま完成色にしない。
- [oss-source / 2026-11-10](https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/ui/src/styles/layout.css) — regions：左欄の幅、上帯の高さ、折りたたみ状態。広い画面の基準値で、狭い画面や利用者の設定では変わる。density は本調査での分類。
- [oss-source / 2026-11-10](https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/ui/src/styles/chat/grouped.css) — conversation・shape：利用者の右寄せ、回答のカードまたは平らな本文、道具用の面、実行中の表示。
- [official-doc / 2026-11-10](https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/docs/web/control-ui/chat.md) — controls・conversation：会話の補助欄、入力横の +、実行の進行と道具の表示。
- [official-doc / 2026-11-10](https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/docs/web/control-ui/sessions-and-sidebar.md) — regions・controls・empty_state：左欄の構成、会話の下書き画面、左欄の開閉と操作の検索。
- [oss-source / 2026-11-10](https://api.github.com/repos/openclaw/openclaw/commits?until=2026-11-10T23%3A59%3A59Z&per_page=1) — 観測する公開コミット ecaefd29e7f1a23657de41a7eb217ba083c477be の選定根拠。UTC の同日末以前で取得。指定日の名前のタグを推定していない。
- [release-notes / 2026-11-10](https://github.com/openclaw/openclaw/releases/tag/v2026.11.3) — 同月の公開リリース。カタログの『2.0 が11月に初登場』という読み方はせず、8月の2.0からの後続として扱う。

### 確認できない値と適用範囲

- `palette.light`: `bg`、`panel`、`border`、`user_bubble`。
- `palette.dark`: `bg`、`border`、`user_bubble`。
- 幅・高さのない領域は実測していないため `size: null`。
- 角丸のピクセル値は null。

## 修正点などの補助リンク

- [公開日未確認](https://github.com/openclaw/openclaw/blob/v2026.1.30/README.md) — 修正点で参照した補助の根拠。日付不明のページは、過去の版の見た目の主根拠にはしない。
- [公開日未確認](https://openclaw.ai/blog/introducing-openclaw-foundation) — 修正点で参照した補助の根拠。日付不明のページは、過去の版の見た目の主根拠にはしない。

## 以前の調査・描画との差分

- 初期版は warelay のヘルプ・QR 接続・ログを表示する端末の道具。WhatsApp の配色を warelay 自身の画面色として採用しない：https://github.com/openclaw/openclaw/blob/v0.1.1/README.md
- カタログの Clawdbot 2026-01-04 を端末だけの製品と決めつけない。同日の公開コードには左の管理一覧と会話を持つ Control UI がある。本仕様は、このブラウザー画面を主な再描画対象に選んだ：https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/docs/control-ui.md
- 名称が変わるたびに WhatsApp / Telegram / Discord / Slack のバッジを持つ独自チャットへ作り直した、という根拠はない。1月28日の Control UI は管理用の左欄と会話であり、各メッセージアプリの画面とは別：https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/docs/web/control-ui.md
- 以前の調査は1月版を既存チャネル中心に扱ったが、ブラウザーの明暗、書体、220px の左欄、56px の上帯も固定ソースで確認できる。メッセージアプリと混ぜず別の画面として再描画する：https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/base.css 、https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/layout.css
- macOS メニュー内にチャット、壁紙付きのデスクトップ、固定の起動フレーズのバッジを合成しない。Open Chat は別の会話表示を開く。メニューバー型アプリは既に1月版の資料にもある：https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/docs/platforms/mac/webchat.md 、https://github.com/openclaw/openclaw/blob/v2026.1.30/docs/platforms/macos.md
- 6月版を固定の Skills / Nodes のタブ列と汎用の許可カードだけで表さない。同日のコードでは258px の左欄、78px の折りたたみ欄、52px の上帯、Inter の本文を確認できる：https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/ui/src/styles/layout.css 、https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/ui/src/styles/base.css
- 9月の『常設3ペイン、右は ClawHub と Live Canvas』というカタログ記述は、そのまま採用しない。標準は左のエージェント・ページ・会話と中央の会話で、補助欄は必要時に開く：https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/docs/web/control-ui/sessions-and-sidebar.md 、https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/docs/web/control-ui/chat.md
- OpenClaw 2.0 の大きな画面変更は11月初登場ではない。公式記事は8月30日、対応する v2026.8.1 の GitHub 公開は8月31日。別の見た目の追加版として記録した：https://openclaw.ai/blog/openclaw-2-accidentally 、https://github.com/openclaw/openclaw/releases/tag/v2026.8.1
- 11月の固定コードの左欄は Pages / Sessions / Users の移動用の帯を持つ。汎用の『Gateway / OpenCode / Claude Code / Codex』タブ列に置き換えない：https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/docs/web/control-ui/sessions-and-sidebar.md
- kind は複数の表示を持つ agent-app とした。各版の主対象は領域名と出典に明示し、複数の画面を合成しない。スナップショットの日付は初公開日や終了日を意味しない。終了日は未確認なので to は null。density と free_fallback は本調査側の分類・提案：https://github.com/openclaw/openclaw/blob/v2026.1.30/README.md
- Foundation の名は現在の運営名。2025年の版の運営名を遡って置き換えない：https://openclaw.ai/blog/introducing-openclaw-foundation
- 11月版の面色は、以前の root の値から変更されている。data-theme=light の文字は #353535、dark の控えめな文字は #8e8e97。背景と枠は後段の混色の式を優先するため、HEX を推測せず null にした：https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/ui/src/styles/base.css

## 日付を固定した方法

日付名のタグが取得できなかった版は、GitHub の公開コミット一覧に UTC の日末を指定し、返った最初の保存時点のソースを読んだ。このコードが同日公開の npm パッケージと完全一致するかは **unverified**。開発中の画面として記録し、未公開の変更を発売済みの版と断定しない。

| カタログの指定日 | 固定した公開コード | コードの時刻（UTC） |
| --- | --- | --- |
| 2026-01-04 | [aa45f512f4bb](https://github.com/openclaw/openclaw/commit/aa45f512f4bb376a060b4642b4b27b358573f710) | 2026-01-04T23:51:11Z |
| 2026-01-28 | [fdcac0ccf447](https://github.com/openclaw/openclaw/commit/fdcac0ccf44704f384f891f8c1016af531e88cb9) | 2026-01-28T23:51:43Z |
| 2026-03-18 | [07d9f725b618](https://github.com/openclaw/openclaw/commit/07d9f725b618bd676b791f6d1949ecb2bff759c1) | 2026-03-18T23:58:56Z |
| 2026-06-15 | [fd806ada649a](https://github.com/openclaw/openclaw/commit/fd806ada649a124d44bffa4850b0da19b739e6e4) | 2026-06-15T23:58:07Z |
| 2026-09-12 | [52823e567a69](https://github.com/openclaw/openclaw/commit/52823e567a69f7a6447f0246fd1c9989373103da) | 2026-09-12T23:58:06Z |
| 2026-11-10 | [ecaefd29e7f1](https://github.com/openclaw/openclaw/commit/ecaefd29e7f1a23657de41a7eb217ba083c477be) | 2026-11-10T23:55:59Z |

8月の追加版は日付検索ではなく公開タグ v2026.8.1。公式記事の日付は8月30日、GitHub 公開記録は8月31日。この違いはそのまま残した。[公式記事](https://openclaw.ai/blog/openclaw-2-accidentally)、[GitHub の公開記録](https://api.github.com/repos/openclaw/openclaw/releases/tags/v2026.8.1)。

## 色・寸法・別の画面の補足

- 1月4日版には rgba（透明度付き）の面・文字・枠がある。暗い版の面は `rgba(14,20,30,0.88)`、本文は `rgba(244,246,251,0.96)`、控えめな文字は `rgba(156,169,189,0.72)`、枠は `rgba(255,255,255,0.09)`。背景との合成を計算していないので JSON の該当 HEX は null。[固定した base.css](https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/ui/src/styles/base.css)。
- 1月の共通の角丸8pxと会話カードの角丸12px、6月以降の共通10pxとカード14pxなどは役割が異なる。利用者の丸み設定もあるため、すべて同じ角丸とはしない。[1月の基礎値](https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/base.css)、[1月の会話カード](https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/chat/grouped.css)、[6月の基礎値](https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/ui/src/styles/base.css)。
- 1月の明るい版の利用者発言は `rgba(251,146,60,0.12)`、暗い版はアクセントの薄い面を使う。HEX を推測していない。[同じ版の会話 CSS](https://github.com/openclaw/openclaw/blob/v2026.1.30/ui/src/styles/chat/grouped.css)。
- 11月の標準暗色の面は `--bg-content: #0e1015` を基準に、背景は本文色を2%、枠は12%混ぜる式。明るい版の基準は `#f8f8f8`、背景は本文色を2%、枠は7%混ぜる式。明暗とも `--bg` の古い基礎値だけを採らない。[11月の base.css](https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/ui/src/styles/base.css)。
- 1月の端末用 TUI は、上に接続先・エージェント・会話名、中央に履歴と道具、下に入力と状態欄。モデル・エージェント・会話をキー操作で選ぶ別の画面であり、ブラウザーの左欄と合成しない。[1月の TUI 資料](https://github.com/openclaw/openclaw/blob/v2026.1.30/docs/tui.md)。
- macOS 音声の別表示は外側12px、内側8pxの角丸と28pxの音量帯を持つが、メニューのサイズやチャットの角丸に流用しない。[3月の音声表示](https://github.com/openclaw/openclaw/blob/07d9f725b618bd676b791f6d1949ecb2bff759c1/apps/macos/Sources/OpenClaw/VoiceWakeOverlayView.swift)。

## 補助で読んだ資料

- [2026-01-31 / 公式 README](https://github.com/openclaw/openclaw/blob/v2026.1.30/README.md) — メッセージアプリ・端末・ブラウザー・OS アプリが同じ製品にあることを照合。
- [2026-01-04 / 公開ソース](https://github.com/openclaw/openclaw/blob/aa45f512f4bb376a060b4642b4b27b358573f710/ui/src/ui/app-render.ts) — 左の移動一覧、主領域、接続・表示の操作。
- [2026-01-28 / 公開ソース](https://github.com/openclaw/openclaw/blob/fdcac0ccf44704f384f891f8c1016af531e88cb9/ui/src/ui/app-render.ts) — 管理一覧と会話の構成。メッセージアプリのバッジ列ではない。
- [2026-06-15 / 公開ソース](https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/ui/src/ui/app-render.ts) — 会話、セッション、操作の構成を補助照合。
- [2026-06-03 / 公式ブログ](https://openclaw.ai/blog/openclaw-agent-skill-workshop) — 通常チャットと別の提案確認ページ。状態別の一覧、選んだ提案、適用・修正・却下の操作を、記事本文と画像の説明文から確認。画像は取得していない。
- [2026-08-25 / TechRadar の長い設定記事](https://www.techradar.com/pro/how-to-self-host-your-own-ai-agent) — 設定して UI を使う流れを補助確認。公開タグ・配色・寸法の根拠にはしていない。掲載画像は採取していない。
- [公開日未確認・取得 2026-11-15 / 公式リリース案内](https://docs.openclaw.ai/releases/2026.8.1) — 2.0 と v2026.8.1 の対応、会話中心の画面の位置づけ。個別の色・寸法は固定コードを優先。
- [公開日未確認・取得 2026-11-15 / 公式ブログ一覧](https://openclaw.ai/blog) — 日付と記事 URL の発見に使用。ログインしていない公開の一覧であり、製品の操作画面の証拠ではない。

## 取得できなかった資料・採用しない URL

- [v2026.1.4 のツリー](https://api.github.com/repos/openclaw/openclaw/git/trees/v2026.1.4?recursive=1) — GitHub API 404。存在しないと一般化せず、その URL で取得できなかったと記録。
- [v2026.1.27 の公開版](https://api.github.com/repos/openclaw/openclaw/releases/tags/v2026.1.27) — 404。beta.1 の変更履歴とは別の URL。
- [v2026.3.18 の公開版](https://api.github.com/repos/openclaw/openclaw/releases/tags/v2026.3.18) — 404。
- [v2026.6.15 の公開版](https://api.github.com/repos/openclaw/openclaw/releases/tags/v2026.6.15) — 404。
- [v2026.9.12 の公開版](https://api.github.com/repos/openclaw/openclaw/releases/tags/v2026.9.12) — 404。
- [1月4日、後年の位置の control-ui 資料](https://api.github.com/repos/openclaw/openclaw/contents/docs/web/control-ui.md?ref=aa45f512f4bb376a060b4642b4b27b358573f710) — 404。当時の `docs/control-ui.md` を代わりに読んだ。
- [1月4日の chat.css](https://api.github.com/repos/openclaw/openclaw/contents/ui/src/styles/chat.css?ref=aa45f512f4bb376a060b4642b4b27b358573f710) — 404。会話の配置は同日の views/chat.ts を読み、未確認の面色は null。
- [9月、旧位置の app-render.ts](https://api.github.com/repos/openclaw/openclaw/contents/ui/src/ui/app-render.ts?ref=52823e567a69f7a6447f0246fd1c9989373103da) — 404。固定版の分割済み操作資料と CSS を使用。
- [11月、旧位置の app-render.ts](https://api.github.com/repos/openclaw/openclaw/contents/ui/src/ui/app-render.ts?ref=ecaefd29e7f1a23657de41a7eb217ba083c477be) — 404。同じく固定版の操作資料と CSS を使用。
- [9月、旧位置の ui ディレクトリー](https://api.github.com/repos/openclaw/openclaw/contents/ui/src/ui?ref=52823e567a69f7a6447f0246fd1c9989373103da) — 404。
- [11月、旧位置の ui ディレクトリー](https://api.github.com/repos/openclaw/openclaw/contents/ui/src/ui?ref=ecaefd29e7f1a23657de41a7eb217ba083c477be) — 404。
- [6月の CHANGELOG.md](https://github.com/openclaw/openclaw/blob/fd806ada649a124d44bffa4850b0da19b739e6e4/CHANGELOG.md) — 範囲を指定した取得が空文字。変更内容の根拠には採らない。
- [9月の CHANGELOG.md](https://github.com/openclaw/openclaw/blob/52823e567a69f7a6447f0246fd1c9989373103da/CHANGELOG.md)、[11月の CHANGELOG.md](https://github.com/openclaw/openclaw/blob/ecaefd29e7f1a23657de41a7eb217ba083c477be/CHANGELOG.md) — 分割した変更履歴への索引。索引だけから個別の画面変更を推定していない。
- [最初に試した2.0記事 URL](https://openclaw.ai/blog/openclaw-2-0) — アクセス不可。正しい `openclaw-2-accidentally` の記事を使用。
- [Internet Archive 指定時刻 2026-01-28](https://web.archive.org/web/20260128000000/https://clawd.bot/) — 取得ツールでアクセス不可。実際の保存日時・当時のページは **unverified**。根拠数に含めない。

## 未確認事項・レビューで判断が必要な点

- 名前の変更日と UI の変更日は同じとは限らない。ブログの改称記事は1月29日、タグ v2026.1.30 の公開は1月31日なので、矛盾を消して一つの日付にしない。[改称の記事](https://openclaw.ai/blog/introducing-openclaw)、[タグの公開記録](https://api.github.com/repos/openclaw/openclaw/releases/tags/v2026.1.30)。
- 指定日コードと同日 npm 配布物の厳密な一致、OS アプリの実際の配布物との一致、利用者の設定、動作中の寸法、字間、表示速度は未検証。
- 既存メッセージアプリの面色や書体は独自 UI の事実として採用していない。macOS のメニューの最終的な色・書体・寸法も実行していないため null。
- カタログのモデル一覧はこの調査で検証していない。描画を識別する根拠としても使わない。
- `.work/design-out/openclaw-formerly-clawdbot-moltbot.json` の2版と、`web/js/tools/openclaw.js` を読んだ。作業中に他担当が描画コードを変更する可能性があるため、本資料の修正点は担当者が現在のコードと照合して反映する。描画コードやカタログは編集していない。

## 実施範囲

公式記事・資料・公開ソース・公開記録・利用記事の文字だけを読む調査。ログイン後の実画面を開いた、製品を起動した、npm 配布物を動かしたという主張はしない。画像、動画、ロゴ、壁紙、フォントやバイナリは取得していない。インストール、サーバー・ハーネスの起動、メッセージ送信はしていない。

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
