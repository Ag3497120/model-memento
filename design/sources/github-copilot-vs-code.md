# GitHub Copilot (VS Code) の画面調査

調査日: 2026-11-15（日本時間）。公開ページの本文と版を固定した公開ソースを読んだ。実アプリの起動・ログイン・インストール・動作試験はしていない。

## 読み始めたローカル資料

- `web/data/catalog.json` の対象ツールの全版・design・features。
- `.work/design-out/github-copilot-vs-code.json`。
- `web/js/tools/copilot.js`（読み取りのみ）。

## 記録の方針

- JSONは `memento.design.v1`。カタログのidを全て維持し、見た目の違いを資料で示せる版を追加。
- from/toは月単位の参照区間。toは次の記憶用画面への編集上の区切りで、製品の提供終了日を示さない。初日の画面を確定できない版は以下に明記。
- nullは未確認。空のregions/controlsはその日付の配置や操作を確定できないという意味で、実際に何もなかったとはしない。
- confidenceは画面再現の根拠の広さの編集評価。幅・色・書体・初日証拠が欠ける版は低くした。
- 各資料のshowsに、どのフィールドの根拠になるかと時間的な限界を記した。複数URLがあっても当日を証明しない比較資料は明記した。
- 現行の公開ヘルプや発表ページは利用者のログイン後画面を実測した資料ではない。マーケティングだけのページから実アプリの値を採らない。
- free_fallbackは再描画用の代替指定であり、製品の書体という主張ではない。ロゴ・マスコット・図柄・画面写真・フォントファイル・コードのまとまった転載は含めていない。

## 版別の資料と確認範囲

### github-copilot-vs-code-2021-06

参照区間: 2021-06 ～ 2023-03 / confidence: 0.78 / 資料の種類: blog, oss-source。

- [blog / 公開・変更日 2021-06-29 ](https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/) — regions・conversation・empty_state・distinctive: 技術プレビューの入力中補完。記事は2022-02-23にも更新されている。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.58.0/src/vs/workbench/browser/media/style.css) — typography: 直後のVS Code 1.58.0のOS別画面書体。6月29日当日の配布版CSSと同一とは断定しない。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.58.0/src/vs/editor/common/config/editorOptions.ts) — typography: 1.58.0のエディタ書体の既定値。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.58.0/extensions/theme-defaults/themes/dark_vs.json) — palette.darkのbg/text: Dark+が参照する基本テーマのeditor.background/foreground。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.58.0/extensions/theme-defaults/themes/light_vs.json) — palette.lightのbg/text: Light+が参照する基本テーマ。補完文字自体の色は未採録。

### github-copilot-vs-code-2023-03

参照区間: 2023-03 ～ 2023-07 / confidence: 0.65 / 資料の種類: blog, release-notes, oss-source。

- [blog / 公開・変更日 2023-03-22 ](https://github.blog/news-insights/product-news/github-copilot-x-the-ai-powered-developer-experience/) — regions・conversation・distinctive: IDE内の会話を含む構想。PR・CLI・Docsも別々の体験として説明。本文は2024-05-21更新なので初日の細部は断定しない。
- [release-notes / 公開・変更日 不明 ](https://code.visualstudio.com/updates/v1_77) — regions・conversation: 3月版VS CodeがChat viewとinline chatを別の機能として説明。3月22日初日ではなく月内の照合資料。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.77.0/src/vs/workbench/browser/media/style.css) — typography: 3月版のOS別書体と画面内固定幅用の指定。

### github-copilot-vs-code-2023-07

参照区間: 2023-07 ～ 2024-05 / confidence: 0.87 / 資料の種類: blog, release-notes, oss-source。

- [blog / 公開・変更日 2023-07-20 ](https://github.blog/news-insights/product-news/github-copilot-chat-beta-now-available-for-every-organization/) — regions・distinctive: Business向け限定公開ベータ。記事は9月29日にも更新。
- [release-notes / 公開・変更日 不明 ](https://code.visualstudio.com/updates/v1_80) — controls・streaming: /searchやCreate Workspace等のプレビュー、Chat view/inline chat、回答待機・受信の通知。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.80.0/src/vs/workbench/contrib/chat/browser/media/chat.css) — conversation・shape: 最大幅850px、段の余白16px/20px、名前12px、識別枠24px、入力の角丸4px、右下の操作。色はテーマ変数。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.80.0/src/vs/workbench/browser/media/style.css) — typography: OS別書体、固定幅用の指定。

### github-copilot-vs-code-2024-05

参照区間: 2024-05 ～ 2024-10 / confidence: 0.66 / 資料の種類: blog, oss-source。

- [blog / 公開・変更日 2024-05-21 ](https://github.blog/news-insights/product-news/introducing-github-copilot-extensions/) — controls・conversation・distinctive: Extensionsの限定プレビュー。VS Codeも対象で、外部サービスを会話から使用。
- [blog / 公開・変更日 2024-04-29 ](https://github.blog/news-insights/product-news/github-copilot-workspace/) — distinctive: WorkspaceはIssue等から始まる別のタスク中心環境。VS Codeの常設の右ペインという根拠はない。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.89.0/src/vs/workbench/contrib/chat/browser/media/chat.css) — conversation・shape: 直前の4月版のチャット段、名前、コード表示と点の待機表示。5月21日の拡張サービス独自の表示は確定しない。

### github-copilot-vs-code-2024-10

参照区間: 2024-10 ～ 2025-02 / confidence: 0.82 / 資料の種類: blog, release-notes, oss-source。

- [blog / 公開・変更日 2024-10-29 ](https://github.blog/news-insights/product-news/bringing-developer-choice-to-copilot/) — controls・distinctive: 複数社のモデル選択。各モデルの展開時期は異なり、全てが10月29日に揃ったわけではない。
- [release-notes / 公開・変更日 不明 ](https://code.visualstudio.com/updates/v1_95) — regions・controls・conversation: 月の更新名は10月。Editsプレビュー、対象ファイル、Chatの既定位置が第2サイドバーへ。リリース月名と公開日を混同しない。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.95.0/extensions/theme-defaults/themes/dark_modern.json) — palette.dark: Default Dark Modernのエディタ背景・文字、sideBar背景/境界、descriptionForeground、button.background。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.95.0/extensions/theme-defaults/themes/light_modern.json) — palette.light: Default Light Modernの同じ役割。利用者の別テーマには適用しない。

### github-copilot-vs-code-2025-02

参照区間: 2025-02 ～ 2025-04 / confidence: 0.82 / 資料の種類: release-notes, blog, oss-source。

- [release-notes / 公開・変更日 不明 ](https://code.visualstudio.com/updates/v1_97) — regions・controls・conversation: 1.97の実験的Agent。コマンドを表示しContinueを待つ。NESは行番号脇の矢印とTab操作。
- [blog / 公開・変更日 2025-02-24 ](https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode) — regions・empty_state: InsidersのEdits内モード切替とAdd Filesによる対象の指定。2月6日と同一の日次状態までは確定しない。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.97.0/src/vs/workbench/browser/media/style.css) — typography: OS別の画面書体・固定幅用の指定。

### github-copilot-vs-code-2025-04

参照区間: 2025-04 ～ 2025-07 / confidence: 0.8 / 資料の種類: release-notes, blog。

- [release-notes / 公開・変更日 不明 ](https://code.visualstudio.com/updates/v1_99) — regions・controls・conversation: 3月版名の1.99。統合チャットと3モード、通常版Agent、MCP対応。
- [blog / 公開・変更日 2025-04-07 ](https://code.visualstudio.com/blogs/2025/04/07/agentMode) — regions・distinctive: 4月の展開状況。統合会話、会話履歴、別窓への移動、対象ファイル欄の簡素化。MCPはこの時期に一般提供済みと断定しない。

### github-copilot-vs-code-2025-07

参照区間: 2025-07 ～ 2026-02 / confidence: 0.9 / 資料の種類: release-notes, blog, oss-source。

- [release-notes / 公開・変更日 2025-07-09 ](https://code.visualstudio.com/updates/v1_102) — regions・controls・distinctive: Ask/Edit/Agentと独自モード、MCP一般提供、専用のMCP表示。
- [blog / 公開・変更日 2025-06-30 ](https://code.visualstudio.com/blogs/2025/06/30/openSourceAIEditorFirstMilestone) — distinctive: 拡張のソース公開日は6月30日。7月10日を初公開日とはしない。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode-copilot-chat/v0.29.0/package.json) — 版の照合: Chat拡張0.29.0はVS Code 1.102系を対象とする。道具の宣言を確認。図柄やコードの転載はしていない。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.102.0/src/vs/workbench/contrib/chat/browser/media/chat.css) — conversation・shape: 最大幅850px、段の余白12/16px、名前13px、入力の角丸4px/小型2px、添付・モデル欄・進行表示。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.102.0/src/vs/workbench/browser/media/style.css) — typography: OS別画面書体と固定幅指定。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.102.0/extensions/theme-defaults/themes/dark_modern.json) — palette.dark: Default Dark Modernの役割別の色。
- [oss-source / 公開・変更日 不明 ](https://raw.githubusercontent.com/microsoft/vscode/1.102.0/extensions/theme-defaults/themes/light_modern.json) — palette.light: Default Light Modernの役割別の色。

### github-copilot-vs-code-2026-02

参照区間: 2026-02 ～ 2026-05 / confidence: 0.69 / 資料の種類: release-notes, official-doc。

- [release-notes / 公開・変更日 2026-02-04 ](https://code.visualstudio.com/updates/v1_109) — regions・controls・conversation・distinctive: 1.109および追補の作業一覧、場所の選択、状態表示、子作業、Editを隠す実験。カタログの2月18日固有の初日確認ではない。
- [official-doc / 公開・変更日 不明 ](https://code.visualstudio.com/docs/agents/overview) — 比較資料: 現行公式ガイドが会話・作業一覧・Agents windowを別の表示として案内。2月の数値や正確な初日ラベルの証拠にはしない。

### github-copilot-vs-code-2026-05

参照区間: 2026-05 ～ 2026-11 / confidence: 0.72 / 資料の種類: release-notes, official-doc。

- [release-notes / 公開・変更日 2026-05-13 ](https://code.visualstudio.com/updates/v1_120) — regions・controls・distinctive: Agents windowが通常版でもプレビューとして利用可能。Open in Agents、Files/Changes、実行方式等の選択保持。
- [official-doc / 公開・変更日 不明 ](https://code.visualstudio.com/docs/agents/overview) — 比較資料: 現行ガイドもAgents windowと通常エディタ内Chatを区別。5月15日の固定画面ではない。

### github-copilot-vs-code-2026-11

参照区間: 2026-11 ～ 未設定 / confidence: 0.75 / 資料の種類: changelog, release-notes。

- [changelog / 公開・変更日 2026-10-28 ](https://github.blog/changelog/2026-10-28-github-copilot-in-vs-code-universe-releases/) — regions・controls・distinctive: VS CodeのAgents window、既定のCopilot実行方式、Customizations、並列結果の比較。別のCopilot appも列挙されており、同一画面としない。
- [release-notes / 公開・変更日 2026-11-04 ](https://code.visualstudio.com/updates/v1_145) — conversation・distinctive: 生成内容の詳しさの設定、遠隔作業のプレビューや表示。11月10日のモデル追加自体は画面変更の根拠にしない。

## 以前の調査・描画の訂正候補

- 2021年版に常設の会話型Outputパネルを置く根拠はない。コードの続きの補完が中心。https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/
- 2023-03のPR Summary・CLIの常設タブは、別々のCopilot Xプレビューを同じVS Codeパネルへ混ぜている。https://github.blog/news-insights/product-news/github-copilot-x-the-ai-powered-developer-experience/
- 2023-07の@workspaceは初日UIとして未確認。1.80で確認できるプレビュー例は/search等。https://code.visualstudio.com/updates/v1_80
- 以前の調査の2023年Chatを最初からGPT-4固定とする説明は慎重に扱う。2024年の公式回顧ではGPT-3.5から後にGPT-4と説明。画面に固定モデル名を追加しない。https://github.blog/news-insights/product-news/bringing-developer-choice-to-copilot/
- 2024-05のCopilot WorkspaceをVS Codeの常設カードとして描かない。Workspaceは別のタスク中心環境。https://github.blog/news-insights/product-news/github-copilot-workspace/
- 2024-10の画面に全モデルを一斉に並べない。展開は段階的。1.95のChat既定位置は右側の第2サイドバー。https://code.visualstudio.com/updates/v1_95
- 2025-02にv1.99・Ask/Edit/Agent統合・MCP Stable・Autoモデルを同時に表示しない。2月は1.97のEdits内Agentプレビュー。https://code.visualstudio.com/updates/v1_97
- Ask/Edit/Agent統合は1.99期として別版を追加。MCPの一般提供は1.102。https://code.visualstudio.com/updates/v1_102
- 2025-07のMIT RepoボタンやMCP Server Registryの固定表・ツール件数・OAuth状態は製品画面の根拠がない。管理表示と会話を分ける。https://code.visualstudio.com/updates/v1_102
- 2026-02をNESとGitHub Issue割当の宣伝カードだけで表さない。公式の1.109は作業一覧・実行場所選択・子作業表示を扱う。https://code.visualstudio.com/updates/v1_109
- 2026-05のCopilot Fusionメータを5月へ遡らせる根拠は未確認。確認できる別窓は1.120。https://code.visualstudio.com/updates/v1_120
- 2026-11のVS Code版をgithub-copilot-appの独立アプリ画面で代用しない。固定のモデル終了案内・Interactive/Automationsタブの根拠はこの版として未確認。https://github.blog/changelog/2026-10-28-github-copilot-in-vs-code-universe-releases/
- paletteはテーマを選んだ場合の役割別の値。bgはエディタ、panelはsideBar、textはeditor.foreground、mutedはdescriptionForeground、accentはbutton.background、borderはsideBar.border。質問の吹き出し色は未確定。https://raw.githubusercontent.com/microsoft/vscode/1.102.0/extensions/theme-defaults/themes/dark_modern.json

## 色・書体・寸法の読み方

- 2021-06の色は直後の1.58.0に同梱されたDark+/Light+の基礎テーマ。6月29日当日の配布物を取得したわけではない。背景とコード文字だけを採用し、補完候補そのものの色はnull。
- 2024-10と2025-07は、版を固定したDefault Dark Modern / Default Light Modernを選んだ場合の色。bg=editor.background、panel=sideBar.background、text=editor.foreground、muted=descriptionForeground、accent=button.background、border=sideBar.border。テーマの選択で外観は変わる。根拠URLは各palette.source。
- radius_px=4は該当版の会話入力に限定。全ボタンやアプリ窓を一律4pxにする意味ではない。2025-07の小型会話入力は2px。
- CSSの固定幅用の書体と、コードエディタの利用者設定は別に扱った。書体名の事実だけを記録し、フォントファイルやアイコン字体を取り込んでいない。
- 数値はCSSで確認したもの。公開済み画面を目視計測した値ではない。

## 期間・対象の注意

- 1.77、1.80、1.95、1.97、1.99は記事の月名と実際の公開日を同一視しない。確認できない発行日はnullにした。
- 2023年のGitHub記事は後から更新されているため、初日の文言・細かい配置の確度を下げた。
- 2025-02はEdits内のAgent、2025-04を統合されたAsk/Edit/Agentの別版とした。
- 2026-02は1.109の最初の記述と追補を含む月の参照。2月18日そのものの配布物・設定を再現したものではない。
- 2026-05は5月13日の1.120。Agents windowは通常版でもプレビュー扱い。
- 2026-11はVS Code内の画面と連携するAgents別窓を対象にした。独立したGitHub Copilot appを同一画面として採用しない。
- 現行の公式概要は後年の照合資料であり、過去版の細部の証明には使わない。

## 未取得・用途外の資料

取得試行日はすべて2026-11-15。失敗URLはJSONの確認済み資料に数えていない。

- blog / 2025-06-30を含む候補URL / https://code.visualstudio.com/blogs/2025/06/30/openSourceCopilotChat — 取得不可。確認できた記事はopenSourceAIEditorFirstMilestone。
- oss-source / 1.109.0 / https://raw.githubusercontent.com/microsoft/vscode/1.109.0/src/vs/workbench/contrib/chat/browser/media/chat.css — 404。この版のCSSから過去の値を推測しない。
- oss-source / 更新日不明 / https://raw.githubusercontent.com/microsoft/vscode-copilot-chat/main/README.md — 現行READMEは本体リポジトリへの移動とアーカイブを案内。2025年の状態の証明にはせず、0.29.0を固定して確認。
- oss-source / 1.58.0 / https://raw.githubusercontent.com/microsoft/vscode/1.58.0/extensions/theme-defaults/themes/dark_plus.json — dark_vs.jsonを参照することを確認。コード色のルールを転載していない。
- oss-source / 1.58.0 / https://raw.githubusercontent.com/microsoft/vscode/1.58.0/extensions/theme-defaults/themes/light_plus.json — light_vs.jsonを参照することを確認。

## 確認待ち

2021年当日の拡張版と補完文字の実効色、2023年初日の歓迎文、2024年5月の各拡張が返す独自のカード、未採録版のテーマ・書体・角丸、2026年のモデル名変更とUI改版日の対応。履歴や別窓の固定幅、モデル・道具の件数、利用率などを作り足さない。

