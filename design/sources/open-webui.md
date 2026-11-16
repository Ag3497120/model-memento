# Open WebUI：見た目の根拠

調査日：2026-11-15。対象ファイルだけを作成。アプリの起動・導入・画面撮影は行っていない。公開ページの本文と公開コードを読み、図版・動画のフレーム・ロゴ・フォント・実装コードは保存していない。

入力：web/data/catalog.jsonの全8版とweb/js/tools/openwebui.jsを読んだ。.work/design-out/open-webui.jsonは存在しなかった。初期固定コミット、版タグのSvelte部品・色票・更新履歴、公式ヘルプを照合し、入力刷新の2025-09版を追加した。18remなどはコードの単位を保ち、ピクセル換算しない。旧版のパレットは標準テーマで変数上書きのない場合。0.11以降のOKLCHを未検算のhexへ変換していない。

## 読み方

- from/to は図鑑内の月単位の区切り。to は次の記録への切替月（排他的）で、旧版の利用終了を意味しない。既存IDを維持し、元の日付の誤りは下記で区別する。
- null は未確認。見た目の測定値を資料のないまま補わない。confidence は見た目全体の裏付けの厚さで、機能一覧の正しさだけを表さない。
- sources.shows は、そのURLが裏付ける範囲と限界を示す。日付のない現行資料は2026-11-15の閲覧資料であり、過去版の同じ配置を証明しない。
- 原画面の短い操作名は出典を識別するために記し、描き直す画面の説明は日本語にする。free_fallback は本アプリ側の代替書体の提案で、製品がその書体だったという主張ではない。
- 公開コードを読めたことと、その版のサービス上で同じ設定が使われたことは別。条件付き表示は有効な場合だけ描く。

## 版の範囲と確かさ

- open-webui-2023-10：2023-10 → 2024-02、confidence 0.9。資料種別：oss-source / changelog。
- open-webui-2024-02：2024-02 → 2024-09、confidence 0.82。資料種別：oss-source / changelog。
- open-webui-2024-09：2024-09 → 2025-04、confidence 0.86。資料種別：changelog / oss-source。
- open-webui-2025-04：2025-04 → 2025-09、confidence 0.83。資料種別：release-notes / oss-source。
- open-webui-2025-09：2025-09 → 2025-11、confidence 0.81。資料種別：release-notes / changelog / oss-source。
- open-webui-2025-11：2025-11 → 2026-07、confidence 0.7。資料種別：changelog / oss-source / official-doc。
- open-webui-2026-07：2026-07 → 2026-10、confidence 0.88。資料種別：release-notes / oss-source / official-doc。
- open-webui-2026-10：2026-10 → 2026-11、confidence 0.78。資料種別：release-notes / oss-source / official-doc / changelog。
- open-webui-2026-11：2026-11 → 未定、confidence 0.88。資料種別：release-notes / oss-source / official-doc。

## 資料台帳

### 1. oss-source

URL: https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/src/routes/+page.svelte

資料日付：2023-10-08。閲覧日：2026-11-15。

対象：open-webui-2023-10。

初期の固定コード。上部のModel選択、中央の空状態、下固定の入力、利用者と回答で異なる横帯。会話開始後はモデル選択を無効化する。画面の外側bg-gray-800、回答帯bg-gray-700、入力bg-gray-700、送信bg-emerald-600。

### 2. oss-source

URL: https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/src/lib/components/layout/Navbar.svelte

資料日付：2023-10-08。閲覧日：2026-11-15。

対象：open-webui-2023-10。

初期左ナビは開閉式でw-72。New Chatと仮の履歴行。bg-gray-900。動的な保存履歴機能の完成を、この仮の行からは推定しない。

### 3. oss-source

URL: https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/tailwind.config.js

資料日付：2023-10-08。閲覧日：2026-11-15。

対象：open-webui-2023-10。

初期のgray色票：800=#343541、700=#40414f、900=#202123、100=#ececf1、500=#8e8ea0、600=#565869。後年のgrayとは値が違う。

### 4. oss-source

URL: https://raw.githubusercontent.com/tailwindlabs/tailwindcss/v3.3.1/src/public/colors.js

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：open-webui-2023-10。

Tailwind 3の標準色の定義。初期送信ボタンemerald-600=#059669の補助資料。製品固有のgray上書きを優先する。

### 5. changelog

URL: https://github.com/open-webui/open-webui/commit/88eab8e8df5b1c8416e815aba51155aa6366b739

資料日付：2024-02-17。閲覧日：2026-11-15。

対象：open-webui-2023-10、open-webui-2024-02。

公式リポジトリのrename取り込み記録。Ollama WebUIからOpen WebUIへの名称変更の時期を確認。初期の全機能がこの時点で完成していたという資料ではない。

### 6. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.1.102/src/lib/components/layout/Sidebar.svelte

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：open-webui-2024-02。

2月期の固定タグ。左260px、黒の履歴欄、New Chat、検索、管理者向けModelfiles、下部アカウント／設定。初期w-72とは異なる。タグの公開日を本文から確定していない。

### 7. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.1.102/tailwind.config.js

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：open-webui-2024-02。

grayは900=#171717、850=#262626、800=#333、200=#e3e3e3へ変更済み。初期の青みがあるgrayをこのタグへ使わない。

### 8. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.1.102/src/lib/components/chat/MessageInput.svelte

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：open-webui-2024-02。

底の入力欄は白／dark:bg-gray-900と枠線、rounded-xl。ファイルの添付チップと送信／停止操作。

### 9. changelog

URL: https://github.com/open-webui/open-webui/blob/v0.3.21/CHANGELOG.md

資料日付：2024-09-08。閲覧日：2026-11-15。

対象：open-webui-2024-09。

0.3.21の記録日は9月8日。Workspace期までの更新履歴と初期0.1系の日付を確認。9月15日に別の配置が登場したとは断定しない。

### 10. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.3.21/src/lib/components/layout/Sidebar.svelte

資料日付：2024-09-08。閲覧日：2026-11-15。

対象：open-webui-2024-09。

左260px、履歴検索・ピン留め、下部の利用者操作。Workspaceは管理者条件付き。背景はlight gray-50、dark gray-950、文字gray-900/gray-200、補助文字gray-600/gray-400。

### 11. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.3.21/tailwind.config.js

資料日付：2024-09-08。閲覧日：2026-11-15。

対象：open-webui-2024-09。

gray-50=#f9f9f9、900=#171717、950=#0d0d0d、850=#262626、200=#e3e3e3、600=#676767、400=#b4b4b4。CSS変数の上書きがない標準テーマ値。

### 12. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.3.21/src/lib/components/chat/Messages/UserMessage.svelte

資料日付：2024-09-08。閲覧日：2026-11-15。

対象：open-webui-2024-09。

chatBubbleの標準はtrue。利用者は右寄せで最大90%、rounded-3xl、gray-50/dark gray-850。設定で通常の行表示へ戻せる。

### 13. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.3.21/src/lib/components/chat/MessageInput.svelte

資料日付：2024-09-08。閲覧日：2026-11-15。

対象：open-webui-2024-09。

下部入力はgray-50/dark gray-850、添付、道具や検索の選択、録音、通話、送信。複数モデルの選択時の分岐もある。

### 14. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.3.21/src/app.css

資料日付：2024-09-08。閲覧日：2026-11-15。

対象：open-webui-2024-09。

Inter・Archivo・Mona Sansを宣言。font-primaryを付けたナビ等はArchivo。宣言があるだけの書体を全画面の主書体とは扱わない。

### 15. release-notes

URL: https://github.com/open-webui/open-webui/releases/tag/v0.6.0

資料日付：2025-04-01。閲覧日：2026-11-15。

対象：open-webui-2025-04。

本文見出しの日付は2025-03-31、GitHub公開表示は4月1日。OpenAPI道具サーバー、MCPO経由MCP、道具表示の整理、検索クリア操作を確認。これは全画面アーティファクト初公開の証明ではない。

### 16. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.6.0/src/lib/components/layout/Sidebar.svelte

資料日付：2025-04-01。閲覧日：2026-11-15。

対象：open-webui-2025-04。

左履歴欄にNew Chat、条件付きHome/Workspace、検索、フォルダ、下部アカウント操作。全ユーザーに同じ項目が出るとは限らない。

### 17. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.6.0/src/lib/components/chat/Messages/UserMessage.svelte

資料日付：2025-04-01。閲覧日：2026-11-15。

対象：open-webui-2025-04。

利用者は標準で右寄せのgray-50/dark gray-850の丸い枠、最大90%。編集・再送・回答分岐などを条件表示。

### 18. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.6.0/tailwind.config.js

資料日付：2025-04-01。閲覧日：2026-11-15。

対象：open-webui-2025-04。

gray色票は50=#f9f9f9、850=#262626、900=#171717、950=#0d0d0dなど。CSS変数で変えられるため標準テーマ値としてだけ記録。

### 19. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.6.0/src/tailwind.css

資料日付：2025-04-01。閲覧日：2026-11-15。

対象：open-webui-2025-04。

html/preの基礎書体はOSのsystem、Inter等の順。サイトの宣伝ページの書体とは区別。

### 20. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.6.0/src/lib/components/chat/Placeholder.svelte

資料日付：2025-04-01。閲覧日：2026-11-15。

対象：open-webui-2025-04。

未送信画面は選択モデル、モデル説明、中央の入力欄と提案群。入力の短い歓迎案内。Temporary Chatや複数モデルの表示は状態による。

### 21. release-notes

URL: https://github.com/open-webui/open-webui/releases/tag/v0.6.29

資料日付：2025-09-17。閲覧日：2026-11-15。

対象：open-webui-2025-09。

入力のメニューを刷新し、添付を＋へ統合、連携を選択メニューへ整理。会話・ノート・知識の選択器を追加。

### 22. changelog

URL: https://github.com/open-webui/open-webui/blob/v0.6.29/CHANGELOG.md

資料日付：2025-09-17。閲覧日：2026-11-15。

対象：open-webui-2025-09、open-webui-2025-11、open-webui-2026-10。

0.6.29の入力刷新を確認。遡ると0.6.19（8月9日）に左ナビ刷新、0.6.16（7月14日）に共同編集ノート追加。カタログの2026年10月初登場説を訂正。

### 23. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.6.35/src/lib/components/chat/MessageInput.svelte

資料日付：2025-11-06。閲覧日：2026-11-15。

対象：open-webui-2025-09、open-webui-2025-11。

添付と連携を持つ入力部、条件付きの検索・画像・コード操作、丸い送信／停止操作。通常のチャットで使われる。

### 24. changelog

URL: https://github.com/open-webui/open-webui/blob/v0.6.35/CHANGELOG.md

資料日付：2025-11-06。閲覧日：2026-11-15。

対象：open-webui-2025-11。

11月期タグでモデル操作メニューの整理、アーティファクトがない場合のボタン非表示を確認。全会話がArena専用画面になるという内容ではない。

### 25. official-doc

URL: https://docs.openwebui.com/features/chat-conversations/chat-features/multi-model-chats/

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：open-webui-2025-11。

2026-11-15の現行ヘルプ。比較はモデル選択器のCompare、回答は横並び／狭い画面では縦並び。Merge Responsesは回答後の操作。現行の操作名・位置を2025年11月へそのまま遡及しない。

### 26. release-notes

URL: https://github.com/open-webui/open-webui/releases/tag/v0.11.0

資料日付：2026-07-27。閲覧日：2026-11-15。

対象：open-webui-2026-07。

全体刷新：会話の列を狭め、文字を軽くし、間隔・メニュー・入力枠・設定を整理。フォルダ専用ページと任意の補助エージェントを追加。常設の右補助エージェント監視欄や会話上の利用量計器の根拠ではない。

### 27. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.11.0/src/lib/components/layout/Sidebar.svelte

資料日付：2026-07-27。閲覧日：2026-11-15。

対象：open-webui-2026-07。

左欄は220〜480pxで幅変更、折畳み時42pxの縦操作列。検索、フォルダ、Notes、Workspace等を条件付き表示。固定260pxとしない。

### 28. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.11.0/src/tailwind.css

資料日付：2026-07-27。閲覧日：2026-11-15。

対象：open-webui-2026-07。

grayはOKLCHで指定する新色票。旧hex値を流用しない。数値変換は未実施なのでpaletteの該当値をnullとする。

### 29. official-doc

URL: https://docs.openwebui.com/features/chat-conversations/chat-features/

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：open-webui-2026-07、open-webui-2026-11。

現行ヘルプの会話・検索・履歴・生成中スクロール。公開されたヘルプであり利用者のログイン済み実画面を操作した観察ではない。2026-11-15閲覧。

### 30. release-notes

URL: https://github.com/open-webui/open-webui/releases/tag/v0.12.0

資料日付：2026-10-10。閲覧日：2026-11-15。

対象：open-webui-2026-10。

Realtime通話、任意の3Dアバター、モデル編集の刷新、ノートや権限まわりの修正。生成末尾のカーソルの点滅も変更。任意の通話アバターは描き直し対象外。

### 31. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.12.0/src/lib/components/chat/MessageInput.svelte

資料日付：2026-10-10。閲覧日：2026-11-15。

対象：open-webui-2026-10。

入力部は枠線とrounded-3xl。仮の会話では破線、利用できる道具・検索等を条件付きで表示。ノート等の添付選択器を含む。

### 32. official-doc

URL: https://docs.openwebui.com/features/notes/

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：open-webui-2026-10。

現行ヘルプは会話と独立した文書編集ページ、選択箇所の編集、ノート内のChat横欄を説明。通常チャットの右に常にノートが出るとは記載しない。2026-11-15閲覧。

### 33. release-notes

URL: https://github.com/open-webui/open-webui/releases/tag/v0.13.0

資料日付：2026-11-03。閲覧日：2026-11-15。

対象：open-webui-2026-11。

会話上部のTabsから、ファイル、複数端末、プレビュー、音声、コメント等の作業タブを開く。＋で追加、並べ替え、全幅／横並び切替。Desktop/Browserは対応Open Terminal接続が必要。

### 34. oss-source

URL: https://github.com/open-webui/open-webui/blob/v0.13.0/src/lib/components/chat/Navbar.svelte

資料日付：2026-11-03。閲覧日：2026-11-15。

対象：open-webui-2026-11。

上部TabsボタンがshowTabsを切り替える。専用端末を接続する前から架空のデスクトップ状態やGit状態を表示する根拠はない。

## 既存調査・描画への訂正

- 2023-10の元コードは青みがある旧gray色票。後年の#171717等の無彩色をそのまま使わない。左欄は18remで、後の260pxとも異なる。https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/tailwind.config.js https://github.com/open-webui/open-webui/blob/c4413a7afaa8ee6e05193fb63de69e149cb1885e/src/lib/components/layout/Navbar.svelte
- 名称変更は2024年2月17日の公式取り込み記録で確認。初期Ollama WebUIを公式Ollamaアプリとして描かない。https://github.com/open-webui/open-webui/commit/88eab8e8df5b1c8416e815aba51155aa6366b739
- web/js/tools/openwebui.jsの2024-09はWorkspaceのタブを会話上部へ常設しているが、確認した版ではWorkspaceは別の入口で、管理者条件付き。https://github.com/open-webui/open-webui/blob/v0.3.21/src/lib/components/layout/Sidebar.svelte
- 0.6.0のMCPはMCPOでOpenAPIへ変換する方式。すべての会話を最初から生成物の2分割画面として描く根拠はない。https://github.com/open-webui/open-webui/releases/tag/v0.6.0
- 見た目の変化として2025-09版を追加。入力の添付が＋へまとまり、連携と資料選択を整理した。https://github.com/open-webui/open-webui/releases/tag/v0.6.29
- 2025-11の通常画面にParallel Chat/Arena Leaderboard/Pipelinesの固定タブを並べる根拠は確認できない。比較は複数モデル選択時の状態である。現行ヘルプのCompare操作の位置も当時へ遡及しない。https://github.com/open-webui/open-webui/blob/v0.6.35/src/lib/components/chat/MessageInput.svelte https://docs.openwebui.com/features/chat-conversations/chat-features/multi-model-chats/
- 0.11の刷新は幅・文字・間隔・メニューの変更。rendererの利用量計器や固定の補助エージェント監視欄はunverified。左欄は幅変更できる。https://github.com/open-webui/open-webui/releases/tag/v0.11.0 https://github.com/open-webui/open-webui/blob/v0.11.0/src/lib/components/layout/Sidebar.svelte
- 共同編集ノートは0.6.16の2025年7月14日に既に記録があり、2026年10月の初登場ではない。通常会話にノートや金額の表が常設される根拠もない。https://github.com/open-webui/open-webui/blob/v0.6.29/CHANGELOG.md https://docs.openwebui.com/features/notes/
- 0.13はTabsから開く作業欄。デスクトップやブラウザは対応するOpen Terminal接続が必要。rendererのWayland :5900、Git main clean等を標準の固定状態として描かない。https://github.com/open-webui/open-webui/releases/tag/v0.13.0

## 未確認・確認できなかった資料

- 初期の左メニューの履歴は仮の表示行を含む。保存・検索の機能まで完成していたという主張はしていない。
- 日付付きコードは版の資料で、カタログの9月15日・11月15日当日の配信状態を厳密に証明しない。0.3.21は9月8日、0.6.35は11月6日の代表タグとして採用。
- 旧版で未取得の回答本文の書体、画面全体の実効背景、初回挨拶の完全な文言、全版の角丸の正確なpx値はunverified。
- 2026-10の金額・文字数の常設表、2026-07の利用量計器・固定の補助エージェント一覧はunverified。機能の存在から常設配置を推測しない。
- https://github.com/open-webui/open-webui/blob/v0.1.1/README.md と https://github.com/open-webui/open-webui/blob/v0.1.100/CHANGELOG.md — 2026-11-15に該当タグなし。初期は固定コミット、2月期は存在を確認したv0.1.102へ切替。
- https://web-zone.io/blog — 検索で2024-01-19の利用記事の索引を確認。https://web-zone.io/blog/ollama-webui-easy-guide-to-running-local-llms/ は取得失敗。当日の画面の根拠には採用しない。
- https://docs.openwebui.com/features/chat-conversations/multi-model-chats/ — 取得失敗。実際のヘルプのリンクを辿り /chat-features/multi-model-chats/ を取得。
- Internet Archiveでログイン後の版別画面は確保できず、独立した公式動画の説明も未取得。公式の部品と更新履歴を主根拠とした。

