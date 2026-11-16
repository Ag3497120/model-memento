# Claude Desktop — 画面の調査記録

調査日：2026-11-15。取得は公開ページの検索と本文の読み取りのみ。アプリの起動、インストール、サーバー起動、動画フレームの確認、画像・フォント・バイナリの保存は行っていない。

## 読んだ既存ファイル

- `web/data/catalog.json` の `claude-desktop`：既存の版ID・design・features・sources。
- `.work/design-out/claude-desktop.json`：過去の調査。主張は再確認し、未確認の項目は引き継がない。
- `web/js/tools/claude-desktop.js`：描画の誤りを比較した。変更していない。

## 仕様の読み方

- schemaはmemento.design.v1。既存IDをすべて残し、確認できた画面の違いに追加の版を置いた。
- fromは図鑑の月の区切り。既存IDに付いた日付が誤っていてもIDは変えず、本文とcorrectionsに実際の確認日を明記した。toは次の掲載版へ切り替える排他的な編集上の境界で、提供終了日ではない。
- 記述は自分の言葉による事実の要約。各事実の末尾にURLを付け、sources.showsにその資料の範囲を示す。短い操作名は機能名として残した。日本語の操作名は説明用で、当日の英語ラベルの完全な書き取りではない。
- nullは調査で確認できない値。paletteの全数値、枠の半径、密度、固定px、専用書体名は未確認。似た製品の色、公開企業サイトのCSS、既存rendererの値から補っていない。free_fallbackは再描画の提案で実測ではない。
- 2本以上の資料がある版でも、2本が独立した当日画面の証拠とは限らない。機能の公開と配置の確認を分け、過去の版に後日の操作を遡及しない。低いconfidenceは機能だけ確認でき、当日の画面を確定できないことを示す。
- confidenceは画面の裏付けの広さを表す主観的な目安。0.65以上は主な領域や操作を複数資料で確認、0.4〜0.64は部分的、0.4未満は配置や当日の差分が大きく未確認。
- 公式ブログは公開の発表ページ。記事中の画面の文章説明がある場合だけUIの根拠にした。ログイン前の販促ページの見た目をアプリの見た目として転記していない。
- ロゴ、キャラクター、専用フォント、製品のイラストや画面画像、回答例の長文は作成物に含めていない。

Mac/Windowsの窓の飾り、壁紙、背後の別アプリをClaude固有の画面領域として数えない。Coworkの実行環境が仮想マシンという説明から、画面内に仮想デスクトップやFinderが表示されるとは推定しない。

## 版ごとの確認範囲

| 版 | 期間 | 資料の種類 | 確信度 | 画面の確認状況 |
| --- | --- | --- | --- | --- |
| claude-desktop-2024-10 | 2024-10 → 2024-11 | press / blog | 0.43 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-desktop-2024-11 | 2024-11 → 2025-02 | blog / official-doc / press | 0.48 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-desktop-2025-02 | 2025-02 → 2025-05 | blog / official-doc | 0.46 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-desktop-2025-05 | 2025-05 → 2025-06 | blog / official-doc | 0.49 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-desktop-2025-06 | 2025-06 → 2025-08 | blog / official-doc | 0.7 | 主な領域・操作を確認。色と寸法は未確認 |
| claude-desktop-2025-08 | 2025-08 → 2025-10 | blog / official-doc | 0.46 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-desktop-2025-10 | 2025-10 → 2026-01 | official-doc / press | 0.23 | 版は保持。機能または後日の参考だけで、当日の配置は未確認 |
| claude-desktop-2026-01 | 2026-01 → 2026-03 | press / release-notes | 0.79 | 主な領域・操作を確認。色と寸法は未確認 |
| claude-desktop-2026-03 | 2026-03 → 2026-05 | release-notes / official-doc | 0.34 | 版は保持。機能または後日の参考だけで、当日の配置は未確認 |
| claude-desktop-2026-05 | 2026-05 → 2026-08 | blog / video / release-notes | 0.61 | 一部の領域・操作のみ。初日や全体の配置は未確認 |
| claude-desktop-2026-08 | 2026-08 → 2026-11 | changelog / official-doc / release-notes | 0.27 | 版は保持。機能または後日の参考だけで、当日の配置は未確認 |
| claude-desktop-2026-11 | 2026-11 → 未設定 | official-doc / blog / changelog | 0.61 | 一部の領域・操作のみ。初日や全体の配置は未確認 |

## 出典

各項目の「日付」は公開日・版の日付として確認できたものだけ。随時更新のヘルプやmainの履歴は日付未確認とし、調査日と区別する。検索索引だけ読めた場合も明記した。

### analysis

- URL：https://claude.com/resources/articles/analysis-tool
- 種類：blog。日付：2024-10-24。参照日：2026-11-15。
- 確認できたこと／限界：名前のメニューは左下、feature previewでJavaScript実行を有効化。常設Analysis REPL欄の説明はない。
- 対象：`claude-desktop-2024-10`。

### c37

- URL：https://www.anthropic.com/news/claude-3-7-sonnet
- 種類：blog。日付：2025-02-24。参照日：2026-11-15。
- 確認できたこと／限界：通常/拡張思考を切り替え、考えた内容を表示。思考量の数値指定はAPIの説明。Claude Codeは端末の別製品。
- 対象：`claude-desktop-2025-02`。

### integrations

- URL：https://claude.com/resources/articles/integrations
- 種類：blog。日付：2025-05-01。参照日：2026-11-15。
- 確認できたこと／限界：Researchボタン、遠隔MCP接続をWeb/desktopへ導入。後日更新を分離する。
- 対象：`claude-desktop-2025-05`。

### c4

- URL：https://www.anthropic.com/news/claude-4
- 種類：blog。日付：2025-05-22。参照日：2026-11-15。
- 確認できたこと／限界：Opus 4/Sonnet 4、思考と検索などの交互実行、Claude Code一般公開とIDE差分連携。
- 対象：`claude-desktop-2025-05`。

### releases

- URL：https://support.claude.com/en/articles/12138966-release-notes
- 種類：release-notes。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：日付別の公式更新履歴。2025-09-29ファイル作成拡大、2026-01-12 Cowork、03-17遠隔依頼、06-12文書編集、07-07共有ホーム、09-16会話統合、11-12 Meetings。各版で参照日を限定。
- 対象：`claude-desktop-2026-01`、`claude-desktop-2026-03`。

### unified

- URL：https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：Chat/Coworkを選ばず一つの会話で依頼。段階展開、移行済みアカウントは旧モードへ戻せない。
- 対象：`claude-desktop-2026-11`。

### artifacthelp

- URL：https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行Artifactsの左ナビ、会話横の編集面、Outputからテンプレート選択、Export。2026-09-16以前のものはlegacyと明記。 旧9487310 URLから転送された新ページ。
- 対象：`claude-desktop-2026-11`。

### sheets

- URL：https://claude.com/resources/articles/sheets-whiteboards-data
- 種類：blog。日付：2026-11-10。参照日：2026-11-15。
- 確認できたこと／限界：Whiteboards/Sheets betaとData。Web/desktop/mobile、会話横または全画面に外部アプリ。6月や9月の証拠には使わない。
- 対象：`claude-desktop-2026-11`。

### desktoplaunch

- URL：https://www.maginative.com/article/claude-desktop-app-now-available-for-mac-and-windows/
- 種類：press。日付：2024-10-31。参照日：2026-11-15。
- 確認できたこと／限界：Mac/Windows公開当日。Webと大きな違いがない会話画面。音声入力の同時発表はmobile、computer useはAPIと明記。
- 対象：`claude-desktop-2024-10`、`claude-desktop-2024-11`、`claude-desktop-2025-10`。

### mcp

- URL：https://www.anthropic.com/news/model-context-protocol
- 種類：blog。日付：2024-11-25。参照日：2026-11-15。
- 確認できたこと／限界：Claude DesktopでローカルMCPサーバー接続を提供。具体的なアイコン形状・位置は記載なし。
- 対象：`claude-desktop-2024-10`、`claude-desktop-2024-11`、`claude-desktop-2025-02`。

### mcphistory

- URL：https://raw.githubusercontent.com/modelcontextprotocol/docs/b244994db016139ca5dd7f2d29316dd419854e41/quickstart.mdx
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：固定コミットの公式手順本文。設定ファイルと会話によるSQLite検索、重要操作の確認。plug / Installed MCP Servers / Developerの記載は見つからない。コミット日未確認。
- 対象：`claude-desktop-2024-11`。

### extensions

- URL：https://www.anthropic.com/research/desktop-extensions
- 種類：blog。日付：2025-06-26。参照日：2026-11-15。
- 確認できたこと／限界：SettingsのExtensions一覧、導入時の説明・権限・入力欄・Install。09-11追記で.dxtから.mcpbに改名。現行本文の.mcpbを6月の綴りとして使わない。
- 対象：`claude-desktop-2025-05`、`claude-desktop-2025-06`、`claude-desktop-2025-08`。

### quick

- URL：https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行のMac向け小窓。Option二回、New chatで最近5件、矢印送信、任意のCaps Lock音声入力。2025-10-16の導入日を示す資料ではない。
- 対象：`claude-desktop-2025-10`。

### coworkreview

- URL：https://simonwillison.net/2026/Jan/12/claude-cowork/
- 種類：press。日付：2026-01-12。参照日：2026-11-15。
- 確認できたこと／限界：公開当日の実使用と記事内の画面説明。左Chat/Code/CoworkとNew task、中央の実行内容、右Progress/Artifacts/Context/Working files、下の返信欄。
- 対象：`claude-desktop-2026-01`。

### desktoplog

- URL：https://claude.com/docs/cowork/changelog.md
- 種類：changelog。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：Desktopのビルド別履歴。2026-08と11月の実在する操作・修正を確認。05-15/04-05の一致項目は見つからない。Computer Use v3 Inspectorを裏付けない。
- 対象：`claude-desktop-2026-08`、`claude-desktop-2026-11`。

### redesign

- URL：https://claude.com/resources/articles/claude-code-desktop-redesign
- 種類：blog。日付：2026-04-14。参照日：2026-11-15。
- 確認できたこと／限界：左の並列セッション一覧、絞り込み、配置可変の会話/端末/差分/編集/プレビュー、表示量3段階。
- 対象：`claude-desktop-2026-05`。

### redesignvideo

- URL：https://www.youtube.com/watch?v=rWaQSQEm_aY
- 種類：video。日付：2026-04-14。参照日：2026-11-15。
- 確認できたこと／限界：公式Claudeチャンネルの題名・説明文を検索で確認。並列一覧と配置変更可能な各欄。映像フレームは見ていない。
- 対象：`claude-desktop-2026-05`。

### whatsnew

- URL：https://code.claude.com/docs/en/whats-new
- 種類：release-notes。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：2026-08-24週CLI会話をDesktopの/resumeへ、08-31週全画面の横の/diff欄とMac背後操作、09-07週切り離し窓。05月pop-outや08-24 Inspector導入とは一致しない。
- 対象：`claude-desktop-2026-05`、`claude-desktop-2026-08`。

### install

- URL：https://support.claude.com/en/articles/10065433-install-claude-desktop
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行インストール手順。ExtensionsはSettings内。過去の画面配置と対応OSを確定する証拠ではない。
- 対象：`claude-desktop-2025-06`、`claude-desktop-2025-08`。

### dispatch

- URL：https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行のDispatch。携帯とDesktopでつながる継続スレッド。03-17更新の補足。音声波形の常設一覧を示す資料ではない。
- 対象：`claude-desktop-2026-03`。

### computer

- URL：https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行の画面操作と許可・停止の説明。Computer Use v3という名称や座標インスペクタを裏付けない。
- 対象：`claude-desktop-2026-03`、`claude-desktop-2026-08`。

### thinkinghelp

- URL：https://support.anthropic.com/en/articles/10574485-using-extended-thinking
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：検索索引の旧公式ヘルプではSearch and tools > Extended thinking。正確な2月24日の配置を裏付ける固定版ではない。
- 対象：`claude-desktop-2025-02`。

### researchhelp

- URL：https://support.claude.com/en/articles/11088861-use-research-on-claude
- 種類：official-doc。日付：未確認（随時更新または本文に固定日なし）。参照日：2026-11-15。
- 確認できたこと／限界：現行ヘルプの+ > Research、下端の青い表示。旧索引にはResearch/Default選択。2025年初日へ現行の位置を転記しない。
- 対象：`claude-desktop-2025-05`。

## 取得できなかった資料・補助照合

- https://github.com/modelcontextprotocol/docs/commit/b244994db016139ca5dd7f2d29316dd419854e41 — 日付：未確認。参照日：2026-11-15。固定コミットは存在し、タイトルはAdd Continue client。取得した本文にコミット日が出ず、2024-11-30とは再確認できない。
- https://archive.ph/2026.01.12-200100/https%3A/claude.com/blog/cowork-research-preview — 日付：未確認。参照日：2026-11-15。検索索引に2026-01-12発表の文章は残るが、直接取得はToo Many Requests。これはInternet Archiveではなく別の保存サービス。初日の画面証拠として使わない。
- https://support.anthropic.com/en/articles/10065433-installing-claude-for-desktop — 日付：未確認。参照日：2026-11-15。旧ヘルプの検索索引にSettings > Extensionsが残る。現在のinstall-claude-desktopページとは内容・対象OS・設定の分類が異なる。2024年版のCSSは得られない。

## 修正を要する既存の説明

- 初期調査では10月初日が不確定だったが、10月31日当日の記事でMac/Windows公開ベータを確認。ただし初日のショートカットの正確な組み合わせは未確認（https://www.maginative.com/article/claude-desktop-app-now-available-for-mac-and-windows/）
- web/js/tools/claude-desktop.jsの10月版にあるDesktopのDictation/Screenshot常設ツールバーは未確認。同日の音声入力発表はmobileとされ、computer useはAPIの機能だった（https://www.maginative.com/article/claude-desktop-app-now-available-for-mac-and-windows/）
- 11月版のMCP Servers左ナビ、右側の設定ファイル全文、ハンマーの道具数は未確認。固定した旧公式手順が裏付けるのは設定ファイルと会話での実行・確認（https://raw.githubusercontent.com/modelcontextprotocol/docs/b244994db016139ca5dd7f2d29316dd419854e41/quickstart.mdx）
- design-outの『2024-11-30の固定手順にプラグ印、Installed MCP Servers、Developer』は同じURLの本文で再確認できなかった。本文にこれらの語がなく、コミット日も取得できなかったため撤回して保留する（https://raw.githubusercontent.com/modelcontextprotocol/docs/b244994db016139ca5dd7f2d29316dd419854e41/quickstart.mdx）
- 2025-02の1024〜64000の思考量スライダーはDesktopの確認済みUIではない。公式発表は利用者の思考モード切替と、開発者向けAPIの数値指定を区別する（https://www.anthropic.com/news/claude-3-7-sonnet）
- 2025-05の.dxt導入画面は早すぎる。公式発表は6月26日なので6月版を追加し、5月版には置かない（https://www.anthropic.com/research/desktop-extensions）
- 2025-08の.mcpbディレクトリは改名前。公式の改名追記は9月11日で、機能は変わらないとされる。8月版の独自の常設右表は未確認（https://www.anthropic.com/research/desktop-extensions）
- 2025-10版のOption二回・Caps Lock・画面添付は現行手順にはあるが、10月16日の初出としては未確認。Skillsを小窓に固定表示する根拠もない（https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac）
- 2026-01のCoworkは左・中央・右の構成を当日の実使用記事で確認できた。右の『Mounted Folder Progress』という名称や成果物の架空の固定一覧は使わない（https://simonwillison.net/2026/Jan/12/claude-cowork/）
- 2026-03-15のDispatch Voice/音声波形/通知トレイは未確認。公式履歴は3月17日に継続スレッド、3月23日に画面操作を記録（https://support.claude.com/en/articles/12138966-release-notes）
- 2026-05のpop-out公開は未確認。確認できた公式週報は9月7〜11日に各欄の切り離し窓を案内。CodeのCLI会話再開は8月24日の週で、Coworkの/resumeと混同しない（https://code.claude.com/docs/en/whats-new）
- 2026-08のComputer Use v3 Inspectorという名称、座標の右欄、操作証跡の常設列は未確認。画面操作の実在だけから描かない（https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork）
- 2026-11の統合済み会話と成果物編集は確認できるが、Session Railの右側固定配置はこの調査で確認できない（https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude）
- OSの壁紙・画面録画・交通信号型の窓ボタン・半透明処理をアプリの配色や固定の見た目として扱わない。数値と当日の書体は未確認。

## レビュアーに残る確認

- nullの数値や当日の配置を確定するには、対象日付に固定されたログイン済み画面の文章説明や正規のCSS・仕様が必要。許可された方法で確認できなければnullのままにする。
- 低いconfidenceの版が独立した見た目を持つかは未確認。モデル更新だけの版を別のレイアウトへ描き変えない。
- 既存カタログとrendererは担当外なので未変更。correctionsを確認して担当者が反映する。

