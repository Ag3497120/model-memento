# DeepSeek の画面調査

確認日: 2026-11-15。対象は公式のウェブ会話画面。今回読んだcatalogにはdeepseekという独立IDがなかった。.work/design-out/deepseek.jsonとweb/js/tools/deepseek.jsも存在しなかった。Harnessや他社クライアントと区別して新規に記録した。

## 版と確かさ

2024年11月はDeep Thinkの初期プレビュー、2025年1月はR1期、2025年8月はV3.1期の切り替え、2026年7月は実使用レビューで位置が分かるExpert / Instant期。fromは出典の観察月で、デザインの最初の導入日を保証しない。7月期のモード名は4月24日の公式発表でも確認できるが、上部に置かれた時期は7月の資料だけで確認している。toは廃止日を確認できないためnull。

8月は画面全体を確認できず、ボタンの役割だけの部分記録。新しい見た目が全面導入されたと主張しない。すべてのpalette・書体名・幅・角丸は未確認なのでnull。free_fallbackは本プロジェクトの実装候補。

## 根拠

- https://www.deepseek.com/en/news/r1-lite-preview/
  - 種類: blog。資料日: 2024-11-20。確認日: 2026-11-15。
  - DeepSeek-R1-Lite-Previewとリアルタイムの思考表示、公式チャットへの入口を説明。現在のページのナビゲーションを2024年のチャット画面と見なさない。

- https://api-docs.deepseek.com/news/news1120/
  - 種類: release-notes。資料日: 2024-11-20。確認日: 2026-11-15。
  - 初期プレビューの思考表示を確認。色や配置の数値はない。

- https://www.datacamp.com/blog/deepseek-r1-lite-preview
  - 種類: press。資料日: 2024-11-26。確認日: 2026-11-15。
  - 本人が試した長い解説。ログイン後にDeep Thinkを有効化する操作と、思考内容が見えることを文章で確認。UI寸法は採用していない。

- https://api-docs.deepseek.com/news/news250120/
  - 種類: release-notes。資料日: 2025-01-20。確認日: 2026-11-15。
  - R1の公開と、公式ウェブのDeepThinkから使えることを確認。配色や幅はこの発表からは分からない。

- https://indianexpress.com/article/technology/techook/deepseek-how-to-use-for-free-smartphone-laptop-pc-9805383/
  - 種類: press。資料日: 2025-02-06。確認日: 2026-11-15。
  - 元記事は2025-01-29、表示される更新日は02-06。下部入力、DeepThink (R1)・Search、その近くの+、狭い画面の左上から開く履歴。スマホとウェブを併記した記事なのでデスクトップの常設左欄の幅へ変換しない。

- https://api-docs.deepseek.com/news/news250821/
  - 種類: release-notes。資料日: 2025-08-21。確認日: 2026-11-15。
  - V3.1の通常応答・思考モードをDeepThinkボタンで切り替える。画面全体の変更を示した説明ではない。

- https://api-docs.deepseek.com/updates/
  - 種類: changelog。資料日: 不明。現行資料または固定コミットの取得。確認日: 2026-11-15。
  - 2025-08-21の項目を参照。APIで通常応答・思考モードが同じV3.1に対応することを確認する補助。ウェブの配置の証拠にはしない。現在の全文は後の変更も含む。

- https://api-docs.deepseek.com/news/news260424/
  - 種類: release-notes。資料日: 2026-04-24。確認日: 2026-11-15。
  - V4公開時点で公式ウェブのExpert Mode / Instant Modeという入口を案内。上部の配置まで分かる資料ではない。

- https://www.techradar.com/pro/deepseek-ai-review
  - 種類: press。資料日: 2026-07-13。確認日: 2026-11-15。
  - 本人が使ったレビューのUser experienceとFeaturesを参照。上部のモード切り替え、手動の検索切り替え、文書のドラッグ追加、思考表示。7月の観察を4月24日の配置へ逆算しない。

- https://api-docs.deepseek.com/news/news261113/
  - 種類: release-notes。資料日: 2026-11-13。確認日: 2026-11-15。
  - API用の公開デモを別途案内し、既存アプリと同じ機能を開発者が組めると説明。本番UIとデモの同一性は述べていない。

- https://github.com/deepseek-ai/chat-demo/blob/5d5dd754ebc1948e977ddb880a9eb5aa25f37b4c/README.md
  - 種類: oss-source。資料日: 不明。現行資料または固定コミットの取得。確認日: 2026-11-15。
  - 静的なAPI用会話デモ。APIキー、設定、履歴の保存、逐次表示などを持つ。本番画面の歴史的証拠には使わない。

- https://github.com/deepseek-ai/chat-demo/blob/5d5dd754ebc1948e977ddb880a9eb5aa25f37b4c/src/app/theme.css
  - 種類: oss-source。資料日: 不明。現行資料または固定コミットの取得。確認日: 2026-11-15。
  - 明暗テーマ・書体・色の意味別変数を読んだ。公式APIデモの情報に限る。specの本番paletteへ値を移していない。

## 取得できたが採用しなかった資料

- https://chat.deepseek.com/ — Web取得とNodeのfetchの両方でHTTP 403。ログイン後の製品画面を直接見たとは主張しない。
- https://www.deepseek.com/ — NodeのfetchでHTTP 200。ログアウト状態の製品案内。取得したHTMLを読み、画像・フォント・バイナリは保存していない。広告ページを会話画面の色・寸法の根拠にしない。
- https://cdn.deepseek.com/chat-demo — 公開APIデモ。Web取得は200相当だが本文行を抽出できなかった。ソースのREADMEとtheme.cssを読み、デモの情報としてのみ扱った。
- https://web.archive.org/web/20250125000000/https://chat.deepseek.com/ — 取得不可。2025年1月の保存画面を検証したとは主張しない。
- https://api-docs.deepseek.com/news/news241120/ — 取得不可。公式ページ内のリンクをたどり、正しいnews1120/を取得した。
- https://sxd.quangngai.gov.vn/upload/2006772/20250417/So_tay_AI_TRUNG_TAM_CHUYEN_DOI_SO_-10_4_2025_b8c02.pdf — 公的機関の2025年の解説冊子。本文の初回取得は成功したが、DeepSeek箇所の再取得がタイムアウトした。検索の画像説明だけで詳細を断定せず、specのレイアウト根拠には採用しない。

## 残る未確認

本番画面の正確な色・書体・幅・吹き出し・余白、各版の空画面の文言、思考欄の開閉位置、検索結果のカード、2026年11月15日現在の画面全体はunverified。APIデモと本番の見た目が一致するかもunverified。2025年1月の報道はスマホとウェブをまとめて説明しているため、その左上の履歴ボタンをデスクトップの常設260px欄へ置き換えない。

公式発表、履歴、本人による長い使用解説、APIデモのソース、Internet Archiveを調べた。取得できなかった資料も上に残した。画像や動画のフレームをコピーせず、ロゴとクジラの図形も再作成していない。

