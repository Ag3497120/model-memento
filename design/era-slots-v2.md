# V2 モデル選択位置の印

対象は指定された8つの描画ファイルです。判断元は各 `design/era/<tool-id>.json` の `model_switch` です。各行のURLも同項目から転記しました。今回は外部ページの再調査をしていません。

`data-era-input` は、送信する文章の入力欄に付けました。Playgroundの文章補完では、入力と続きを共有する編集欄に付けています。BingのMac版では小さな入力窓にも付けました。設定やファイル編集など、送信しない入力欄には付けていません。

モデル選択はV1が取り付けます。描画側の `S.picker(ctx)`、独自のモデル選択メニュー、モデルを直接選ぶボタンは除去しました。ほかの操作は残しています。

`input-bar` でも左右が資料で確定していない版があります。下表の左右は取り付け先の指定であり、当時の左右位置を確認できたという意味ではありません。未確認部分は `unverified` と記しています。

`none` はモデル用の印を付けません。`other` で位置・手順が未確認の版にも推測で印を付けません。切り替え位置が不明なことと、切り替え機能がなかったことは区別しています。

今回の対象には `where: settings` の版はありません。Playground 2023-11の `other` は既存のアシスタント設定欄に受け口を置き、設定画面を追加する必要はありませんでした。

## chatgpt.js

判断元: [chatgpt.json](era/chatgpt.json)。

| 版 | model_switch.where | data-era-slot | data-era-input | 位置・未確認部分 | 出典URL |
| --- | --- | --- | --- | --- | --- |
| chatgpt-2022-11 | none | なし | 送信用の文章欄 | 年代データが none のため、モデル用の受け口を置かない。 モデル選択は2023年2月9日の更新で追加。公開初期のモデル名の画面表記は unverified。 | [資料1](https://openai.com/index/chatgpt/) [資料2](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2022-12 | none | なし | 送信用の文章欄 | 年代データが none のため、モデル用の受け口を置かない。 モデル選択は2023年2月9日の更新で追加。公開初期のモデル名の画面表記は unverified。 | [資料1](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2023-03 | top-dropdown | top | 送信用の文章欄 | 上部。左右の細かな位置は unverified。 Plusの例。上部配置は2月9日の説明に基づく継続の推定。3月14日の正確な位置と全ラベルは unverified。 | [資料1](https://openai.com/index/gpt-4-research/) [資料2](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2023-05 | top-dropdown | top | 送信用の文章欄 | 上部。左右の細かな位置は unverified。 Plusの例。GPT-4内の機能を選ぶ操作。上部の正確な形と全項目は unverified。 | [資料1](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2023-07 | top-dropdown | top | 送信用の文章欄 | 上部。左右の細かな位置は unverified。 Plusの例。設定と会話側の両方で選択する。選択メニューの全項目は unverified。 | [資料1](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2023-09 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 画像対応の公開は確認。9月当日の切替位置・全項目・初期値は unverified。 | [資料1](https://openai.com/index/chatgpt-can-now-see-hear-and-speak/) [資料2](https://openai.com/index/gpt-4-research/) |
| chatgpt-2023-11 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 閲覧・分析・画像生成の個別切替を省いた更新は確認。上部左の正確な配置は unverified。 | [資料1](https://openai.com/index/introducing-gpts/) |
| chatgpt-2024-05 | top-dropdown | top | 送信用の文章欄 | 上部。左右の細かな位置は unverified。 5月17日更新時の有料Web版の例。上部の左右位置と初期値は unverified。段階公開で候補が異なる。 | [資料1](https://openai.com/index/gpt-4o-and-more-tools-to-chatgpt-free/) [資料2](https://www.tomsguide.com/ai/chatgpt/gpt-4o-is-openais-exciting-new-model-heres-how-to-get-access) |
| chatgpt-2024-05-macos | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 初期Mac版のモデル切替位置・全ラベル・初期値は unverified。 | [資料1](https://openai.com/index/gpt-4o-and-more-tools-to-chatgpt-free/) |
| chatgpt-2024-08-macos | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 小窓の追加は確認。8月のモデル切替位置は unverified。 | [資料1](https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes) |
| chatgpt-2024-09 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 Plus・Teamの公開日の例。選択メニューの座標と全項目は unverified。 | [資料1](https://openai.com/index/introducing-openai-o1-preview/) |
| chatgpt-2024-10 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 選択肢の原文ラベルと座標は unverified。Canvasが試験中にモデル選択へ入っていたことを確認。 | [資料1](https://openai.com/index/introducing-canvas/) |
| chatgpt-2024-11-macos | input-bar | input-left | 送信用の文章欄 | 入力欄内。左右は unverified（取り付け先は input-left）。 記事の画像説明でo1-previewを確認。全項目と初期値は unverified。 | [資料1](https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes) |
| chatgpt-2024-11 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 履歴欄の更新資料はモデル切替位置を説明していない。 | [資料1](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) [資料2](https://openai.com/index/introducing-openai-o1-preview/) |
| chatgpt-2024-12 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 Proの確認済みの選択肢。選択位置、全一覧、初期値は unverified。 | [資料1](https://openai.com/index/introducing-chatgpt-pro/) |
| chatgpt-2025-02 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 入力欄のDeep researchの操作をrelated_controlsに記録。通常のモデル切替の位置・全一覧・初期値は unverified。 | [資料1](https://openai.com/index/introducing-deep-research/) |
| chatgpt-2025-04 | input-bar | input-left | 送信用の文章欄 | 入力欄内。左右は unverified（取り付け先は input-left）。 代表画面は無料版。Thinkを押すとo4-miniを使用する。有料版はモデル選択にo3、o4-mini、o4-mini-highが並ぶ。無料版に並ぶモデル名の候補一覧は unverified。 | [資料1](https://openai.com/index/introducing-o3-and-o4-mini/) |
| chatgpt-2025-06-macos | input-bar | input-left | 送信用の文章欄 | 入力欄内。左右は unverified（取り付け先は input-left）。 11月14日に追加された入力欄の選択を継続したという推定。6月4日のラベル・全一覧は unverified。 | [資料1](https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes) [資料2](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2025-08 | top-dropdown | top | 送信用の文章欄 | 上部左側。 8月22日の有料Web版の例。8月7日の公開後に候補が変わったため、8月12日の更新と照合。全一覧と初期値は unverified。 | [資料1](https://openai.com/index/introducing-gpt-5/) [資料2](https://help.openai.com/en/articles/9624314-model-release-notes) [資料3](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) [資料4](https://www.tomsguide.com/ai/missing-chatgpt-4-after-the-gpt-5-roll-out-heres-how-to-bring-it-back) |
| chatgpt-2026-02 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 調査の入口とモデル切替の位置を区別して確認する必要がある。モデル切替は unverified。 | [資料1](https://openai.com/index/introducing-deep-research/) [資料2](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2026-04 | input-bar | input-left | 送信用の文章欄 | 入力欄内。左右は unverified（取り付け先は input-left）。 4月28日のWeb版更新を代表画面に選択。3月17日の候補名を参照。4月28日当日の全一覧と初期値は unverified。 | [資料1](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| chatgpt-2026-11 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 代表画面は仕様のdot。dotのモデル選択位置・選択肢・初期値は unverified。 | [資料1](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot) |

## playground.js

判断元: [openai-playground.json](era/openai-playground.json)。

| 版 | model_switch.where | data-era-slot | data-era-input | 位置・未確認部分 | 出典URL |
| --- | --- | --- | --- | --- | --- |
| openai-playground-2020-06 | other | なし | 文章と生成された続きの共有編集欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 公開日のモデル選択ラベル、配置、一覧、初期値は unverified。 | [資料1](https://openai.com/index/openai-api/) |
| openai-playground-2020-08 | top-dropdown | top | 文章と生成された続きの共有編集欄 | 上部右側。 モデル選択は画面右上。本文で確認できたdavinciを収録。メニューの見出し、全一覧、初期値は unverified。 | [資料1](https://www.twilio.com/en-us/blog/developers/ultimate-guide-openai-gpt-3-language-model) |
| openai-playground-2021-11 | other | なし | 文章と生成された続きの共有編集欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 改良後のモデル選択の位置、各モデル名の正確な表記は unverified。 | [資料1](https://openai.com/index/api-no-waitlist/) |
| openai-playground-2022-03 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 編集用モデルの識別名は本文で確認。画面の選択肢の綴りと位置は unverified。 | [資料1](https://openai.com/index/gpt-3-edit-insert/) |
| openai-playground-2023-03 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 右上のModeからChatへ切り替える操作を確認。モデル欄自体の当日の位置・ラベル・候補・初期値は unverified。 | [資料1](https://community.openai.com/t/gpt-4-not-visible-in-the-api-playground-even-though-i-have-been-invited-for-the-limited-beta/105886) |
| openai-playground-2023-11 | other | settings | 送信用の文章欄 | 既存のアシスタント設定欄のモデル位置。設定して保存する手順に対応。正確な配置と候補は unverified。 モデル欄の存在を確認。正確な画面内の位置、選択肢、初期値は unverified。 | [資料1](https://dev.classmethod.jp/articles/4e7a92449ab74724778e8da65fa0006bdabbe660/) [資料2](https://openai.com/index/new-models-and-developer-products-announced-at-devday/) |
| openai-playground-2024-05 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 GPT-4oのAPI提供は確認。Playgroundの当日のモデル欄の位置と一覧は unverified。 | [資料1](https://developers.openai.com/api/docs/changelog) |
| openai-playground-2024-10 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 Voiceは声の選択。モデル自体の切替位置と一覧は unverified。 | [資料1](https://dev.classmethod.jp/articles/openai-realtime-api-on-playground/) [資料2](https://openai.com/index/introducing-the-realtime-api/) |
| openai-playground-2025-03 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 Responsesを試す入口は確認。モデル欄の位置と一覧は unverified。 | [資料1](https://openai.com/index/new-tools-for-building-agents/) |
| openai-playground-2025-06 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 モデル設定をPromptsへ保存できる。モデル欄の場所、選択肢、初期値は unverified。 | [資料1](https://community.openai.com/t/enhanced-prompt-management/1290305) |
| openai-playground-2026-06 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 6月15日固有の改修を確認できない。配置、選択肢、初期値は unverified。 | [資料1](https://help.openai.com/en/articles/9824968-prompt-management-in-playground) |

## gpt2.js

判断元: [openai-gpt-2-interactive.json](era/openai-gpt-2-interactive.json)。

| 版 | model_switch.where | data-era-slot | data-era-input | 位置・未確認部分 | 出典URL |
| --- | --- | --- | --- | --- | --- |
| openai-gpt-2-2019-02 | cli-flag | input-left | 送信用の文章欄 | 入力行に空の受け口。終了して --model_name を付けて再起動する画面内の手順はV1が担当。左右は表示上の指定。 コマンドに付ける指定で変更する。端末アプリ名とOSの版は unverified。 | [資料1](https://raw.githubusercontent.com/openai/gpt-2/9d1e704fec1726d5e051e98336b655ae8ce49242/src/interactive_conditional_samples.py) [資料2](https://raw.githubusercontent.com/openai/gpt-2/0465394bd312e564fe8fc2e600f562369037636b/README.md) |
| openai-gpt-2-2019-05 | cli-flag | input-left | 送信用の文章欄 | 入力行に空の受け口。終了して --model_name を付けて再起動する画面内の手順はV1が担当。左右は表示上の指定。 コマンドに付ける指定で変更する。端末アプリ名とOSの版は unverified。 | [資料1](https://raw.githubusercontent.com/openai/gpt-2/e5c5054474f583d6d9499624649353995d63c70a/src/interactive_conditional_samples.py) [資料2](https://raw.githubusercontent.com/openai/gpt-2/dd75299dfec802cc0ee8b7bcc7ac4c2d05622bf8/README.md) |
| openai-gpt-2-2019-08 | cli-flag | input-left | 送信用の文章欄 | 入力行に空の受け口。終了して --model_name を付けて再起動する画面内の手順はV1が担当。左右は表示上の指定。 コマンドに付ける指定で変更する。端末アプリ名とOSの版は unverified。 | [資料1](https://raw.githubusercontent.com/openai/gpt-2/ac5d52295f8a1c3856ea24fb239087cc1a3d1131/src/interactive_conditional_samples.py) [資料2](https://raw.githubusercontent.com/openai/gpt-2/f35fa1d920e9d2d0690f66d03aa3f76b3c59230e/README.md) |
| openai-gpt-2-2019-11 | cli-flag | input-left | 送信用の文章欄 | 入力行に空の受け口。終了して --model_name を付けて再起動する画面内の手順はV1が担当。左右は表示上の指定。 コマンドに付ける指定で変更する。端末アプリ名とOSの版は unverified。 | [資料1](https://raw.githubusercontent.com/openai/gpt-2/ac5d52295f8a1c3856ea24fb239087cc1a3d1131/src/interactive_conditional_samples.py) [資料2](https://raw.githubusercontent.com/openai/gpt-2/fbae7db92a722d85b8ab058a6076d22963dc8ce9/README.md) [資料3](https://openai.com/index/gpt-2-1-5b-release/) [資料4](https://raw.githubusercontent.com/openai/gpt-2/fbae7db92a722d85b8ab058a6076d22963dc8ce9/DEVELOPERS.md) |

## claude.js

判断元: [claude.ai.json](era/claude.ai.json)。

| 版 | model_switch.where | data-era-slot | data-era-input | 位置・未確認部分 | 出典URL |
| --- | --- | --- | --- | --- | --- |
| claude.ai-2023-07 | none | なし | 送信用の文章欄 | 年代データが none のため、モデル用の受け口を置かない。 公開時はClaude 2のWebベータ。モデル切替の操作は資料に記載がなく、内部設定の有無は unverified。 | [資料1](https://www.anthropic.com/news/claude-2) |
| claude.ai-2023-11 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 Claude 2.1への更新は確認。旧版を選べたか、切替場所と初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-2-1) |
| claude.ai-2024-03 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 Proの例。レビュー本文で3種類を確認。入力欄との左右位置、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-3-family) [資料2](https://www.watch.impress.co.jp/docs/topic/1581763.html) [資料3](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude.ai-2024-06 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-3-5-sonnet) [資料2](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude.ai-2024-09 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-3-5-sonnet) [資料2](https://claude.com/resources/articles/claude-for-enterprise) [資料3](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude.ai-2024-10 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://claude.com/resources/articles/analysis-tool) [資料2](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude.ai-2024-11 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.testingcatalog.com/claude-ai-got-new-model-selector-context-connectors-in-development/) [資料2](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude.ai-2025-02 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-3-7-sonnet) [資料2](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude.ai-2025-03 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-3-7-sonnet) [資料2](https://claude.com/resources/articles/web-search) [資料3](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude.ai-2025-04 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-3-7-sonnet) [資料2](https://claude.com/resources/articles/research) [資料3](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude.ai-2025-05 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-4) [資料2](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude.ai-2025-07 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-4) [資料2](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude.ai-2025-09 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-sonnet-4-5) [資料2](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude.ai-2026-02 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 当日のモデル欄の正確なラベル、位置、候補と初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-opus-4-6) [資料2](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings) |
| claude.ai-2026-04 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 同月の選択肢・位置・初期値は unverified。 | [資料1](https://support.claude.com/en/articles/12138966-release-notes) [資料2](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings) |
| claude.ai-2026-06 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 6月12日のモデル欄は unverified。 | [資料1](https://support.claude.com/en/articles/12138966-release-notes) [資料2](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings) |
| claude.ai-2026-07 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 ChatとCoworkの入口とモデル選択を分けて扱う。モデル欄は unverified。 | [資料1](https://support.claude.com/en/articles/12138966-release-notes) [資料2](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings) |
| claude.ai-2026-09 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 統合された版の段階公開。9月当日のモデル欄の場所・全一覧は unverified。 | [資料1](https://support.claude.com/en/articles/12138966-release-notes) [資料2](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings) |
| claude.ai-2026-11 | input-bar | input-right | 送信用の文章欄 | 送信ボタンの直前。More modelsの操作はV1が取り付ける。 2026-11-15閲覧時の操作。More modelsはメニュー内の追加項目。契約と管理者設定で候補が変わるため全一覧は unverified。 | [資料1](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings) |

## claude-desktop.js

判断元: [claude-desktop.json](era/claude-desktop.json)。

| 版 | model_switch.where | data-era-slot | data-era-input | 位置・未確認部分 | 出典URL |
| --- | --- | --- | --- | --- | --- |
| claude-desktop-2024-10 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 初期Desktopのモデル欄の位置、候補、初期値は unverified。 | [資料1](https://www.maginative.com/article/claude-desktop-app-now-available-for-mac-and-windows/) |
| claude-desktop-2024-11 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 Webの旧説明と候補の報道を参照。Desktop当日の左右位置と全候補は unverified。 | [資料1](https://www.testingcatalog.com/claude-ai-got-new-model-selector-context-connectors-in-development/) [資料2](https://www.anthropic.com/news/model-context-protocol) [資料3](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude-desktop-2025-02 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 Desktop当日の左右位置、旧モデルの一覧、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-3-7-sonnet) [資料2](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude-desktop-2025-05 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-4) [資料2](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude-desktop-2025-06 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-4) [資料2](https://www.anthropic.com/research/desktop-extensions) [資料3](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude-desktop-2025-08 | input-bar | input-left | 送信用の文章欄 | 入力欄内の下段。左右は unverified（取り付け先は input-left）。 入力欄付近のモデル名から選ぶ旧説明を参照。当日の左右位置、全項目、初期値は unverified。 | [資料1](https://www.anthropic.com/news/claude-4) [資料2](https://www.anthropic.com/research/desktop-extensions) [資料3](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with) |
| claude-desktop-2025-10 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 小窓の現行操作は確認。2025年10月のモデル切替位置と候補は unverified。 | [資料1](https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac) [資料2](https://www.maginative.com/article/claude-desktop-app-now-available-for-mac-and-windows/) |
| claude-desktop-2026-01 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 最初のCoworkのモデル切替操作は unverified。 | [資料1](https://simonwillison.net/2026/Jan/12/claude-cowork/) |
| claude-desktop-2026-03 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 3月当日のモデル切替位置、候補、初期値は unverified。 | [資料1](https://support.claude.com/en/articles/12138966-release-notes) [資料2](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings) |
| claude-desktop-2026-05 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 この版はDesktop内のCode画面。Codeのモデル欄の正確な場所と候補は unverified。 | [資料1](https://claude.com/resources/articles/claude-code-desktop-redesign) |
| claude-desktop-2026-08 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 8月当日のモデル切替は unverified。 | [資料1](https://support.claude.com/en/articles/12138966-release-notes) [資料2](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings) |
| claude-desktop-2026-11 | input-bar | input-right | 送信用の文章欄 | 送信ボタンの直前。More modelsの操作はV1が取り付ける。 2026-11-15閲覧時の操作。More modelsはメニュー内の追加項目。契約と管理者設定で候補が変わるため全一覧は unverified。 | [資料1](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings) |

## bing.js

判断元: [bing-chat-microsoft-copilot.json](era/bing-chat-microsoft-copilot.json)。

| 版 | model_switch.where | data-era-slot | data-era-input | 位置・未確認部分 | 出典URL |
| --- | --- | --- | --- | --- | --- |
| bing-chat-microsoft-copilot-2023-02 | none | なし | 送信用の文章欄 | 年代データが none のため、モデル用の受け口を置かない。 公開資料に利用者が基盤モデルを指定する操作は示されていない。 | [資料1](https://blogs.microsoft.com/blog/2023/02/07/reinventing-search-with-a-new-ai-powered-microsoft-bing-and-edge-your-copilot-for-the-web/) |
| bing-chat-microsoft-copilot-2023-03 | none | なし | 送信用の文章欄 | 年代データが none のため、モデル用の受け口を置かない。 基盤モデル名の選択欄は資料にない。会話の調子を選ぶ操作をrelated_controlsに収録。 | [資料1](https://blogs.bing.com/search/2023/3/Bing-Preview-Release-Notes-Tone-Changes-and-More/) |
| bing-chat-microsoft-copilot-2023-05 | none | なし | 送信用の文章欄 | 年代データが none のため、モデル用の受け口を置かない。 基盤モデル名の選択欄は資料にない。当日の調子の切替位置は unverified。 | [資料1](https://blogs.microsoft.com/blog/2023/05/04/announcing-the-next-wave-of-ai-innovation-with-microsoft-bing-and-edge/) [資料2](https://blogs.bing.com/search/2023/3/Bing-Preview-Release-Notes-Tone-Changes-and-More/) |
| bing-chat-microsoft-copilot-2023-07 | none | なし | 送信用の文章欄 | 年代データが none のため、モデル用の受け口を置かない。 基盤モデル名の選択欄は資料にない。当日の調子の切替位置は unverified。 | [資料1](https://blogs.bing.com/search/2023/7/Bing-Chat-Enterprise-announced,-multimodal-Visual-Search-rolling-out-to-Bing-Chat/) [資料2](https://blogs.bing.com/search/2023/3/Bing-Preview-Release-Notes-Tone-Changes-and-More/) |
| bing-chat-microsoft-copilot-2023-11 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 専用のCopilot会話へ移行。当日のモデル選択と調子の切替位置は unverified。 | [資料1](https://blogs.bing.com/search/2023/11/our-vision-to-bring-microsoft-copilot-to-everyone-and-more/) [資料2](https://blogs.bing.com/search/2023/3/Bing-Preview-Release-Notes-Tone-Changes-and-More/) |
| bing-chat-microsoft-copilot-2024-02 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 モデル名の選択欄とGPT-4 Turboの切替条件は unverified。 | [資料1](https://blogs.microsoft.com/blog/2024/02/07/delivering-copilot-for-everyone/) |
| bing-chat-microsoft-copilot-2024-03 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 Notebookの切替は作業画面の変更。モデル選択欄の位置と候補は unverified。 | [資料1](https://www.windowscentral.com/software-apps/microsoft-copilots-new-feature-can-finally-handle-complex-projects-and-supports-up-to-18000-characters-but-it-has-one-major-downside) |
| bing-chat-microsoft-copilot-2024-10 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 Think Deeperは考えるモード。当日の基盤モデルの選択欄の有無は unverified。 | [資料1](https://blogs.microsoft.com/blog/2024/10/01/an-ai-companion-for-everyone/) |
| bing-chat-microsoft-copilot-2025-03-macos | other | なし | 送信用の文章欄＋小さな入力窓 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 Mac版でThink Deeperを利用できる。モデル名の直接選択とモードの正確な場所は unverified。 | [資料1](https://www.tomshardware.com/software/macos/copilot-gets-its-own-app-for-the-mac) |
| bing-chat-microsoft-copilot-2025-04 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 機能の拡張は確認。当日のモデル選択とThink Deeperの正確な場所は unverified。 | [資料1](https://blogs.microsoft.com/blog/2025/04/04/your-ai-companion/) |
| bing-chat-microsoft-copilot-2026-03 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 Smartの導入は2025年8月7日。2026年3月当日の全候補と正確なラベルは unverified。 | [資料1](https://www.microsoft.com/en-us/microsoft-copilot/blog/2025/08/07/release-notes-august-7-2025/?msockid=3a9cb2b069a26f4000daa4fe68bb6eb1) [資料2](https://support.microsoft.com/en-us/microsoft-365-copilot/conversation-modes-in-microsoft-copilot) |
| bing-chat-microsoft-copilot-2026-11 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 仕様が参照する企業向けCopilotの例。基盤モデルの選択位置と一覧は unverified。 | [資料1](https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/what%E2%80%99s-new-in-microsoft-copilot--october-2026/4568528) |

## gemini.js

判断元: [google-bard-gemini.json](era/google-bard-gemini.json)。

| 版 | model_switch.where | data-era-slot | data-era-input | 位置・未確認部分 | 出典URL |
| --- | --- | --- | --- | --- | --- |
| google-bard-gemini-2023-03 | none | なし | 送信用の文章欄 | 年代データが none のため、モデル用の受け口を置かない。 公開資料では提供側が会話のモデルを更新。利用者が基盤モデル名を選ぶ欄は確認できない。 | [資料1](https://blog.google/innovation-and-ai/products/try-bard/) |
| google-bard-gemini-2023-07 | none | なし | 送信用の文章欄 | 年代データが none のため、モデル用の受け口を置かない。 公開資料では提供側が会話のモデルを更新。利用者が基盤モデル名を選ぶ欄は確認できない。 | [資料1](https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-july-2023/) |
| google-bard-gemini-2023-09 | none | なし | 送信用の文章欄 | 年代データが none のため、モデル用の受け口を置かない。 公開資料では提供側が会話のモデルを更新。利用者が基盤モデル名を選ぶ欄は確認できない。 | [資料1](https://blog.google/products-and-platforms/products/gemini/google-bard-new-features-update-sept-2023/) |
| google-bard-gemini-2023-12 | none | なし | 送信用の文章欄 | 年代データが none のため、モデル用の受け口を置かない。 公開資料では提供側が会話のモデルを更新。利用者が基盤モデル名を選ぶ欄は確認できない。 | [資料1](https://blog.google/products-and-platforms/products/gemini/google-bard-try-gemini-ai/) |
| google-bard-gemini-2024-02 | top-dropdown | top | 送信用の文章欄 | 上部左側。 左上で利用先を切替。有料のAdvancedを使えるアカウントの例。初期値は契約と状態で変わるため unverified。 | [資料1](https://9to5google.com/2024/02/08/google-gemini-advanced/) [資料2](https://blog.google/products-and-platforms/products/gemini/bard-gemini-advanced-app/) [資料3](https://9to5google.com/2025/10/23/gemini-model-switcher-redesign/) |
| google-bard-gemini-2024-05 | top-dropdown | top | 送信用の文章欄 | 上部左側。 2月の左上の切替と10月の移動記事から同じ位置の継続を推定。5月14日の細かなラベルは unverified。 | [資料1](https://9to5google.com/2024/02/08/google-gemini-advanced/) [資料2](https://blog.google/products-and-platforms/products/gemini/google-gemini-update-may-2024/) [資料3](https://9to5google.com/2025/10/23/gemini-model-switcher-redesign/) |
| google-bard-gemini-2024-08 | top-dropdown | top | 送信用の文章欄 | 上部左側。 左上の継続として収録。当日の候補の全一覧と初期値は unverified。 | [資料1](https://9to5google.com/2024/02/08/google-gemini-advanced/) [資料2](https://blog.google/products-and-platforms/products/gemini/google-gemini-update-august-2024/) [資料3](https://9to5google.com/2025/10/23/gemini-model-switcher-redesign/) |
| google-bard-gemini-2024-09 | top-dropdown | top | 送信用の文章欄 | 上部左側。 左上の継続として収録。記事は一つのアカウントの試験表示。全員への適用日と当日の候補は unverified。 | [資料1](https://9to5google.com/2024/02/08/google-gemini-advanced/) [資料2](https://9to5google.com/2024/09/11/gemini-homepage-redesign/) [資料3](https://9to5google.com/2025/10/23/gemini-model-switcher-redesign/) |
| google-bard-gemini-2024-12 | top-dropdown | top | 送信用の文章欄 | 上部左側。 Webの左上。公式記事の引用ラベルを収録。全項目と初期値は unverified。 | [資料1](https://9to5google.com/2024/02/08/google-gemini-advanced/) [資料2](https://blog.google/products-and-platforms/products/gemini/google-gemini-deep-research/) [資料3](https://9to5google.com/2024/12/20/gemini-advanced-deep-research/) [資料4](https://9to5google.com/2025/10/23/gemini-model-switcher-redesign/) |
| google-bard-gemini-2025-03 | top-dropdown | top | 送信用の文章欄 | 上部左側。 Webの左上。確認済みの選択名を収録。残りの候補と初期値は unverified。 | [資料1](https://9to5google.com/2024/02/08/google-gemini-advanced/) [資料2](https://blog.google/products-and-platforms/products/gemini/new-gemini-app-features-march-2025/) [資料3](https://blog.google/products-and-platforms/products/gemini/gemini-collaboration-features/) [資料4](https://9to5google.com/2025/10/23/gemini-model-switcher-redesign/) |
| google-bard-gemini-2025-06 | top-dropdown | top | 送信用の文章欄 | 上部左側。 5月20日の初期モデルの説明と10月23日の移動前のモデル表記を参照。6月17日当日の全一覧は unverified。 | [資料1](https://9to5google.com/2024/02/08/google-gemini-advanced/) [資料2](https://blog.google/products-and-platforms/products/gemini/gemini-app-updates-io-2025/) [資料3](https://9to5google.com/2025/10/23/gemini-model-switcher-redesign/) |
| google-bard-gemini-2025-12 | input-bar | input-right | 送信用の文章欄 | 入力欄内。左右は unverified（取り付け先は input-right）。 10月23日の移動記事と12月17日の選択名を組み合わせて確認。初期値は unverified。 | [資料1](https://9to5google.com/2025/10/23/gemini-model-switcher-redesign/) [資料2](https://blog.google/products-and-platforms/products/gemini/gemini-3-flash-gemini-app/) |
| google-bard-gemini-2026-11 | input-bar | input-right | 送信用の文章欄 | 入力欄内の下段。右寄せは表示上の指定で、左右は unverified。 代表画面はGoogle AI UltraのChat。現行ヘルプの候補を収録。実画面の長い表記と初期値は unverified。 | [資料1](https://support.google.com/gemini/answer/18648722?hl=en&co=GENIE.Platform%3DDesktop) [資料2](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/) [資料3](https://9to5google.com/2025/10/23/gemini-model-switcher-redesign/) |

## claude-code.js

判断元: [claude-code.json](era/claude-code.json)。

| 版 | model_switch.where | data-era-slot | data-era-input | 位置・未確認部分 | 出典URL |
| --- | --- | --- | --- | --- | --- |
| claude-code-2025-02 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 | [資料1](https://www.anthropic.com/news/claude-3-7-sonnet) |
| claude-code-2025-04 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 | [資料1](https://raw.githubusercontent.com/anthropics/claude-code/555b6b5b8a5f06f1e8725a584e62fb6b7c8eece5/README.md) |
| claude-code-2025-05 | slash-command | なし | 送信用の文章欄 | 常設のモデル欄を置かず、入力行の /model をV1が受け取る。 | [資料1](https://github.com/anthropics/claude-code/issues/1243) [資料2](https://www.anthropic.com/news/claude-4) |
| claude-code-2025-07 | slash-command | なし | 送信用の文章欄 | 常設のモデル欄を置かず、入力行の /model をV1が受け取る。 | [資料1](https://github.com/anthropics/claude-code/issues/2806) |
| claude-code-2025-09 | slash-command | なし | 送信用の文章欄 | 常設のモデル欄を置かず、入力行の /model をV1が受け取る。 | [資料1](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously) [資料2](https://raw.githubusercontent.com/anthropics/claude-code/v2.0.74/CHANGELOG.md) |
| claude-code-2025-10 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 | [資料1](https://claude.com/resources/articles/claude-code-on-the-web) |
| claude-code-2025-11 | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 | [資料1](https://www.anthropic.com/news/claude-opus-4-5) |
| claude-code-2025-12 | slash-command | なし | 送信用の文章欄 | 常設のモデル欄を置かず、入力行の /model をV1が受け取る。 | [資料1](https://github.com/anthropics/claude-code/releases/tag/v2.0.74) [資料2](https://raw.githubusercontent.com/anthropics/claude-code/v2.0.74/CHANGELOG.md) |
| claude-code-2026-02 | slash-command | なし | 送信用の文章欄 | 常設のモデル欄を置かず、入力行の /model をV1が受け取る。 | [資料1](https://github.com/anthropics/claude-code/releases/tag/v2.1.51) [資料2](https://raw.githubusercontent.com/anthropics/claude-code/v2.1.51/CHANGELOG.md) |
| claude-code-2026-04-macos | other | なし | 送信用の文章欄 | unverified：モデル選択の正確な位置を決めず、従来の選択欄を除去。 | [資料1](https://claude.com/resources/articles/claude-code-desktop-redesign) |
| claude-code-2026-05 | slash-command | なし | 送信用の文章欄 | 常設のモデル欄を置かず、入力行の /model をV1が受け取る。 | [資料1](https://github.com/anthropics/claude-code/releases/tag/v2.1.145) [資料2](https://raw.githubusercontent.com/anthropics/claude-code/v2.1.145/CHANGELOG.md) |
| claude-code-2026-08 | slash-command | なし | 送信用の文章欄 | 常設のモデル欄を置かず、入力行の /model をV1が受け取る。 | [資料1](https://github.com/anthropics/claude-code/releases/tag/v2.1.238) [資料2](https://raw.githubusercontent.com/anthropics/claude-code/v2.1.238/CHANGELOG.md) |
| claude-code-2026-10 | slash-command | なし | 送信用の文章欄 | 常設のモデル欄を置かず、入力行の /model をV1が受け取る。 | [資料1](https://github.com/anthropics/claude-code/releases/tag/v2.1.316) [資料2](https://raw.githubusercontent.com/anthropics/claude-code/v2.1.316/CHANGELOG.md) |
| claude-code-2026-11 | slash-command | なし | 送信用の文章欄 | 常設のモデル欄を置かず、入力行の /model をV1が受け取る。 | [資料1](https://github.com/anthropics/claude-code/releases/tag/v2.1.325) [資料2](https://raw.githubusercontent.com/anthropics/claude-code/v2.1.325/CHANGELOG.md) |

## 検証と引き継ぎ

完了：107版の送信用入力に印を追加。42か所の受け口を追加し、9版は `/model` を使うため常設欄を置きません。11版は `none`、45版は切り替え位置が `unverified` のため受け口を置いていません。各版の記録は上の107行です。

8ファイルそれぞれに `node --check web/js/tools/<file>.js` を実行。全件で終了コード0、標準出力・標準エラー出力ともに空。

追加確認として `node --input-type=module` に標準入力から `node:test` の検証コードを渡して実行。通信を禁止したメモリー上の簡易DOMで全107版を描画し、入力の印、空の受け口、既存選択欄の除去、送信、V1への取り付け・取り外し、9版の `/model` で一覧が開くこと、記録の行数を確認しました。出力は `tests 8`、`pass 8`、`fail 0`、終了コード0。集計出力は `{"versions":107,"slots":42,"mounted":51,"slashCommands":9}`。簡易DOMは見た目やブラウザー固有の挙動を検証しません。検証コードはファイルに保存していません。

ブラウザー、アプリ、サーバー、ビルドは起動していません。画面の見た目は未確認です。

V1への確認事項：GPT-2の画面内の再起動コマンドには、年代データの `--model_name` を使う必要があります。今回読み取った `web/js/era/model-switch.js` は共通の `${era.tool_id} --model` 表示を使っています。このファイルは担当外なので変更していません。根拠は上のGPT-2各行の固定版ソースURLです。
