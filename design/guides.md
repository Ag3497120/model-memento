# 指示の出し方の資料集

確認日：2026-11-16。G1 が所有するデータ・処理・画面のみを編集しています。

## 方法と出典

公式の開発資料、公式の実例集・ブログ、公式の公開リポジトリを検索し、読める本文または公式ページの検索結果で各要約の根拠を確認しました。第三者の記事やコミュニティの投稿を発行元の推奨として収録していません。日本語の題名・要約・使う場面は独自に書き、原文の引用、画像、ロゴ、フォント、外部のコードは収録していません。題名は原文の逐語訳ではありません。

一つの資料を一つの guide として数えます。同じ URL の見出しを別資料に数えていません。現時点で 103 件、36 の発行元・規格、26 の方法です。GitHub の変更記録やソースコードを根拠にする場合は、そのことを題名や要約に明記します。資料の存在・内容の確認と、紹介される手法の性能測定は別です。各モデルや道具を実行して助言の効果を測ったものではありません。

全 guide の url を sources に含めています。出典は認証情報を含まない HTTPS の URL に限ります。checked_at は内容を確認した日です。公式ページの日付を日まで確認できない場合、published / updated は null です。年・月だけの表示から日を作っていません。URL にある仕様版の日付も公開日へ転記しません。日まで確認できる資料は 9 件、日付が未確認の資料は 94 件です。

公開ページへの Node の読み取り専用 GET 103 件では、102 件が HTTP 200、Microsoft の古い URL 1 件が 404 でした。その 1 件を現行の公式ページへ置換し、別の GET で HTTP 200 を確認しました。Antigravity の一部は検索に載った公式の本文を確認し、直接 GET では HTML の枠と HTTP 200 だけを確認しています。通信が成功することは、本文の不変性や助言の有効性の証明ではありません。

## 既存の記録とのつながり

- data/curated/instructions.json を指示ファイルの場所の原本として再利用します。索引には tool_id と配列の位置だけを載せ、画面は既存の web/data/instructions.json を読みます。古い場所の記録と現在の公式説明が異なり得ることを画面に表示します。
- recipes/catalog/styles/*.json の 17 種類すべてへ taxonomy の style_id からつながります。スタイルの実行用ファイルや本文をコピーせず、既存の短い表示用の名前・説明をビルド時に読みます。
- data/curated/harness.json の 29 道具すべてに資料があります。tool_ids は同ファイルの ID をそのまま使います。recipes の別名へ勝手に置き換えません。
- web/data/models.json と web/data/closed.json の ID を合わせ、同じ ID は主一覧の記録を優先します。ビルドから models / closed を渡す場合は生成中の配列を利用します。登録元や接続先の名前からモデルの作り手を推測しません。

主一覧 90 モデルのうち applies_to が一致するものは 42、同じ作り手の参考資料だけがあるものは 48 です。両一覧の重複を除いた 1701 モデルでは、それぞれ 494 と 549、対応する資料も既知の作り手の資料もまだないものは 658 です。主一覧の 48 モデルでは「このモデルの版への適用は未確認」と明示します。関連資料を表示するために applies_to を水増ししていません。

## 年代の扱い

_techniques.json の publishers と first_seen は deriveTechniques が guide から生成します。各 guide の published、なければ updated を使い、発行元ごとの最小値と根拠の guide_ids を保持します。日付がない発行元の date は null です。checked_at は年代の計算に使いません。「この資料集で確認できる最古の日付」であり、技法の発明年、流行の開始年、会社の採用日を意味しません。画面の年代一覧も同じルールを説明します。

## ビルドと画面

lib/guides/schema.js、loader.js、validate.js、build.js が形式・日付・出典・参照・年代の整合を検査します。参照が一つでも解決しない場合は、対象の guide / field / id を報告しビルドを失敗させます。最大 600000 バイトを超える索引も失敗させます。現在の索引は 258492 バイトです。

scripts/build-web.js には guides:start / guides:end 内だけを追加しました。通常のオフラインビルドは web/data/guides.json を生成します。既存の CSS 自動列挙により web/css/guides.css が取り込まれます。--sources-only / --era-only は元の早期終了のままです。

所有範囲の制約のため、web/data/guides.json と web/index.html をこちらで生成していません。全体ビルドも実行していません。レビュアーが統合後に以下を実行してください。

```sh
npm run build:web -- --offline
```

書き込みなしの確認は次です。

```sh
node lib/guides/build.js --check
```

画面は web/js/guides/index.js の import 時に registerNavEntry を登録します。web/js/model/index.js が同モジュールの guidesSection を import するため、app.js に追加の import は不要です。指示の出し方の dialog には screen-header と、先頭の data-screen-back、最後の閉じるボタンがあります。

道具の「この版について」への埋め込みは、その画面を所有するレビュアーが追加してください。

```js
import { guidesSection } from './guides/index.js'; // web/js/app.js からの場合
aboutBody.append(guidesSection({ toolId: tool.id }));
```

aboutBody は実際の道具説明の要素名に合わせてください。このファイルを G1 からは変更していません。組み合わせ画面へのボタンは既存の combine エントリを開きます。スタイルの自動選択には未対応で、示されたスタイル名を利用者が選びます。

## 毎日のリンク確認

scripts/check-links.js は --input フォルダーを受け取ります。設定リストの追加は不要です。既存の毎日の呼び出しに --input data/curated/guides を含めてください。すでに --input data/curated がある場合は再帰走査されるので追加不要です。

```sh
node scripts/check-links.js --artifact site --input data/curated/guides --input recipes/catalog
```

通信・書き込みなしで収録を確かめる場合：

```sh
node scripts/check-links.js --artifact web --input data/curated/guides --inventory
```

今回の実行結果は「リンク一覧: 52567 件、読み込んだファイル 2125 件。通信・書き込みはありません。」でした。ほかの担当のファイルも読むため、この件数は変化します。

## 検証

```sh
node --test test/guides/*.test.js test/app/model.test.js
node --check web/js/guides/index.js
node --check scripts/build-web.js
```

オフラインのテストは、形式、不正な URL と日付、文字数、ID 解決、派生した年代、サイズ上限、指定した保存先、検索の交差条件、読み込み失敗からの再試行、メニュー登録、dialog のヘッダー、指示ファイルへの参照、モデルへの埋め込みと適用未確認表示、文字を HTML として扱わないことを確認します。DOM は最小のテスト用のものです。実ブラウザーでの表示、レイアウト、キーボード移動、レビュアーの汎用戻る処理との結合は unverified です。アプリ、サーバー、エージェント、第三者の実行ツールを起動していません。

文字数チェックは summary_ja が 160 文字を超えるものを拒否します。原文と照合する盗用検出器ではありません。要約は手作業で独自に作っています。

## 発行元ごとの件数

| 発行元・規格 | 資料数 |
| --- | ---: |
| AGENTS.md | 1 |
| Agent Skills | 1 |
| Aider | 2 |
| Alibaba / Qwen | 4 |
| Amazon | 4 |
| Anthropic | 13 |
| Baidu | 1 |
| BigScience | 1 |
| Cherry Studio | 1 |
| Cline | 2 |
| Cohere | 3 |
| Continue | 2 |
| Cursor | 2 |
| DeepSeek | 3 |
| Google | 11 |
| Hugging Face | 1 |
| LM Studio | 2 |
| MCP | 1 |
| Meta | 2 |
| Microsoft | 6 |
| MiniMax | 2 |
| Mistral | 3 |
| Moonshot | 3 |
| NVIDIA | 2 |
| NousResearch | 2 |
| Ollama | 2 |
| Open WebUI | 2 |
| OpenAI | 10 |
| OpenClaw | 2 |
| OpenCode | 2 |
| Windsurf | 1 |
| Zed | 2 |
| Zhipu | 2 |
| n8n | 1 |
| pi | 2 |
| xAI | 2 |

## 道具ごとの件数

| 道具 | 既存 ID | 資料数 |
| --- | --- | ---: |
| OpenAI Playground | `openai-playground` | 4 |
| ChatGPT | `chatgpt` | 1 |
| Bing Chat / Microsoft Copilot | `bing-chat-microsoft-copilot` | 1 |
| Google Bard → Gemini | `google-bard-gemini` | 5 |
| Claude.ai | `claude.ai` | 5 |
| Claude Desktop | `claude-desktop` | 5 |
| HuggingChat | `huggingchat` | 1 |
| LM Studio | `lm-studio` | 2 |
| GitHub Copilot (VS Code) | `github-copilot-vs-code` | 4 |
| Cursor | `cursor` | 2 |
| Continue | `continue` | 2 |
| Aider | `aider` | 2 |
| Cline (formerly Claude Dev) | `cline-formerly-claude-dev` | 2 |
| Windsurf | `windsurf` | 1 |
| Claude Code | `claude-code` | 8 |
| OpenAI Codex CLI | `openai-codex-cli` | 3 |
| OpenCode | `opencode` | 2 |
| OpenClaw (formerly Clawdbot / Moltbot) | `openclaw-formerly-clawdbot-moltbot` | 2 |
| Google Antigravity | `antigravity` | 2 |
| Cherry Studio | `cherry-studio` | 1 |
| DeepSeek | `deepseek` | 3 |
| Gemini CLI | `gemini-cli` | 3 |
| Hermes Agent | `nousresearch--hermes-agent` | 2 |
| n8n | `n8n` | 1 |
| Ollama | `ollama` | 2 |
| Open WebUI | `open-webui` | 2 |
| GPT-2 interactive | `openai-gpt-2-interactive` | 1 |
| Pi Coding Agent | `earendil-works--pi` | 2 |
| Zed | `zed` | 2 |

## 未確認と不足

日付が未確認の 94 資料には日付を補っていません。可変の公式資料・リポジトリの既定ブランチを参照しているため、後日の内容変更は日々の HTTP 確認だけでは検出できません。主要な過去版の当時の助言の収集と、日付・コミットを固定した出典の拡充は今後の課題です。

主一覧で個別の適用が未確認のモデル：`gemini-3-pro-preview`, `gemini-2.0-flash`, `claude-3.5-haiku`, `chatgpt-4o-latest`, `gpt-4o-2024-05-13`, `gpt-3.5-turbo-0125`, `gpt-3.5-turbo-1106`, `gpt-3.5-turbo-instruct`, `bard`, `bing-chat-sydney`, `claude-2.0`, `claude-3-opus`, `claude-3.5-sonnet-20240620-20241022`, `claude-instant-1.2`, `gemini-1.0-pro`, `gpt-3.5-turbo-0301`, `palm-2-text-bison`, `text-davinci-003`, `davinci-gpt-3`, `curie`, `code-davinci-002-codex`, `text-davinci-002`, `gpt-3.5-turbo-0613`, `davinci-002`, `gpt-4-32k-0314`, `gpt-4-0613`, `gpt-4-1106-preview`, `gpt-4-0125-preview`, `gpt-4-vision-preview`, `gpt-4-turbo-2024-04-09`, `gpt-4o-api-2024-08-06-2024-11-20`, `gpt-4.5-preview`, `gpt-5-2025-08-07`, `gpt-oss-120b`, `claude-1.3`, `claude-2.1`, `claude-3-sonnet`, `claude-3-haiku`, `lamda`, `gemini-1.5-pro-flash`, `gemini-2.5-pro-preview-03-25`, `gemini-2.5-pro-ga`, `galactica`, `opt-175b`, `llama-1`, `grok-1`, `grok-2.5`, `ernie-5.5-flash-preview`。

追加一覧で資料がまだない 658 モデルの登録上の発行元・接続先：AI Stupid Level, AIHubMix, AMD, Abacus, Agnes AI, Alibaba (China), Alibaba Token Plan, Amazon Bedrock, Ambient, Arcee, AtomicChat, Augure, Azure, Bailing, Bee by HEOSSI, ByteDance, Charm Hyper, Clarifai, Claudinio, Cloudflare Workers AI, CommandCode, CoreWeave, Cortecs, Crusoe, DevPass (LLM Gateway), DigitalOcean, Echo, Eden AI, Edge0, EmpirioLabs AI, FastRouter, GitHub Copilot, GreenPT, Groq, Helicone, Huawei Cloud MAAS, Inception, InferX, Inference, Infomaniak, Jad AI, JonathanColetti, KRAFTON, Kilo Gateway, LLMTR, Liquid Inference, LiquidAI, LucidQuery, Lynkr, Meganova, Merge Gateway, MiniMaxAI, MinimaLabs, MoonMath-ai, Munito AI, NEAR AI Cloud, NanoGPT, NeoSmith, Neuralwatt, Nodecode, Novita AI, Ollama Cloud, OpenCode Go, OpenRouter, OrcaRouter, Perplexity Agent, Pioneer, Poe, Privatemode AI, Qiniu, Rayline, Regolo AI, Requesty, RuAPI, SAP AI Core, Sakana AI, Sarvam AI, Scaleway, Scantist, SenseNova (China), SiliconFlow, SiliconFlow (China), Standard Compute, StepFun (China), StepFun Step Plan (China), Tempr Gateway, Tencent, Tencent Coding Plan (China), The Grid AI, Tinfoil, Together AI, TrustedRouter, TrustedTokens, Umans AI, Unrestricted, Upstage, Venice AI, Vercel AI Gateway, Vispark, Vivgrid, Vultr, Xiaomi, Xiaomi Token Plan (China), Xpersona, Zeldoc, Zro, abliteration.ai, aj9o9, audnai, baidu, ccore, evroc, klokintegration.se, manuelgscom, meraGPT, meta-llama, openrouter, prism-ml, stepping stone AG, superbot, taobao-mnn, tencent, typesafe, watsonx.ai, webAI-Official, xtools-at, zai-org。ここには実際のモデルの作り手ではなく接続サービス名が記録されたものもあります。名称だけで作り手の助言へ結び付けず、unverified として扱います。Amazon / NVIDIA の資料は収録していますが、登録上の Amazon Bedrock の全モデルや NVIDIA の全モデルへの適用を確認した意味ではありません。

一般的な AGENTS.md / Skills / MCP の仕様があることと、個々の道具のすべての版がそれに対応することは別です。公式の各道具の説明と既存の場所の記録を並べ、対応を推測で追加しない方針です。HuggingChat は過去の公式変更、pi は現在の公式読み込み実装、Baidu は指示文を再利用する SDK の説明が根拠です。全モデルの性能比較や、未収録の全発行元の調査が完了したとはしていません。
