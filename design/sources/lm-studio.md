# LM Studio：見た目の根拠

調査日：2026-11-15。対象ファイルだけを作成。アプリの起動・導入・画面撮影は行っていない。公開ページの本文と公開コードを読み、図版・動画のフレーム・ロゴ・フォント・実装コードは保存していない。

入力：web/data/catalog.jsonの全10版、.work/design-out/lm-studio.json、web/js/tools/lmstudio.jsを読んだ。新規にlm-studio-2025-02を追加した。LM Studioのアプリ本体の実効CSSは取得していないため、全版の正確な色・主書体・角丸数値はnull。公式ブログ・版の更新記録・現行ヘルプ・利用者自身の手順書を照合した。

## 読み方

- from/to は図鑑内の月単位の区切り。to は次の記録への切替月（排他的）で、旧版の利用終了を意味しない。既存IDを維持し、元の日付の誤りは下記で区別する。
- null は未確認。見た目の測定値を資料のないまま補わない。confidence は見た目全体の裏付けの厚さで、機能一覧の正しさだけを表さない。
- sources.shows は、そのURLが裏付ける範囲と限界を示す。日付のない現行資料は2026-11-15の閲覧資料であり、過去版の同じ配置を証明しない。
- 原画面の短い操作名は出典を識別するために記し、描き直す画面の説明は日本語にする。free_fallback は本アプリ側の代替書体の提案で、製品がその書体だったという主張ではない。
- 公開コードを読めたことと、その版のサービス上で同じ設定が使われたことは別。条件付き表示は有効な場合だけ描く。

## 版の範囲と確かさ

- lm-studio-2023-05：2023-05 → 2023-11、confidence 0.32。資料種別：blog / release-notes。
- lm-studio-2023-11：2023-11 → 2024-04、confidence 0.61。資料種別：press / release-notes / blog。
- lm-studio-2024-04：2024-04 → 2024-08、confidence 0.25。資料種別：release-notes / press。
- lm-studio-2024-08：2024-08 → 2025-01、confidence 0.74。資料種別：release-notes / official-doc。
- lm-studio-2025-01：2025-01 → 2025-02、confidence 0.7。資料種別：release-notes。
- lm-studio-2025-02：2025-02 → 2025-06、confidence 0.75。資料種別：blog / release-notes。
- lm-studio-2025-06：2025-06 → 2025-10、confidence 0.84。資料種別：release-notes / blog。
- lm-studio-2025-10：2025-10 → 2026-02、confidence 0.38。資料種別：release-notes / blog / official-doc。
- lm-studio-2026-02：2026-02 → 2026-06、confidence 0.82。資料種別：blog / official-doc。
- lm-studio-lmlink-mobile-2026-06-04：2026-06 → 2026-11、confidence 0.37。資料種別：blog / official-doc。
- lm-studio-2026-11：2026-11 → 未定、confidence 0.77。資料種別：official-doc / changelog。

## 資料台帳

### 1. blog

URL: https://lmstudio.ai/blog/free-for-work

資料日付：2025-07-08。閲覧日：2026-11-15。

対象：lm-studio-2023-05、lm-studio-2023-11。

初回公開を2023年5月と回顧。初回ビルドの見た目は示さない。Element Labsの会社表記は公式ページのフッター。

### 2. release-notes

URL: https://lmstudio.ai/blog/lmstudio-v0.3.0

資料日付：2024-08-22。閲覧日：2026-11-15。

対象：lm-studio-2023-05、lm-studio-2023-11、lm-studio-2024-04、lm-studio-2024-08、lm-studio-2025-01。

旧版の暗いレトロな配色と一部Comic Sans使用を回顧。0.3.0の会話フォルダ、回答の左右切替、設定欄の刷新、文書添付、Dark/Light/Sepia/Systemを確認。色番号・主書体・固定幅は記載なし。本文の初回公開年は別の公式回顧と不一致。

### 3. press

URL: https://github.com/lahoramaker/awesome-lmstudio/wiki/Troubleshooting-most-common-problems

資料日付：2023-11-14。閲覧日：2026-11-15。

対象：lm-studio-2023-11、lm-studio-2024-04。

利用者自身の手順書。press区分の外部ウォークスルーで報道記事ではない。左の3番目が会話、右のSettings内にModel ConfigurationとHardware Setting、GPU Accelerationと読込し直し操作。0.2.8の自動設定に言及。5月版・4月版の同一配置までは証明しない。

### 4. official-doc

URL: https://lmstudio.ai/docs/app/user-interface/themes

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：lm-studio-2024-08、lm-studio-2025-10。

現行のテーマ選択は設定、またはCmd/Ctrl+Kの後T。Autoで明暗を切替。2026-11-15閲覧。過去版の色番号・当時の配置は証明しない。

### 5. release-notes

URL: https://lmstudio.ai/blog/lmstudio-v0.3.6

資料日付：2025-01-06。閲覧日：2026-11-15。

対象：lm-studio-2025-01、lm-studio-2025-06。

道具を呼ぶ機能は外部アプリ向けAPI。モデルの道具対応バッジ、会話とサーバー欄の改善、右上Quick Docsの別窓を確認。アプリ内MCPの公開資料ではない。

### 6. release-notes

URL: https://lmstudio.ai/blog/lmstudio-v0.3.8

資料日付：2025-01-21。閲覧日：2026-11-15。

対象：lm-studio-2025-01、lm-studio-2025-02。

DeepSeek R1の考えた過程を折り畳む表示が追加されたと明記。カタログの1月24日は発売日とは限らない。

### 7. release-notes

URL: https://lmstudio.ai/blog/lmstudio-v0.3.9

資料日付：2025-01-30。閲覧日：2026-11-15。

対象：lm-studio-2025-01。

考えた過程をAPIの別項目に分ける設定と、Runtimesの通知を確認。1月24日より後の版である。

### 8. blog

URL: https://lmstudio.ai/blog/lmstudio-v0.3.10

資料日付：2025-02-18。閲覧日：2026-11-15。

対象：lm-studio-2025-02、lm-studio-2025-06、lm-studio-2025-10。

設定の横欄にSpeculative Decodingと補助モデルの選択器を追加。採用された下書きの文字を緑で区別する任意表示。記事内動画は説明文だけを参照、フレーム未使用。

### 9. release-notes

URL: https://lmstudio.ai/blog/lmstudio-v0.3.17

資料日付：2025-06-25。閲覧日：2026-11-15。

対象：lm-studio-2025-06、lm-studio-2025-10。

右のProgram→Install→Edit mcp.jsonで道具の設定を編集。実行時は引数を編集できる確認窓と1回／常時許可。Solarized Dark、b7の思考表示プレビュー、b10の生成統計設定を確認。

### 10. release-notes

URL: https://lmstudio.ai/blog/lmstudio-v0.3.30

資料日付：2025-10-08。閲覧日：2026-11-15。

対象：lm-studio-2025-10。

0.3.30 b1はAPI・読込処理の修正。b2は10月18日の更新。10月12日に新しいチャット配置や下書き生成が初登場した根拠はない。

### 11. blog

URL: https://lmstudio.ai/blog/0.4.0

資料日付：2026-01-28。閲覧日：2026-11-15。

対象：lm-studio-2026-02、lm-studio-lmlink-mobile-2026-06-04。

Split Viewは会話右上の専用ボタンで新しい欄を追加。会話の…→Export、設定→Developerで詳細設定、Developerタブ内説明。新版はタブと画面分割を持つ。記事内動画は説明文のみ。

### 12. official-doc

URL: https://lmstudio.ai/docs/app/basics/chat

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：lm-studio-2026-02、lm-studio-lmlink-mobile-2026-06-04。

現行ヘルプで＋による新規会話、入れ子のフォルダ、会話タブを左右へドラッグして画面分割、欄右上の×を確認。2026-11-15閲覧。0.3期への遡及はしない。

### 13. blog

URL: https://lmstudio.ai/blog/locally-lm-link

資料日付：2026-06-04。閲覧日：2026-11-15。

対象：lm-studio-lmlink-mobile-2026-06-04。

iPhone/iPadのLocallyがLM Studioのモバイルアプリとして紹介され、LM Linkで別の端末のモデルを使える。暗号化と端末内履歴を説明。本文だけでは操作の左右位置・吹き出し・配色は判定できない。

### 14. official-doc

URL: https://lmstudio.ai/docs/bionic

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：lm-studio-2026-11。

2026-11-15の公式ヘルプ。BionicはLM Studioとは別アプリと明記。ローカル・クラウド・LM Linkのモデルを使い、プロジェクト内の作業会話を管理する。

### 15. official-doc

URL: https://lmstudio.ai/docs/bionic/projects-and-sessions

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：lm-studio-2026-11。

会話、プロジェクトファイル、内蔵ブラウザをタブで開く。タブを左右へドラッグして並べ、Forkで分岐し、裏で完了した会話に印が付く。2026-11-15閲覧。

### 16. official-doc

URL: https://lmstudio.ai/docs/bionic/quick-start

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：lm-studio-2026-11。

作成画面のAllow coding、フォルダ選択、Create、Root modelを確認。右欄のProject Filesは全会話で共有。2026-11-15閲覧。

### 17. changelog

URL: https://lmstudio.ai/changelog/bionic-v1.1.10

資料日付：2026-10-29。閲覧日：2026-11-15。

対象：lm-studio-2026-11。

1.1.10の公開日は10月29日。アプリ内端末、コードの変更表示、会話内ファイルプレビュー、Read Aloud操作を確認。

## 既存調査・描画への訂正

- 初期の主書体・色番号を断定できない。0.3.0記事のComic Sansは『一部使用』で、全UIの主書体とする根拠ではない。https://lmstudio.ai/blog/lmstudio-v0.3.0
- 最初の公開は公式回顧で2023年5月。0.3.0記事内のMay 2024とは矛盾するため、初版ビルドの配置を同記事だけから確定しない。https://lmstudio.ai/blog/free-for-work
- web/js/tools/lmstudio.jsが各版に描くGPU使用量・速度・固定のモデル名は、その版の画面値としてunverified。0.3.0のモデル設定は自動／手動で変わる。https://lmstudio.ai/blog/lmstudio-v0.3.0
- 1月の道具対応APIと6月のアプリ内MCPは分ける。思考の折り畳み表示は1月21日の0.3.8に明記。https://lmstudio.ai/blog/lmstudio-v0.3.6 https://lmstudio.ai/blog/lmstudio-v0.3.8 https://lmstudio.ai/blog/lmstudio-v0.3.17
- 0.3.30は10月8日。下書き生成の選択器・色分けは0.3.10で2月18日に公開済み。追加版lm-studio-2025-02に分離した。https://lmstudio.ai/blog/lmstudio-v0.3.30 https://lmstudio.ai/blog/lmstudio-v0.3.10
- 0.4.0の記事は /blog/0.4.0、公開日は2026年1月28日。既存IDの2026-02は図鑑の記録月として残す。https://lmstudio.ai/blog/0.4.0
- Locally + LM LinkはiPhone/iPadの画面。デスクトップの3分割画面をそのまま流用する根拠はない。https://lmstudio.ai/blog/locally-lm-link
- BionicはLM Studioとは別アプリ。既存2026-11 IDの記録はBionicの説明として残すが、主分類desktop-chatはLM Studio全体の分類である。1.1.10は10月29日公開。https://lmstudio.ai/docs/bionic https://lmstudio.ai/changelog/bionic-v1.1.10

## 未確認・確認できなかった資料

- 2023-05の初回ビルドの配置・寸法、2024-04の0.2.20固有の配置はunverified。2023年11月の手順書を5月や翌4月へ遡及しない。
- 2023-11版のカタログ上の11月18日は発売日として未確認。0.2.8への言及は11月14日付の手順書に既にある。上記手順書URL参照。
- モバイル版の吹き出し、操作の位置、歓迎画面はunverified。公式告知本文では確認できない。
- 全版の発言の正確な余白・行間・画面幅、Bionicの正確な色・書体はunverified。サイトのCSSをアプリのCSSとして採用しない。
- https://lmstudio.ai/blog/lmstudio-v0.4.0 — 2026-11-15取得失敗。検索で正しい記事 /blog/0.4.0 を特定した。
- https://mcomputers.cz/wp-content/uploads/2024/10/10_Vaclav-Kyba-Miroslav-Janata_Prakticke-zkusenosti-s-LLM-v-prostredi-Microsoftu.pdf — 2024年10月の利用者発表資料。2026-11-15に本文抽出とPDF表示要求。画像内の配置を十分に目視検証できなかったため0.2.20の見た目の根拠には採用していない。
- Internet Archiveの実アプリ履歴画面、公式動画の独立した説明文、初期アプリの固定色ファイルは確保できていない。

