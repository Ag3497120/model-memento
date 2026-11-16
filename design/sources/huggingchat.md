# HuggingChat：見た目の根拠

調査日：2026-11-15。対象ファイルだけを作成。アプリの起動・導入・画面撮影は行っていない。公開ページの本文と公開コードを読み、図版・動画のフレーム・ロゴ・フォント・実装コードは保存していない。

入力：web/data/catalog.jsonの全8版、.work/design-out/huggingchat.json、web/js/tools/huggingchat.jsを読んだ。公開コードは各時期のコミットを特定して固定した。公式告知・公式ヘルプ・公式ブログと同時期の報道も確認。公開ページのログアウト状態と、コードで条件付きの会話画面を区別する。palette.panelは2026-11だけ右の作業欄の背景。回答のグラデーションは単色へ潰さない。user_bubbleは通常時に塗りがないためnullで、背景色を吹き出し色として記入しない。

## 読み方

- from/to は図鑑内の月単位の区切り。to は次の記録への切替月（排他的）で、旧版の利用終了を意味しない。既存IDを維持し、元の日付の誤りは下記で区別する。
- null は未確認。見た目の測定値を資料のないまま補わない。confidence は見た目全体の裏付けの厚さで、機能一覧の正しさだけを表さない。
- sources.shows は、そのURLが裏付ける範囲と限界を示す。日付のない現行資料は2026-11-15の閲覧資料であり、過去版の同じ配置を証明しない。
- 原画面の短い操作名は出典を識別するために記し、描き直す画面の説明は日本語にする。free_fallback は本アプリ側の代替書体の提案で、製品がその書体だったという主張ではない。
- 公開コードを読めたことと、その版のサービス上で同じ設定が使われたことは別。条件付き表示は有効な場合だけ描く。

## 版の範囲と確かさ

- huggingchat-2023-04：2023-04 → 2023-08、confidence 0.93。資料種別：oss-source / press。
- huggingchat-2023-08：2023-08 → 2024-02、confidence 0.84。資料種別：oss-source / blog。
- huggingchat-2024-02：2024-02 → 2024-09、confidence 0.87。資料種別：release-notes / oss-source。
- huggingchat-2024-09：2024-09 → 2025-07、confidence 0.85。資料種別：blog / oss-source。
- huggingchat-2025-07：2025-07 → 2025-10、confidence 0.35。資料種別：release-notes。
- huggingchat-2025-10：2025-10 → 2026-04、confidence 0.94。資料種別：release-notes / oss-source。
- huggingchat-2026-04：2026-04 → 2026-11、confidence 0.84。資料種別：oss-source / official-doc。
- huggingchat-2026-11：2026-11 → 未定、confidence 0.9。資料種別：oss-source / official-doc。

## 資料台帳

### 1. oss-source

URL: https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatIntroduction.svelte

資料日付：2023-04-28。閲覧日：2026-11-15。

対象：huggingchat-2023-04。

空状態は左に製品紹介と小さなv0、右にCurrent Modelの情報カード。質問例がある場合は下の3列に置く。『右が提案タイルだけ』という以前の調査を訂正。

### 2. oss-source

URL: https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/NavMenu.svelte

資料日付：2023-04-28。閲覧日：2026-11-15。

対象：huggingchat-2023-04。

左はNew Chat、編集・削除付き履歴、下部Theme/Feedback/About & Privacy。履歴欄と下部欄は右向きの淡いグラデーションと丸角で、単色のパネルではない。

### 3. oss-source

URL: https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/routes/+layout.svelte

資料日付：2023-04-28。閲覧日：2026-11-15。

対象：huggingchat-2023-04。

広い画面は左280pxの2列。小画面では別のMobileNavを表示し左常設欄を隠す。

### 4. oss-source

URL: https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatWindow.svelte

資料日付：2023-04-28。閲覧日：2026-11-15。

対象：huggingchat-2023-04。

下部のグラデーション上にrounded-xlの入力、右端に送信。下はモデルのリンク、注意、会話時の共有。初期の固定コードにモデルの選択器や検索・道具一覧はない。

### 5. oss-source

URL: https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatMessage.svelte

資料日付：2023-04-28。閲覧日：2026-11-15。

対象：huggingchat-2023-04。

利用者の発言は枠塗りなしで左揃え。回答はrounded-2xl、淡いグラデーションと細い境界。小さい丸い印で発言を区別。回答本文を断片ごとに描画する。

### 6. oss-source

URL: https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/tailwind.config.cjs

資料日付：2023-04-28。閲覧日：2026-11-15。

対象：huggingchat-2023-04。

フォントのInter上書きはコメント。grayの独自色上書きもない。主書体をInterと断定せず、標準のシステム書体として扱う。

### 7. oss-source

URL: https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/app.html

資料日付：2023-04-28。閲覧日：2026-11-15。

対象：huggingchat-2023-04。

bodyにdark:bg-gray-900を指定。暗色の基本背景の根拠。

### 8. oss-source

URL: https://raw.githubusercontent.com/tailwindlabs/tailwindcss/v3.3.1/src/public/colors.js

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：huggingchat-2023-04、huggingchat-2025-10、huggingchat-2026-04。

Tailwind 3の標準gray値。900=#111827、800=#1f2937、700=#374151、600=#4b5563、500=#6b7280、400=#9ca3af、300=#d1d5db、100=#f3f4f6。製品内の実際の用途は各部品を別途確認。

### 9. press

URL: https://www.infoq.com/news/2023/04/hugging-chat-open-source/

資料日付：2023-04-28。閲覧日：2026-11-15。

対象：huggingchat-2023-04。

初期はOpenAssistant由来の30Bモデルを使うという同時期の報道。後年の複数モデル・Assistants・道具の配置の証明には使わない。見た目の細部は固定コードを優先。

### 10. oss-source

URL: https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/chat/ChatWindow.svelte

資料日付：2023-08-01。閲覧日：2026-11-15。

対象：huggingchat-2023-08。

検索が有効な設定の場合、入力欄の上にWebSearchToggle。入力下にモデルリンクと共有。生成中は停止操作。カタログの『入力欄の下』ではない。

### 11. oss-source

URL: https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/WebSearchToggle.svelte

資料日付：2023-08-01。閲覧日：2026-11-15。

対象：huggingchat-2023-08。

Search webという短いスイッチ、情報の補足ヒント、明暗両方のスタイルを確認。

### 12. oss-source

URL: https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/chat/ChatIntroduction.svelte

資料日付：2023-08-01。閲覧日：2026-11-15。

対象：huggingchat-2023-08。

右のCurrent Modelカードの丸い設定操作からModelsModalを開く。質問例はカードと別の下の段。

### 13. oss-source

URL: https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/ModelsModal.svelte

資料日付：2023-08-01。閲覧日：2026-11-15。

対象：huggingchat-2023-08。

モデル一覧を選んで送信する窓。右上の常設ドロワーではなく空状態の設定ボタンから開く実装。

### 14. blog

URL: https://huggingface.co/blog/llama2

資料日付：2023-07-18。閲覧日：2026-11-15。

対象：huggingchat-2023-08。

Llama 2公開時の公式案内。モデルの利用時期の補助資料で、チャットの左右配置や色は示さない。

### 15. release-notes

URL: https://huggingface.co/spaces/huggingchat/chat-ui/discussions/357?expand=true

資料日付：2024-02-02。閲覧日：2026-11-15。

対象：huggingchat-2024-02。

公式orgのAssistants告知。モデル・名前・システム指示を選んで公開する別ページ。3月15日追記でインターネット対応。2月2日時点のRAGや道具対応を既成機能としない。

### 16. oss-source

URL: https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/lib/components/NavMenu.svelte

資料日付：2024-02-02。閲覧日：2026-11-15。

対象：huggingchat-2024-02。

左下にTheme、Assistants、Settings。会話は時期ごとにグループ化。Assistantsは有効設定のときだけ表示。

### 17. oss-source

URL: https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/lib/components/chat/ChatWindow.svelte

資料日付：2024-02-02。閲覧日：2026-11-15。

対象：huggingchat-2024-02。

検索切替は入力欄の上、設定が有効でassistantでない場合のみ。画像対応モデルでは添付画像を入力上に表示。下にはモデル設定へのリンクと共有。

### 18. oss-source

URL: https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/lib/components/chat/ChatIntroduction.svelte

資料日付：2024-02-02。閲覧日：2026-11-15。

対象：huggingchat-2024-02。

空状態は紹介、現在モデルのカードと設定リンク、下の質問例。後年のOmniの簡略な空画面とは異なる。

### 19. blog

URL: https://huggingface.co/blog/community-tools

資料日付：2024-09-16。閲覧日：2026-11-15。

対象：huggingchat-2024-09。

Community Toolsの公式公開は9月16日。公開SpaceのURLから道具の作成フォームへ関数と引数を読み込み、Toolsページで有効化。Assistants作成では最大3つの道具を選ぶ。

### 20. oss-source

URL: https://github.com/huggingface/chat-ui/blob/bb38bf54d76f2862955754045c66dc73213e50a5/src/lib/components/NavMenu.svelte

資料日付：2024-09-17。閲覧日：2026-11-15。

対象：huggingchat-2024-09。

Theme・Assistants・Tools・Settings。Toolsの新機能バッジは紫系。道具・Assistantsの常設3タブではない。各入口の表示は設定による。

### 21. oss-source

URL: https://github.com/huggingface/chat-ui/blob/bb38bf54d76f2862955754045c66dc73213e50a5/src/lib/components/chat/ChatWindow.svelte

資料日付：2024-09-17。閲覧日：2026-11-15。

対象：huggingchat-2024-09。

道具対応モデルでは入力欄の上のToolsMenu、そうでなければ検索切替。下はモデル設定リンク。添付できる種類もモデル・有効な道具による。

### 22. oss-source

URL: https://github.com/huggingface/chat-ui/blob/bb38bf54d76f2862955754045c66dc73213e50a5/src/lib/components/chat/ChatIntroduction.svelte

資料日付：2024-09-17。閲覧日：2026-11-15。

対象：huggingchat-2024-09。

現在モデルの情報カードと質問例。提供元ロゴを表示する場合があるが本アプリでは使わない。

### 23. release-notes

URL: https://huggingface.co/spaces/huggingchat/chat-ui/discussions/747?expand=true

資料日付：2025-07-01。閲覧日：2026-11-15。

対象：huggingchat-2025-07。

公式orgは公開チャットを一時休止すると告知し、過去会話のZip書き出しを案内。担当者の同日返信で書き出し機能の公開を確認。ページの厳密なレイアウトは保存資料なし。

### 24. release-notes

URL: https://huggingface.co/spaces/huggingchat/chat-ui/discussions/764

資料日付：2025-10-16。閲覧日：2026-11-15。

対象：huggingchat-2025-07、huggingchat-2025-10。

Omniで再公開。入力ごとにモデルを選び、生成中に採用モデルを表示。裏の生成状態を追跡して会話を切り替えられる。選択肢数は当日115以上で、現行ページの数を流用しない。

### 25. oss-source

URL: https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/NavMenu.svelte

資料日付：2025-10-16。閲覧日：2026-11-15。

対象：huggingchat-2025-10。

左のNew Chat、時期別の履歴、Models、Settings。左の履歴・操作欄はグラデーション。旧Assistantsと旧Toolsの入口を無条件で残さない。

### 26. oss-source

URL: https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/routes/+layout.svelte

資料日付：2025-10-16。閲覧日：2026-11-15。

対象：huggingchat-2025-10。

大画面の左欄は290px、折畳み可。初回や未ログイン時にはWelcomeModal。280pxの初期幅とは異なる。

### 27. oss-source

URL: https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/chat/ChatWindow.svelte

資料日付：2025-10-16。閲覧日：2026-11-15。

対象：huggingchat-2025-10。

入力欄はrounded-xl、右下に丸い送信／停止。下にモデル選択とOmniの経路・モデルの生成中表示。入力dark:bg-gray-800、基本グラデーションはdark:from-gray-900。

### 28. oss-source

URL: https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/chat/ChatMessage.svelte

資料日付：2025-10-16。閲覧日：2026-11-15。

対象：huggingchat-2025-10。

利用者は通常時bg-inheritで左寄せ。編集時だけ灰色のtextarea。回答は丸角の淡いグラデーション。経路・採用モデル・プロバイダ情報は回答下に小さく表示。常設の速度表ではない。

### 29. oss-source

URL: https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/chat/ChatIntroduction.svelte

資料日付：2025-10-16。閲覧日：2026-11-15。

対象：huggingchat-2025-10。

空状態は中央の製品名。旧い現在モデルカードと質問例の大きな塊はコメントアウトされており、表示されない。ロゴは再利用しない。

### 30. oss-source

URL: https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/WelcomeModal.svelte

資料日付：2025-10-16。閲覧日：2026-11-15。

対象：huggingchat-2025-10。

初回案内の窓とStart chatting。白／黒の背景に簡単な説明。ロゴやルーターの動画意匠は再利用しない。

### 31. oss-source

URL: https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/tailwind.config.cjs

資料日付：2025-10-16。閲覧日：2026-11-15。

対象：huggingchat-2025-10。

grayの独自値：600=#323843、700=#252a33、800=#1b1f27、900=#12151c、950=#07090d。明暗どちらにも同じ色名の上書きが適用されるため、明色の回答text-gray-600も#323843。初期の標準grayとは違う。

### 32. oss-source

URL: https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/app.html

資料日付：2025-10-16。閲覧日：2026-11-15。

対象：huggingchat-2025-10。

bodyはdark:bg-gray-900。ブラウザのtheme-colorの#07090dはページ本文の背景とは別なので混同しない。

### 33. oss-source

URL: https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/src/lib/components/NavMenu.svelte

資料日付：2026-04-12。閲覧日：2026-11-15。

対象：huggingchat-2026-04。

左のMCP Servers入口と管理窓、Models、Settings、時期別の会話。デスクトップの下部ナビ行高を約2.08remへ整えたコード。

### 34. oss-source

URL: https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/src/lib/components/chat/ChatWindow.svelte

資料日付：2026-04-12。閲覧日：2026-11-15。

対象：huggingchat-2026-04。

入力右下の送信／停止とマイク、入力下のモデル／プロバイダ選択、Omniの経路表示。大きな速度／金額トレースバーの根拠ではない。

### 35. oss-source

URL: https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/src/lib/components/chat/ChatMessage.svelte

資料日付：2026-04-12。閲覧日：2026-11-15。

対象：huggingchat-2026-04。

回答下に経路、モデル、プロバイダを小さく表示。小画面でプロバイダを隠す条件あり。ユーザーは通常時bg-inherit、編集時だけ灰色の枠。

### 36. oss-source

URL: https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/tailwind.config.cjs

資料日付：2026-04-12。閲覧日：2026-11-15。

対象：huggingchat-2026-04。

2025年10月と同じgray上書き値をこの固定版でも確認。明色の回答text-gray-600も標準色ではなく#323843。

### 37. official-doc

URL: https://huggingface.co/docs/chat-ui/en/configuration/mcp-tools

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：huggingchat-2026-04、huggingchat-2026-11。

現行の公式ヘルプ。入力部の＋または設定からMCP Serversを開き、Add ServerとHealth Checkで登録。実行結果は会話内の開閉する道具ブロック。2026-11-15閲覧。過去の初出日までは証明しない。

### 38. oss-source

URL: https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/NavMenu.svelte

資料日付：2026-11-14。閲覧日：2026-11-15。

対象：huggingchat-2026-11。

固定コミットのNew Chat、Models、MCP Servers、Settings。広い画面では操作行h-8、小画面はh-10。旧Assistantsをそのまま戻す根拠はない。

### 39. oss-source

URL: https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/chat/ChatWindow.svelte

資料日付：2026-11-14。閲覧日：2026-11-15。

対象：huggingchat-2026-11。

入力部は縦方向の枠になり、ML Assistantの帯を重ねられる。通常入力の下にモデル、プロバイダ、Omniの経路。道具呼出し中の状態表示、マイク、送信、停止、再開操作は状態に応じる。

### 40. oss-source

URL: https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/chat/ChatMessage.svelte

資料日付：2026-11-14。閲覧日：2026-11-15。

対象：huggingchat-2026-11。

生成中の考えた過程・道具・計画は個別ブロック、完了した道具群は要約して開閉。利用者は通常時bg-inherit。回答下の経路・モデル・提供元も条件付きで表示。

### 41. oss-source

URL: https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/styles/main.css

資料日付：2026-11-14。閲覧日：2026-11-15。

対象：huggingchat-2026-11。

Tailwind 4のgray色票へ変更。50=#fafafa、100=#f5f5f5、200=#e5e5e5、400=#a3a3a3、500=#737373、600=#454545、700=#2e2e2e、800=#1a1a1a、900=#0a0a0a。10月2025版の色を流用しない。

### 42. oss-source

URL: https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/chat/SidePaneHost.svelte

資料日付：2026-11-14。閲覧日：2026-11-15。

対象：huggingchat-2026-11。

開いたときだけ作業の横欄とタブ列を表示。Trackioの計測、Workflow、論文PDF等を同じ欄に置く。背景は白／dark gray-900。

### 43. oss-source

URL: https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/chat/SidePane.svelte

資料日付：2026-11-14。閲覧日：2026-11-15。

対象：huggingchat-2026-11。

作業欄は幅変更でき、最小max(20%,300px)、最大80%。小画面では全画面の重ね表示に切替。右側の部品の存在は、ログイン前から常に表示される意味ではない。

### 44. official-doc

URL: https://huggingface.co/chat/

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：huggingchat-2026-11。

2026-11-15のログアウト状態で取得。初回のStart chatting案内、New Chat、Models、Settings、OmniとML Internの案内。実会話は送信していない。Modelsの件数は変動するため再現用の固定値にしない。

### 45. official-doc

URL: https://huggingface.co/docs/chat-ui/en/configuration/theming

資料日付：日付記載なし／固定ファイルの公表日は未確認。閲覧日：2026-11-15。

対象：huggingchat-2026-11。

現行の公式設定ページ。名称・アセット・紹介文を環境設定で変えられる。公開chat-uiのコードと公式サービスの選択設定を区別するため参照。

## 既存調査・描画への訂正

- 初期の質問例は現在モデルカードとは別の下段。過去調査の『右側に提案群だけ』では情報カードを落としてしまう。ロゴを省き、紹介・カード・質問例の配置を残す。https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatIntroduction.svelte
- 初期は単一モデルのリンクで、後年のモデル選択や専用アシスタントを4月画面へ足さない。Interの上書きはコメントなので主書体と断定しない。https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/src/lib/components/chat/ChatWindow.svelte https://github.com/huggingface/chat-ui/blob/07a1e01a7e8e4a74cbaf1ae9f925016263418c3f/tailwind.config.cjs
- 2023-08のモデル選択は空状態のモデルカードから開く窓。web/js/tools/huggingchat.jsの常設Model Cardサイドパネルと別物。Search webは入力欄の上にあり、カタログの『左下』とは違う。https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/chat/ChatIntroduction.svelte https://github.com/huggingface/chat-ui/blob/54e8a52e285c9f3997d9d7550420da821cdde219/src/lib/components/chat/ChatWindow.svelte
- 2024-02-02の専用アシスタントは名前・モデル・指示を組み合わせる方式。検索は当日の固定コードではassistant利用時に隠し、公式告知のネット対応追記は3月15日。初日から文書検索や道具呼出し対応と描かない。https://huggingface.co/spaces/huggingchat/chat-ui/discussions/357?expand=true https://github.com/huggingface/chat-ui/blob/9574269312f8c18f71a9f56563d01f52ae182e2b/src/lib/components/chat/ChatWindow.svelte
- Community Toolsの記事は9月16日公開。カタログの9月10日当日の公開はunverified。Chat/Assistants/Community Toolsの固定3タブや左の大きいカタログではなく、左の入口と入力上の選択を確認。https://huggingface.co/blog/community-tools https://github.com/huggingface/chat-ui/blob/bb38bf54d76f2862955754045c66dc73213e50a5/src/lib/components/NavMenu.svelte https://github.com/huggingface/chat-ui/blob/bb38bf54d76f2862955754045c66dc73213e50a5/src/lib/components/chat/ChatWindow.svelte
- 2025-07は公開チャットの休止。rendererのHF Hubの会話画面・Inference Providersタブへの移行先レイアウトは告知で確認できない。https://huggingface.co/spaces/huggingchat/chat-ui/discussions/747?expand=true
- 2025-10は115という数の常設ルータータブや月間クレジット計器ではなく、入力下と回答下に経路・モデルが出る。Omniはモデルを選ぶ役割で、単一の回答モデル名ではない。https://huggingface.co/spaces/huggingchat/chat-ui/discussions/764 https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/chat/ChatWindow.svelte https://github.com/huggingface/chat-ui/blob/278fc67521fee7c1fb84dae4b6e631313610fd14/src/lib/components/chat/ChatMessage.svelte
- 2026-04の採用モデルと提供元は回答の下の小さい表示。rendererの2,100/420 tok/s等の常設速度表、金額のトレースバーはunverified。MCP Serversの入口は4月固定コードにも存在する。https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/src/lib/components/chat/ChatMessage.svelte https://github.com/huggingface/chat-ui/blob/c0cfbdf65cd25f750666e5bb37ea46be8f755004/src/lib/components/NavMenu.svelte
- 2026-11にはML Internと必要時のタブ付き作業欄がある。rendererの旧Assistants入口、IDE風の下部状態バー、固定モデル一覧を標準画面とする根拠はない。2025年の青みのgrayも流用しない。https://huggingface.co/chat/ https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/lib/components/chat/SidePaneHost.svelte https://github.com/huggingface/chat-ui/blob/f543c9a1f38683ce6cebf82c007bbef2e24ee867/src/styles/main.css

## 未確認・確認できなかった資料

- 2025-07の休止ページの正確な配置・歓迎文・書き出しボタンの名前はunverified。空画面を再構成せず、regionsとcontrolsは空配列にした。
- 各公開コミットと当日公式サービスの配信設定が完全一致するかはunverified。Community Toolsは9月17日の固定コードと16日の公式告知を根拠とする。
- 2023-08にCode Llamaが8月1日から選べたというカタログの記述は本調査では確認していない。モデル一覧は本課題の配置根拠から除外。
- 2026-11の固定コードは11月14日。既存IDの11月1日の状態まで同じと証明していない。ログイン済み会話の実送信、スマホでの操作検証は未実施。
- 角丸の正確なpx値・全版の行間・2023-08/2024-02/2024-09の実効パレットはunverified。初期・2025-10・2026-11の色票を他の版へ無条件で転記しない。
- https://huggingface.co/blog/huggingchat-assistants — 2026-11-15取得失敗。公式orgのdiscussions/357で公開日と追記を確認。
- https://huggingface.co/blog/chat-ui-tools — カタログ上の候補。実際に取得して根拠とした公式記事は /blog/community-tools。
- https://web.archive.org/web/20230801000000/https://huggingface.co/chat/ — 2026-11-15取得失敗。Internet Archiveの履歴ページは確保できていない。
- https://api.github.com/repos/huggingface/chat-ui/commits?until=2024-09-17T00%3A00%3A00Z&per_page=1 — Web取得失敗。GitHub検索で日付付きコミットを特定し、仕様内の固定URLで本文を確認。
- 公式動画のフレームは使用しておらず、独立した公式動画説明文も未確保。静止画・ロゴ・モデルの提供元画像はプロジェクトへ保存していない。

