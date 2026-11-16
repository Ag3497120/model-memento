# Ollama：見た目の根拠

調査日：2026-11-15。対象ファイルだけを作成。アプリの起動・導入・画面撮影は行っていない。公開ページの本文と公開コードを読み、図版・動画のフレーム・ロゴ・フォント・実装コードは保存していない。

入力：web/data/catalog.jsonの全6版とweb/js/tools/ollama.jsを読んだ。.work/design-out/ollama.jsonは存在しなかった。端末とメニューバーから2025年の公式チャットへ変化するため、各版のregionsを優先する。端末は背景・書体が利用者設定に依存する。公式ブログ、固定した公開コード、第三者の利用記録を照合。正確な色は全版nullとした。

## 読み方

- from/to は図鑑内の月単位の区切り。to は次の記録への切替月（排他的）で、旧版の利用終了を意味しない。既存IDを維持し、元の日付の誤りは下記で区別する。
- null は未確認。見た目の測定値を資料のないまま補わない。confidence は見た目全体の裏付けの厚さで、機能一覧の正しさだけを表さない。
- sources.shows は、そのURLが裏付ける範囲と限界を示す。日付のない現行資料は2026-11-15の閲覧資料であり、過去版の同じ配置を証明しない。
- 原画面の短い操作名は出典を識別するために記し、描き直す画面の説明は日本語にする。free_fallback は本アプリ側の代替書体の提案で、製品がその書体だったという主張ではない。
- 公開コードを読めたことと、その版のサービス上で同じ設定が使われたことは別。条件付き表示は有効な場合だけ描く。

## 版の範囲と確かさ

- ollama-2023-07：2023-07 → 2024-02、confidence 0.86。資料種別：oss-source / blog。
- ollama-2024-02：2024-02 → 2024-09、confidence 0.84。資料種別：oss-source / blog。
- ollama-2024-09-macos：2024-09 → 2025-07、confidence 0.83。資料種別：oss-source / blog。
- ollama-2025-07-macos：2025-07 → 2026-03、confidence 0.6。資料種別：blog / press。
- ollama-2026-03-macos：2026-03 → 2026-11、confidence 0.88。資料種別：oss-source / blog。
- ollama-2026-11-macos：2026-11 → 未定、confidence 0.51。資料種別：oss-source / blog。

## 資料台帳

### 1. oss-source

URL: https://github.com/ollama/ollama/blob/e7a393de5405e7c12e4ca59493cb4c6037fe3b57/cmd/cmd.go

資料日付：2023-07-20。閲覧日：2026-11-15。

対象：ollama-2023-07。

固定コミットの対話入力は>>>。入力待ちや入手時に回転表示、回答の断片を受け取るたび端末へ追記し、最後に改行。端末の背景色・文字色・書体はここでは決めない。

### 2. blog

URL: https://ollama.com/blog/run-llama2-uncensored-locally

資料日付：2023-08-01。閲覧日：2026-11-15。

対象：ollama-2023-07。

当時の公式利用例はollama runによるローカル実行。7月20日そのものの画面を示す資料ではない。

### 3. oss-source

URL: https://github.com/ollama/ollama/blob/v0.1.24/cmd/interactive.go

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：ollama-2024-02。

v0.1.24の入力記号>>>、複数行...、入力案内とヘルプ操作。APIのカード型管理画面はこの対話画面にない。タグの公開日はここから確定していない。

### 4. blog

URL: https://ollama.com/blog/openai-compatibility

資料日付：2024-02-08。閲覧日：2026-11-15。

対象：ollama-2024-02。

外部アプリ向けの互換APIを紹介。記事のWeb画面は利用例の別アプリで、Ollama本体の分割画面ではない。

### 5. oss-source

URL: https://github.com/ollama/ollama/blob/v0.3.12/macapp/src/index.ts

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：ollama-2024-09-macos。

macOSのメニューバー操作はQuit Ollama、更新時だけ通知とRestart to updateを追加。これはmacappのコードで、Windows用Go実装と区別。メニューバーから会話をする画面やGPU計器は確認できない。

### 6. blog

URL: https://ollama.com/blog/llama3.2

資料日付：2024-09-25。閲覧日：2026-11-15。

対象：ollama-2024-09-macos。

Llama 3.2の1B/3Bを端末で使う案内。11B/90B画像対応版はComing very soonという状態で、9月25日の対応済みモデルではない。

### 7. blog

URL: https://ollama.com/blog/llama3.2-vision

資料日付：2024-11-06。閲覧日：2026-11-15。

対象：ollama-2024-09-macos。

画像対応の11B/90Bは11月6日にOllama 0.4向けに公開。画像を端末へ落とすかパスを入力する手順。

### 8. blog

URL: https://ollama.com/blog/new-app

資料日付：2025-07-30。閲覧日：2026-11-15。

対象：ollama-2024-09-macos、ollama-2025-07-macos、ollama-2026-03-macos。

macOSとWindowsに公式チャットを追加。アプリでモデルを入手し、テキスト・PDF・コードを落として添付し、対応モデルへ画像を送る。設定で会話に渡す量を調整。図版・動画フレームは未使用で、本文では左右位置や色番号までは不明。

### 9. press

URL: https://www.windowscentral.com/artificial-intelligence/ollamas-new-app-makes-using-local-ai-llms-on-your-windows-11-pc-a-breeze-no-more-need-to-chat-in-the-terminal

資料日付：2025-08-05。閲覧日：2026-11-15。

対象：ollama-2025-07-macos。

利用者による起動・モデル選択・文書添付の紹介。Windows版の説明で、macOS版の厳密な配置や配色の根拠には使わない。

### 10. blog

URL: https://ollama.com/blog/gpt-oss?pubDate=20250824

資料日付：2025-08-05。閲覧日：2026-11-15。

対象：ollama-2025-07-macos。

gpt-ossの公開は8月5日。7月30日の公式チャット初公開時点のモデルとしては扱わない。

### 11. oss-source

URL: https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/ChatForm.tsx

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：ollama-2026-03-macos。

v0.16.0の入力欄は中央寄せで最大768px、rounded-3xl、上側に添付チップ、案内Send a message。モデル選択・思考・Web検索は対応状態により表示。タグの日付と3月12日の一致は未確認。

### 12. oss-source

URL: https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/Chat.tsx

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：ollama-2026-03-macos。

スクロールする会話と下部に固定する入力部。モデルを跨いだ会話、ログイン不足の表示などの条件分岐を確認。常設の右側VRAM計器は確認できない。

### 13. oss-source

URL: https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/Message.tsx

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：ollama-2026-03-macos。

ユーザーは右寄せの丸い枠、回答はMarkdown本文。添付チップ、道具名・実行状態・開閉できる引数／結果、回答のコピー操作を確認。

### 14. oss-source

URL: https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/Thinking.tsx

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：ollama-2026-03-macos。

考え中と所要時間付きの見出し、開閉する過程、生成中の高さ調整と自動スクロール。

### 15. oss-source

URL: https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/ModelPicker.tsx

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：ollama-2026-03-macos、ollama-2026-11-macos。

入力欄のモデルボタンから上に開く検索付き一覧。幅w-64、クラウドモデルに印。ローカル／クラウドはモデルの属性で、M5とTurboを並べた常設切替板ではない。

### 16. oss-source

URL: https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/ChatSidebar.tsx

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：ollama-2026-03-macos。

左の会話一覧にNew ChatとSettings、時期ごとの履歴、名前の編集。Vision Attachments・MCP Tools・ollama psの常設タブはこの部品にない。

### 17. oss-source

URL: https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/index.css

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：ollama-2026-03-macos、ollama-2026-11-macos。

本文はui-sans-serif/system-ui/Segoe UI。丸い表示用スタックにSF Pro Roundedの名前もある。--bg-color:#1a1a1aはサンプル変数で使用箇所を追えておらず、実効背景色として採用しない。

### 18. blog

URL: https://ollama.com/blog/thinking

資料日付：2025-05-30。閲覧日：2026-11-15。

対象：ollama-2026-03-macos。

考えた過程の有効／無効切替と、過程を回答から分ける出力。記事の手順は端末とAPI。動画は添えられた説明文だけを読み、フレームは使わない。2026年3月の専用GUI初公開の根拠ではない。

### 19. oss-source

URL: https://github.com/ollama/ollama/blob/main/app/ui/app/src/components/AppSidebar.tsx

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：ollama-2026-11-macos。

2026-11-15閲覧時の可変main。Apps、Chat、Settingsの機能入口を確認。11月8日の固定版や1.2という版番号を証明しない。

### 20. oss-source

URL: https://github.com/ollama/ollama/blob/main/app/ui/app/src/components/Chat.tsx

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：ollama-2026-11-macos。

2026-11-15閲覧時の可変main。会話欄と下部入力、モデルとログインに応じた表示。過去のv0.16.0から全意匠が同じという意味ではない。

### 21. blog

URL: https://ollama.com/blog/cloud-models

資料日付：2025-09-19。閲覧日：2026-11-15。

対象：ollama-2026-11-macos。

クラウド対応の公開。ローカルと同じモデル操作で利用し、モデル名の-cloudで区別。特定のGPU別切替板や速度表の配置は示さない。

## 既存調査・描画への訂正

- 初期3版の主たる対話面は端末。rootのdesktop-chatは後年の公式アプリを表す分類であり、初期版へチャットウィンドウを追加する根拠ではない。https://github.com/ollama/ollama/blob/e7a393de5405e7c12e4ca59493cb4c6037fe3b57/cmd/cmd.go https://ollama.com/blog/new-app
- web/js/tools/ollama.jsの2023-07に描く動物・ASCII飾り・状態バーは初期cmd.goに裏付けがない。特にロゴやマスコットの描き直しはしない。https://github.com/ollama/ollama/blob/e7a393de5405e7c12e4ca59493cb4c6037fe3b57/cmd/cmd.go
- 2024-02のModelfileカードとAPIカードを並べる固定の管理画面は確認できない。APIの記事は外部Webアプリの作成例。https://ollama.com/blog/openai-compatibility
- 2024-09のmacOSメニューは終了と条件付き更新操作。rendererの会話ポップアップ、Vision Ready、GPU使用量計器は根拠なし。Llama 3.2 Visionは11月6日公開で9月25日へ遡及できない。https://github.com/ollama/ollama/blob/v0.3.12/macapp/src/index.ts https://ollama.com/blog/llama3.2 https://ollama.com/blog/llama3.2-vision
- 7月30日の公式アプリのモデル例はGemma 3。gpt-ossは8月5日の発表なので初公開日の常設モデル名にはできない。https://ollama.com/blog/new-app https://ollama.com/blog/gpt-oss?pubDate=20250824
- 2026-03のVision Attachments・MCP Tools・ollama psタブと右側のVRAM計器は、確認した公式ChatSidebarとChatの配置にはない。思考機能の公式発表は2025年5月で、2026年3月のGUI初登場日を証明しない。https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/ChatSidebar.tsx https://github.com/ollama/ollama/blob/v0.16.0/app/ui/app/src/components/Chat.tsx https://ollama.com/blog/thinking
- 2026-11の1.2という版番号、Local Metal M5とTurboの大型切替板、138/310 tok/s等の固定値はunverified。クラウドモデルの存在だけからその画面を発明しない。https://ollama.com/blog/cloud-models https://github.com/ollama/ollama/blob/main/app/ui/app/src/components/AppSidebar.tsx

## 未確認・確認できなかった資料

- 2025年7月30日のmacOS版の実効CSS、サイドバー幅、発言の枠、初回歓迎文はunverified。Windows向けの利用記事からmacOSの値を借りない。
- 2026年3月12日とv0.16.0タグの発売日の一致はunverified。公開コードはそのタグで確認できる画面として記録し、3月12日に初めて追加されたとは主張しない。
- 2026年11月8日の固定コミットは未特定。mainの観察は2026-11-15現在の参考で、当日の配色・細部を保証しない。
- https://github.com/ollama/ollama/blob/v0.10.0/app/ui/src/index.css — 2026-11-15に404。初公開時のCSSをこの場所からは取得できなかった。
- https://github.com/ollama/ollama/blob/v0.10.0/app/README.md — 2026-11-15閲覧。ビルド方法中心で、7月のチャットの見た目を確定できないため仕様の根拠にはしない。
- https://github.com/ollama/ollama/blob/v0.3.12/app/ollama/tray.go — 2026-11-15に404。正しくはmacapp/src/index.tsを使用。Go版のtrayコードをmacOSのメニューとして扱わない。
- https://ollama.com/blog/cloud — 2026-11-15に404。正しい公開記事cloud-modelsを検索して確認。
- Internet Archiveのアプリ内画面や独立した公式動画の説明文は確保できていない。

