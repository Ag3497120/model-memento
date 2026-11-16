# OpenAI Playground の調査

調査日: 2026-11-15。既存9版を全て保持し、直接利用の記録がある2020-08、挿入・編集用の新画面が発表された2022-03を追加した。OpenAIの公式発表、API変更記録、公式ヘルプ、当時の利用者・開発者による直接記録を照合した。コードや動画を実行していない。

## 読んだ資料とその範囲

- https://openai.com/index/openai-api/
  - openai-playground-2020-06 / blog / 日付: 2020-06-11。入力と補完の方式・開始月。ログイン不要の製品発表で、操作画面の寸法・色は示さない。
  - openai-playground-2020-08 / blog / 日付: 2020-06-11。文章の補完という方式を裏付ける公式発表。8月の外観そのものの独立した観測ではない。
- https://www.twilio.com/en-us/blog/developers/ultimate-guide-openai-gpt-3-language-model
  - openai-playground-2020-06 / blog / 日付: 2020-08-25。8月時点の直接利用記録。6月初日の外観を保証しないため、別の2020-08版へ配置を記録した。
  - openai-playground-2020-08 / blog / 日付: 2020-08-25。当時の直接利用による長い説明。regions、controls、conversationの根拠。Web取得の再試行でタイムアウトした後、Node標準fetchではHTTP 200で本文を読めた。画像ファイルは取得していない。
- https://openai.com/index/api-no-waitlist/
  - openai-playground-2021-11 / blog / 日付: 2021-11-18。改良されたPlayground、Instruct Series、Codex、例文集。ログイン不要の発表で画面の詳細はない。
- https://openai.com/index/gpt-3-edit-insert/
  - openai-playground-2021-11 / blog / 日付: 2022-03-15。Insert/Editの新しいPlayground画面は後日の発表。2021-11へ遡って描かないための時点の根拠。
  - openai-playground-2022-03 / blog / 日付: 2022-03-15。新しいPlayground画面の存在、挿入と編集の入力方式。切替ボタンがタブだったかは示さない。
- https://community.openai.com/t/introducing-insert-and-edits-capabilities/15993
  - openai-playground-2022-03 / changelog / 日付: 2022-03-15。Adam-OpenAIの公式Announcements投稿。専用UIとsuffix入力を確認。利用者の3月19日の返信は編集箇所の強調表示を要望しており、完成済み機能として扱わない。
- https://community.openai.com/t/gpt-4-not-visible-in-the-api-playground-even-though-i-have-been-invited-for-the-limited-beta/105886
  - openai-playground-2023-03 / blog / 日付: 2023-03-18。公式Communityに掲載された利用者の直接報告。3月18〜21日の返信で右上のModeとChat、Modelの操作を確認。OpenAI社員による仕様保証ではない。
- https://community.openai.com/t/chat-mode-in-playground-has-load-save-view-code-grayed-out/102300
  - openai-playground-2023-03 / blog / 日付: 2023-03-16。利用者の直接報告。役割付き入力と保存・コード表示の無効状態。返信内のAPI解説の推測は採用しない。
- https://openai.com/index/gpt-4-research/
  - openai-playground-2023-03 / blog / 日付: 2023-03-14。GPT-4のAPI/Playgroundへの提供時点。UIの寸法や色の証拠ではない。
- https://openai.com/index/new-models-and-developer-products-announced-at-devday/
  - openai-playground-2023-11 / blog / 日付: 2023-11-06。Assistants APIと専用Playgroundの発表、threadと3つの道具。APIの128Kという数値をChatGPTの画面仕様へ流用しない。
- https://dev.classmethod.jp/articles/4e7a92449ab74724778e8da65fa0006bdabbe660/
  - openai-playground-2023-11 / blog / 日付: 2023-11-07。著者がPlaygroundで実際に作成・実行した説明。controlsとconversationの根拠。掲載画像の寸法や色は採用せず、本文のみ。
- https://developers.openai.com/api/docs/changelog
  - openai-playground-2024-05 / changelog / 日付: 2024-05-13。2024-04-17、05-09、05-13の該当項目で時点を確認。配置を示す資料ではない。
  - openai-playground-2025-03 / changelog / 日付: 2025-06-13。再利用できる版付きPromptsは6月13日の別更新。3月の名前と画面へ遡らせない。
  - openai-playground-2025-06 / changelog / 日付: 2025-06-13。dashboardとResponses APIの再利用可能Promptsの追加日。カタログの6月11日を追認しない。
  - openai-playground-2026-06 / changelog / 日付: 不明（現在の可変ページ）。6月15日のPlayground外観変更という一致項目は確認できず。APIの変更から外観を推定しない。
- https://help.openai.com/en/articles/8550641-assistants-api-v2-faq
  - openai-playground-2024-05 / official-doc / 日付: 不明（現在の可変ページ）。現在のv2説明。会話保持と道具を確認。改訂される記事なので5月当日の見た目を保証しない。
- https://openai.com/index/introducing-structured-outputs-in-the-api/
  - openai-playground-2024-05 / blog / 日付: 2024-08-06。JSON Schemaへの厳密な出力の発表は後の8月。5月版へ遡及しないための根拠。
- https://openai.com/index/introducing-the-realtime-api/
  - openai-playground-2024-10 / blog / 日付: 2024-10-01。Realtime公開とWebSocket接続、音声の逐次送受信。Playgroundの具体的なメニューとは分ける。
- https://dev.classmethod.jp/articles/openai-realtime-api-on-playground/
  - openai-playground-2024-10 / blog / 日付: 2024-10-04。当時の直接利用による説明。regionsとcontrolsの根拠。本文・説明だけを読み、埋め込み動画のフレームは使用していない。
- https://openai.com/index/new-tools-for-building-agents/
  - openai-playground-2025-03 / blog / 日付: 2025-03-11。Responsesの公開とTry in Playground。配置・色は示さない。
- https://community.openai.com/t/enhanced-prompt-management/1290305
  - openai-playground-2025-06 / changelog / 日付: 2025-06-16。OpenAIの公式Announcements投稿。Prompts Playground改修、版、変数、Optimize、Presets移行。
- https://help.openai.com/en/articles/9824968-prompt-management-in-playground
  - openai-playground-2025-06 / official-doc / 日付: 不明（現在の可変ページ）。現在の説明ではPublish、History、Link Eval等を確認できるが、初期6月の正確な部品と配置の根拠には使わない。
  - openai-playground-2026-06 / official-doc / 日付: 不明（現在の可変ページ）。現在のPrompts操作を示す背景資料。2026-06-15の画面の観測資料ではない。
- https://platform.openai.com/playground
  - openai-playground-2026-06 / official-doc / 日付: 不明（現在の可変ページ）。現在のPlayground URLを取得したが読める本文は0行。ログイン後の画面や過去の配置の根拠は得られない。

## 追加で読んだ資料

- https://www.youtube.com/watch?v=U9mJuUkhUzk — video、2023-11-06。検索結果の公式OpenAI投稿のタイトル・説明でDevDay開催と発表リンクを確認した。直接ページの取得本文はフッターのみ。説明から画面配置は分からず、映像のフレームは参照していない。版の2件条件を満たすための水増しには使っていない。
- https://help.openai.com/en/articles/8550641-assistants- — official-doc、日付不明。検索結果には左のAssistants一覧への案内があるが、古い版と現在のページが混ざるため5月当日の配置として採用しない。

## 取得できなかった資料

- https://web.archive.org/web/20200612000000/https://beta.openai.com/playground — archive候補。取得できず、実在する該当日時のスナップショットも未確認。6月の外観の証拠に使っていない。

## 読み方

全ての数値の色・寸法・書体の固有名は、当時のCSSを確認できなかったのでnull。free_fallbackは再描画用の代替で、実際の製品書体ではない。shapeの密度も未測定ならnull。to:nullは終了月不明。ルートkindは指定候補にplaygroundがないためchat-webに分類したが、一般向けChatGPTと同じ画面という意味ではない。APIの仕様・モデルの公開と、見える画面部品を分けている。

2020-06と2020-08を分けた理由は、初日の構成を8月の利用記録から遡って断定しないため。2021-11は公式発表に改良の記載があるだけで外観未確認。2024-05もAPIの更新時点は追えるが当日の実画面の細部は不足。2026-06の3件は周辺資料と取得結果であり、その版の画面を3回確認した意味ではない。低いconfidenceとnullを維持する。

Communityの一般利用者の投稿はblogとして分類した。一次の利用体験だがOpenAIの正式な仕様保証ではない。公式Announcementsのスタッフ投稿はchangelogとして分類した。DevelopersIOとTwilioは著者自身が操作した長い説明で、OpenAIによる公式資料ではない。ログイン不要の公開記事を読んだものであり、今回自分でPlaygroundへログインしてはいない。画像・動画・ロゴ・フォント・第三者コードの複製は保存していない。

## 未解決・担当外の変更

6月2020、11月2021、5月2024、3月2025、6月2026の当日画面を確認する追加資料が必要。古いSystem欄・Assistants欄の正確な左右配置、実測の幅、配色、書体はunverified。レンダラーとcatalogは変更していない。specs内のcorrectionsを基に担当者が修正する必要がある。

## 時点を照合する追加の報道

以下は画面の独立した証拠として数えず、公開時点とアクセス条件を照合したもの。種類を増やしても当日の配置へのconfidenceは上げていない。

- https://venturebeat.com/ai/openai-launches-an-api-to-commercialize-its-research — press、2020-06-11。API開始を照合。6月・8月の外観は示さない。
- https://venturebeat.com/ai/openai-makes-gpt-3-generally-available-through-its-api — press、2021-11-18。待機リスト撤廃を照合。外観は示さない。
- https://techcrunch.com/2023/03/14/openai-releases-gpt-4-ai-that-it-claims-is-state-of-the-art/ — press、2023-03-14。API待機リストを照合。外観は示さない。
- https://www.axios.com/2024/10/01/chatgpt-developers-ai-voice-engine — press、2024-10-01。音声API公開を照合。配置は示さない。
- https://platform.openai.com/docs/guides/prompt-engineering — official-doc、日付不明。現在のhttps://developers.openai.com/api/docs/guides/prompt-engineeringへ転送。現在の文章作成指針で、過去のPlaygroundの外観の資料としては使わない。

## オフライン確認コマンド

以下をプロジェクト直下で実行する。JSON解析と各版の出典件数だけを調べ、外観の正しさやリンクの将来の存続を検証するものではない。

```sh
node -e 'const fs=require("node:fs");let n=0;for(const id of ["chatgpt","openai-playground","openai-gpt-2-interactive"]){const d=JSON.parse(fs.readFileSync("design/specs/"+id+".json","utf8"));if(d.versions.some(v=>v.sources.length<2))throw Error(id);n+=d.versions.length;}console.log("PASS: 3 JSON files, "+n+" versions, every version has >= 2 sources");'
```
