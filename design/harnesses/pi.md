# pi アダプターの調査記録

調査日: **2026-11-15**。公開されている公式の `main` の資料とソースを読んだ。特定のリリースでの動作確認ではない。実際の確認コマンドと結果は末尾に記録する。

## 採用した仕様

- 旧リポジトリは `earendil-works/pi` に転送される。現在の npm パッケージは `@earendil-works/pi-coding-agent`。インストール表示は `npm install -g --ignore-scripts @earendil-works/pi-coding-agent` とする。pi 自体には Node.js 22.19 以上が必要。アダプターは標準ライブラリのみを使う。インストールは実行していない。[公式の開始手順](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md)
- 設定の保存先は `PI_CODING_AGENT_DIR` で変更できる。通常の `~/.pi/agent` の代わりに `<workspace>/.config/pi` を指定し、記録の保存先も `PI_CODING_AGENT_SESSION_DIR` でその下に固定する。`HOME` は変更しない。[環境変数](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/environment-variables.md)
- MCP（外部ツールとの共通の接続方式）は、作業フォルダの `.pi/mcp.json` に JSON の `mcpServers` を置く。各標準入出力接続は `command`、`args`、`env` を持つ。アダプターは `<workspace>/project/.pi/mcp.json` を返す。通常の個人設定は `~/.pi/agent/mcp.json`。同名のプロジェクト接続が個人設定を置き換える。HTTP 接続も pi は扱えるが、今回の契約は標準入出力接続の入力だけを定義している。[MCP 設定](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/mcp.md)
- 初回は起動時の確認画面でプロジェクト設定を許可する必要がある。その手順を `manual` に返す。アダプターは `--approve` を自動付与しない。自動実行の print / JSON / RPC では確認画面が出ないため、別途許可済みの設定か明示した `--approve` が必要。[プロジェクトの許可](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/security.md)
- 指示ファイルは各フォルダで `AGENTS.override.md` → `AGENTS.md` → `AGENTS.MD` → `CLAUDE.md` → `CLAUDE.MD` の順に最初の一つを読む。個人設定フォルダを先に、その後は上位フォルダから作業フォルダの順に追加する。下位のファイルが上位すべてを消すわけではない。プロジェクトの許可に関係なく指示ファイルを読む。[実装](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/resource-loader.ts)、[設定資料](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/configuration.md)
- スキル（必要なときに読む詳しい手順）は `SKILL.md` を含むフォルダ。標準の場所は `<agent-dir>/skills/` と `.pi/skills/`。資料は `~/.agents/skills/` と上位を含む `.agents/skills/` の探索も説明している。同名のスキルは最初に見つかったものを使う。標準フォルダの直接の読込順は個人側、プロジェクト側、その後に追加指定先。[スキル資料](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md)、[実装](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/skills.ts)
- モデルの指定は `--provider <pi の提供元名> --model <モデル ID>`。Anthropic と OpenAI はそのまま、Gemini の提供元名は `google`。モデル ID はレシピの文字列を直接使わず、受け取った提供元カタログに一致した値を使う。[CLI](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/cli.md)、[Google 提供元の実装](https://github.com/earendil-works/pi/blob/main/packages/ai/src/providers/google.ts)
- 互換接続の追加は `<agent-dir>/models.json` の `providers`。OpenAI 互換と Ollama は `api: "openai-completions"`、Anthropic 互換は `anthropic-messages`、Google 互換は `google-generative-ai`。`baseUrl`、`apiKey`、`models: [{id}]` を生成する。鍵は `${KEY_ENV}` という参照だけ。Ollama の鍵なし接続だけは公式の例にある秘密ではない `ollama` を使う。モデルの利用条件は今回確認していない。[接続の説明](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md)、[項目の定義](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models-configuration.md)
- pi が扱う他の提供元には DeepSeek、OpenRouter、Mistral、Groq、xAI、Amazon Bedrock、Google Vertex AI などがある。このアダプターの `supports.models` は今回対応した接続の種類を示し、提供元すべての一覧ではない。[提供元資料](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/providers.md)、[提供元とモデルの対応実装](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/model-resolver.ts)
- 画面なしの実行は `--print` / `-p`、結果の逐次 JSON 出力は `--mode json`、継続的な操作は `--mode rpc`。`--no-session` は記録を保存しない。RPC は pi 独自の方式で、ACP の起動コマンドとしては使わない。[接続方式](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/cli-integration.md)、[CLI の読取実装](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/cli/args.ts)
- 標準機能には補助エージェントがない。公式リポジトリに追加の拡張機能の例があり、別の pi プロセスを起動して分担する。今回それをコピー、導入、起動していない。`supports.subagents: false` は追加なしの場合を表す。conductor の helpers と pi 自身を helper として使う役割は `unsupported` に返す。[公式の例](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/subagent/README.md)
- ネイティブの ACP は **unverified**。公式資料の CLI モードとソースには text / json / rpc がある。公式リポジトリでは ACP 追加の提案もある。第三者による接続プログラム `pi-acp` は存在するが、今回のアダプターは導入しない。`acp: null` とし、端末以外の接続は `unsupported` に返す。[CLI の実装](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/cli/args.ts)、[ACP の議論](https://github.com/earendil-works/pi/discussions/4444)

## 閲覧 URL の台帳

以下はすべて **2026-11-15 に閲覧**。本文やコードは転載せず、確認内容を記す。`blob/main` のページに対応する `raw.githubusercontent.com` のテキストを読んだものは、その URL も記録する。

| URL | 確認内容 |
| --- | --- |
| https://github.com/badlogic/pi-mono | 現在のリポジトリへの転送。 |
| https://github.com/earendil-works/pi | 現在の所有者、名称、公式サイトへのリンク、拡張で機能を足す方針。 |
| https://raw.githubusercontent.com/badlogic/pi-mono/main/packages/coding-agent/README.md | 旧 URL でも現在のパッケージの開始手順が返った。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/LICENSE | MIT のライセンス表示。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/index.md | 設定、モデル、CLI、RPC などの公式資料の入口。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/cli.md | モデル指定、画面なし実行、記録、プロジェクト許可、バージョン表示の引数。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/configuration.md | 個人側の設定の保存先、プロジェクトの `.pi`、指示ファイルの探索。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/environment-variables.md | 設定と記録の保存先を変える環境変数。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/mcp.md | 接続ファイルの場所、形式、設定の上書き、接続名の制約、環境変数の参照、`!command` の意味。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/models.md | モデルの選択、互換接続、鍵の参照、Ollama の鍵なし設定の例。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/models-configuration.md | `providers`、`api`、`baseUrl`、`apiKey`、モデル ID と省略できる項目。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/providers.md | Anthropic、OpenAI、Gemini などの鍵の環境変数と提供元の設定。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/skills.md | `SKILL.md`、探索場所、同名の場合の扱い、必要時に本文を読む方式。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/security.md | プロジェクト許可、対象になる設定、画面なし実行での扱い。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/cli-integration.md | interactive / print / JSON / RPC の入出力と終了の条件。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/config.ts | 環境変数からの保存先取得と、その下の models、auth、settings、sessions のパス。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/cli/args.ts | `--version`、モデル指定、利用できるモードの実装。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/core/resource-loader.ts | 指示ファイル名の優先順と上位フォルダからの追加順。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/core/skills.ts | 個人とプロジェクトのスキルの順序、重複時は先のものを保持。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/core/model-resolver.ts | pi 内部の提供元名。モデル ID 内の `:` が考慮されること。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/core/model-registry.ts | モデル検索と設定の再読込を提供するソース。ここから新たな機能を推測していない。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/ai/src/providers/google.ts | Gemini 用の pi 提供元 ID が `google`、鍵の名前が `GEMINI_API_KEY`。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/examples/extensions/subagent/README.md | 補助役は別途導入する拡張の例。別プロセス、役割の指示ファイル、連続・並行実行の説明。 |
| https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/subagent/index.ts | 拡張の例の入口。検索結果で別プロセスを起動する説明を確認。コードは使用していない。 |
| https://github.com/earendil-works/pi/discussions/4444 | 2026-05-12 の ACP 対応提案。組込み対応の確認には使っていない。 |
| https://github.com/xintaofei/pi-acp | 第三者の `@spacering/pi-acp`。起動コマンドは `pi-acp`、内部では `pi --mode rpc` を使うという説明。動作と互換性は **unverified**。 |
| https://github.com/victor-software-house/pi-acp | 別の第三者の ACP 接続プログラム。2026-10-24 に公開アーカイブ化された表示。こちらも導入していない。 |
| https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/core/mcp/config.ts | **404**。この推測したパスから事実を採用していない。MCP の仕様は公式資料を根拠にした。 |

## 契約で未定義の部分と判断

- `ctx.style` の細かい形式は `lib/recipes/CONTRACT.md` に定義されていない。本実装は `agentsMd` の文字列、`files: [{path: "AGENTS.md", content}]`、`files` の `project/AGENTS.md`、または `content` の文字列を受け付ける。出力先は常に `project/AGENTS.md`。内容がなければ推測せず `unsupported`。スキルの生成形式も未定義なので、本実装は `agents-md` 以外の指示形式を `unsupported` とする。
- `ctx.providers` は ID で引くカタログとして扱い、公開契約の提供元メタデータを直接、または `{meta: ...}` で受け取る。モデルはそのカタログ内で一致したものだけ採用する。不明なモデルでは `argv` を空にし、別のモデルで起動しない。
- 互換接続の pi 内部の ID はカタログ ID に `memento-` を付ける。pi に組み込まれた同名提供元の設定との混同を避けるためのアダプター側の選択であり、pi の既定値ではない。
- MCP は `recipe.tools` で選ばれた既知の接続だけを出力する。pi で接続名が衝突する `-` / `_` の組合せ、未確認の形式、`!` から始まるコマンド実行型の環境値は採用しない。これらの pi 側の仕様は [MCP 資料](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/mcp.md) に記載されている。
- `PI_CODING_AGENT_DIR` は設定の保存先を変える仕組み。親フォルダの指示ファイルや `~/.agents/skills` の読込まで隔離する仕組みではない。生成するファイルと保存先はワークスペース内だが、pi のファイルアクセスを制限するとは主張しない。[設定資料](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/configuration.md)、[スキル資料](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md)

## 確認結果と未確認事項

- `command -v pi || true`: 終了コード 0、出力なし。今回の Mac の PATH 上で pi は見つからなかったため、実物の `pi --version` は実行していない。
- `node --test test/recipes/harness-pi.test.js`: 終了コード 0。実際の出力の集計は `tests 13`、`pass 13`、`fail 0`、`cancelled 0`、`skipped 0`、`todo 0`。
- pi の実起動、MCP 接続、認証、提供元の通信、個々のモデルが pi の配布済み一覧に存在すること、追加の補助役拡張、第三者の ACP 接続プログラムの動作は **unverified**。
- テストのモデル・接続・URL はカタログ入力の試験用の値。第三者の実サービスや実モデルの利用可否を表していない。`detect` の成功時の試験は Node の実行ファイルを渡して `--version` だけを実行し、pi の存在やバージョンの証拠にはしていない。

## C2 追記: RPC・SDK と MCP サーバー（2026-11-15）

公式の実行方式は端末、画面なしテキスト、JSON、RPC（pi 独自の継続的な通信）。公式 SDK はプログラム内に pi を組み込む部品。これらを他のエージェントへ公開する公式の MCP サーバー接続は **unverified**。`asMcpServer` は公開しない。[実行方式](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/cli-integration.md)、[SDK](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md)、[コマンド](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/cli.md)

外部の MCP 道具を受け取る設定はある。進行役では `helper-<role>` を通常の `.pi/mcp.json` に含める。以前の補助役未対応という記録を受け取り部分について更新する。[MCP 設定](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/mcp.md)

補助役としては、合成側が `helpers/<role>-<index>/` に単独用のモデル設定と指示書を残し、依頼と結果を手動と明記する。実起動、MCP、モデル通信、SDK の実行はしていない。確認はオフラインテストのみ。
