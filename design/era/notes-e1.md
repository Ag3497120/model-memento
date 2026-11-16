# E1 年代別の操作と画面の手掛かり

出典の閲覧日は2026年11月15日。最終のオフライン確認日は2026年11月16日。

## 納品ファイル

| ファイル | 版数 | アクセント数 |
| --- | --- | --- |
| [chatgpt.json](./chatgpt.json) | 22 | 22 |
| [openai-playground.json](./openai-playground.json) | 11 | 11 |
| [openai-gpt-2-interactive.json](./openai-gpt-2-interactive.json) | 4 | 4 |
| [claude.ai.json](./claude.ai.json) | 19 | 19 |
| [claude-desktop.json](./claude-desktop.json) | 12 | 12 |
| [bing-chat-microsoft-copilot.json](./bing-chat-microsoft-copilot.json) | 12 | 14 |
| [google-bard-gemini.json](./google-bard-gemini.json) | 13 | 13 |
| 合計 | 93 | 95 |

このノートを含めて指定の8ファイルを作成した。

## 作業項目の状態

| 項目 | 状態 | 確認結果 |
| --- | --- | --- |
| 仕様の全版を収録 | done | 7仕様の93版と一致、重複なし |
| モデルの切替 | partly | 41版の場所は `other` とし、詳細を `unverified` で記録 |
| 年代の手掛かり | done / partly | 全93版に計95件、各件に日付付き出典あり、掲示位置や原文が未確認の件あり |
| OS・窓・代表日・傾向 | done / partly | 全版に記録、OSの版や当日の詳細が未確認の件あり |
| JSONと日付の検査 | done | 下記のオフライン検査で8件成功、0件失敗 |
| 画面への組み込み・表示確認 | 別担当の確認事項 | `server.js`・`web/js/app.js`・`web/js/nav.js` の担当範囲 |

## 記録上の選択

- `desktop.date_shown` は資料を使って説明するために選んだ代表日。各仕様の期間内に置いた。Web版を基本とし、Mac固有の版とClaude DesktopはMac版を選んだ。
- `accents[].when` は代表日1日の範囲。前に公開された機能を採用した場合、その公開日を出典の `date` に残した。
- `sources[].date_type` は公開日、更新記録の項目日、投稿日、固定コミットの日を表す。公開日不明の資料は `date: null` と `date_type: undated`、閲覧日は `accessed_on` に記録した。
- `options` は確認した候補を記録し、全一覧の確認範囲を `notes` に記した。`default: null` と `label: unverified` は確認できた初期値や短い表示名がない項目を表す。
- `where: other` と `notes` の `unverified` は、当日の切替位置を確認できなかった項目を表す。`none` の説明には、資料上で確認した公開形態を記した。
- `trend` は、資料に記載された操作・配置からの観察上の解釈。文章末に根拠のURLを付けた。
- `notes`、`desktop.sources`、`sources[].shows` は確認範囲を補足する欄。Bingの `related_controls` には、会話の調子や仕事の種類を選ぶ実際の操作を記録した。
- Code Interpreterはプログラムを使って計算する機能、CanvasとArtifactsは会話の横で文章や作成物を編集する作業面として記述した。

## 配置を判断するための記録

- 2020年8月のPlaygroundのモデル選択は右上。生成の細かな設定は右の欄。本文を読み直してモデル選択の位置を修正した。 [Twilioの当時の利用記録](https://www.twilio.com/en-us/blog/developers/ultimate-guide-openai-gpt-3-language-model)
- GPT-2は当時の固定コミットを参照。2月と5月の初期値は117M、8月後半と11月は124M。起動コマンドの `--model_name` で選択する。 [2月のコード](https://raw.githubusercontent.com/openai/gpt-2/9d1e704fec1726d5e051e98336b655ae8ce49242/src/interactive_conditional_samples.py)、[8月のコード](https://raw.githubusercontent.com/openai/gpt-2/ac5d52295f8a1c3856ea24fb239087cc1a3d1131/src/interactive_conditional_samples.py)
- ChatGPTのMac版は2024年11月14日に入力欄からモデルとTemporary Chatを操作できる更新がある。Web版の入力欄への移動は2026年4月28日の更新として収録した。 [Mac版の更新記録](https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes)、[Web版の更新記録](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- Geminiは2024年2月に左上の利用先切替を確認し、2025年10月23日の報道で入力欄への移動を確認した。12月版は入力欄内にFast・Thinking・Proを置く。 [2024年2月の報道](https://9to5google.com/2024/02/08/google-gemini-advanced/)、[2025年10月の報道](https://9to5google.com/2025/10/23/gemini-model-switcher-redesign/)、[12月の公式発表](https://blog.google/products-and-platforms/products/gemini/gemini-3-flash-gemini-app/)
- Bingの上限は代表日ごとに記録した。2023年2月17日は1会話5往復・1日50往復、3月3日は1会話6往復と返答下の回数表示。 [2月17日の更新](https://blogs.bing.com/search/2023/2/The-new-Bing-Edge-Updates-to-Chat/)、[3月3日の更新](https://blogs.bing.com/search/2023/3/Bing-Preview-Release-Notes-Tone-Changes-and-More/)

## レビュー時に確認が必要な点

- 画面への組み込みでは、各版の `model_switch` と確認範囲の `notes` を扱う処理が必要。共通のModel Mementoメニューと当時の製品内メニューの配置は、画面担当者の確認事項。
- Claudeの2024〜2025年の入力欄付近の位置は、検索に残る旧ヘルプの説明を参照した。当日の左右位置、全候補、初期値は `unverified`。現行ヘルプでは送信ボタン横のモデル名とMore modelsを確認した。 [旧ヘルプのURL](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with)、[現行ヘルプ](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings)
- Playgroundの2026年6月15日固有の配置は `unverified`。同版のアクセントは、2025年8月26日に発表されたAssistants終了予定の案内を背景として採用した。Playground内の掲示位置は `unverified`。 [公式の終了予定告知](https://community.openai.com/t/assistants-api-beta-deprecation-august-26-2026-sunset/1354666)
- Bing/Copilotの2026年11月版は、仕様が参照している企業向けCopilotを対象にした。対象製品と契約の範囲についてレビュアーの確認が必要。 [2026年10月の公式更新](https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/what%E2%80%99s-new-in-microsoft-copilot--october-2026/4568528)
- 2022年12月のChatGPTの混雑画面について、原文と出現日は `unverified`。
- 価格・利用上限・段階公開の条件は各出典の日付と `where` に記載した。画面内の固定バナーや数値メーターの位置が未確認の項目には `unverified` を付けた。
- 見た目の再現処理とブラウザー上の動作検査は別担当の確認事項。

## 未確認事項の全版一覧

各JSONの `unverified` と `null` が個別の未確認事項。下表は該当する欄の索引。候補の全一覧や当日の詳細は、各版の `notes` に記録している。

| 版 | 切替場所の記録 | 未確認の欄 |
| --- | --- | --- |
| chatgpt-2022-11 | `none` | 表示名、初期値、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| chatgpt-2022-12 | `none` | 表示名、初期値、候補の全一覧・当日の詳細 |
| chatgpt-2023-03 | `top-dropdown` | 表示名、初期値、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| chatgpt-2023-05 | `top-dropdown` | 初期値、候補の全一覧・当日の詳細 |
| chatgpt-2023-07 | `top-dropdown` | 初期値、候補の全一覧・当日の詳細 |
| chatgpt-2023-09 | `other` | 切替場所・操作、表示名、初期値、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| chatgpt-2023-11 | `other` | 切替場所・操作、表示名、初期値、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| chatgpt-2024-05 | `top-dropdown` | 表示名、初期値、候補の全一覧・当日の詳細 |
| chatgpt-2024-05-macos | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、OS・窓の詳細 |
| chatgpt-2024-08-macos | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、OS・窓の詳細 |
| chatgpt-2024-09 | `other` | 切替場所・操作、表示名、初期値、候補の全一覧・当日の詳細 |
| chatgpt-2024-10 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| chatgpt-2024-11-macos | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細、OS・窓の詳細 |
| chatgpt-2024-11 | `other` | 切替場所・操作、表示名、初期値、候補 |
| chatgpt-2024-12 | `other` | 切替場所・操作、表示名、初期値、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| chatgpt-2025-02 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| chatgpt-2025-04 | `input-bar` | 初期値、候補、候補の全一覧・当日の詳細 |
| chatgpt-2025-06-macos | `input-bar` | 表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文、OS・窓の詳細 |
| chatgpt-2025-08 | `top-dropdown` | 表示名、初期値、候補の全一覧・当日の詳細 |
| chatgpt-2026-02 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細 |
| chatgpt-2026-04 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細 |
| chatgpt-2026-11 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細 |
| openai-playground-2020-06 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| openai-playground-2020-08 | `top-dropdown` | 表示名、初期値、候補の全一覧・当日の詳細 |
| openai-playground-2021-11 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| openai-playground-2022-03 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| openai-playground-2023-03 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| openai-playground-2023-11 | `other` | 切替場所・操作、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| openai-playground-2024-05 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| openai-playground-2024-10 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細 |
| openai-playground-2025-03 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| openai-playground-2025-06 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| openai-playground-2026-06 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文、配置の傾向 |
| openai-gpt-2-2019-02 | `cli-flag` | 候補の全一覧・当日の詳細、OS・窓の詳細 |
| openai-gpt-2-2019-05 | `cli-flag` | 候補の全一覧・当日の詳細、OS・窓の詳細 |
| openai-gpt-2-2019-08 | `cli-flag` | 候補の全一覧・当日の詳細、OS・窓の詳細 |
| openai-gpt-2-2019-11 | `cli-flag` | 候補の全一覧・当日の詳細、OS・窓の詳細 |
| claude.ai-2023-07 | `none` | 表示名、初期値、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| claude.ai-2023-11 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| claude.ai-2024-03 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細 |
| claude.ai-2024-06 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細 |
| claude.ai-2024-09 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| claude.ai-2024-10 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細 |
| claude.ai-2024-11 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| claude.ai-2025-02 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細 |
| claude.ai-2025-03 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細 |
| claude.ai-2025-04 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細 |
| claude.ai-2025-05 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| claude.ai-2025-07 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細 |
| claude.ai-2025-09 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細 |
| claude.ai-2026-02 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文、配置の傾向 |
| claude.ai-2026-04 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文、配置の傾向 |
| claude.ai-2026-06 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細 |
| claude.ai-2026-07 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細 |
| claude.ai-2026-09 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細 |
| claude.ai-2026-11 | `input-bar` | 初期値、候補、候補の全一覧・当日の詳細 |
| claude-desktop-2024-10 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文、OS・窓の詳細 |
| claude-desktop-2024-11 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細、OS・窓の詳細 |
| claude-desktop-2025-02 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細、OS・窓の詳細 |
| claude-desktop-2025-05 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細、OS・窓の詳細 |
| claude-desktop-2025-06 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細、OS・窓の詳細 |
| claude-desktop-2025-08 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細、OS・窓の詳細 |
| claude-desktop-2025-10 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文、OS・窓の詳細 |
| claude-desktop-2026-01 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、OS・窓の詳細 |
| claude-desktop-2026-03 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、OS・窓の詳細 |
| claude-desktop-2026-05 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、OS・窓の詳細 |
| claude-desktop-2026-08 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、OS・窓の詳細 |
| claude-desktop-2026-11 | `input-bar` | 初期値、候補、候補の全一覧・当日の詳細、OS・窓の詳細 |
| bing-chat-microsoft-copilot-2023-02 | `none` | 表示名、初期値 |
| bing-chat-microsoft-copilot-2023-03 | `none` | 表示名、初期値 |
| bing-chat-microsoft-copilot-2023-05 | `none` | 表示名、初期値、候補の全一覧・当日の詳細 |
| bing-chat-microsoft-copilot-2023-07 | `none` | 表示名、初期値、候補の全一覧・当日の詳細 |
| bing-chat-microsoft-copilot-2023-11 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| bing-chat-microsoft-copilot-2024-02 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| bing-chat-microsoft-copilot-2024-03 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| bing-chat-microsoft-copilot-2024-10 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細 |
| bing-chat-microsoft-copilot-2025-03-macos | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、OS・窓の詳細 |
| bing-chat-microsoft-copilot-2025-04 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細 |
| bing-chat-microsoft-copilot-2026-03 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| bing-chat-microsoft-copilot-2026-11 | `other` | 切替場所・操作、表示名、初期値、候補、候補の全一覧・当日の詳細 |
| google-bard-gemini-2023-03 | `none` | 表示名、初期値、手掛かりの表示位置・原文 |
| google-bard-gemini-2023-07 | `none` | 表示名、初期値、手掛かりの表示位置・原文 |
| google-bard-gemini-2023-09 | `none` | 表示名、初期値 |
| google-bard-gemini-2023-12 | `none` | 表示名、初期値、手掛かりの表示位置・原文 |
| google-bard-gemini-2024-02 | `top-dropdown` | 初期値、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| google-bard-gemini-2024-05 | `top-dropdown` | 表示名、初期値、候補の全一覧・当日の詳細、手掛かりの表示位置・原文 |
| google-bard-gemini-2024-08 | `top-dropdown` | 表示名、初期値、候補の全一覧・当日の詳細 |
| google-bard-gemini-2024-09 | `top-dropdown` | 表示名、初期値、候補の全一覧・当日の詳細 |
| google-bard-gemini-2024-12 | `top-dropdown` | 表示名、初期値、候補の全一覧・当日の詳細 |
| google-bard-gemini-2025-03 | `top-dropdown` | 表示名、初期値、候補の全一覧・当日の詳細 |
| google-bard-gemini-2025-06 | `top-dropdown` | 表示名、候補の全一覧・当日の詳細 |
| google-bard-gemini-2025-12 | `input-bar` | 初期値、候補の全一覧・当日の詳細 |
| google-bard-gemini-2026-11 | `input-bar` | 表示名、初期値、候補の全一覧・当日の詳細 |

## 公開日不明の資料

- 2026-11-15閲覧。dotの設定と電話への接続。モデル選択の記述は得られない。 [資料](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot)
- 現行の操作説明。2026年6月15日固有の外観は unverified。2026-11-15参照。 [資料](https://help.openai.com/en/articles/9824968-prompt-management-in-playground)
- 旧説明の検索記録では文章入力の下のモデル名から選び、変更時に新しい会話を開く。現行ページへ転送。説明の適用日は unverified。 [資料](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with)
- 2026-11-15閲覧。送信ボタンの横のモデル名とMore models。過去の左右位置と当時の全一覧は unverified。 [資料](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings)
- 現行のMac向け小窓の説明。Optionの2回押し。2025年10月の初期仕様は unverified。 [資料](https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac)
- 2026-11-15閲覧。入力欄の下のQuick responseから複数の会話モードを選ぶ。3月当日の一覧は unverified。 [資料](https://support.microsoft.com/en-us/microsoft-365-copilot/conversation-modes-in-microsoft-copilot)
- 2026-11-15閲覧。入力欄の下のモデル名から選ぶ。契約別の候補とLow/Medium/Highを説明。 [資料](https://support.google.com/gemini/answer/18648722?hl=en&co=GENIE.Platform%3DDesktop)
- 2026-11-15閲覧。左下のSettings → Personal Intelligence → Memory summary。 [資料](https://support.google.com/gemini/answer/18617127?hl=en)

## 実行したオフライン検査

プロジェクトのルートで次のコマンドを実行した。Node標準の `node:test` と `node:assert/strict` を使用する。

```sh
node --input-type=module <<'NODE'
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const toolIds = [
  'chatgpt',
  'openai-playground',
  'openai-gpt-2-interactive',
  'claude.ai',
  'claude-desktop',
  'bing-chat-microsoft-copilot',
  'google-bard-gemini',
];
const locations = new Set([
  'top-dropdown', 'input-bar', 'side-panel', 'settings',
  'slash-command', 'cli-flag', 'none', 'other',
]);
const accentKinds = new Set([
  'capacity', 'usage-cap', 'waitlist', 'update-notice',
  'deprecation-notice', 'error-message', 'beta-badge', 'pricing',
  'limits', 'keyboard-hint', 'streaming-speed', "what's-new", 'other',
]);
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
let versionCount = 0;
let accentCount = 0;

function checkSources(value) {
  if (Array.isArray(value)) {
    value.forEach(checkSources);
    return;
  }
  if (!value || typeof value !== 'object') return;
  if ('url' in value) {
    assert.equal(new URL(value.url).protocol, 'https:');
    assert.ok(value.date === null || isoDate.test(value.date));
    assert.equal(value.accessed_on, '2026-11-15');
    assert.equal(typeof value.shows, 'string');
  }
  Object.values(value).forEach(checkSources);
}

for (const toolId of toolIds) {
  test(toolId, () => {
    const spec = JSON.parse(fs.readFileSync('design/specs/' + toolId + '.json'));
    const era = JSON.parse(fs.readFileSync('design/era/' + toolId + '.json'));
    assert.equal(era.schema, 'memento.era.v1');
    assert.equal(era.tool_id, toolId);
    assert.deepEqual(
      era.versions.map(version => version.id).sort(),
      spec.versions.map(version => version.id).sort(),
    );
    assert.equal(new Set(era.versions.map(version => version.id)).size, era.versions.length);
    for (const version of era.versions) {
      versionCount++;
      const original = spec.versions.find(item => item.id === version.id);
      const shown = version.desktop.date_shown;
      assert.match(shown, isoDate);
      assert.equal(new Date(shown).toISOString().slice(0, 10), shown);
      assert.ok(shown >= original.from + '-01');
      if (original.to) assert.ok(shown < original.to + '-01');
      assert.ok(locations.has(version.model_switch.where));
      assert.equal(typeof version.model_switch.label, 'string');
      assert.ok(Array.isArray(version.model_switch.steps));
      assert.ok(Array.isArray(version.model_switch.options));
      assert.ok(version.model_switch.default === null ||
        typeof version.model_switch.default === 'string');
      assert.ok(version.model_switch.sources.length > 0);
      assert.ok(version.desktop.sources.length > 0);
      assert.match(version.trend, /https:\/\//);
      assert.ok(version.accents.length > 0);
      for (const accent of version.accents) {
        accentCount++;
        assert.ok(accentKinds.has(accent.kind));
        assert.ok(accent.text.trim().split(/\s+/u).length <= 12);
        assert.ok(accent.text.length <= 80);
        const [start, end] = accent.when.split('..');
        assert.match(start, isoDate);
        assert.match(end, isoDate);
        assert.equal(new Date(start).toISOString().slice(0, 10), start);
        assert.equal(new Date(end).toISOString().slice(0, 10), end);
        assert.ok(start <= shown && shown <= end);
        assert.ok(accent.sources.length > 0);
        assert.ok(accent.sources.some(source => isoDate.test(source.date)));
      }
      checkSources(version);
    }
    console.log(toolId + ': ' + era.versions.length + ' versions, ' +
      era.versions.reduce((sum, version) => sum + version.accents.length, 0) + ' accents');
  });
}
test('totals', () => {
  assert.equal(versionCount, 93);
  assert.equal(accentCount, 95);
  console.log('TOTAL ' + versionCount + ' versions, ' + accentCount + ' accents');
});
NODE
```

実際の出力の集計部分。

```text
chatgpt: 22 versions, 22 accents
openai-playground: 11 versions, 11 accents
openai-gpt-2-interactive: 4 versions, 4 accents
claude.ai: 19 versions, 19 accents
claude-desktop: 12 versions, 12 accents
bing-chat-microsoft-copilot: 12 versions, 14 accents
google-bard-gemini: 13 versions, 13 accents
TOTAL 93 versions, 95 accents
# tests 8
# pass 8
# fail 0
```

検査した内容はJSONの読み込み、版IDの一致と重複、代表日の期間、列挙値、各アクセントの日付付き出典、短い表示文の長さ、URLの形式。文の長さは空白で区切った語数12以下と80文字以下を確認した。日本語の表示文は短い機能説明として記述した。

## 実行した公開URLの取得確認

Nodeの標準 `fetch` で各URLへGETし、応答本文をメモリー内で読んだ。取得確認にはネット接続を使用した。

```sh
node --input-type=module <<'NODE'
import fs from 'node:fs';
const toolIds = ['chatgpt', 'openai-playground', 'openai-gpt-2-interactive',
  'claude.ai', 'claude-desktop', 'bing-chat-microsoft-copilot', 'google-bard-gemini'];
const urls = new Set();
function collect(value) {
  if (Array.isArray(value)) return value.forEach(collect);
  if (!value || typeof value !== 'object') return;
  if (value.url) urls.add(value.url);
  Object.values(value).forEach(collect);
}
for (const toolId of toolIds) {
  collect(JSON.parse(fs.readFileSync('design/era/' + toolId + '.json')));
}
const list = [...urls];
const results = [];
let nextIndex = 0;
async function worker() {
  while (nextIndex < list.length) {
    const url = list[nextIndex++];
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(18000) });
      await response.text();
      results.push({url, status: response.status, redirected: response.url !== url});
    } catch (error) {
      results.push({url, error: error.message});
    }
  }
}
await Promise.all(Array.from({length: 6}, worker));
console.log(JSON.stringify({
  urls: list.length,
  direct_200: results.filter(result => result.status === 200 && !result.redirected).length,
  redirected_200: results.filter(result => result.status === 200 && result.redirected).length,
  failed: results.filter(result => result.status !== 200).length,
}));
for (const result of results) {
  if (result.status !== 200 || result.redirected) console.log(JSON.stringify(result));
}
NODE
```

実際の集計出力。

```json
{"urls":106,"direct_200":80,"redirected_200":2,"failed":24}
```

24件の失敗はOpenAI系URLのHTTP 403。Webツールでも公開記事と更新記録を閲覧した。検索に残る旧説明や日付のない説明は、各項目に確認範囲を記録した。

転送を確認した2件はClaudeの旧モデル変更ヘルプとCopilotの2025年8月7日の更新記事。Copilotの過去本文はWebツールで取得でき、入力欄のSmart Modeを説明していた。現在のURLの転送先を含め、出典の再取得について確認が必要。 [Claudeの旧ヘルプ](https://support.anthropic.com/en/articles/8664678-how-can-i-change-the-model-version-that-i-m-chatting-with)、[Copilotの更新記事](https://www.microsoft.com/en-us/microsoft-copilot/blog/2025/08/07/release-notes-august-7-2025/?msockid=3a9cb2b069a26f4000daa4fe68bb6eb1)

