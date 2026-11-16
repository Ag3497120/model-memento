# Google Antigravity の画面調査

調査日: 2026-11-15。カタログに本体のantigravity項目がないため指定IDで新規作成。関連する認証用プラグインやSDKは本体の旧版ではない。web/js/tools/には本体の専用描画コードがなく、.work/design-out/にも本体の旧調査はなかった。参照したカタログは読み取りのみ。

トップのkind=agent-appは現在の主な利用面を表す。2025-11版はIDEと管理画面という2つの利用面をregionsに記録した。from/toは月単位の図鑑上の区切り。元のIDEが2026-05に消滅したという意味ではなく、別の外観を選べるようにするための区分。2.0アプリとIDEの歴史は並行するため、1本の終了履歴として扱わない。

ブログの本文・画像の代替説明、公式の操作手順、更新履歴を読んだ。紹介ページは製品を実際に操作した証拠ではない。画像や動画のコマから測定せず、幅・色・角丸はnullとした。現行手順を過去版へ遡らせない。日本語の操作名は再描画用の訳で、製品の当日の逐語ラベルではない。

## 版ごとの資料

### antigravity-2025-11（confidence 0.73）

- blog / 公開日 2025-11-18 / 閲覧日 2026-11-15: https://antigravity.google/blog/introducing-google-antigravity
  - エディターと管理画面を別ウィンドウに分ける。タスク単位の道具表示・成果物・受信箱・文書へのコメント。画像や動画のコマは取得せず本文と代替説明だけを参照。
- blog / 公開日 2025-11-20 / 閲覧日 2026-11-15: https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/
  - 2種類の画面、コード・端末・ブラウザーをまたぐ作業、成果物の確認と直接のコメント。

### antigravity-2026-05（confidence 0.79）

- blog / 公開日 2026-05-19 / 閲覧日 2026-11-15: https://antigravity.google/blog/introducing-google-antigravity-2
  - 独立した2.0デスクトップアプリ。複数フォルダーのプロジェクト、定期作業、入力欄横の音声文字起こし。旧IDEは別。
- blog / 公開日 2026-05-19 / 閲覧日 2026-11-15: https://antigravity.google/blog/google-io-2026-feature-deep-dive
  - 左列をプロジェクト・状態・新しさで整理。単独の会話を別区分へ。新しい作業コピーと音声入力の入口。
- official-doc / 公開日 未記載 / 閲覧日 2026-11-15: https://codelabs.developers.google.com/getting-started-google-antigravity
  - 現行の操作手順。左のプロジェクトと左下設定を説明。更新済み資料なので5月初日の正確な全配置の証拠にはしない。2026-11-15閲覧。

### antigravity-2026-10（confidence 0.73）

- changelog / 公開日 2026-10-15 / 閲覧日 2026-11-15: https://antigravity.google/docs/changelog?tab=hub
  - 2.24.0の項目。Overviewに成果物・変更ファイル・リンク・追加資料をまとめる横パネルへの刷新。最大化は会話の上に重なる。
- official-doc / 公開日 未記載 / 閲覧日 2026-11-15: https://antigravity.google/docs/side-panel/
  - 現在のOverview・タブ・分割の説明。10月15日からの全仕様とは断定せず、更新履歴が明示する構成だけを採用。2026-11-15閲覧。

### antigravity-2026-11（confidence 0.82）

- changelog / 公開日 2026-11-03 / 閲覧日 2026-11-15: https://antigravity.google/docs/changelog?tab=hub
  - 2.29.0: 開始画面は上に挨拶・下に入力。既定OnyxテーマとGoogle Sans。2.30.0: 用途別の構成。2.31.0（11月9日）: 12/14/16pxの文字サイズ。累積の更新履歴なので節の日付を区別。
- official-doc / 公開日 未記載 / 閲覧日 2026-11-15: https://antigravity.google/docs/settings/
  - 2.30.0以降の仕事用・ソフトウェア開発用の構成。設定は左下、個人アカウントで切替。2026-11-15閲覧。
- official-doc / 公開日 未記載 / 閲覧日 2026-11-15: https://antigravity.google/docs/side-panel/
  - 現行の横パネル。資料・成果物・差分・端末・別の会話・Webページをタブで開く。仕事用の構成は一部の項目を省く。2026-11-15閲覧。

## 同日の報道による照合

- press / 公開日2025-11-18 / 閲覧日2026-11-15: https://www.theverge.com/news/822833/google-antigravity-ide-coding-agent-gemini-3-pro
  - エディターと管理画面という2種類、成果物を介した確認とコメントを本文で照合。画像や動画のコマは取得しない。

## 日付と利用面の区別

- 初日: https://antigravity.google/blog/introducing-google-antigravity — 2025-11-18。道具の操作をタスク単位でまとめ、成果物を見て判断するという構成。
- 開発者向け発表: https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/ — 2025-11-20。初日の完全な寸法・配色を示す資料ではない。
- 2.0: https://antigravity.google/blog/introducing-google-antigravity-2 — 2026-05-19。独立したアプリと従来のIDEを区別。
- 左列の具体的な整理: https://antigravity.google/blog/google-io-2026-feature-deep-dive — 2026-05-19。プロジェクト別・状態別・新しさ別、単独の会話の別区分を本文で確認。
- 横パネルの刷新: https://antigravity.google/docs/changelog?tab=hub — 2.24.0、2026-10-15。
- 開始画面・既定テーマ・書体: 同更新履歴の2.29.0、2026-11-03。
- 用途別の構成: 同更新履歴の2.30.0と https://antigravity.google/docs/settings/ のInterface Layout節。仕事向け構成はGit・端末等を省く。アカウントにより切替がない。
- 文字サイズ12/14/16px: 同更新履歴の2.31.0、2026-11-09。これはフォントサイズで、角丸や余白の測定値ではない。
- 現行IDEの支援パネル: https://antigravity.google/docs/ide/agent-side-panel/ — 公開日未記載、2026-11-15閲覧。ヘッダーの会話切替、入力欄のモデル選択、変更の確認を説明。2025年版の証拠として採用しない。

## 修正点・未確認

- カタログにid=antigravityは存在しなかった。.work/design-out/antigravity.jsonと専用描画ファイルも存在しなかった。認証用プラグインやSDKを本体と取り違えない。
- 2025年11月版はエディターと管理画面を別ウィンドウにする。最初から独立した2.0アプリとして描かない（https://antigravity.google/blog/introducing-google-antigravity）
- 2026年5月19日の2.0はIDEを必須にしない独立アプリ。旧IDEも別に提供される（https://antigravity.google/blog/introducing-google-antigravity-2）
- 5月の音声入力は文字起こしで、送信前に直せる。11月の会話型音声モードと同じ表示にしない（https://antigravity.google/blog/google-io-2026-feature-deep-dive）
- 現在のOverviewのすべての項目や新しい文字サイズを2025年11月へ遡らせない。2.24.0、2.29.0、2.30.0、2.31.0の節を区別（https://antigravity.google/docs/changelog?tab=hub）
- Google Sansは2026年11月の既定変更として確認。初期版の書体としては unverified（https://antigravity.google/docs/changelog?tab=hub）
- 現行IDEのWorked forやAccept allは別のIDE用画面。アプリの開始画面や2025年の初日へそのまま転用しない（https://antigravity.google/docs/ide/agent-side-panel/）
- ライト・ダークの色番号、Onyxの正確な色、各領域の幅、角丸、過去の書体とコード用書体は unverified。VS Code由来という一般論から既定色を補わない。

## 動画・保存版・取得失敗

- https://www.youtube.com/watch?v=uzFOhkORVfk — 検索で「Google Antigravity: Hands on with our new agentic development platform」、公開日2025-11-19という情報を確認。動画ページは取得が制限され、説明全文・字幕・投稿者の確認は unverified。フレームは取得・保存していない。版の2件要件に数えない。
- https://web.archive.org/web/20251119000000/https://antigravity.google/ — 取得不可。実在する保存時刻・ログイン後画面は unverified。
- https://antigravity.google/blog/introducing-google-antigravity-2-0 — 現行の /blog/introducing-google-antigravity-2 へ移動する案内。独立した証拠として二重計上しない。
- https://antigravity.google/docs/agent-manager — 404。現行資料の構成から過去の管理画面を推定しない。
- 公式ソース一式・アプリのテーマ定義は確認できなかった。オープンソースだとも非公開だとも断定しない。
- ログイン済みアプリは操作していない。スクリーンショット・ロゴ・アイコン・書体ファイル・製品の作例は保存していない。
