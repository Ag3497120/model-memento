# Google Bard → Gemini の画面調査

調査日: 2026-11-15。対象はパソコンのWeb版。アプリ・API・ログイン前ページを混ぜない。カタログの11件をすべて保持し、見た目の変化を確認できた2023-09と2024-09を追加した。from/toは月単位の図鑑上の境界で、全利用者の切替日やサービス終了日ではない。8月版のGemsは8月28日以降の姿である。

各項目の文章にはURLを添付し、sourcesに資料の種類・日付・対象を記した。日本語の操作名は再描画用の訳で、当日の日本語UIを逐語記録したものではない。未知の色・書体・寸法・会話の形・待機中の動きはnull。資料が機能だけを裏付ける版は低いconfidenceとした。異なるURLでも同じ公式発表の転載は独立した視覚証拠とは数えない。

参照したローカル入力: web/data/catalog.json、.work/design-out/google-bard-gemini.json、web/js/tools/gemini.js。これらは調査対象であって外部製品の事実の根拠ではない。元ファイルは編集していない。gemini-cliとantigravityの旧調査ファイルは存在しなかった。

## 版ごとの根拠

### google-bard-gemini-2023-03（2023-03〜2023-07、confidence 0.64）

- blog / 公開日 2023-03-21 / 閲覧日 2026-11-15: https://blog.google/innovation-and-ai/products/try-bard/
  - 初期Bardの複数下書き・検索・実験の説明。画面画像は取得せず本文と代替説明のみ確認。
- press / 公開日 2023-03-21 / 閲覧日 2026-11-15: https://www.engadget.com/google-bard-ai-hands-on-a-work-in-progress-with-plenty-of-caveats-170956025.html
  - 当日の操作記事。左列のメニューと下部入力欄を確認。

### google-bard-gemini-2023-07（2023-07〜2023-09、confidence 0.83）

- blog / 公開日 2023-07-13 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-july-2023/
  - 履歴のピン留め・改名、読み上げ、返答の調整、画像入力の開始。
- press / 公開日 2023-07-13 / 閲覧日 2026-11-15: https://9to5google.com/2023/07/13/google-bard-europe/
  - 左列の新規会話・固定・最近の会話、右上へ移動した設定、入力横の＋、読み上げと調整の位置。

### google-bard-gemini-2023-09（2023-09〜2023-12、confidence 0.66）

- blog / 公開日 2023-09-19 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-sept-2023/
  - 検索で確認できた文を強調表示する操作、Googleサービスとの連携。2026-10の追記があるためプライバシー説明は当時の根拠に使わない。
- press / 公開日 2023-09-19 / 閲覧日 2026-11-15: https://www.semafor.com/article/09/19/2023/google-soups-up-gmail-and-other-apps-with-bard-ai-updates
  - 検索の抜粋で同日のサービス連携と検索による再確認を照合。本文取得は制限され、配色・配置の証拠には使わない。

### google-bard-gemini-2023-12（2023-12〜2024-02、confidence 0.31）

- blog / 公開日 2023-12-06 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/google-bard-try-gemini-ai/
  - Bardの英語テキスト会話へGemini Proを導入。モデルの公開は確認できるが、画面全体の変更は示さない。
- press / 公開日 2023-12-06 / 閲覧日 2026-11-15: https://9to5google.com/2023/12/06/google-gemini-1-0/
  - BardへのGemini Pro導入。当時の新しい画面寸法・バナー・モデル選択メニューの証拠にはならない。
- blog / 公開日 2023-09-19 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-sept-2023/
  - 再確認と連携は12月以前の追加。12月6日の完全な配置は未確認。

### google-bard-gemini-2024-02（2024-02〜2024-05、confidence 0.65）

- blog / 公開日 2024-02-08 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/bard-gemini-advanced-app/
  - Geminiへの改称、AdvancedとUltra 1.0、AndroidとiOSの別の利用面。
- press / 公開日 2024-02-08 / 閲覧日 2026-11-15: https://9to5google.com/2024/02/08/google-gemini-advanced/
  - Webの左上の切替、左列下部の設定・履歴・ヘルプ、実験表示の削除。

### google-bard-gemini-2024-05（2024-05〜2024-08、confidence 0.6）

- blog / 公開日 2024-05-14 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/google-gemini-update-may-2024/
  - Web Advancedへ端末・Driveから文書を追加。記事は2025-08-13に更新されており、当日以外の予告を含む。
- press / 公開日 2024-05-14 / 閲覧日 2026-11-15: https://9to5google.com/2024/05/14/gemini-advanced-1-5-pro/
  - 当日の文書追加と1.5 Pro。表計算の解析やGemsは当日には予告。
- press / 公開日 2024-05-21 / 閲覧日 2026-11-15: https://9to5google.com/2024/05/21/gemini-advanced-spreadsheet/
  - 5月21日に表データ追加とグラフの調整を報告。14日と区別。

### google-bard-gemini-2024-08（2024-08〜2024-09、confidence 0.69）

- blog / 公開日 2024-08-28 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/google-gemini-update-august-2024/
  - Gemsの指示・名前・会話、用途別の作成例。8月13日の機能として遡らせない。
- press / 公開日 2024-08-28 / 閲覧日 2026-11-15: https://9to5google.com/2024/08/28/gemini-advanced-gems-imagen-3/
  - WebのGem manager、左列のGemsへの入口、指示の書き直し。
- blog / 公開日 2024-08-13 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/made-by-google-gemini-ai-updates/
  - LiveはAndroidの音声会話として公開。Webの常設波形の根拠ではない。

### google-bard-gemini-2024-09（2024-09〜2024-12、confidence 0.52）

- press / 公開日 2024-09-11 / 閲覧日 2026-11-15: https://9to5google.com/2024/09/11/gemini-homepage-redesign/
  - Webの開始画面で提案と名前入り挨拶を省いた試験を一アカウントで確認。全員への適用日は不明。
- press / 公開日 2024-10-09 / 閲覧日 2026-11-15: https://9to5google.com/2024/10/09/gemini-homescreen-android-redesign-wide/
  - Webも挨拶中心に簡素化されたと追認。記事の細かな入力配置はAndroidのためWebへ転用しない。

### google-bard-gemini-2024-12（2024-12〜2025-03、confidence 0.8）

- blog / 公開日 2024-12-11 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/google-gemini-deep-research/
  - モデル選択からDeep Researchまたは2.0 Flash Experimentalへ。調査計画の修正・承認、出典付き報告、Docsへの書き出し。
- press / 公開日 2024-12-10 / 閲覧日 2026-11-15: https://9to5google.com/2024/12/10/gemini-text-field-tweak/
  - Webの入力欄が細い輪郭の横長丸形へ。左に＋、入力、右にマイク。

### google-bard-gemini-2025-03（2025-03〜2025-06、confidence 0.84）

- blog / 公開日 2025-03-18 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/gemini-collaboration-features/
  - 入力欄のCanvas、選択箇所の長さ・調子の修正、HTML/Reactの確認、音声解説の候補。
- press / 公開日 2025-03-18 / 閲覧日 2026-11-15: https://9to5google.com/2025/03/18/gemini-canvas-audio-overview/
  - Webで左に会話、隣にCanvasという2領域。
- blog / 公開日 2025-03-13 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/new-gemini-app-features-march-2025/
  - Deep Researchの進捗と思考表示、入力欄・モデル選択からの入口。

### google-bard-gemini-2025-06（2025-06〜2025-12、confidence 0.6）

- blog / 公開日 2025-05-20 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/gemini-app-updates-io-2025/
  - 2.5期のCanvasで図解、クイズ、音声解説、アプリを作る。6月17日の画面全体を示す資料ではない。
- release-notes / 公開日 2025-05-20 / 閲覧日 2026-11-15: https://gemini.google/release-notes/
  - Canvasの作成メニューとGemini Advanced名の終了。6月版に関係する5月の変更を参照。
- press / 公開日 2025-03-18 / 閲覧日 2026-11-15: https://9to5google.com/2025/03/18/gemini-canvas-audio-overview/
  - 左右に会話とCanvasを置く構成の初出根拠。6月の全配置は未確認。

### google-bard-gemini-2025-12（2025-12〜2026-11、confidence 0.51）

- blog / 公開日 2025-12-17 / 閲覧日 2026-11-15: https://blog.google/products-and-platforms/products/gemini/gemini-3-flash-gemini-app/
  - Fast・Thinking・Proという選択名と対応。
- release-notes / 公開日 2025-12-17 / 閲覧日 2026-11-15: https://gemini.google/release-notes/
  - 12月17日の項目で同じ3つの選択名を確認。寸法・配置の根拠ではない。

### google-bard-gemini-2026-11（2026-11〜未確定、confidence 0.58）

- official-doc / 公開日 未記載 / 閲覧日 2026-11-15: https://support.google.com/gemini/answer/18617127?hl=en
  - 左メニュー→設定→Personal Intelligence→Memory summary。依頼文で情報を更新し、右上の履歴で変更を確認。公開日なし、2026-11-15閲覧。
- press / 公開日 2026-11-10 / 閲覧日 2026-11-15: https://www.androidcentral.com/apps-software/ai/google-is-upgrading-gemini-with-memory-summary-heres-how-to-find-out-what-your-assistant-knows-about-you
  - 同月のMemory summary公開と設定からの入口。提供条件は現行ヘルプと異なるため固定しない。
- blog / 公開日 2026-11-10 / 閲覧日 2026-11-15: https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/
  - CarbonをGeminiアプリに展開。画面配置・思考レベルのUIは示さない。
- blog / 公開日 2026-11-12 / 閲覧日 2026-11-15: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/
  - Hydrogenのモデル選択。記事は11月13日更新。APIの思考設定をアプリの4段階メニューの根拠にしない。

## 修正点

- 2023年3月の左列を会話履歴として扱わない。履歴の固定や改名は7月の追加（https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-july-2023/）
- 3月から検索による文の再確認やGoogleサービス連携を同時に表示しない。9月19日の追加（https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-sept-2023/）
- 7月版の描画では設定類を左列に残さず、当日の記事が示す右上の位置を使う（https://9to5google.com/2023/07/13/google-bard-europe/）
- 12月のGemini Pro導入はモデルの変更。常設のGemini Proバッジや新レイアウトは unverified（https://blog.google/products-and-platforms/products/gemini/google-bard-try-gemini-ai/）
- 2月版は左のメニューと左上の切替を省かない。描画コードの4枚カード・正確な挨拶は unverified（https://9to5google.com/2024/02/08/google-gemini-advanced/）
- 5月14日に表計算・グラフを最初から表示しない。表データ対応の確認日は5月21日。100万文字相当の残量計を常設する根拠も unverified（https://9to5google.com/2024/05/21/gemini-advanced-spreadsheet/）
- Gemsは8月28日の追加。8月13日のWebに遡らせない（https://blog.google/products-and-platforms/products/gemini/google-gemini-update-august-2024/）
- 8月13日のLiveはAndroid向け音声会話。Webの常設の波形や音量計は unverified（https://blog.google/products-and-platforms/products/gemini/made-by-google-gemini-ai-updates/）
- 3月18日のCanvasをGemini 2.5の専用画面と呼ばない。公式の公開記事はCanvasと音声解説を説明している（https://blog.google/products-and-platforms/products/gemini/gemini-collaboration-features/）
- 6月の上部常設音声プレイヤーやGoogle Docs Syncボタンは unverified。作成メニューとして確認できる内容を使う（https://gemini.google/release-notes/）
- 12月のFast・Thinking・Proは選択メニューの項目。Fast/Thinkingだけの独立したトグルの位置は unverified（https://blog.google/products-and-platforms/products/gemini/gemini-3-flash-gemini-app/）
- 11月の記憶のまとめは設定配下。独立した左列ボタン、Pixel Rambler、アプリ内low/medium/high/xhighの4段階メニューは unverified（https://support.google.com/gemini/answer/18617127?hl=en）
- Web版の色番号・書体名・幅・角丸は全版で unverified。カタログの配色を確認済みの実測値として転記しない。

## 根拠として採用しなかったもの・未確認

- https://gemini.google.com/ — 2026-11-15取得。本文はログイン案内とGoogle appsだけ。会話中画面も現在のCSSも確認できない。
- https://design.google/library/gemini-ai-visual-design — 2026-11-15閲覧、公開日未確認。丸形・グラデーションの一般論はあるが、対象月の有効CSSを示さない。過去年月の色・フォント指定へ流用していない。
- https://web.archive.org/web/20230322000000/https://bard.google.com/ — 取得不可。指定時刻に実在する保存版があるかも未確認。
- https://web.archive.org/web/20240209000000/https://gemini.google.com/ — 取得不可。画面証拠として数えない。
- https://blog.google/products/gemini/google-gemini-update-io-2024/ と https://blog.google/products/gemini/made-by-google-gemini-ai-updates-2024/ — 取得不可。採用URLは上の公式記事。
- https://blog.google/products-and-platforms/products/gemini/google-gemini-update-may-2024/ は2025-08-13更新、https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-sept-2023/ は2026-10-16追記あり。同時期の報道と照合し、後の追記を初日の機能として扱わない。
- https://support.google.com/gemini/answer/18617127?hl=en と11月10日の報道では提供地域等の記述が異なる。最新条件を当日へ遡らせない。画面の入口だけを採用。
- 初期Bardの取材記事は左メニューと下部入力欄のみを短く要約。画像・画面・長文は保存していない。
- 全版の正確な配色、Googleの書体ファイル、余白、幅、角丸、全待機アニメーションは unverified。ロゴやブランドの星印は再描画しない。

## 検索抜粋の制約

- https://www.semafor.com/article/09/19/2023/google-soups-up-gmail-and-other-apps-with-bard-ai-updates — 検索の抜粋で2023-09-19の連携と再確認を照合したが、記事本文の取得は制限された。配色や配置の裏付けには使わない。
- 2024-09の開始画面変更は同時期の報道のみ。公式の変更履歴・当時の有効CSSは unverified。2つの報道も同じ媒体であり、独立性に制約がある。
