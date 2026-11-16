# Zed 外観調査

調査日: 2026-11-15。web/data/catalog.jsonとweb/js/tools/zed.jsを読んだ。.work/design-out/zed.jsonは存在しなかった。アプリを実行・表示していない。既存の画面キャプチャを根拠に使わず、公式文書・固定ソース・公開記事の文章を照合した。

## 読み方

sources.showsは仕様中の各事実との対応。from/toは図鑑の月単位の切替で、提供終了日ではない。ソースの固定日と配布ビルドの同一性は別であり、バイナリは検証していない。GPLのソースは配置・色・設定名を調べるために読み、実装コードを転記していない。

paletteは指定した同梱テーマの数値。bgを編集面、panelをドック背景として対応させた。メインのUI背景backgroundとは別。8桁色の末尾ffは不透明なので6桁へ整理した。2024年5月はOne Darkが既定、8月以降の確認済み設定はOSに合わせてOne Light/One Dark。別テーマの画面にはこの数値を断定しない。user_bubbleは専用トークンを確認していないのでnull。

regions.sizeは設定上の既定値で、縮小表示時・利用者の変更後・実画面の実測幅ではない。2026年11月のAgent Panelはflexibleがtrueなので640px固定にしない。Threads Sidebarのみ既定300pxを記録。shape.densityのcompactは編集面としての調査上の分類、free_fallbackは再描画のための選択。製品の正式設定名ではない。角丸は部品ごとに異なり、単一の値を未確認。

## 版ごとの根拠

| id | 期間 | 出典の種類 | 確度 |
| --- | --- | --- | --- |
| zed-2024-05-macos | 2024-05〜2024-08 | official-doc, oss-source, blog | 0.91 |
| zed-2024-08-macos | 2024-08〜2025-04 | blog, official-doc, oss-source | 0.92 |
| zed-2025-04-macos | 2025-04〜2025-05 | archive, official-doc, blog | 0.57 |
| zed-2025-05 | 2025-05〜2025-09 | blog, official-doc | 0.7 |
| zed-2025-09-macos | 2025-09〜2026-04 | official-doc, blog, oss-source | 0.9 |
| zed-2026-04 | 2026-04〜2026-11 | blog, official-doc | 0.76 |
| zed-2026-11-macos | 2026-11〜現在 | official-doc, oss-source, blog | 0.9 |

4月2025は保存された公式beta募集ページからレビューと保存点の機能を確認できたが、左右・寸法・色・書体は特定できない。5月の完成画面を当日の画面として入れず、別版zed-2025-05を追加した。4月2026は配置を変えた公開記事を根拠に追加。11月の固定ソースの寸法や新機能を4月へ遡らせていない。

## 参照URL

- https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/docs/src/assistant-panel.md
  - 種類: official-doc / 日付: 2024-05-29 / 対象: zed-2024-05-macos
  - regions・controls・conversation・empty_state・shape: 右ドックのAssistant。You/Assistant/Systemの文章ブロック。モデル選択と残り文字量に相当するトークン数、Cmd+Enterで送信、Escapeで停止、過去の文章も編集可能。New Contextと履歴。初回はAPIキー設定。
- https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/assets/settings/default.json
  - 種類: oss-source / 日付: 2024-05-29 / 対象: zed-2024-05-macos
  - regions・typography: 固定ソースの既定設定。ペインの幅と左右位置、UIと編集面の書体名。利用者は変更でき、配布版での実測ではない。
- https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/assets/themes/one/one.json
  - 種類: oss-source / 日付: 2024-05-29 / 対象: zed-2024-05-macos
  - palette: 同梱One Dark/One Lightの色。bgはeditor.background、panelはpanel.background、text/muted/accent/borderはtext/text.muted/text.accent/border。末尾ffは完全不透明なので省略。会話専用の吹き出し色とはみなさない。
- https://zed.dev/blog/assistant
  - 種類: blog / 日付: 2023-06-28 / 対象: zed-2024-05-macos
  - conversation・distinctiveの来歴: 0.92で会話を文章として編集するAssistantを導入。Youの場所からCmd+Enterで送信し、下へ応答を順に表示。Escapeで停止。初回はOpenAI APIキー。2024年5月より前の資料。
- https://zed.dev/blog/zed-ai
  - 種類: blog / 日付: 2024-08-20 / 対象: zed-2024-08-macos
  - regions・controls・conversation・distinctive: Assistantは全会話を編集できる文章の編集面。/file・/tab・/terminal等の文脈は折り畳み表示。Ctrl+Enterのインライン変換は変更を順に表示する。
- https://raw.githubusercontent.com/zed-industries/zed/a3672d96d4a8f776f32ffb6d830130d54d418bf4/docs/src/assistant/assistant-panel.md
  - 種類: official-doc / 日付: 2024-08-20 / 対象: zed-2024-08-macos
  - controls・conversation・shape: You/Assistant/System、モデル選択、Cmd+Enter送信、Escape停止、New Context。会話全体を編集できる。右ドックを開く操作。
- https://raw.githubusercontent.com/zed-industries/zed/a3672d96d4a8f776f32ffb6d830130d54d418bf4/assets/settings/default.json
  - 種類: oss-source / 日付: 2024-08-20 / 対象: zed-2024-08-macos
  - regions・typography: 固定ソースの既定設定。ペインの幅と左右位置、UIと編集面の書体名。利用者は変更でき、配布版での実測ではない。
- https://raw.githubusercontent.com/zed-industries/zed/a3672d96d4a8f776f32ffb6d830130d54d418bf4/assets/themes/one/one.json
  - 種類: oss-source / 日付: 2024-08-20 / 対象: zed-2024-08-macos
  - palette: 同梱One Dark/One Lightの色。bgはeditor.background、panelはpanel.background、text/muted/accent/borderはtext/text.muted/text.accent/border。末尾ffは完全不透明なので省略。会話専用の吹き出し色とはみなさない。
- https://github.com/zed-industries/zed/discussions/24028
  - 種類: official-doc / 日付: 2025-03-31 / 対象: zed-2025-04-macos
  - distinctiveと確認範囲: Zedの担当者がAgentic Editingのbeta参加受付を案内。4月23日の完成した画面配置やラベルの証拠にはならない。
- https://raw.githubusercontent.com/zed-industries/zed/2124b7ea998a949b2a5e4bdc1f12bb5275d636c2/docs/src/assistant/assistant-panel.md
  - 種類: official-doc / 日付: 2025-04-23 / 対象: zed-2025-04-macos
  - 確認範囲: 同日までの公開ソースの説明書は従来の文章型Assistantを説明している。カタログのAgentic Editing betaの固有画面へ流用しない。
- https://zed.dev/blog/fastest-ai-code-editor
  - 種類: blog / 日付: 2025-05-07 / 対象: zed-2025-04-macos, zed-2025-05
  - regions・controls・conversation・distinctive: AgentへEnterで送信。コマンド許可、回答後の評価、編集可能なReview Changesの横断差分、モデル選択、Write/Ask/Minimalの道具設定。5月の一般公開であり、4月betaの形を確定しない。
- https://zed.dev/ai
  - 種類: official-doc / 日付: 未確認（2026-11-15取得） / 対象: zed-2025-05
  - 現行のログイン前の製品紹介。編集可能な統合差分での受入・拒否という流れを補助確認する。5月7日の固定配置・色の根拠にはしない。2026-11-15取得。
- https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/docs/src/ai/agent-panel.md
  - 種類: official-doc / 日付: 2025-09-16 / 対象: zed-2025-09-macos
  - regions・controls・conversation・shape: 右上の+でAgent別の新規スレッド。下の入力でEnter送信、応答と道具の実行状況を順に表示。入力上の変更一覧とReview Changes、質問カードの再編集、Write/Ask/Minimal。外部Agentには履歴・モデル選択などの制限がある。
- https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/docs/src/ai/external-agents.md
  - 種類: official-doc / 日付: 2025-09-16 / 対象: zed-2025-09-macos
  - controls・distinctive: Gemini CLIとClaude CodeのスレッドをAgent Panel右上の+から作る。認証を選ぶ。Codexの標準項目やClaude Sonnet 4.5の既定表示はこの版では確認しない。
- https://zed.dev/blog/claude-code-via-acp
  - 種類: blog / 日付: 2025-09-03 / 対象: zed-2025-09-macos
  - regions・distinctive: Claude CodeがZedのAgent Panelへ統合。作業リストを横へ固定し、変更箇所の横断表示で小さな変更ごとに受入・拒否する。右上のPlusメニューから選ぶ。
- https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/assets/settings/default.json
  - 種類: oss-source / 日付: 2025-09-16 / 対象: zed-2025-09-macos
  - regions・typography: 固定ソースの既定設定。ペインの幅と左右位置、UIと編集面の書体名。利用者は変更でき、配布版での実測ではない。
- https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/assets/themes/one/one.json
  - 種類: oss-source / 日付: 2025-09-16 / 対象: zed-2025-09-macos
  - palette: 同梱One Dark/One Lightの色。bgはeditor.background、panelはpanel.background、text/muted/accent/borderはtext/text.muted/text.accent/border。末尾ffは完全不透明なので省略。会話専用の吹き出し色とはみなさない。
- https://zed.dev/blog/parallel-agents
  - 種類: blog / 日付: 2026-04-22 / 対象: zed-2026-04, zed-2026-11-macos
  - regions・controls・distinctive: 新しいThreads Sidebarでプロジェクト別に会話を一覧し、新規作成・停止・保管を行う。既定ではThreads SidebarとAgent Panelを左、Project/Git Panelを右へ配置。既存利用者は任意で新配置へ変更する。
- https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/docs/src/ai/parallel-agents.md
  - 種類: official-doc / 日付: 2026-11-04 / 対象: zed-2026-04, zed-2026-11-macos
  - 補助資料: 同名のThreads Sidebarとプロジェクト別管理が後の固定説明書にも残る。4月22日の寸法・追加機能を遡及する証拠にはしない。 / regions・controls・distinctive: プロジェクト別のThreads Sidebar、会話ごとのAgentと作業フォルダ、必要時の作業用コピー分離。Agentのスレッドとターミナルのスレッドは同じ一覧に並ぶ。4月時点の寸法は示さない。
- https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/docs/src/ai/agent-panel.md
  - 種類: official-doc / 日付: 2026-11-04 / 対象: zed-2026-11-macos
  - controls・conversation・empty_state・shape: 空の会話では左のAgent選択、右上の+からNew Thread。Enter送信、道具の実行状況、編集可能な質問カード、入力の待ち列とSteer。Review Changesで横断差分。Terminalを新規スレッドとして選べる。
- https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/assets/settings/default.json
  - 種類: oss-source / 日付: 2026-11-04 / 対象: zed-2026-11-macos
  - regions・typography: 固定ソースの既定設定。ペインの幅と左右位置、UIと編集面の書体名。利用者は変更でき、配布版での実測ではない。
- https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/assets/themes/one/one.json
  - 種類: oss-source / 日付: 2026-11-04 / 対象: zed-2026-11-macos
  - palette: 同梱One Dark/One Lightの色。bgはeditor.background、panelはpanel.background、text/muted/accent/borderはtext/text.muted/text.accent/border。末尾ffは完全不透明なので省略。会話専用の吹き出し色とはみなさない。
- https://zed.dev/blog/terminal-threads
  - 種類: blog / 日付: 2026-05-20 / 対象: zed-2026-11-macos
  - regions・controls・distinctive: 新規スレッドの+メニューからTerminalを選ぶと、Agent Panel本文がターミナルになり、Threads Sidebarに独立した項目が現れる。5月追加なので4月の版へ遡らせない。

## 修正が必要な箇所

- 2024年5月をZed AIサービスの公開月にしない。文章型Assistantは2023年6月から存在し、Zed AIの公開は2024年8月20日。https://zed.dev/blog/assistant https://zed.dev/blog/zed-ai
- 2024年5月の描画にある別枠のチャット入力や/file・/tab・/diagnostics常設バーを当時の確定UIにしない。固定説明書はYouの文章ブロックへ直接入力する。5月のslash command群は今回未確認。https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/docs/src/assistant-panel.md
- 2024年8月のPrompt Library Drawerという固定の引出し、3つの既成ワークフロー、Anthropic Fast Edit状態表示はunverified。公式の中核は編集可能な会話・文脈の折り畳み・Ctrl+Enter変換。https://zed.dev/blog/zed-ai
- zed-2025-04-macosはbeta期。3月31日の保存された公式募集文から横断差分と会話の保存点は確認できたが、左右配置・寸法・色・書体は未確認。一般公開は別版の5月7日として扱う。https://web.archive.org/web/20250331193917id_/https://zed.dev/ai/agent https://zed.dev/blog/fastest-ai-code-editor
- 2025年9月の外部Agent選択は右上の+から新規スレッドを作る操作。常設のACP JSON-RPC Stream表やclaude --acpのコマンド欄は裏付けがない。9月16日のCodex標準項目とClaude Sonnet 4.5表示はunverified。https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/docs/src/ai/external-agents.md
- 2026年の左右配置は4月22日のParallel Agentsで変化した。左のThreads SidebarとAgent Panel、右のProject/Gitを記録し、2025年へ戻して適用しない。https://zed.dev/blog/parallel-agents
- 描画コードのGPU 120 FPSやJSON-RPC Connectedは性能や内部の仕組みを画面の常設ラベルに変えたもの。固定設定・説明書にはその状態バーを確認できずunverified。https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/docs/src/ai/agent-panel.md
- 2026年11月のPinned、共同参加者3人のバー、Zeta 2の差分バッジ、DeltaDBのUIは今回の固定説明書では確認できない。再描画の必須要素にしない。https://raw.githubusercontent.com/zed-industries/zed/c7bea343838f42b4c14151393e41f0bbe033c95e/docs/src/ai/parallel-agents.md
- 既定書体は時期で異なる。2024年5月は.SystemUIFont/Zed Mono、8月はZed Plex Sans/Mono、2025年9月は.ZedSans/.ZedMono。現行サイトの書体や一律の書体を全版に使わない。https://raw.githubusercontent.com/zed-industries/zed/bdf627ce07e7f0d4dc72eafca3be276c4ed8ca5d/assets/settings/default.json https://raw.githubusercontent.com/zed-industries/zed/a3672d96d4a8f776f32ffb6d830130d54d418bf4/assets/settings/default.json https://raw.githubusercontent.com/zed-industries/zed/f6c5c68751f686a4cf90ea1a1d32a361cb7c888e/assets/settings/default.json

## 取得できなかった資料・補助確認

- https://zed.dev/blog/agentic-editing と https://zed.dev/blog/assistant-panel は本文を取得できなかった。後者の正しい記事は https://zed.dev/blog/assistant 。
- https://zed.dev/releases/preview/0.183.0 は取得時に一般のstable一覧へ転送された。4月23日の固定版の証拠として不採用。
- https://github.com/zed-industries/zed/releases/tag/v0.185.0 と https://github.com/zed-industries/zed/releases/tag/v0.231.0 は404。存在する配布版として記録していない。
- GitHub公開APIで日付以前のコミットと再帰ツリーを探索し、上記の固定SHAの本文をraw URLから実際に読んだ。追加探索ではAPIが403（共有IPの回数制限）となった。4月2025のAgent画面のソースを取得したとは主張しない。探索例: https://api.github.com/repos/zed-industries/zed/commits?until=2025-04-23T23:59:59Z&per_page=1 。
- https://zed.dev/blog/ai-continues-to-impress （2024-01-22）はインラインの依頼例を補助確認したが、5月の幅・色の根拠にはしていない。
- 公式ブログの埋込動画の文章説明は読んだが、動画のフレーム・再生・画像保存は使っていない。独立した動画の説明ページを確認できず、kind:videoを作っていない。
- 信頼できる二次報道も探索したが、数値の出典は一次資料へ限定した。

## 未確認・レビュアーへの確認点

- 2025年4月23日のbetaに限定したレイアウト・ボタン・書体・配色。
- 2025年5月7日の配布ビルドの色と幅、2026年4月22日の初期Threads Sidebarの幅。
- 2026年11月のZeta 2や共同Agentの専用UI。カタログのモデル名・性能値はこの外観調査では検証対象外。

## 追加で確認した当時のbeta募集文

- https://web.archive.org/web/20250331193917id_/https://zed.dev/ai/agent
  - 種類: archive / 日付: 2025-03-31 / 対象: zed-2025-04-macos
  - regions・controls・distinctive: 当時の公式beta募集ページの保存本文。刷新されたAssistant Panel、変更を編集できるmultibufferで保持・差戻し、会話のチェックポイント、Profiles・MCP・.rulesを案内。掲載画像は使わず、左右・幅・色・書体・正確なボタン文言は確認しない。
  - ログイン前の製品紹介・beta募集ページ。GitHubでログインする案内はbetaへの参加操作で、アプリ本体の空画面と混同しない。
