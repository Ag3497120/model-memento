# Claude Code — 画面の調査記録

調査日：2026-11-15。取得は公開ページの検索と本文の読み取りのみ。アプリの起動、インストール、サーバー起動、動画フレームの確認、画像・フォント・バイナリの保存は行っていない。

## 読んだ既存ファイル

- `web/data/catalog.json` の `claude-code`：既存の版ID・design・features・sources。
- `.work/design-out/claude-code.json`：過去の調査。主張は再確認し、未確認の項目は引き継がない。
- `web/js/tools/claude-code.js`：描画の誤りを比較した。変更していない。

## 仕様の読み方

- schemaはmemento.design.v1。既存IDをすべて残し、確認できた画面の違いに追加の版を置いた。
- fromは図鑑の月の区切り。既存IDに付いた日付が誤っていてもIDは変えず、本文とcorrectionsに実際の確認日を明記した。toは次の掲載版へ切り替える排他的な編集上の境界で、提供終了日ではない。
- 記述は自分の言葉による事実の要約。各事実の末尾にURLを付け、sources.showsにその資料の範囲を示す。短い操作名は機能名として残した。日本語の操作名は説明用で、当日の英語ラベルの完全な書き取りではない。
- nullは調査で確認できない値。paletteの全数値、枠の半径、密度、固定px、専用書体名は未確認。似た製品の色、公開企業サイトのCSS、既存rendererの値から補っていない。free_fallbackは再描画の提案で実測ではない。
- 2本以上の資料がある版でも、2本が独立した当日画面の証拠とは限らない。機能の公開と配置の確認を分け、過去の版に後日の操作を遡及しない。低いconfidenceは機能だけ確認でき、当日の画面を確定できないことを示す。
- confidenceは画面の裏付けの広さを表す主観的な目安。0.65以上は主な領域や操作を複数資料で確認、0.4〜0.64は部分的、0.4未満は配置や当日の差分が大きく未確認。
- 公式ブログは公開の発表ページ。記事中の画面の文章説明がある場合だけUIの根拠にした。ログイン前の販促ページの見た目をアプリの見た目として転記していない。
- ロゴ、キャラクター、専用フォント、製品のイラストや画面画像、回答例の長文は作成物に含めていない。

kindは主な端末版に合わせてterminal。2025-09のVS Code欄、2025-10のWeb、2025-11以降のDesktopは、regionsと出典の文中に対象の画面を明記した。単一のkindから全版を同じ見た目にするための資料ではない。

公式GitHubの公開履歴と投稿本文を参照したが、CLIのUI実装がOSSであるとは扱わない。oss-sourceに分類するアプリのテーマ・レイアウトコードは取得できていない。ソースコードの転載もない。利用者のissueはスキーマにissue種別がないためpressに分類し、showsに利用者報告と明記した。公式の承認を受けた説明という意味ではない。

## 版ごとの確認範囲

| 版 | 期間 | 資料の種類 | 確信度 | 画面の確認状況 |
| --- | --- | --- | --- | --- |
| claude-code-2025-02 | 2025-02 → 2025-04 | blog / press | 0.53 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-code-2025-04 | 2025-04 → 2025-05 | changelog / press | 0.25 | 版は保持。機能または後日の参考だけで、当日の配置は未確認 |
| claude-code-2025-05 | 2025-05 → 2025-07 | blog / changelog / press | 0.62 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-code-2025-07 | 2025-07 → 2025-09 | changelog / press | 0.29 | 版は保持。機能または後日の参考だけで、当日の配置は未確認 |
| claude-code-2025-09 | 2025-09 → 2025-10 | blog / changelog | 0.68 | 主な領域・操作を確認。色と寸法は未確認 |
| claude-code-2025-10 | 2025-10 → 2025-11 | blog / official-doc | 0.59 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-code-2025-11 | 2025-11 → 2025-12 | blog / press | 0.4 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-code-2025-12 | 2025-12 → 2026-02 | release-notes / blog / changelog | 0.38 | 版は保持。機能または後日の参考だけで、当日の配置は未確認 |
| claude-code-2026-02 | 2026-02 → 2026-04 | release-notes / official-doc / blog | 0.57 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-code-2026-04-macos | 2026-04 → 2026-05 | blog / video / press | 0.77 | 主な領域・操作を確認。色と寸法は未確認 |
| claude-code-2026-05 | 2026-05 → 2026-08 | release-notes / official-doc | 0.62 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-code-2026-08 | 2026-08 → 2026-10 | release-notes / official-doc | 0.43 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-code-2026-10 | 2026-10 → 2026-11 | official-doc / release-notes | 0.3 | 版は保持。機能または後日の参考だけで、当日の配置は未確認 |
| claude-code-2026-11 | 2026-11 → 未設定 | release-notes / official-doc | 0.6 | 一部の領域・操作のみ。初日や全体の配置は未確認 |

## 出典

各項目の「日付」は公開日・版の日付として確認できたものだけ。随時更新のヘルプやmainの履歴は日付未確認とし、調査日と区別する。検索索引だけ読めた場合も明記した。

### c37

- URL：https://www.anthropic.com/news/claude-3-7-sonnet
- 種類：blog。日付：2025-02-24。参照日：2026-11-15。
- 確認できたこと／限界：通常/拡張思考を切り替え、考えた内容を表示。思考量の数値指定はAPIの説明。Claude Codeは端末の別製品。
- 対象：`claude-code-2025-02`。

### c4

- URL：https://www.anthropic.com/news/claude-4
- 種類：blog。日付：2025-05-22。参照日：2026-11-15。
- 確認できたこと／限界：Opus 4/Sonnet 4、思考と検索などの交互実行、Claude Code一般公開とIDE差分連携。
- 対象：`claude-code-2025-05`。

### sonnet45

- URL：https://www.anthropic.com/news/claude-sonnet-4-5
- 種類：blog。日付：2025-09-29。参照日：2026-11-15。
- 確認できたこと／限界：Sonnet 4.5と製品更新。モデル発表だけでは全画面の配置を確定できない。
- 対象：`claude-code-2025-09`。

### releases

- URL：https://support.claude.com/en/articles/12138966-release-notes
- 種類：release-notes。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：日付別の公式更新履歴。2025-09-29ファイル作成拡大、2026-01-12 Cowork、03-17遠隔依頼、06-12文書編集、07-07共有ホーム、09-16会話統合、11-12 Meetings。各版で参照日を限定。
- 対象：correctionsの照合。

### opus46

- URL：https://www.anthropic.com/news/claude-opus-4-6
- 種類：blog。日付：2026-02-05。参照日：2026-11-15。
- 確認できたこと／限界：Opus 4.6、adaptive thinking、APIのeffort設定とClaude Codeのagent teams。APIの1MをWeb入力表示へ転記しない。
- 対象：`claude-code-2026-02`。

### coworkreview

- URL：https://simonwillison.net/2026/Jan/12/claude-cowork/
- 種類：press。日付：2026-01-12。参照日：2026-11-15。
- 確認できたこと／限界：公開当日の実使用と記事内の画面説明。左Chat/Code/CoworkとNew task、中央の実行内容、右Progress/Artifacts/Context/Working files、下の返信欄。
- 対象：`claude-code-2025-11`。

### redesign

- URL：https://claude.com/resources/articles/claude-code-desktop-redesign
- 種類：blog。日付：2026-04-14。参照日：2026-11-15。
- 確認できたこと／限界：左の並列セッション一覧、絞り込み、配置可変の会話/端末/差分/編集/プレビュー、表示量3段階。
- 対象：`claude-code-2026-04-macos`。

### redesignvideo

- URL：https://www.youtube.com/watch?v=rWaQSQEm_aY
- 種類：video。日付：2026-04-14。参照日：2026-11-15。
- 確認できたこと／限界：公式Claudeチャンネルの題名・説明文を検索で確認。並列一覧と配置変更可能な各欄。映像フレームは見ていない。
- 対象：`claude-code-2026-04-macos`。

### redesignpress

- URL：https://www.macrumors.com/2026/04/15/anthropic-rebuilds-claude-code-desktop-app/
- 種類：press。日付：2026-04-15。参照日：2026-11-15。
- 確認できたこと／限界：公式刷新の翌日記事。一覧のstatus/project/environment絞り込み、統合端末・ファイル編集・差分欄。
- 対象：`claude-code-2026-04-macos`。

### codelaunchreview

- URL：https://www.devclass.com/ai-ml/2025/02/27/anthropic-previews-claude-code-agentic-coding-capable-but-costly/1622996
- 種類：press。日付：2025-02-27。参照日：2026-11-15。
- 確認できたこと／限界：公開直後の実使用記事。UIは端末、専用IDEプラグインでない。許可を伴う道具実行。
- 対象：`claude-code-2025-02`、`claude-code-2025-04`。

### codelog

- URL：https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- 種類：changelog。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：版番号別の公式履歴。0.2.44思考語、0.2.54 #/Ctrl+R、1.0.0、1.0.38 hooks、1.0.60 /agents、2.0.0端末刷新。日付がない項目は初出日を断定しない。
- 対象：`claude-code-2025-04`、`claude-code-2025-05`、`claude-code-2025-07`、`claude-code-2025-09`、`claude-code-2025-12`。

### codeissue

- URL：https://github.com/anthropics/claude-code/issues/2097
- 種類：press。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：公式リポジトリの利用者報告。1.0.24/27のテキスト出力に歓迎枠、>入力、道具行⏺と結果⎿。5月初日から同じとは確定しない。source種別pressは投稿資料の代替分類で報道ではない。
- 対象：`claude-code-2025-05`、`claude-code-2025-07`。

### code2

- URL：https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously
- 種類：blog。日付：2025-09-29。参照日：2026-11-15。
- 確認できたこと／限界：端末2.0の状態表示・Ctrl+R履歴検索、Esc二回または/rewind、別のVS Code欄とファイル内差分。
- 対象：`claude-code-2025-09`。

### codeweb

- URL：https://claude.com/resources/articles/claude-code-on-the-web
- 種類：blog。日付：2025-10-20。参照日：2026-11-15。
- 確認できたこと／限界：Webでリポジトリを選んで依頼、進行と変更を確認しPRへ。複数タスクとiOS。ローカル遠隔操作とは別。
- 対象：`claude-code-2025-10`。

### codewebdocs

- URL：https://code.claude.com/docs/en/claude-code-on-the-web
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行クラウドセッション手順。公開日付ではなく操作の補足。
- 対象：`claude-code-2025-10`。

### opus45

- URL：https://www.anthropic.com/news/claude-opus-4-5
- 種類：blog。日付：2025-11-24。参照日：2026-11-15。
- 確認できたこと／限界：Claude CodeをDesktopから並列で使う更新とOpus 4.5。正確な初日寸法はない。
- 対象：`claude-code-2025-11`、`claude-code-2025-12`。

### release2074

- URL：https://github.com/anthropics/claude-code/releases/tag/v2.0.74
- 種類：release-notes。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：LSP、/themeの色分け切替、/terminal-setup拡大。12月10日当日の機能かは別途確認が必要。
- 対象：`claude-code-2025-12`。

### release2151

- URL：https://github.com/anthropics/claude-code/releases/tag/v2.1.51
- 種類：release-notes。日付：2026-02-24。参照日：2026-11-15。
- 確認できたこと／限界：remote-control導入、固定モデル名を人が読める表示にする/model変更。
- 対象：`claude-code-2026-02`。

### release21145

- URL：https://github.com/anthropics/claude-code/releases/tag/v2.1.145
- 種類：release-notes。日付：2026-05-19。参照日：2026-11-15。
- 確認できたこと／限界：/pluginのDiscover/Browseで導入前に中身表示、全画面で候補をマウス選択、下端のPR表示。UTC表記でカタログ05-20と1日差。
- 対象：`claude-code-2026-05`。

### release21238

- URL：https://github.com/anthropics/claude-code/releases/tag/v2.1.238
- 種類：release-notes。日付：2026-08-20。参照日：2026-11-15。
- 確認できたこと／限界：キー操作設定、許可欄の長文折返し修正。Adaptive Effortや/scheduleの初公開記事ではない。
- 対象：`claude-code-2026-08`。

### release21325

- URL：https://github.com/anthropics/claude-code/releases/tag/v2.1.325
- 種類：release-notes。日付：2026-11-13。参照日：2026-11-15。
- 確認できたこと／限界：実行中の案内、拒否エラー下の/rewind・/clear案内、focus viewや許可欄・歓迎ヘッダーの修正。
- 対象：`claude-code-2026-11`。

### remote

- URL：https://code.claude.com/docs/en/remote-control
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行のローカル遠隔操作。端末を動かしたままURL/QRからWebや携帯へ接続、端末側に接続状態。後日の追加フラグは2月へ遡及しない。
- 対象：`claude-code-2026-02`。

### interactive

- URL：https://code.claude.com/docs/en/interactive-mode
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行の端末入力、許可モード、道具の表示、履歴、差分操作。年ごとの初出を示すページではない。
- 対象：`claude-code-2026-05`、`claude-code-2026-10`。

### terminal

- URL：https://code.claude.com/docs/en/terminal-config
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：端末アプリの配色とClaude Codeテーマは別。下端の状態欄を変更可能。特定のフォントや全端末共通色は指定しない。
- 対象：`claude-code-2026-11`。

### fullscreen

- URL：https://code.claude.com/docs/en/fullscreen
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行の全画面描画は端末内の表示方式。/tui fullscreenで切替、内部スクロール、マウス選択、下端への移動。最大化したデスクトップ窓を意味しない。
- 対象：`claude-code-2026-08`、`claude-code-2026-10`、`claude-code-2026-11`。

### whatsnew

- URL：https://code.claude.com/docs/en/whats-new
- 種類：release-notes。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：2026-08-24週CLI会話をDesktopの/resumeへ、08-31週全画面の横の/diff欄とMac背後操作、09-07週切り離し窓。05月pop-outや08-24 Inspector導入とは一致しない。
- 対象：`claude-code-2026-08`、`claude-code-2026-10`。

### license

- URL：https://github.com/anthropics/claude-code/blob/main/LICENSE.md
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：公式リポジトリの権利表記。公開GitHubを根拠にCLI全体をOSSと扱わない。UI実装・テーマコードを転載していない。
- 対象：correctionsの照合。

## 取得できなかった資料・補助照合

- https://raw.githubusercontent.com/anthropics/claude-code/v2.0.0/CHANGELOG.md — 日付：未確認。参照日：2026-11-15。404。固定タグの履歴を取得できず、2.0.0の記述はmainの該当節と当日の公式ブログで照合。
- https://github.com/anthropics/claude-code/releases/tag/v2.1.297 — 日付：未確認。参照日：2026-11-15。404。10月8日に対応する固定版を確認できなかった。Swarm/ Hooks v2の画面の裏付けには使わない。
- https://www.youtube.com/watch?v=t3nnDXa81Hs — 日付：未確認。参照日：2026-11-15。公式ブログからリンクされた拡張思考動画。取得本文はYouTubeの一般フッターのみ。題名以外の説明や映像は根拠に使わない。

## 修正を要する既存の説明

- web/js/tools/claude-code.jsのclaudeMascotBannerは端末にキャラクターを文字で描く。ユーザーの権利ルールに従い全時代で再描画対象から除外する（https://github.com/anthropics/claude-code/blob/main/LICENSE.md）
- 2025-02の起動時を独自のCLAUDE.mdカードと3ボタン許可カードに固定する根拠はない。公開直後のUIは端末であり、5月や9月のIDE専用欄を遡及しない（https://www.devclass.com/ai-ml/2025/02/27/anthropic-previews-claude-code-agentic-coding-capable-but-costly/1622996）
- 2025-04の起動時CLAUDE.md探索ツリーや常設Hierarchy Loaderは未確認。公式履歴に機能の説明があっても、常設の画面要素とは限らない（https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md）
- 1.0.24/27の歓迎枠・>・道具の行頭記号は投稿本文で確認した。5月22日初日へ同じ枠を固定する根拠とは分ける（https://github.com/anthropics/claude-code/issues/2097）
- 5月GA画面のHooks/Subagentsボタンは早すぎる可能性がある。履歴ではhooksは1.0.38、補助役の管理は1.0.60で登場。版番号だけから日付は推定しない（https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md）
- 2025-07のHooks/Commands/Subagentsの固定ダッシュボードは機能から創作されたもの。常設表示は未確認（https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md）
- 2025-09は端末2.0とネイティブVS Code欄。Webは10月20日、Desktopは11月24日の別更新なので9月の同時公開としない（https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously）
- 2025-10の固定Cloud Sandbox右コード欄やPR一覧の幅は未確認。進捗・変更まとめ・複数タスクという動作だけを採用（https://claude.com/resources/articles/claude-code-on-the-web）
- 2025-12-10の固定LSP診断表とCtrl+Bの背景作業表は未確認。LSP追加は2.0.74で確認できるが、その公開日と12月10日の同一性を確認していない（https://github.com/anthropics/claude-code/releases/tag/v2.0.74）
- 2026-02の1Mメーター、Agent Teamsの常設表、独自のAllow Remote Controlカードは未確認。2.1.51の確実なUI変更は/modelの読みやすい名前と更新案内（https://github.com/anthropics/claude-code/releases/tag/v2.1.51）
- 2026-04-macosの4月5日公開、iTerm2とXcodeの固定左右分割、Metal 120Hzなどは未確認。4月14日の公式刷新はDesktop内の並べ替え可能な複数欄であり、端末の窓の見た目とは違う（https://claude.com/resources/articles/claude-code-desktop-redesign）
- 2026-05のAuto Mode Classifierスコア表や独自の3ボタンは未確認。2.1.145の実際の公開記録は導入前の拡張内容、候補のマウス操作、PR状態など（https://github.com/anthropics/claude-code/releases/tag/v2.1.145）
- 2026-08の/scheduleとAdaptive Effort初出は2.1.238の公開記録からは確認できない。Opus 5.5は9月22日なので8月20日のモデル表示にしない（https://support.claude.com/en/articles/12138966-release-notes）
- 2026-10のWorktree Swarm/ Hooks v2常設表と特定の実行数レーンは未確認。既存の複数作業機能から創作しない（https://code.claude.com/docs/en/interactive-mode）
- 2026-11のUnified Desktop Window描画を端末2.1.325の見た目の代用にしない。公開記録は端末の歓迎ヘッダー・許可欄・focus viewなどの修正を記載（https://github.com/anthropics/claude-code/releases/tag/v2.1.325）
- 公開GitHubには履歴やプラグインもあるが、CLIの描画全体をOSSと断定しない。公式の権利表記を確認し、テーマ実装のコピーは行っていない（https://github.com/anthropics/claude-code/blob/main/LICENSE.md）
- 一律の黒背景・橙の色コード・固定フォントを全時期に適用する根拠はない。Claude Codeのテーマと端末アプリ自身の配色は別（https://code.claude.com/docs/en/terminal-config）

## レビュアーに残る確認

- nullの数値や当日の配置を確定するには、対象日付に固定されたログイン済み画面の文章説明や正規のCSS・仕様が必要。許可された方法で確認できなければnullのままにする。
- 低いconfidenceの版が独立した見た目を持つかは未確認。モデル更新だけの版を別のレイアウトへ描き変えない。
- 既存カタログとrendererは担当外なので未変更。correctionsを確認して担当者が反映する。

