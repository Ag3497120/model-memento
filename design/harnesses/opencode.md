# OpenCode 連携の調査記録

確認日: **2026-11-15**。対象は `anomalyco/opencode` の現在の公式資料と `dev` ブランチのソースです。資料は V2 を案内していました。以下は自分の言葉でまとめた記録で、製品の画像や長い引用は含みません。資料とソースの確認のみで、OpenCode 自体は起動していません。

## 生成するものと起動方法

`plan()` はファイルを書かず、書く内容を返します。

| 返すもの | 内容 |
| --- | --- |
| `project/opencode.json` | V2 の JSON 設定。モデル、提供元、`mcp.servers` をまとめる。 |
| `project/AGENTS.md` | 選ばれた指示の本文。出力先はこの固定名だけ。 |
| 通常の `argv` | `["opencode", "--standalone"]`。作業場所は `<workspace>/project`。 |
| ACP の起動設定 | `command: "opencode"`, `args: ["acp"]`。ACP はエディターとエージェントをつなぐ方法。 |
| `zed-acp` の `argv` | `["opencode", "acp"]`。エディター側の登録は手作業。接続の作業場所にも `<workspace>/project` の絶対パスを渡す。 |

起動方法の根拠: [CLI](https://opencode.ai/docs/cli/)、[ACP](https://opencode.ai/docs/cli/acp/)、[コマンドのソース](https://github.com/anomalyco/opencode/blob/dev/packages/cli/src/commands/commands.ts)。V2 の設定の根拠: [設定](https://opencode.ai/docs/config/)、[MCP](https://opencode.ai/docs/mcp-servers/)、[提供元](https://opencode.ai/docs/providers/)。確認日はすべて上記と同じです。

保存先は、起動する子プロセスだけに渡す以下の環境変数で指定します。現在のプロセスや利用者の設定は変更しません。

| 環境変数 | 値 |
| --- | --- |
| `XDG_CONFIG_HOME` | `<workspace>/.config` |
| `OPENCODE_CONFIG_DIR` | `<workspace>/.config/opencode` |
| `XDG_DATA_HOME` | `<workspace>/.config/opencode/data` |
| `XDG_CACHE_HOME` | `<workspace>/.config/opencode/cache` |
| `XDG_STATE_HOME` | `<workspace>/.config/opencode/state` |

`meta.configHomeEnv` は公開資料にもある `XDG_CONFIG_HOME` です。[CLI の設定資料](https://opencode.ai/docs/cli/config/)で CLI 設定の移動を確認し、[保存先のソース](https://github.com/anomalyco/opencode/blob/dev/packages/util/src/global-roots.ts)でサーバー側の保存先にも使われることを確認しました。`OPENCODE_CONFIG_DIR` は[ソース](https://github.com/anomalyco/opencode/blob/dev/packages/util/src/global.ts)で確認した追加指定です。これは構成の保存先をそろえるためで、ホーム全体を移す約束ではありません。

## 公式資料で確認した事実

以下の URL はすべて **2026-11-15 に参照**しました。実装の第三者製品に関する根拠 URL は `meta.sources` にも収録しています。

- <https://github.com/anomalyco/opencode> — 公式リポジトリ、製品名、公式サイトの案内を確認。今回の対象をこのリポジトリに固定した。
- <https://github.com/anomalyco/opencode/blob/dev/LICENSE> — MIT ライセンスを確認。コードはコピーしていない。
- <https://opencode.ai/docs/> — 現在の npm 導入表示は `npm install -g @opencode/cli`。端末用の実行ファイル名は `opencode`。他の導入方法として V2 のインストール用スクリプト、Homebrew、実行ファイル配布も案内される。導入は実行していない。
- <https://opencode.ai/docs/config/> — JSON / JSONC に対応。全体用は `~/.config/opencode/opencode.json(c)`、プロジェクト用は直下または `.opencode/opencode.json(c)`。親フォルダから設定を合わせ、`.opencode` 側が直下形式より後になる。管理者の設定と macOS 管理設定が最優先。モデルは `provider/model`。環境変数の参照は `{env:NAME}`。実装は鍵の値を保存しない。
- <https://opencode.ai/config.json> — 公開 JSON Schema（設定の形式の定義）。V2 の `agents`、`providers`、`mcp.servers` などの形を照合した。実際の OpenCode に読み込ませた確認ではない。
- <https://opencode.ai/docs/mcp-servers/> — 名前付きの接続先は `mcp.servers`。ローカル接続は `type: "local"`、`command` は実行ファイルと引数の配列、`environment` は環境変数の辞書。既定で接続するため `enabled` は書かない。リモート接続は `type: "remote"` と URL、必要に応じ認証。プロジェクトへの追加と `--global` による全体への追加を区別。契約の `ctx.mcp` はコマンド形式なので、今回生成するのはローカル接続だけ。
- <https://opencode.ai/docs/instructions/> — V2 が自動検出する指示書は `AGENTS.md`。`CLAUDE.md` への代替読み込みはしない。全体の指示書を先に、作業場所から近い順に上へたどった指示書を、その後に追加指定の指示を合わせる。ホーム内ではホームまで、ホーム外ではプロジェクトの根元まで探索する。矛盾を自動解決する上書き規則ではない。下位の指示書は探索時にも読み込む。実装はプロジェクトの固定位置にだけ本文を返す。
- <https://opencode.ai/docs/skills/> — 再利用する指示は `.opencode/skills/<id>/SKILL.md` に置ける。同じ ID は後から登録したものが優先。低い順に、組み込み、`.claude/skills`、`.agents/skills`、全体の `~/.config/opencode/skills`、プロジェクトの `.opencode/skills`、明示した `skills` 配列。互換用のフォルダは全体から始めて親から現在地の順、プロジェクト用も親から現在地の順に扱う。今回の契約にはスキル本文の受け渡しが定義されていないため、スキルファイルは生成しない。
- <https://opencode.ai/docs/models/> — 起動後の選択は `/models`、非対話実行の選択は `opencode run --model provider/model`、既定値は設定の `model`。利用可能な提供元とモデルである必要があり、既定値が使えないと別モデルへ切り替わる場合がある。この連携では一覧と照合できないモデルの起動引数を空にし、未対応として返す。
- <https://opencode.ai/docs/providers/> — Anthropic、OpenAI、Google の実装と、OpenAI 互換 API の設定を確認。V2 は `providers.<id>.package`、`settings.baseURL`、`models` を使う。鍵の変数名は `env` に指定できる。Google の組み込み ID は `google`。Ollama は組み込みの `ollama` でローカルのモデルを探し、別の接続先は `/v1` を含む `baseURL`。ほかに Azure、Amazon Bedrock、Google Vertex、GitHub Copilot、OpenRouter、LM Studio、vLLM の説明もある。今回の変換対象は `meta.supports.models` にある5種類だけ。
- <https://opencode.ai/docs/agents/> — 主担当と内部の補助役に対応。`agents.<id>` または `.opencode/agents/<id>.md` にモデルと指示を置き、`mode: "subagent"` などを選ぶ。内部の子セッションと、別の実行ツールへの自動の仕事の受け渡しは同じ機能ではない。今回の連携では `helpers` の自動接続を生成せず、未対応として明示する。
- <https://opencode.ai/docs/cli/> — `opencode` は対話画面、`opencode run` は非対話実行。通常は共有のバックグラウンドサーバーを使い、`--standalone` は専用サーバーを使う。この連携は渡した環境設定を使うため後者を返す。`debug paths` は保存先の確認方法として記載があるが実行していない。
- <https://opencode.ai/docs/cli/config/> — 端末画面の設定は全体用の `cli.json`。`XDG_CONFIG_HOME` を指定すると `$XDG_CONFIG_HOME/opencode/cli.json` を使う。プロジェクト用の CLI 設定ファイルはない。画面の設定自体は今回生成しない。
- <https://opencode.ai/docs/cli/commands/> — `run --model`、`--agent`、`--format json`、`--file`、`--session`、`--continue`、`--archived` を確認。CI の例は `run --standalone --model ...`。`--auto` は拒否されていない権限の自動承認であり、非対話実行の必須指定ではない。連携が返す引数には含めない。レシピには依頼文の入力欄がないため `run` の呼び出しは生成しない。
- <https://opencode.ai/docs/cli/acp/> — ACP のコマンドは `opencode acp`。標準入出力でやり取りし、専用の内部サーバーを使う。接続時に絶対パスの作業場所を渡す。認証は先に `opencode auth login` などで用意する。エディターの設定形式の例はあるが、この連携は利用者のエディター設定を変更しない。
- <https://opencode.ai/docs/migrate-v1/> — V1 と V2 は同じ `opencode` 名を使い、設定の保存場所も共通。V2 は対応する V1 設定も読み込むが、V2 専用形式を V1 に渡してはいけない。MCP は V2 で `mcp.servers`、提供元は `providers`、内部の役割は `agents`。このため生成計画に V2 の版確認を手作業として残す。
- <https://opencode.ai/docs/troubleshooting/> — 不具合の報告材料に `opencode --version` を案内。全体のデータベースや共有サーバーの保存場所も説明される。今回実行したのは存在の確認だけで、これらのファイルには触れていない。

## ソースで確認したこと

以下も **2026-11-15 に参照**。`dev` は変更されるブランチであり、公開済みの特定バージョンとの一致は **unverified**。

- <https://github.com/anomalyco/opencode/blob/dev/packages/util/src/global-roots.ts> — `XDG_CONFIG_HOME`、`XDG_DATA_HOME`、`XDG_CACHE_HOME`、`XDG_STATE_HOME` を基点にし、その下にアプリ名を付ける。標準の一時領域は別に扱う。環境変数で設定・データなどを移せても、すべての実行時ファイルが作業場所内に収まる保証はしない。
- <https://github.com/anomalyco/opencode/blob/dev/packages/util/src/global.ts> — 設定の場所に `OPENCODE_CONFIG_DIR` を適用する。`OPENCODE_TEST_HOME` も見つかったが、公開された利用者向けのホーム移動方法とは確認できず、使用しない。
- <https://github.com/anomalyco/opencode/blob/dev/packages/core/src/config.ts> — 設定ファイル、プロジェクトの補足設定、管理者設定などを組み合わせる。設定先だけを移しても他の設定を全部無効にはしない。
- <https://github.com/anomalyco/opencode/blob/dev/packages/core/src/config/discovery.ts> — `opencode.json` / `opencode.jsonc`、親フォルダ、`.opencode`、全体用の互換フォルダ、管理者の設定を探索する。今回の設定先の指定を完全な隔離と呼ばない理由。
- <https://github.com/anomalyco/opencode/blob/dev/packages/cli/src/commands/commands.ts> — `--standalone`、`acp`、`run` の配列形式の起動引数と、`run` のモデル・役割・出力形式などの指定を照合した。

調査経路として以下も同日に読んだが、実装上の新しい主張の根拠にはしていない。

- <https://github.com/anomalyco/opencode/tree/dev/packages> — 現在の構成に `cli`、`core`、`util` があることを確認。
- <https://github.com/anomalyco/opencode/tree/dev/packages/cli/src> — コマンド定義と環境変数を扱うファイルを探した。
- <https://github.com/anomalyco/opencode/tree/dev/packages/core/src> — 設定の探索処理を探した。
- <https://github.com/anomalyco/opencode/tree/dev/packages/cli/src/commands> — `commands.ts` を特定した。
- <https://github.com/anomalyco/opencode/tree/dev/packages/util/src> — 保存先を扱う `global.ts` と `global-roots.ts` を特定した。
- <https://github.com/anomalyco/opencode/blob/dev/packages/core/src/flag.ts> — 機能の有効・無効を決める処理であり、ホームの移動方法を示すものではなかった。
- <https://github.com/anomalyco/opencode/blob/dev/packages/cli/src/env.ts> — CLI の環境変数処理を読んだが、保存先の根拠にはならなかった。
- <https://github.com/anomalyco/opencode/blob/dev/packages/schema/src/config.ts> — 設定の形式の入口を読んだ。具体的な形式の確認には公開 JSON Schema と公式資料を使った。

取得に失敗した URL も記録する。これらから機能を推測していない。

- <https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/config/config.ts> — 404。過去の構成を想定した場所は使わず、現在の `packages/core` を調べた。
- <https://github.com/anomalyco/opencode/blob/dev/packages/server/src/env.ts> — 404。ここに環境変数の説明があるとは確認できなかった。
- <https://opencode.ai/docs/cli/paths/> と <https://opencode.ai/docs/cli/automation/> — 読み取りツールで取得できず。必要な説明は CLI 入口ページ内の節にあった。
- <https://opencode.ai/docs/migrate/> — 読み取りツールで取得できず。公式リンク先の `/docs/migrate-v1/` を参照した。

## 連携上の境界とレビューで確認する点

- `ctx.providers` は契約の提供元 ID をキーとする辞書として扱い、値は掲載情報そのもの、または `meta` を公開するモジュールを受け取る。モデル名・接続先・鍵の変数名はその情報から取り出す。レシピの自由文を引数、パス、URL、環境変数に変換しない。
- 契約で `ctx.style` の内部形式は未定義。今回は `files: [{ path: "AGENTS.md", content: "…" }]` または `files: { "AGENTS.md": "…" }` に対応する。`project/AGENTS.md` も同じ固定出力先に対応づける。それ以外の出力先、複数の本文、本文なしは未対応として返す。**レビュー依頼: コアが渡す形式と合わせてほしい。**
- `ctx.role: "helper"` は生成ファイルと起動引数を空にし、未対応とする。主担当が OpenCode の場合も、レシピの `helpers` を内部の補助役や外部ツールへ自動変換しない。製品の補助役対応は資料で確認済みだが、今回の受け渡し処理は未実装。
- モデルの認証、実際のモデルの存在、MCP 接続、エディターからの ACP 接続、実行時のファイルの場所、権限設定は **unverified**。これらを試すプロセスは起動していない。
- `plan()` のパス確認は固定の出力先と文字列上の境界による。既存のシンボリックリンクや上書きの防止は契約どおりコアの `apply()` が担当する。
- 特別な `OPENCODE_HOME` という利用者向け変数は今回の資料では確認できず **unverified**。`OPENCODE_CONFIG_DIR` の現在の利用者向け公式説明も確認できなかったため、ソースによる確認として区別した。XDG の指定と専用サーバーでも管理者設定、親の指示、互換用のホーム内フォルダ、一時領域までは隔離しない。
- V1 用の設定生成は未実装。**レビュー依頼: 現在の V2 を対象とする前提でよいか、導入済み V1 の利用者には版の確認を画面でも表示するか確認してほしい。**

## 実行した確認

2026-11-15、プロジェクトの作業フォルダで実行。

```text
node --test test/recipes/harness-opencode.test.js
# tests 12
# pass 12
# fail 0
```

2つの MCP 接続、指示の本文、設定先の境界、純粋な計画、自由文の分離、未対応の報告、提供元の変換、ACP の引数、空の `which` による未導入の検出を確認。テスト中も OpenCode や MCP サーバーは起動しない。

```text
if command -v opencode >/dev/null 2>&1; then opencode --version; else printf '%s\n' 'opencode: not installed (not found on PATH)'; fi
opencode: not installed (not found on PATH)
```

終了コードはどちらも 0。`opencode` が PATH にないため、実際の `--version` 呼び出しは未実行。導入、サーバー起動、ネットワークを使う動作確認、全体設定への書き込みはしていない。

## C2 追記: serve と MCP サーバーの違い（2026-11-15）

公式の `opencode serve` は API（他のプログラムが呼ぶ接続口）を公開するコマンド。`mcp` は接続する道具の管理用。OpenCode 自身を MCP の道具として公開する公式の起動方法や公式 SDK 接続は、調べた資料では **unverified**。第三者の接続プログラムは採用せず、`asMcpServer` は公開しない。[コマンド](https://opencode.ai/docs/cli/commands/)、[API](https://opencode.ai/docs/api)、[MCP](https://opencode.ai/docs/mcp-servers/)

進行役としては `helper-<role>` を通常の `mcp.servers` に含める。以前の補助役未対応という記録を受け取り部分について更新する。[設定](https://opencode.ai/docs/mcp-servers/) 補助役としては出典つきの手動理由を示し、合成側が `helpers/<role>-<index>/` に単独用の設定案を残す。

実サーバー、認証、モデル通信、ACP 接続は未実行。確認はオフラインテストのみ。
