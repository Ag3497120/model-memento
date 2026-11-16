# レシピで使うモデルの提供元

確認日: **2026-11-15**。公開資料を読み、6社分の接続先と短いモデル一覧を固定した。実際のAPIへの接続、キーの確認、モデルの実行は行っていない。

「提供元」はモデルに問い合わせる相手。「harness」は、モデルに加えてファイル操作や作業の進め方をまとめる実行役を指す。このカタログは提供元のデータだけを持つ。レシピのつなぎ方は [CONTRACT.md](../lib/recipes/CONTRACT.md) に従う。

## データの読み方

- 各ファイルは `export const meta` を公開する。`id`・`name`・`kind`・`baseUrl`・`keyEnv`・`models`・`sources` は契約の項目。
- `kind` は接続の通信形式を表す。`anthropic`・`openai`・`gemini`・`ollama` はそれぞれの形式、`openai-compatible` はOpenAIと共通の形式を使う接続先。
- `baseUrl` はその形式の基準となるURL。`/v1` や `/api` を一律に追加しない。
- 追加項目 `additionalEndpoints` は、今回確認した別の形式の `{ kind, baseUrl, sources }` の一覧。空の配列は別形式への非対応を意味しない。ここでの `anthropic` も通信形式を示す。接続形式を選ぶ側は、この配列から明示的に選ぶ必要がある。追加の接続先を自動で試す処理はない。
- 追加項目 `verified: { at, how: "docs" }` は資料の確認日。接続試験済みという意味ではない。
- `keyEnv` は環境変数（起動時に渡す名前付きの設定）の**名前**だけ。キー値、環境変数の読み取り、通信、モデル一覧の自動更新を含まない。
- `context` は一度に扱える文章量の上限。正確な数値をこのデータでは確定していないため、すべて `null`（unverified）。
- モデルの `id` は提供元が掲載する呼び出し用IDをそのまま保持する。レシピでは `<provider>:<model>` とする。区切りは最初の `:` だけなので、Ollamaの `ollama:qwen3.5:9b` やOpenRouterの `openrouter:openai/gpt-6.1-sol` も分解できる。

## 接続先とキー名

| 提供元 | 主な形式 (`kind`) | `baseUrl` | `keyEnv` と根拠 |
| --- | --- | --- | --- |
| Anthropic | `anthropic` | `https://api.anthropic.com` — [公式API説明](https://platform.claude.com/docs/en/api/overview) | `ANTHROPIC_API_KEY` — [公式SDK説明](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript) |
| OpenAI | `openai` | `https://api.openai.com/v1` — [公式SDK設定](https://developers.openai.com/api/reference/java) | `OPENAI_API_KEY` — [OpenAI Docsの始め方](https://developers.openai.com/api/docs/quickstart) |
| DeepSeek | `openai-compatible` | `https://api.deepseek.com` — [公式の最初のAPI呼び出し](https://api-docs.deepseek.com/) | `DEEPSEEK_API_KEY` — [同じ資料の環境変数例](https://api-docs.deepseek.com/) |
| Gemini（Google AI Studio API） | `gemini` | `https://generativelanguage.googleapis.com/v1beta` — [公式の始め方にあるREST接続例](https://aistudio.google.com/docs/get-started) | `GEMINI_API_KEY` — [公式キー設定](https://aistudio.google.com/docs/api-key) |
| Ollama（この端末） | `ollama` | `http://localhost:11434/api` — [公式API説明](https://docs.ollama.com/api/introduction) | `null`。端末内のモデルへの接続には認証不要 — [同じ資料](https://docs.ollama.com/api/introduction) |
| OpenRouter | `openai-compatible` | `https://openrouter.ai/api/v1` — [公式OpenAI SDK接続例](https://openrouter.ai/docs/guides/community/openai-sdk) | `OPENROUTER_API_KEY` — [同じ接続例](https://openrouter.ai/docs/guides/community/openai-sdk) |

## 別の通信形式を使う接続先

| 提供元 | 追加の形式 | SDKに渡す基準URL | 根拠 |
| --- | --- | --- | --- |
| DeepSeek | Anthropic形式 (`anthropic`) | `https://api.deepseek.com/anthropic` | [公式Anthropic API説明](https://api-docs.deepseek.com/guides/anthropic_api/) |
| Gemini | OpenAI形式 (`openai-compatible`) | `https://generativelanguage.googleapis.com/v1beta/openai/` | [公式OpenAI互換接続説明](https://aistudio.google.com/docs/openai) |
| Ollama（この端末） | OpenAI形式 (`openai-compatible`) | `http://localhost:11434/v1/` | [公式OpenAI互換接続説明](https://docs.ollama.com/api/openai-compatibility) |
| Ollama（この端末） | Anthropic形式 (`anthropic`) | `http://localhost:11434` | [公式Anthropic互換接続説明](https://docs.ollama.com/api/anthropic-compatibility) |

DeepSeekは**両方の形式を公式に提供している**。Anthropic形式では一部の項目が無視されるなどの違いがあるため、「互換」は全機能が同じという意味にはしない。キー名 `DEEPSEEK_API_KEY` はこのカタログでの参照名であり、Anthropic SDKを使う実行役ではキーをSDKが受け取れる名前へ結び付ける必要がある。公式の例は `ANTHROPIC_API_KEY` を使う。[DeepSeekの互換範囲とSDK例](https://api-docs.deepseek.com/guides/anthropic_api/)

Ollamaの互換APIも各社APIの一部に対応するもの。OpenAI SDKのようにキー引数を要求するクライアントはあるが、端末内の接続ではその値は使われない。このため、カタログには仮のキー値も保存しない。クラウド用の `OLLAMA_API_KEY` は今回のローカル定義に含めない。[OpenAI形式の説明](https://docs.ollama.com/api/openai-compatibility)・[ローカルとクラウドの区別](https://docs.ollama.com/api/introduction)

## 固定したモデル一覧

全行の確認日は **2026-11-15**。短い候補一覧であり、全モデルの一覧ではない。表示名は選択画面用の短い名前で、IDの書き換えには使わない。

| 提供元 | 呼び出し用ID | モデル一覧の出典 |
| --- | --- | --- |
| Anthropic | `claude-fable-5-2`、`claude-opus-5-5`、`claude-sonnet-5-5`、`claude-haiku-5-5` | [公式モデル一覧のClaude API ID](https://platform.claude.com/docs/en/models/overview) |
| OpenAI | `gpt-6-astra`、`gpt-6.1-sol`、`gpt-6.1-terra`、`gpt-6-luna` | [公式モデル一覧のModel ID](https://developers.openai.com/api/docs/models) |
| DeepSeek | `deepseek-flash`、`deepseek-v4-pro` | [公式モデル・料金表](https://api-docs.deepseek.com/quick_start/pricing/) |
| Gemini | `gemini-4-carbon`、`gemini-4-argon`、`gemini-4-hydrogen` | [公式モデル一覧のModel code](https://aistudio.google.com/docs/models) |
| Ollama（この端末） | `qwen3.5:9b`、`qwen3.5:35b`、`gemma4:e4b`、`gemma4:31b` | [公式ライブラリ](https://ollama.com/library)・[Qwen 3.5のタグ](https://ollama.com/library/qwen3.5)・[Gemma 4のタグ](https://ollama.com/library/gemma4) |
| OpenRouter | `openai/gpt-6.1-sol`、`anthropic/claude-sonnet-5.5`、`deepseek/deepseek-v4-pro` | [公式カタログ](https://openrouter.ai/models)・[GPT-6.1 Sol](https://openrouter.ai/openai/gpt-6.1-sol)・[Claude Sonnet 5.5](https://openrouter.ai/anthropic/claude-sonnet-5.5)・[DeepSeek V4 Pro 0423](https://openrouter.ai/deepseek/deepseek-v4-pro) |

DeepSeekの現行Flashの呼び出し名は `deepseek-flash`。資料上の実体名 `DeepSeek-V4.1-Flash-1017` と区別する。古い `deepseek-v4-flash` などは互換名として受け付けられるが、短い候補一覧には加えていない。[公式モデル表の注記](https://api-docs.deepseek.com/quick_start/pricing/)

OpenRouter側のモデルIDはOpenRouterの資料に従う。たとえば `deepseek/deepseek-v4-pro` のページは「0423」と表示しているため、DeepSeek直結の現在の実体と同じ版だとは扱わない。[OpenRouterの該当ページ](https://openrouter.ai/deepseek/deepseek-v4-pro)・[DeepSeek直結の版情報](https://api-docs.deepseek.com/quick_start/pricing/)

Ollamaの候補は公式ライブラリにあるタグを示す。端末への導入済み状態は `unverified`。導入済みモデルを調べるAPIは別にあるが、このデータを読むときは呼ばない。[Ollamaの導入済みモデル一覧API](https://docs.ollama.com/api/tags)

## 確認範囲とレビュー事項

オフライン確認コマンドは `node --test test/recipes/providers.test.js`。テストは公開する形、IDの重複、出典URL、確認日の形、キーらしい値の混入を調べる。定義をJSONとして読めるデータに限定し、読み込み時の通信や環境変数参照を防ぐ。

`unverified`: 実際の接続、アカウントごとの利用権、キーの有効性、正確な `context` の数値、端末に入っているOllamaのモデル、個々の実行役との動作。資料確認だけでこれらを保証しない。

レビュー事項: 合成処理が追加の形式を扱う場合は `additionalEndpoints` を明示的に選ぶ必要がある。既存の `kind` だけを読む処理ではDeepSeekは主なOpenAI形式で扱われる。このタスクでは契約や合成処理を変更していない。

公式DeepSeek Harnessの調査と、将来の接続部品の案は [DeepSeekの調査メモ](harnesses/deepseek.md) に記録した。
