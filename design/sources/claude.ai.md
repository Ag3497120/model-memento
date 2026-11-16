# Claude.ai — 画面の調査記録

調査日：2026-11-15。取得は公開ページの検索と本文の読み取りのみ。アプリの起動、インストール、サーバー起動、動画フレームの確認、画像・フォント・バイナリの保存は行っていない。

## 読んだ既存ファイル

- `web/data/catalog.json` の `claude.ai`：既存の版ID・design・features・sources。
- `.work/design-out/claude.ai.json`：過去の調査。主張は再確認し、未確認の項目は引き継がない。
- `web/js/tools/claude.js`：描画の誤りを比較した。変更していない。

## 仕様の読み方

- schemaはmemento.design.v1。既存IDをすべて残し、確認できた画面の違いに追加の版を置いた。
- fromは図鑑の月の区切り。既存IDに付いた日付が誤っていてもIDは変えず、本文とcorrectionsに実際の確認日を明記した。toは次の掲載版へ切り替える排他的な編集上の境界で、提供終了日ではない。
- 記述は自分の言葉による事実の要約。各事実の末尾にURLを付け、sources.showsにその資料の範囲を示す。短い操作名は機能名として残した。日本語の操作名は説明用で、当日の英語ラベルの完全な書き取りではない。
- nullは調査で確認できない値。paletteの全数値、枠の半径、密度、固定px、専用書体名は未確認。似た製品の色、公開企業サイトのCSS、既存rendererの値から補っていない。free_fallbackは再描画の提案で実測ではない。
- 2本以上の資料がある版でも、2本が独立した当日画面の証拠とは限らない。機能の公開と配置の確認を分け、過去の版に後日の操作を遡及しない。低いconfidenceは機能だけ確認でき、当日の画面を確定できないことを示す。
- confidenceは画面の裏付けの広さを表す主観的な目安。0.65以上は主な領域や操作を複数資料で確認、0.4〜0.64は部分的、0.4未満は配置や当日の差分が大きく未確認。
- 公式ブログは公開の発表ページ。記事中の画面の文章説明がある場合だけUIの根拠にした。ログイン前の販促ページの見た目をアプリの見た目として転記していない。
- ロゴ、キャラクター、専用フォント、製品のイラストや画面画像、回答例の長文は作成物に含めていない。

## 版ごとの確認範囲

| 版 | 期間 | 資料の種類 | 確信度 | 画面の確認状況 |
| --- | --- | --- | --- | --- |
| claude.ai-2023-07 | 2023-07 → 2023-11 | blog / press | 0.42 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2023-11 | 2023-11 → 2024-03 | blog / press | 0.28 | 版は保持。機能または後日の参考だけで、当日の配置は未確認 |
| claude.ai-2024-03 | 2024-03 → 2024-06 | blog / press | 0.48 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2024-06 | 2024-06 → 2024-09 | blog / press | 0.67 | 主な領域・操作を確認。色と寸法は未確認 |
| claude.ai-2024-09 | 2024-09 → 2024-10 | blog / official-doc | 0.42 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2024-10 | 2024-10 → 2024-11 | blog / press | 0.51 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2024-11 | 2024-11 → 2025-02 | press / official-doc / blog | 0.45 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2025-02 | 2025-02 → 2025-03 | blog / official-doc | 0.55 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2025-03 | 2025-03 → 2025-04 | blog / press | 0.6 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2025-04 | 2025-04 → 2025-05 | blog / official-doc | 0.58 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2025-05 | 2025-05 → 2025-07 | blog / official-doc | 0.56 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2025-07 | 2025-07 → 2025-09 | blog / press | 0.65 | 主な領域・操作を確認。色と寸法は未確認 |
| claude.ai-2025-09 | 2025-09 → 2026-02 | blog / release-notes | 0.43 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2026-02 | 2026-02 → 2026-04 | blog / official-doc | 0.25 | 版は保持。機能または後日の参考だけで、当日の配置は未確認 |
| claude.ai-2026-04 | 2026-04 → 2026-06 | blog / release-notes | 0.18 | 版は保持。機能または後日の参考だけで、当日の配置は未確認 |
| claude.ai-2026-06 | 2026-06 → 2026-07 | release-notes / official-doc | 0.41 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2026-07 | 2026-07 → 2026-09 | release-notes / official-doc | 0.38 | 版は保持。機能または後日の参考だけで、当日の配置は未確認 |
| claude.ai-2026-09 | 2026-09 → 2026-11 | release-notes / official-doc | 0.63 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude.ai-2026-11 | 2026-11 → 未設定 | blog / official-doc / release-notes | 0.69 | 主な領域・操作を確認。色と寸法は未確認 |

## 出典

各項目の「日付」は公開日・版の日付として確認できたものだけ。随時更新のヘルプやmainの履歴は日付未確認とし、調査日と区別する。検索索引だけ読めた場合も明記した。

### c2

- URL：https://www.anthropic.com/news/claude-2
- 種類：blog。日付：2023-07-11。参照日：2026-11-15。
- 確認できたこと／限界：Claude 2を使う一般向けWebベータの公開。画面寸法・配色の記載はない。
- 対象：`claude.ai-2023-07`。

### c21

- URL：https://www.anthropic.com/news/claude-2-1
- 種類：blog。日付：2023-11-21。参照日：2026-11-15。
- 確認できたこと／限界：Claude 2.1のWeb提供とProの大きなファイル添付。tool useとsystem promptsの説明はAPI/Workbenchの文脈。
- 対象：`claude.ai-2023-11`。

### c3

- URL：https://www.anthropic.com/news/claude-3-family
- 種類：blog。日付：2024-03-04。参照日：2026-11-15。
- 確認できたこと／限界：公開当日のWeb提供はOpusとSonnet。Haikuは後日。画像理解の導入。モデル選択欄の座標はない。
- 対象：`claude.ai-2024-03`。

### gig

- URL：https://gigazine.net/news/20231019-claude-chatgpt-rival-chat-ai/
- 種類：press。日付：2023-10-19。参照日：2026-11-15。
- 確認できたこと／限界：実際にログインした操作レビュー。入力・送信、文章とコードの回答、ファイルのドラッグ添付と名前・容量表示。7月初日や11月更新直後の寸法は示さない。
- 対象：`claude.ai-2023-07`、`claude.ai-2023-11`。

### coin

- URL：https://cointelegraph.com/news/anthropic-launches-claude-2-amid-continuing-ai-hullabaloo
- 種類：press。日付：2023-07-11。参照日：2026-11-15。
- 確認できたこと／限界：公開当日の実使用記事。Web会話と文書添付の表示を報告。筆者の添付試験は成功していない。
- 対象：`claude.ai-2023-07`。

### c35

- URL：https://www.anthropic.com/news/claude-3-5-sonnet
- 種類：blog。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：Artifactsを会話の横の専用ウィンドウに表示する説明。現行ページの日付は2024-06-21、同時期のレビューは06-20。6月版として使用。
- 対象：`claude.ai-2024-06`、`claude.ai-2024-09`、`claude.ai-2024-10`、`claude.ai-2025-02`。

### projects

- URL：https://www.anthropic.com/news/projects
- 種類：blog。日付：2024-06-25。参照日：2026-11-15。
- 確認できたこと／限界：Projectsの資料、指示、Teamの共有会話・活動フィード。寸法や常設Artifactsメニューの証拠ではない。
- 対象：`claude.ai-2024-06`、`claude.ai-2024-09`。

### simon35

- URL：https://simonwillison.net/2024/Jun/20/claude-35-sonnet/
- 種類：press。日付：2024-06-20。参照日：2026-11-15。
- 確認できたこと／限界：本人の利用記録。Artifactsプレビューの有効化と生成物を伴う会話。
- 対象：`claude.ai-2024-06`。

### enterprise

- URL：https://claude.com/resources/articles/claude-for-enterprise
- 種類：blog。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：EnterpriseのGitHub資料連携とProjects/Artifacts。現行ページは2024-09-10表記で、カタログ09-04とは一致しない。正確な初出日は保留。
- 対象：`claude.ai-2024-09`。

### analysis

- URL：https://claude.com/resources/articles/analysis-tool
- 種類：blog。日付：2024-10-24。参照日：2026-11-15。
- 確認できたこと／限界：名前のメニューは左下、feature previewでJavaScript実行を有効化。常設Analysis REPL欄の説明はない。
- 対象：`claude.ai-2024-10`、`claude.ai-2024-11`。

### stylespress

- URL：https://www.notebookcheck.net/Anthropic-allows-Claude-AI-users-to-customize-writing-styles.924555.0.html
- 種類：press。日付：2024-11-28。参照日：2026-11-15。
- 確認できたこと／限界：11月26日発表の文体選択を報道。Formal/Concise/Explanatory、文章例から独自の文体を作成。
- 対象：`claude.ai-2024-11`。

### styleshelp

- URL：https://support.anthropic.com/en/articles/10181068-configuring-and-using-styles
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：検索索引に残る旧公式ヘルプ。Search and tools > Use style、文体管理の説明。直接取得は404。2024年当日の位置の証拠には使わない。
- 対象：`claude.ai-2024-11`。

### c37

- URL：https://www.anthropic.com/news/claude-3-7-sonnet
- 種類：blog。日付：2025-02-24。参照日：2026-11-15。
- 確認できたこと／限界：通常/拡張思考を切り替え、考えた内容を表示。思考量の数値指定はAPIの説明。Claude Codeは端末の別製品。
- 対象：`claude.ai-2025-02`、`claude.ai-2025-03`。

### search

- URL：https://claude.com/resources/articles/web-search
- 種類：blog。日付：2025-03-20。参照日：2026-11-15。
- 確認できたこと／限界：Web検索を設定で有効化、回答に直接出典。初回は米国の有料プラン向け。現行記事に後日の対象拡大もある。
- 対象：`claude.ai-2025-03`。

### research

- URL：https://claude.com/resources/articles/research
- 種類：blog。日付：2025-04-15。参照日：2026-11-15。
- 確認できたこと／限界：チャットのResearch切替、WebとGoogle Workspace検索、回答内の出典。
- 対象：`claude.ai-2025-04`、`claude.ai-2025-05`、`claude.ai-2026-04`。

### integrations

- URL：https://claude.com/resources/articles/integrations
- 種類：blog。日付：2025-05-01。参照日：2026-11-15。
- 確認できたこと／限界：Researchボタン、遠隔MCP接続をWeb/desktopへ導入。後日更新を分離する。
- 対象：`claude.ai-2025-04`、`claude.ai-2025-05`、`claude.ai-2026-04`。

### c4

- URL：https://www.anthropic.com/news/claude-4
- 種類：blog。日付：2025-05-22。参照日：2026-11-15。
- 確認できたこと／限界：Opus 4/Sonnet 4、思考と検索などの交互実行、Claude Code一般公開とIDE差分連携。
- 対象：`claude.ai-2025-05`。

### buildart

- URL：https://claude.com/resources/articles/build-artifacts
- 種類：blog。日付：2025-06-25。参照日：2026-11-15。
- 確認できたこと／限界：公式本文を直接確認。左ナビの成果物専用画面、例を見て変更、新規作成。6月25日の発表。7月21日mobile/7月31日Team、10月21日保存機能は追記。
- 対象：`claude.ai-2025-07`。

### poweredart

- URL：https://www.anthropic.com/news/claude-powered-artifacts
- 種類：blog。日付：2025-06-25。参照日：2026-11-15。
- 確認できたこと／限界：検索索引で本文確認。成果物内からClaudeに問い合わせる共有アプリ。公開時は永続保存なし。直接取得不可。
- 対象：`claude.ai-2025-07`。

### sonnet45

- URL：https://www.anthropic.com/news/claude-sonnet-4-5
- 種類：blog。日付：2025-09-29。参照日：2026-11-15。
- 確認できたこと／限界：Sonnet 4.5と製品更新。モデル発表だけでは全画面の配置を確定できない。
- 対象：`claude.ai-2025-09`。

### releases

- URL：https://support.claude.com/en/articles/12138966-release-notes
- 種類：release-notes。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：日付別の公式更新履歴。2025-09-29ファイル作成拡大、2026-01-12 Cowork、03-17遠隔依頼、06-12文書編集、07-07共有ホーム、09-16会話統合、11-12 Meetings。各版で参照日を限定。
- 対象：`claude.ai-2025-09`、`claude.ai-2026-04`、`claude.ai-2026-06`、`claude.ai-2026-07`、`claude.ai-2026-09`、`claude.ai-2026-11`。

### opus46

- URL：https://www.anthropic.com/news/claude-opus-4-6
- 種類：blog。日付：2026-02-05。参照日：2026-11-15。
- 確認できたこと／限界：Opus 4.6、adaptive thinking、APIのeffort設定とClaude Codeのagent teams。APIの1MをWeb入力表示へ転記しない。
- 対象：`claude.ai-2026-02`。

### modelhelp

- URL：https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行画面の送信ボタン隣のモデル名・思考量、More models、Effort、思考内容の開閉。2023/2024年の座標証拠には使わない。
- 対象：`claude.ai-2026-02`、`claude.ai-2026-11`。

### unified

- URL：https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：Chat/Coworkを選ばず一つの会話で依頼。段階展開、移行済みアカウントは旧モードへ戻せない。
- 対象：`claude.ai-2026-07`、`claude.ai-2026-09`。

### artifacthelp

- URL：https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行Artifactsの左ナビ、会話横の編集面、Outputからテンプレート選択、Export。2026-09-16以前のものはlegacyと明記。 旧9487310 URLから転送された新ページ。
- 対象：`claude.ai-2026-06`、`claude.ai-2026-09`、`claude.ai-2026-11`。

### sheets

- URL：https://claude.com/resources/articles/sheets-whiteboards-data
- 種類：blog。日付：2026-11-10。参照日：2026-11-15。
- 確認できたこと／限界：Whiteboards/Sheets betaとData。Web/desktop/mobile、会話横または全画面に外部アプリ。6月や9月の証拠には使わない。
- 対象：`claude.ai-2026-11`。

### c3review

- URL：https://www.watch.impress.co.jp/docs/topic/1581763.html
- 種類：press。日付：2024-04-09。参照日：2026-11-15。
- 確認できたこと／限界：Claude 3期間内の実使用レビュー。文章・画像・文書添付、生成された文章とコード。3月4日当日のモデル選択配置は示さない。
- 対象：`claude.ai-2024-03`。

### searchpress

- URL：https://www.macrumors.com/2025/03/21/anthropic-claude-gets-web-search/
- 種類：press。日付：2025-03-21。参照日：2026-11-15。
- 確認できたこと／限界：Web検索の翌日記事。回答にクリックできる出典表示。
- 対象：`claude.ai-2025-03`。

### thinkinghelp

- URL：https://support.anthropic.com/en/articles/10574485-using-extended-thinking
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：検索索引の旧公式ヘルプではSearch and tools > Extended thinking。正確な2月24日の配置を裏付ける固定版ではない。
- 対象：`claude.ai-2025-02`。

### researchhelp

- URL：https://support.claude.com/en/articles/11088861-use-research-on-claude
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行ヘルプの+ > Research、下端の青い表示。旧索引にはResearch/Default選択。2025年初日へ現行の位置を転記しない。
- 対象：`claude.ai-2025-04`、`claude.ai-2025-05`。

### projecthelp

- URL：https://support.claude.com/en/articles/9517075-what-are-projects
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行のProject資料・指示・履歴の説明。段階展開の新Projectsも含むため、2024年の幅・配置・対象プランの証拠にはしない。
- 対象：`claude.ai-2024-09`。

### analysispress

- URL：https://techcrunch.com/2024/10/24/anthropics-ai-can-now-run-and-write-code/
- 種類：press。日付：2024-10-24。参照日：2026-11-15。
- 確認できたこと／限界：同日の報道でも分析コード実行と図表化を確認。寸法・常設パネルの証拠ではない。
- 対象：`claude.ai-2024-10`。

### simonapps

- URL：https://simonwillison.net/2025/Jun/25/ai-powered-apps-with-claude/
- 種類：press。日付：2025-06-25。参照日：2026-11-15。
- 確認できたこと／限界：本人の利用記録。成果物の中でClaudeへ問い合わせる小アプリ。専用画面の導入日を7月17日へ移す根拠ではない。
- 対象：`claude.ai-2025-07`。

## 取得できなかった資料・補助照合

- https://web.archive.org/web/20230712000000/https://claude.ai/ — 日付：未確認。参照日：2026-11-15。Internet Archiveへの取得要求は失敗。保存の存在・実際の保存日時・ログイン済み画面のいずれも未確認。7月12日に観測できたと主張しない。
- https://claude.ai/ — 日付：未確認。参照日：2026-11-15。取得制限で本文を取得できない。現在のログアウト画面も過去のログイン済み画面も観察していない。
- https://www.anthropic.com/news/styles — 日付：2024-11-26。参照日：2026-11-15。公式発表URLは現行Resourcesへ転送後取得失敗。日付と概要はNotebookcheckが掲載した発表記録で確認。原URLを直接読めたとはしない。

## 修正を要する既存の説明

- web/js/tools/claude.jsの2023-07は#EFEEE6を実測値のように表示し、初日のモデル選択も描く。公開発表ではその色と選択UIを確認できないため、色・選択位置は未確定とする（https://www.anthropic.com/news/claude-2）
- 2023-11のSystem Prompt欄と200K常設メーターには根拠がない。2.1発表のsystem promptsとtool useはAPI/Workbenchの説明であり、一般向けWeb画面に移さない（https://www.anthropic.com/news/claude-2-1）
- 2024-03のOpus/Sonnet/Haikuの3つの常設ボタンは裏付けがない。3月4日にはHaikuは後日提供とされている（https://www.anthropic.com/news/claude-3-family）
- 2024-06の常時表示される成果物欄、Artifacts専用左ナビ、Fable 5.2/Opus 5.5比較の候補文は当時の新規画面の再現として扱えない。6月発表が示すのは生成物を会話横へ開く動作（https://www.anthropic.com/news/claude-3-5-sonnet）
- 専用Artifacts一覧は2025年6月25日の発表。2024年6月の左ナビや2025年7月17日の初出として扱わない。7月版はこの画面を利用する期間の区切りとして残す（https://claude.com/resources/articles/build-artifacts）
- 2024-09のEnterprise・GitHub同期・Team Libraryなどの常設UIは、連携の機能発表からは導けない。プランやProject資料追加の機能と区別する（https://claude.com/resources/articles/claude-for-enterprise）
- 2024-10のAnalysis REPL左ナビと常設右実行欄は未確認。分析機能の公開は10月24日で、10月22日のモデル更新と区別する（https://claude.com/resources/articles/analysis-tool）
- 2024-11の文体ボタン横並びと常設Style Profile右欄は未確認。確認できるのは入力欄からの文体設定と文章例による独自文体（https://www.notebookcheck.net/Anthropic-allows-Claude-AI-users-to-customize-writing-styles.924555.0.html）
- 2025-02の16k thinking budgetの数値表示は、API向けの思考量指定をWebの設定と混同している。Web検索は3月、Researchは4月、遠隔接続は5月の別更新（https://www.anthropic.com/news/claude-3-7-sonnet）
- Web検索・Research・遠隔接続を同じ2月の画面にまとめない。追加した3月・4月の版と5月の版に分けた（https://claude.com/resources/articles/research）
- 2025-07のstatefulという説明は公開当日の内容と一致しない。6月公開時は永続保存なし、公式記事の保存対応追記は10月21日（https://www.anthropic.com/news/claude-powered-artifacts）
- 2026-02のAPI向け1Mの説明は、Webの会話に1Mメーターを描く証拠ではない（https://www.anthropic.com/news/claude-opus-4-6）
- 2026-04-18の資料鮮度メーター、思考量スライダー、独自の出典カード刷新は未確認。出典付きResearch自体は2025年から（https://claude.com/resources/articles/research）
- 2026-06/09のWhiteboards切替は未確認。公式のWhiteboards/Sheets試験提供発表は2026年11月10日（https://claude.com/resources/articles/sheets-whiteboards-data）
- 2026-06-15のFable 5を通常の候補として固定しない。公式履歴は6月9日公開、6月12日停止、7月1日復旧と記載（https://support.claude.com/en/articles/12138966-release-notes）
- 2026-09のChat/Cowork統合は9月16日からの段階展開。全員が同日に同じ画面になるとは扱わない（https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude）
- 既存のdesign-outは初出機能の切り分けには役立つが、配色・寸法・入力形状の証拠にはしない。今回も全版の数値色・固定px・専用フォント名は未確認のためnull。

## レビュアーに残る確認

- nullの数値や当日の配置を確定するには、対象日付に固定されたログイン済み画面の文章説明や正規のCSS・仕様が必要。許可された方法で確認できなければnullのままにする。
- 低いconfidenceの版が独立した見た目を持つかは未確認。モデル更新だけの版を別のレイアウトへ描き変えない。
- 既存カタログとrendererは担当外なので未変更。correctionsを確認して担当者が反映する。

