# ChatGPT の調査

調査日: 2026-11-15。既存17版に、12月2022、Macの8月2024、Webの11月2024、Projectsの12月2024、調査画面の2月2026を追加した。既存のdesign/featuresと旧調査、web/js/tools/chatgpt.jsを読んだ。レンダラーやcatalogは編集していない。

## 仕様の読み方

月単位のfromは既存IDとの対応。to:nullは終了月不明で、全てが現在も同じ画面という意味ではない。1カ月内の後日追加は本文に日付を添えた。とくに2026-11は15日時点の調査で、5日の固定画面を確認した意味ではない。Mac専用IDはネイティブアプリであり、ルートkindのchat-webを全版へ一律に適用しない。指定スキーマに版ごとのkind欄がないため、regionsとIDで区別した。

実測できない色の7項目、寸法、角丸、書体の固有名はnull。現行ブランド資料から過去のアプリの書体を決めない。free_fallbackは再描画用の代替指定。詳細な画面を確認できない版では空画面の文言・密度・枠の形もnull。unverifiedは存在しないという断言ではなく、根拠が不足しているという意味。各事実の末尾に直接のURLを付けた。

## 読んだ資料と日付

- https://openai.com/index/chatgpt/
  - chatgpt-2022-11 / blog / 日付: 2022-11-30。初回公開と対話方式。公開紹介ページであり、現在の製品ナビゲーションは2022年の操作画面ではない。
- https://arstechnica.com/information-technology/2022/12/openai-invites-everyone-to-test-new-ai-powered-chatbot-with-amusing-results/
  - chatgpt-2022-11 / press / 日付: 2022-12-01。公開直後の報道。会話画面と無料試行を確認するが、ピクセル単位の外観を記述しない。
- https://interfacelineage.com/chatgpt-chat-completions-ui
  - chatgpt-2022-11 / blog / 日付: 不明（現在の可変ページ）。二次のデザイン史。12月5日の帯状の会話を紹介する。初日の画面の保証ではないので次の版へ分けた。
  - chatgpt-2022-12 / blog / 日付: 不明（現在の可変ページ）。12月5日の画面に対する説明と帯状の配置。二次資料であり、採寸やCSSの根拠にしない。
  - chatgpt-2024-05 / blog / 日付: 不明（現在の可変ページ）。6月2024の会話を説明。右寄せの質問と枠なしの返答。5月初日の形状への遡及はしない。
- https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - chatgpt-2022-12 / release-notes / 日付: 2022-12-15。履歴・改名・削除の段階公開と下部の版表記。12月15日の項目だけを用いる。
  - chatgpt-2023-03 / release-notes / 日付: 2023-03-14。Plusへの追加と利用上限が変わること。
  - chatgpt-2023-05 / release-notes / 日付: 2023-05-12。モデル選択→Plugins→Plugin Storeという操作順とBeta features。
  - chatgpt-2023-07 / release-notes / 日付: 2023-07-06。PlusのWeb版へ順次公開、設定から有効化。
  - chatgpt-2023-09 / release-notes / 日付: 2023-09-25。同日の段階公開を照合する変更記録。同じ発表に基づき、独立した2つの画面観測ではない。
  - chatgpt-2023-11 / release-notes / 日付: 2023-11-06。GPTs公開の変更記録。
  - chatgpt-2024-05 / release-notes / 日付: 2024-05-13。当初はテキストと画像のみ。新しいリアルタイム音声・動画の初日実装を追認しない。
  - chatgpt-2024-09 / release-notes / 日付: 2024-09-12。同日のo1公開記録。具体的な思考表示の短文や折りたたみ形は確認できず。
  - chatgpt-2024-10 / release-notes / 日付: 2024-12-10。canvasでのPython実行は12月の更新。10月の文章用Canvasに常設の実行ボタンを置かないための時点の資料。
  - chatgpt-2024-11 / release-notes / 日付: 2024-11-22。2週間かけるWeb改修。サイドバーと入力欄、新規会話の移動。
  - chatgpt-2024-12 / release-notes / 日付: 2024-12-13。Projects公開時点の照合。現在の共有機能や全プランへの展開を初日へ遡らせない。
  - chatgpt-2025-02 / release-notes / 日付: 2025-02-02。最初のPro向け公開時点を照合。2月27日のGPT-4.5を2月2日の常設ボタンにしない。
  - chatgpt-2025-04 / release-notes / 日付: 2025-04-15。Image Libraryの公開日とサイドバーの入口。会話上部の常設の画像ストリップとは異なる。
  - chatgpt-2025-06-macos / release-notes / 日付: 2025-06-04。後続7月16日の項目も初回Team公開を6月4日と記す。初日・後日のプラン展開を分ける。
  - chatgpt-2025-08 / release-notes / 日付: 2025-08-12。Auto/Fast/Thinkingの追加は8月12日。8月8日のAccent Colors説明は色を変更できることを示すが、固定の色コードは示さない。
  - chatgpt-2026-02 / release-notes / 日付: 2026-02-10。入口と報告表示の改修。
  - chatgpt-2026-11 / release-notes / 日付: 2026-11-13。11月4日のImages 2.6、10月26日のTerra、11月13日のWalletを日付別に照合。11月5日の固定画面を示す資料ではない。
- https://openai.com/index/gpt-4-research/
  - chatgpt-2023-03 / blog / 日付: 2023-03-14。GPT-4とPlus/APIの提供時点。外観の配色や幅は示さない。
- https://www.reddit.com/r/ChatGPT/comments/11rc06k/just_got_access_to_gpt4_chatgpt_plus/
  - chatgpt-2023-03 / blog / 日付: 2023-03-14。当日利用者の投稿と返信の本文。選択メニューにGPT-4、Legacy、Defaultがあると報告。画像の数値やコメント中の憶測は採用しない。
- https://openai.com/index/chatgpt-plugins/
  - chatgpt-2023-05 / blog / 日付: 2023-03-23。先行公開時の説明。閲覧先と出典の表示。5月の全Plus向け展開と区別する。
  - chatgpt-2023-07 / blog / 日付: 2023-03-23。計算用の状態、ファイルの受け渡しについての公式説明。7月当日の細かな部品の保証ではない。
- https://community.openai.com/t/chatgpt-4-missing-upload-button-solved-confusing-ui/300566
  - chatgpt-2023-07 / blog / 日付: 2023-07-16。利用者の直接報告。添付操作は通常のGPT-4ではなくCode Interpreterを選んだ場合に出るという説明。
- https://openai.com/index/chatgpt-can-now-see-hear-and-speak/
  - chatgpt-2023-09 / blog / 日付: 2023-09-25。画像は全プラットフォーム、音声はiOS/Androidという初期の区別。操作の場所は記事本文で確認。
- https://openai.com/index/introducing-gpts/
  - chatgpt-2023-11 / blog / 日付: 2023-11-06。GPT作成と通常会話の機能統合。公開紹介ページであって、サイドバーの幅や配色の資料ではない。
- https://openai.com/index/new-models-and-developer-products-announced-at-devday/
  - chatgpt-2023-11 / blog / 日付: 2023-11-06。APIのGPT-4 Turboの128Kという記載。これをChatGPT画面の常設の値へ流用しない。
- https://www.youtube.com/watch?v=U9mJuUkhUzk
  - chatgpt-2023-11 / video / 日付: 2023-11-06。公式投稿のタイトル・説明・発表リンクを検索結果で確認。直接ページの本文はフッターだけ。画面配置の証拠に数えない。
- https://openai.com/index/gpt-4o-and-more-tools-to-chatgpt-free/
  - chatgpt-2024-05 / blog / 日付: 2024-05-13。新しいホーム・メッセージ配置と機能展開。具体的な寸法やスターターの枚数は示さない。
  - chatgpt-2024-05-macos / blog / 日付: 2024-05-13。Mac版発表、ショートカット、右下の音声操作。カタログの5月14日は日付の扱いの違いで、月として保持。
  - chatgpt-2024-08-macos / blog / 日付: 2024-05-13。5月には呼び出し用ショートカットが既にあったこと。8月の常時前面ウィンドウと混同しないための背景資料。
- https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes
  - chatgpt-2024-05-macos / release-notes / 日付: 2024-08-06。常に前面に残るCompanion windowは8月6日の別更新。5月の呼び出しと区別するための資料。
  - chatgpt-2024-08-macos / release-notes / 日付: 2024-08-06。追加されたCompanion windowの挙動と設定。
  - chatgpt-2024-11-macos / release-notes / 日付: 2024-11-14。Work with Appsと入力バー改修。2025-03-06のコード直接編集と分ける。
- https://openai.com/index/introducing-openai-o1-preview/
  - chatgpt-2024-09 / blog / 日付: 2024-09-12。初期のモデル選択と入力制限。APIが逐次出力に未対応という説明を、そのままChatGPTの表示仕様へ流用しない。
- https://openai.com/index/introducing-canvas/
  - chatgpt-2024-10 / blog / 日付: 2024-10-03。canvas初期の別編集領域、範囲選択、修正メニュー、戻す操作。
- https://openai.com/index/introducing-chatgpt-search/
  - chatgpt-2024-10 / blog / 日付: 2024-10-31。月末追加の検索ボタンとSources一覧。canvas初日の実装と区別。
- https://help.openai.com/en/articles/10119604-work-with-apps-on-macos
  - chatgpt-2024-11-macos / official-doc / 日付: 不明（現在の可変ページ）。現行の操作説明。入力欄の上の帯。現在は直接編集や追加アプリの説明も含むため、11月当日の一覧には流用しない。
- https://community.openai.com/t/new-sidebar-pop-up-is-garbage/1028109
  - chatgpt-2024-11 / blog / 日付: 2024-11-22。当日の直接利用者が会話一覧のポップアップ化を報告。OpenAIの仕様保証ではないが、同日の変化を照合できる。
- https://arstechnica.com/information-technology/2024/12/12-days-of-openai-the-ars-technica-recap/
  - chatgpt-2024-12 / press / 日付: 2024-12-20。12日間の発表の当時のまとめ。12月13日のProjectsとサイドバーの＋操作。
- https://openai.com/index/introducing-deep-research/
  - chatgpt-2025-02 / blog / 日付: 2025-02-02。How to use節の初期説明。2026-02-10の更新段落は別版へ分ける。
  - chatgpt-2026-02 / blog / 日付: 2026-02-10。冒頭の明示された更新段落。2025年初期の画面と分ける。
- https://openai.com/index/introducing-o3-and-o4-mini/
  - chatgpt-2025-04 / blog / 日付: 2025-04-16。モデル選択と無料利用者のThink操作、道具の組み合わせ。
- https://help.openai.com/en/articles/11487532-chatgpt-record
  - chatgpt-2025-06-macos / official-doc / 日付: 不明（現在の可変ページ）。現在の録音操作は録音開始、経過時間、停止、Resume、Send。現行の4時間上限や後年の操作を6月初日の仕様として採用しない。
- https://openai.com/index/introducing-gpt-5/
  - chatgpt-2025-08 / blog / 日付: 2025-08-07。初日のモデル選択と任意の話し方の設定。
- https://help.openai.com/en/articles/10169521-projects-in-chatgpt
  - chatgpt-2026-04 / official-doc / 日付: 不明（現在の可変ページ）。現在のProjectsの説明では会話・資料・指示と設定を確認できる。4月10日の独自UIを示す資料ではない。
- https://help.openai.com/en/articles/8590148-memory-in-chatgpt
  - chatgpt-2026-04 / official-doc / 日付: 不明（現在の可変ページ）。現在のMemoryの設定・要約・Sourcesの説明。Memory Graphという画面の根拠は確認できず。4月当日の観測資料ではない。
- https://help.openai.com/en/articles/20001530-getting-started-with-your-dot
  - chatgpt-2026-11 / official-doc / 日付: 不明（現在の可変ページ）。2026-11-15に読んだ現行の操作説明。プロフィールの3区分とTexting、添付、タスクの位置。全ての利用者に同じ表示とはしない。
- https://chatgpt.com/
  - chatgpt-2026-11 / official-doc / 日付: 不明（現在の可変ページ）。2026-11-15に取得したログアウト状態のページ。ログインと登録、New chat・Images・Plugins等の文字を確認。ログイン後のDots・モデル選択・Walletの配置は確認できない。

## 根拠の強さ

公式の発表は機能の開始日と操作を確認する一次資料。現在のサイトのヘッダーやフッターは昔のアプリ画面ではない。公式ヘルプも随時更新されるので、過去の公開日の見た目をそのまま保証しない。複数のURLが同じ発表を再掲する場合は、独立した画面観測が増えたとはみなしていない。

Interface Lineageは二次のデザイン解説。本文が示す12月5日と6月2024の画面の説明を用い、採寸・色コード・初日への遡及には使わなかった。投稿そのものの公開日は不明。初期ホームの3列は旧調査と今回の検索で候補を見つけたが、初日を確定できる資料は得られなかったのでempty_stateに断定を加えていない。RedditやCommunityはblogに分類した一般利用者の直接体験で、OpenAIによる仕様保証ではない。

2026-04は2件とも現在の周辺資料で、その版の画面を確認した資料ではない。Memory Graphなどを未確認のまま描くのを止めるため、IDを保持して低いconfidenceにした。2025-06録音も初日専用の画面記録が不足している。

## 追加で確認した公開ページ

- https://help.openai.com/en/articles/10128477-chatgpt-enterprise-and-edu-release-notes — release-notes、2026-11-04のDotsの項目など。企業向けの条件付き展開で、一般のログイン後画面の固定配置は示さない。
- https://help.openai.com/en/articles/9268871-how-is-data-retained-in-the-macos-app — official-doc、日付不明。旧調査から推測したcompanion用のURLがこの記事へ転送された。データ保持の説明で、窓の外観の証拠にはしない。
- https://help.openai.com/en/articles/9268871-how-to-launch-the-companion-window-in-the-chatgpt-macos-app — 上の保持説明へ転送。URLの名前だけで内容を判断しない。
- https://help.openai.com/ja-jp/articles/9703738-chatgpt-macos-app-release-notes — 検索で日本語版の同じ更新記録も照合。翻訳は独立した画面証拠に数えない。

## 取得できなかった候補

- https://web.archive.org/web/20221201000000/https://chat.openai.com/chat — archive候補。ツールで取得できず、指定日時の実在する保存ページも未確認。
- https://www.pcworld.com/article/1375296/chatgpt-is-a-chatbot-that-can-write-poetry-and-code-and-its-amazing.html — 推測した旧記事URL、取得不可。根拠に使わない。
- https://www.pcworld.com/article/1435784/chatgpt-a-hands-on-first-look-at-the-new-ai-chatbot.html — 推測した旧記事URL、取得不可。根拠に使わない。
- https://help.openai.com/en/articles/9930697-what-is-the-canvas-feature-in-chatgpt-and-how-do-i-use-it — HTTP 404。canvasの根拠には公式の公開時ブログを使った。
- https://help.openai.com/en/articles/9268872-using-the-chatgpt-macos-app — HTTP 404。採用しない。
- https://openai.com/index/gpt-4-and-more-tools-to-chatgpt-free/ — 文字が抜けた誤った候補URLで取得失敗。正しく開いたgpt-4o-and-more-tools-to-chatgpt-freeを採用した。

## 権利と再描画

画像・動画のフレーム・ロゴ・アイコン・壁紙・フォント・第三者コードは保存していない。動画は公式投稿のタイトル・説明だけを参照した。会話・資料・グラフ・画像の内容は独自の短い例文や無地の枠に置き換える。製品名は通常の文字で表示する。ソースに出るロゴの存在を、そのロゴを描く指示にしない。

## レビュアーへの未解決事項

- 各版の当日のCSSや採寸可能な信頼できる資料がないため、配色・書体・幅・角丸はunverified。
- 2022-11初日のメニューと3列ホーム、2023-03の正確な配置、2024-05初日の空画面は追加確認が必要。
- カタログの2026-04-10のMemory Graph、2026-11-05の全機能統合は未確認。11月13日のWalletを5日版に含めないこと。
- Macの初日録音操作やキー、固定の画面文言は未確認。現行Recordヘルプには後年の内容が多い。
- 担当外のcatalogとレンダラーは、specsのcorrectionsを基に別途修正が必要。

## 追加の照合

- https://help.openai.com/en/articles/6825453-chatgpt-release-notes — release-notes、該当日付不明。April 10, 2026という更新項目を確認できず。2026-04版に参考資料として追加したが、Memory Graphが存在しないと証明した意味ではない。
- https://www.pcworld.com/article/1424575/chatgpt-is-the-future-of-ai-chatbots.html — press、2022-12-05。検索で正しい記事URLと著者の利用説明を確認。初期の再生成操作の存在の参考になるが、3列ホーム・11月30日初日の配置の証拠として採用していない。

## オフライン確認コマンド

以下をプロジェクト直下で実行する。JSON解析と各版の出典件数だけを調べ、外観の正しさやリンクの将来の存続を検証するものではない。

```sh
node -e 'const fs=require("node:fs");let n=0;for(const id of ["chatgpt","openai-playground","openai-gpt-2-interactive"]){const d=JSON.parse(fs.readFileSync("design/specs/"+id+".json","utf8"));if(d.versions.some(v=>v.sources.length<2))throw Error(id);n+=d.versions.length;}console.log("PASS: 3 JSON files, "+n+" versions, every version has >= 2 sources");'
```
