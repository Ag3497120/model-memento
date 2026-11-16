# OpenClaw アダプター調査記録

調査日: **2026-11-15（日本時間）**。公式ドキュメントと公開ソースを読んだ。
以下は要約であり、配布物や説明文の転載ではない。画像、商標の図案、外部コードは取り込んでいない。
ドキュメントは本文取得に `.md` 版も使用した。同じパスの HTML 版へのリンクを証拠 URL とする。
ソースは `main` の取得時点の内容。公開 npm 版との完全一致や、機能が入った最初の版は **unverified**。

## 根拠 URL と確認内容

すべての行の確認日は **2026-11-15**。この一覧の URL はアダプターの `meta.sources` にも含めた。

| URL | 確認した内容 |
| --- | --- |
| https://github.com/openclaw/openclaw/blob/main/LICENSE | MIT ライセンス。 |
| https://github.com/openclaw/openclaw/blob/main/package.json | パッケージ名と実行名は `openclaw`。公式リポジトリは `openclaw/openclaw`。取得した main のバージョン欄は `2026.11.3`、Node 条件は `>=24.16.0 <25 \|\| >=26.1.0`。ファイル更新日は 2026-11-14。これはこの Mac にインストールされた版の情報ではない。 |
| https://docs.openclaw.ai/install | npm による全体インストールを掲載。npm 12 と 11.16 以降では `--allow-scripts=openclaw` を付ける説明があり、11.15 以前では付けない。ほかにインストーラー、pnpm、bun、ソースからの方法がある。サイトへの公式リンク先は `openclaw.ai`。アダプターは表示するだけでインストールしない。 |
| https://docs.openclaw.ai/help/environment | `OPENCLAW_HOME` は内部のホーム基準、`OPENCLAW_STATE_DIR` は状態保存先、`OPENCLAW_CONFIG_PATH` は設定ファイル、`OPENCLAW_WORKSPACE_DIR` は既定の作業場所を変更する。明示した状態・設定パスがホーム指定より優先。秘密キーはプロセス環境など信頼された場所から渡す。作業フォルダーの `.env` では秘密キーや OpenClaw の制御変数を読み飛ばす。設定文字列で `${VAR}` 参照が使える。 |
| https://docs.openclaw.ai/help/faq/config-basics | 設定は省略可能な JSON5。既定は `~/.openclaw/openclaw.json`、明示する場合は `OPENCLAW_CONFIG_PATH`。 |
| https://docs.openclaw.ai/gateway/configuration-reference | JSON5 の設定形式と各設定領域への索引。JSON を生成しても JSON5 として読める。 |
| https://docs.openclaw.ai/gateway/config-extensions | ネイティブの MCP 設定は `mcp.servers`。名前ごとに標準入出力の `command`・`args`、またはリモート URL を指定。`mcpServers` という別製品向けの形式ではない。MCP の CLI 設定操作とスキル設定も説明されている。 |
| https://github.com/openclaw/openclaw/blob/main/src/config/paths.ts | `OPENCLAW_CONFIG_PATH` を優先して設定パスを決め、通常は状態保存先の `openclaw.json` を使う。`OPENCLAW_STATE_DIR` の明示指定を扱う。更新日 2026-11-02。 |
| https://github.com/openclaw/openclaw/blob/main/src/config/types.mcp.ts | MCP 設定に名前から定義への `servers` レコードがある。更新日 2026-10-06。 |
| https://github.com/openclaw/openclaw/blob/main/src/config/zod-schema.mcp-server.ts | `command` は文字列、`args` は文字列配列、`env` はレコード。`stdio`、`sse`、`streamable-http` の形式などを定義。更新日 2026-10-21。アダプターが生成するのは契約にある command/args/env の標準入出力形式のみ。 |
| https://docs.openclaw.ai/concepts/agent-workspace | 作業場所は `agents.defaults.workspace` などで指定できる。`AGENTS.md` は作業の指示、`SOUL.md` は口調・人格などを持つ。`skipBootstrap: true` で既定の初期ファイル生成を止められる。作業場所の指定だけでは OS のファイルアクセスを隔離しない。 |
| https://docs.openclaw.ai/concepts/system-prompt | 選択されたエージェントの作業場所から指示ファイルを注入。別の実行場所を使うときの AGENTS.md の追加条件、補助実行では AGENTS.md だけを注入すること、文字数上限を説明。一般的な祖先フォルダー全体を探索する仕様としては扱わない。 |
| https://github.com/openclaw/openclaw/blob/main/src/agents/workspace.ts | 指示ファイルの準備と補助実行用の絞り込み。補助実行の初期ファイル許可対象に AGENTS.md がある。 |
| https://github.com/openclaw/openclaw/blob/main/src/agents/workspace-bootstrap-policy.ts | 初期指示の列挙順は AGENTS.md、SOUL.md、IDENTITY.md、USER.md、BOOTSTRAP.md、MEMORY.md。順序はファイル間の競合時の絶対的な優先順位という保証ではない。 |
| https://github.com/openclaw/openclaw/blob/main/src/agents/workspace-file-read.ts | 選択された作業場所と既定ファイル名を結合して読む。非同期処理の完了順ではなく定義された順に返す。更新日 2026-11-03。 |
| https://docs.openclaw.ai/tools/skills | SKILL.md と YAML の前置き情報を使う。名前が同じ場合の優先順は、作業場所の skills、作業場所の .agents/skills、個人の .agents/skills（既定状態のみ）、状態保存先の skills、Workshop、同梱、追加ディレクトリーとプラグイン。 |
| https://docs.openclaw.ai/concepts/model-providers | モデル提供元の公式設定案内の索引。独自の接続先は models.providers の案内へつながる。 |
| https://docs.openclaw.ai/concepts/model-providers/quick-rules | モデル参照は provider/model。既定モデルは agents.defaults.model.primary。OpenAI のルートでは暗黙に別の実行方式が選ばれる場合があり、provider/model の agentRuntime.id を openclaw に指定すると OpenClaw の実行方式に固定できる。 |
| https://docs.openclaw.ai/concepts/model-providers/official-provider-plugins | Anthropic、OpenAI、Google などを掲載。各キー名は ANTHROPIC_API_KEY、OPENAI_API_KEY、GEMINI_API_KEY。Google の OpenClaw 内部 ID は google。ほかに DeepSeek、OpenRouter、Mistral、xAI なども説明されているが、カタログ情報なしで設定を推測しない。 |
| https://docs.openclaw.ai/concepts/model-providers/custom-providers | models.providers に独自 URL、API 形式、キー参照、モデル一覧を記述。OpenAI 互換は openai-completions の例がある。モデル一覧への登録とモデル別の別名設定は別。 |
| https://docs.openclaw.ai/gateway/config-agents/models | agents.defaults.models のモデル別設定に agentRuntime を持たせられる。既定モデルを provider/model で指定する方法を説明。 |
| https://docs.openclaw.ai/providers/ollama | Ollama はネイティブの /api/chat を使う。/v1 を付けた OpenAI 互換 URL は道具呼び出しを壊すとして避ける説明。 |
| https://docs.openclaw.ai/providers/ollama/setup | ローカル・LAN 接続と公開リモート接続で認証条件が異なる。ローカルは実際の秘密キーを必要としない。利用するモデルと Ollama 本体は別途用意する必要がある。 |
| https://docs.openclaw.ai/providers/ollama/configuration | models.providers.ollama に baseUrl、api: ollama、models を設定できる。モデル ID のコロンを含むタグを使う例がある。 |
| https://docs.openclaw.ai/cli/tui | openclaw tui --local は Gateway なしで端末から使える。Gateway と同じ状態保存先を同時には所有できない。ローカルでは Gateway 限定機能は使えない。 |
| https://github.com/openclaw/openclaw/blob/main/src/cli/tui-cli.ts | tui の --local 登録と、ローカル指定・接続 URL などの組み合わせの検査を確認。更新日 2026-10-22。 |
| https://docs.openclaw.ai/cli/acp | openclaw acp は標準入出力を使う ACP サーバーで、稼働中の Gateway に接続する橋渡し。--session で agent:main:main などを指定。エディター側の個別設定は手動。橋渡しモードのセッション単位 mcpServers は受け付けない。MCP は Gateway 側に設定する。 |
| https://docs.openclaw.ai/cli/gateway | Gateway の実行と管理の索引。サービスのインストールとフォアグラウンド実行は別。 |
| https://docs.openclaw.ai/cli/gateway/running | openclaw gateway run で起動。gateway.mode: local が必要。loopback は同じ Mac 内からの接続に限定。ポート指定は可能で通常は 18789。--force は既存の待ち受けを止め得るためこのアダプターは使わない。 |
| https://docs.openclaw.ai/tools/acp-agents | 外部実行ソフトを OpenClaw から使う ACP セッションと、OpenClaw 自体を外部から操作する openclaw acp は別経路。ネイティブの補助実行も別。 |
| https://docs.openclaw.ai/tools/acp-agents/quickstart | 外部実行ソフトへの ACP 接続には公式の @openclaw/acpx プラグインなどの準備が必要。利用先の認証と許可も必要。アダプターはインストールや実行をしない。 |
| https://docs.openclaw.ai/tools/subagents | sessions_spawn によるバックグラウンドの補助実行があり、別セッションで結果を親へ戻す。補助実行用モデルの設定もある。この機能の存在と、レシピの任意の helpers が自動接続済みであることは別。 |
| https://docs.openclaw.ai/cli/agent | 対話なしの実行方法として agent exec、--message-file、--json、--config、--cwd、--state-dir などを説明。従来の agent --local による一回の実行もある。 |

## 生成方針

アダプター独自の判断と実装上の制約を以下に示す。第三者製品の未確認機能を補っているわけではない。

- `plan()` はファイルを作らず、書き込み予定だけを返す。ネットワークもプロセスも使わない。
- 設定ファイルは `.config/openclaw/openclaw.json`。状態も `.config/openclaw/`、内部ホーム基準はその `home/`、作業場所は `project/` にする。四つの明示的な環境変数を返す。全体のホーム設定には触れない。
- MCP の入力は契約の `ctx.mcp[id] = { command, args, env }`。選択された道具だけをネイティブの `mcp.servers` に変換する。未確認または不正な定義は unsupported。秘密キーらしい環境変数は `${ENV_NAME}` 参照だけを許可し、実際の値は保存しない。
- 指示は `project/AGENTS.md` に置く。既定ファイルの自動生成は止める。祖先 AGENTS.md のマージや別製品の指示ファイル名への自動対応は行わない。
- 端末は `['openclaw', 'tui', '--local']`。ACP 用のフロントエンドでは `['openclaw', 'gateway', 'run']` を返し、エディター側は別途 acp.command/args/env を設定する。acp は `openclaw acp --session agent:main:main`。エディターの全体設定は書かない。
- ACP 接続情報は端末用プランにも返すが、使う前に端末のローカル実行を終了し、同じ環境変数で Gateway を起動する手順を manual に記載する。Gateway の自動起動機能は実装しない。
- Gateway は mode: local / bind: loopback。既定の認証機構を上書きせず、秘密キーや固定トークンは作らない。複数 Gateway のポート自動割り当ては行わない。
- モデル ID は最初のコロンだけで分ける。タグやモデル名の内部のコロン・スラッシュは維持する。既定のモデルを設定し、モデル別 agentRuntime.id を openclaw に固定する。
- Anthropic、OpenAI、Google/Gemini と Ollama の既知の ID は固定対応表を使う。追加の提供元は、信頼された ctx.providers のメタ情報から接続先とキー名を得る。種類が openai-compatible なら openai-completions を使う。レシピから任意 URL を受け取らない。
- カタログにモデル一覧がある場合は選択されたモデルの登録を確認する。カタログがない既知の提供元については、呼び出し側が契約どおりレシピを検証済みであることを前提にする。アカウントの利用権は保証しない。
- helper 役として使う設定と、自動的な helpers の接続は実装していない。役割を実現できたかのような起動結果を返さず unsupported にする。ネイティブの補助実行機能そのものは meta.supports.subagents: true。

## 指示の順序と未確認事項

公式ソースで初期ファイルの順序を確認したが、AGENTS.md と SOUL.md などの矛盾を必ずどちらが解決するかという総合的な優先順位は **unverified**。
設定された作業場所が起点であり、一般のコーディング CLI と同じ祖先探索をするとは推測しない。
スキル名が重なった場合の優先順は上表の公式スキル文書で確認済み。

`CONTRACT.md` は `ctx.style: {...}` の内部形式を定めていない。現在受け付ける本文は
`{ id, agentsMd: '...' }` または `{ id, files: [{ path: 'AGENTS.md', content: '...' }] }`。
`project/AGENTS.md` という固定パス表記も受け付ける。任意の入力パスは書き込み先にしない。
本文がない場合に限り、契約の例にある `plan-then-act` に対して短い日本語の固定文を持つ。
未知の書き方は本文がなければ unsupported。**レビュアー確認事項:** コアのスタイル本文の形式と合わせる必要がある場合は、このアダプター内の変換だけを調整する。

`ctx.providers` は ID をキーにするオブジェクトかメタ情報の配列を受け付ける。
各値が `{ meta }` のモジュール形でもよい。レシピ側はコアでカタログ検証済みという契約を維持する。
**レビュアー確認事項:** 別の ctx.providers 形式をコアが採用した場合は変換が必要。

## 対話なしの使い方（調査のみ）

公式の https://docs.openclaw.ai/cli/agent には、`openclaw agent exec` と
`--message-file` / `--json` による対話なしの実行がある。`--config` で設定ファイルを固定し、
`--cwd` で作業場所を指定できる。既定では一時的な状態保存先を使う。
`--state-dir` で状態を残す場合は、そのディレクトリーを先に作っておく必要がある。
このレシピ契約には対話なし実行の依頼本文やモード欄がないため、plan の起動コマンドには採用していない。
人が使う端末・ACP 接続用の計画を返す。CLI やサービス、モデル、MCP サーバーは本作業では起動していない。

初期設定にも対話なしの例があり、https://docs.openclaw.ai/providers/ollama/setup は
`onboard --non-interactive --accept-risk` と接続先・モデル指定を掲載する。
これは初期設定用であり、通常の作業を一回実行する agent exec とは別。

## 実行した確認と残る不確実性

- `node --test test/recipes/harness-openclaw.test.js`: 初回は 16 件中 15 成功、1 失敗。未知の提供元で undefined.api を読む分岐をテストが検出したため修正した。修正後の再実行は終了コード 0、実出力の集計は `# tests 16`、`# pass 16`、`# fail 0`、`# skipped 0`。
- `command -v openclaw` で見つからず。条件付きのバージョン確認コマンドの実出力は `openclaw: not installed (not on PATH)`。`openclaw --version` は未実行。
- OpenClaw 本体による設定検証、実際のモデル利用、MCP 接続、ACP 接続、Gateway の起動は **unverified**。インストールと本体起動をしない作業制約に従う。
- スキルの読込仕様は調査済みだが、この契約の style から SKILL.md を組み立てる形式は **unverified**。このアダプターは AGENTS.md のみを生成する。
- ソース調査で候補にした https://github.com/openclaw/openclaw/blob/main/src/config/zod-schema.models.ts は取得エラーだった。根拠にしていない。モデル設定の根拠は上表の公式設定文書。

テスト用の `example.invalid` 接続先、fixture-model、test-model は合成データであり、実在する提供元や提供中モデルの主張ではない。
テストは他のレシピ実装に依存せず、標準ライブラリーとこのアダプターだけを読み、オフラインで実行する。

## C2 追記: 補助役の MCP サーバー（2026-11-15）

以前の補助役接続の未実装という記録を更新する。公式の `openclaw mcp serve` があるため `asMcpServer` を実装した。この機能は起動済み Gateway（会話を仲介するプログラム）の既存の会話を読む・送る道具を公開する。新しい作業用エージェントを直接実行する機能ではなく、送信には保存済みの接続先が必要。[公式資料](https://docs.openclaw.ai/cli/mcp/serve)

設定先は `.config/helpers/<role>-<index>/openclaw/`。補助役のモデルと共有 `project/` を作業場所とする設定を保存する。専用の `OPENCLAW_HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR` を返す。[環境変数の根拠](https://docs.openclaw.ai/help/environment) 引数は `mcp serve --claude-channel-mode off`。通常の道具呼出しを使う。[起動引数](https://docs.openclaw.ai/cli/mcp/serve#options)

同じ補助役用の環境変数で Gateway を別途起動し、既存の会話の接続先を用意する必要がある。アダプターは Gateway を自動起動しない。指定モデルで独立した確認作業を返せることは **unverified**。[機能の範囲](https://docs.openclaw.ai/cli/mcp/serve#current-limits)

進行役としては補助役の接続を通常の `mcp.servers` に含める。[接続設定](https://docs.openclaw.ai/tools/mcp) 実プロセス、Gateway、送受信、認証は実行していない。確認はオフラインテストのみ。
