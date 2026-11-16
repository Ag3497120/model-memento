# Codex CLI 調査メモ

確認日: 2026-11-15。公式ドキュメントと公開ソースを読み、以下を自分の言葉で整理した。
CLI の実動作を確認したのは `--version` だけ。インストール、ログイン、モデルへの接続、MCP サーバー、ACP は実行していない。

## 参照した資料

以下はすべて 2026-11-15 に閲覧。`developers.openai.com/codex/` の説明ページは現在 `learn.chatgpt.com` に転送される。本文取得には各ページの `.md` 版も使用した。

| URL | 確認した内容 |
| --- | --- |
| https://developers.openai.com/codex/cli → https://learn.chatgpt.com/docs/codex/cli | ターミナルで使う CLI。`npm install -g @openai/codex`、`brew install --cask codex`、単体インストーラーを案内。初回のログインも必要。インストール方法は表示するだけで実行しない。 |
| https://github.com/openai/codex | OpenAI の公開リポジトリ。CLI の説明、ソース、ライセンスへのリンクがある。 |
| https://github.com/openai/codex/blob/main/LICENSE | Apache-2.0。ライセンス本文はプロジェクトへ転載していない。 |
| https://developers.openai.com/codex/config-basic → https://learn.chatgpt.com/docs/config-file/config-basic | ユーザー設定は通常 `~/.codex/config.toml`。信頼済みプロジェクトでは `.codex/config.toml` も読み込む。通常の優先順は CLI、作業場所に近いプロジェクト設定、選択したプロファイル、ユーザー設定、組織からの既定値、システム設定、組み込み値。管理者の制約は別途適用される。 |
| https://learn.chatgpt.com/docs/config-file/config-advanced | `CODEX_HOME` が設定と状態の保存先を変更し、既定は `~/.codex`。モデルは `model` または `--model`。独自接続先は `model_provider` と `[model_providers.<id>]` の `base_url`、`env_key` など。OpenAI の接続先だけ変える場合は `openai_base_url`。Ollama と LM Studio は `--oss --local-provider ollama` / `lmstudio`。Amazon Bedrock と Google Cloud の組み込み接続先、Azure の独自接続例も記載。 |
| https://learn.chatgpt.com/docs/config-file/config-reference | 独自接続の `wire_api` は `responses` のみ。`env_key` はキーを受け取る環境変数の名前。通常の OpenAI 互換を名乗るだけでは、この通信方式への対応を保証できない。 |
| https://developers.openai.com/codex/mcp → https://learn.chatgpt.com/docs/extend/mcp | MCP は `config.toml` の `[mcp_servers.<name>]`。プロジェクト内 `.codex/config.toml` も使用できるが信頼設定が必要。ローカルの標準入出力方式は `command`、`args`、`env`、`env_vars`、`cwd`。HTTP 方式は `url`、認証用の変数名など。`env_vars` は同じ名前の環境変数を引き継ぐ。 |
| https://developers.openai.com/codex/guides/agents-md → https://learn.chatgpt.com/docs/agent-configuration/agents-md | 最初に Codex ホーム、次にプロジェクトのルートから現在の場所までの指示を読む。各場所で `AGENTS.override.md`、`AGENTS.md`、設定済みの代替名の順。各場所につき最初の空でない1ファイル。後から読む、作業場所に近い指示が優先。ルートが見つからなければ現在の場所だけ確認。既定の総量上限は 32 KiB。 |
| https://developers.openai.com/codex/skills → https://learn.chatgpt.com/docs/build-skills | スキルは `SKILL.md` を持つ再利用可能な手順。作業場所からリポジトリのルートまでの `.agents/skills/`、`$HOME/.agents/skills/`、`/etc/codex/skills/`、組み込みの手順を読む。`CODEX_HOME` を変えてもユーザーの `.agents/skills` やシステム設定まで隔離されるとは説明されていない。 |
| https://learn.chatgpt.com/docs/agent-configuration/subagents | 現行版は補助エージェントを使える。個別のモデルや指示を指定する TOML ファイルは `.codex/agents/` または `~/.codex/agents/`。これは別製品の CLI を自動接続する設定とは区別する。 |
| https://learn.chatgpt.com/docs/non-interactive-mode | 対話画面を使わない実行は `codex exec`。`--json` は1行ごとの JSON 出力、`--sandbox workspace-write` は作業領域への書き込み、`--ephemeral` はセッション記録を保存しない指定。Git 管理外で使う場合は `--skip-git-repo-check`。現行文書では `--full-auto` は廃止。これらは調査のみで、このアダプターの通常起動は対話型。 |
| https://learn.chatgpt.com/docs/auth | ChatGPT ログインと API キーに対応。`codex login` または標準入力経由の `codex login --with-api-key`。`cli_auth_credentials_store = "file"` なら実際の認証データは `CODEX_HOME/auth.json` に保存される。独自接続先のキーは `env_key` の名前で環境から受け取れる。 |
| https://github.com/openai/codex/blob/main/codex-rs/core/config.schema.json | 公開された設定仕様でも独自接続先の `wire_api` は `responses` のみ。`base_url`、`env_key`、`mcp_servers`、認証データの保存方法などの定義を確認した。 |
| https://github.com/openai/codex/blob/main/codex-rs/cli/src/main.rs | `Exec`、`Review`、`Mcp`、`AppServer` などのコマンドを確認。取得したソース内で `acp` は見つからず、ネイティブ ACP 起動コマンドは未確認。 |
| https://github.com/openai/codex/blob/main/codex-rs/utils/cli/src/shared_options.rs | `--model`、`--oss`、`--local-provider`、`--cd` の引数を実装側でも確認。作業場所とモデル名は別々の引数で渡す。 |
| https://github.com/openai/codex/blob/main/codex-rs/exec/src/cli.rs | `--skip-git-repo-check`、`--ephemeral`、`--ignore-user-config` などを確認。調査のために実行したわけではない。 |
| https://learn.chatgpt.com/docs/developer-commands?surface=cli | `codex exec`、ログイン、MCP 管理などのコマンド説明。引数表の一部は動的表示なので、必要な引数は上記のソースでも確認した。 |
| https://learn.chatgpt.com/docs/app-server | `codex app-server` はスレッドやターンを扱う独自の接続方法。名前や JSON-RPC の使用だけから ACP と同じとは判断しない。 |
| https://github.com/agentclientprotocol/codex-acp/blob/main/README.md | ACP 用の別アダプター。`npx -y @agentclientprotocol/codex-acp`、または別途インストール後の `codex-acp` で起動。Codex App Server と ACP を橋渡しし、対応する Codex パッケージも同梱。OpenAI Codex CLI 自体の機能としては扱わず、今回の `acp` は `null`。このパッケージは実行もインストールもしていない。 |

ソース本文は以下の raw URL でも取得した。同じファイルの別表示であり、実装の転載はない。

- https://raw.githubusercontent.com/openai/codex/main/LICENSE — 上記のライセンス本文。
- https://raw.githubusercontent.com/openai/codex/main/codex-rs/core/config.schema.json — 上記の設定仕様。
- https://raw.githubusercontent.com/openai/codex/main/codex-rs/cli/src/main.rs — 上記のコマンド一覧。
- https://raw.githubusercontent.com/openai/codex/main/codex-rs/utils/cli/src/shared_options.rs — 上記の共有引数。
- https://raw.githubusercontent.com/openai/codex/main/codex-rs/exec/src/cli.rs — 上記の対話画面を使わない実行の引数。
- https://raw.githubusercontent.com/agentclientprotocol/codex-acp/main/README.md — 上記の ACP 橋渡しパッケージの説明。
- https://raw.githubusercontent.com/openai/codex/main/codex-rs/utils/cli/src/lib.rs — 実際の共有引数のファイル名が `shared_options.rs` であることを確認。
- https://raw.githubusercontent.com/openai/codex/main/codex-rs/tui/src/cli.rs — 通常起動が対話画面であることと `--version` を補助的に確認。
- https://raw.githubusercontent.com/openai/codex/main/codex-rs/app-server/README.md — 管理下の承認処理などの説明。ACP の起動方法を示す根拠には使っていない。
- https://raw.githubusercontent.com/openai/codex/main/codex-rs/core/src/model_provider_info.rs — 404。根拠には使っていない。
- https://raw.githubusercontent.com/openai/codex/main/codex-rs/core/src/model_provider_info/mod.rs — 404。根拠には使っていない。
- https://raw.githubusercontent.com/openai/codex/main/codex-rs/utils/cli/src/shared_cli_options.rs — 404。根拠には使っていない。

## 実装上の選択

- `plan()` は書き込みを実行せず、`.config/codex/config.toml` と `project/AGENTS.md` の内容を返す。起動環境の `CODEX_HOME` は `<workspace>/.config/codex`。通常のユーザー設定に相当する設定をこの専用領域へ置くので、プロジェクト設定の自動信頼を追加しない。認証情報もこの領域を使う設定とし、初回ログインは `manual` に残す。環境変数の値や認証データを読み取らない。
- 起動は `['codex', '--cd', '<workspace>/project', '--model', '<catalog model>']`。Ollama の場合は別々の `--oss`、`--local-provider`、`ollama` を追加。レシピのタイトル、目的、メモをコマンドへ転用しない。
- `supports.models` は、このアダプターで扱う種類を列挙する。OpenAI、Responses 方式の独自接続先、Ollama。Anthropic の専用通信方式は上記の `wire_api` 仕様にないため `unsupported`。LM Studio、Bedrock、Google Cloud、Azure 専用設定は今回生成しない。独自接続先を含め、実際のモデルの利用可否は未確認。
- 別の CLI を補助役として自動で呼ぶ仕組みは生成しない。`role: helper` はファイル・環境・起動引数を空にして `unsupported`。主担当に外部の補助役が指定された場合も対応できない部分を返す。Codex 自身の補助エージェント機能を無効化するという意味ではない。
- 非対応の前面画面、指示形式、取得できないカタログ項目は黙って代替せず `unsupported`。ACP 橋渡しパッケージを勝手にインストールしない。
- MCP の `env` にある `${NAME}` は同じキー名の `env_vars` に変換する。別名への変換や複雑な変数展開は未確認としてサーバーを省略する。固定値は TOML の文字列として引用する。MCP は契約にある標準入出力方式のみ生成する。

## コアとの接続で確認が必要な点

`CONTRACT.md` は `ctx.style` と `ctx.providers` の内部形式を確定していない。このアダプターでは、信頼済みの `ctx.providers[providerId]` に提供元の `meta` またはメタデータそのものを受け取り、`models[].id` を照合する。レシピの `provider:model` の末尾は、カタログ内のモデル ID と一致する必要がある。

スタイルは一致する `id` と、`files: [{path: 'AGENTS.md', content}]`、`files: {'AGENTS.md': content}`、または `agentsMd` の本文を受け取る。`project/AGENTS.md` も入力側の別表現として受理するが、出力先は固定する。任意のスタイルパスへは書かない。本文を得られなければ `unsupported`。ガイド側で違う形式になった場合は接続部分の調整が必要。

独自接続先の種類 `openai-compatible` だけでは Responses 方式への対応を検証できない。設定は生成するが `model.responses-compatibility` を `why: "unverified"` として残す。カタログが通信方式の確認済み情報を渡す契約は現時点ではない。自動起動を許す条件はコア側で確認してほしい。

`CODEX_HOME` の変更は OS 全体の隔離ではない。ユーザーのスキルやシステム・管理者設定の読み込み、モデルの権限、実サーバーの互換性は実行検証していない。ネイティブ ACP コマンド、外部ハーネス同士の補助役接続も `unverified`。

## 実行確認

- `command -v codex` → `/opt/homebrew/bin/codex`（終了値 0）。
- `/opt/homebrew/bin/codex --version` → `codex-cli 0.157.1`（終了値 0）。同時に `WARNING: proceeding, even though we could not create PATH aliases: Operation not permitted (os error 1)` が出た。PATH やグローバル設定は編集していない。
- `node --test test/recipes/harness-codex.test.js` → `tests 17`、`pass 17`、`fail 0`（終了値 0）。設定の実読み込み、認証、モデル・MCP・ACP の接続は未実行。

## C2 追記: MCP サーバーモードの削除（2026-11-15）

公式資料は `codex mcp-server` と単体の `codex-mcp-server` の削除を明記している。古い Agents SDK の例も現行の方法として使えない。代替の app-server は独自の通信方式で、MCP の置換ではない。そのため `asMcpServer` は公開しない。`meta.helperMcpReason` に出典つきの削除理由を持たせ、補助役としては手動とする。[公式の削除案内](https://learn.chatgpt.com/docs/mcp-server)

外部の MCP 道具を受け取る機能は継続している。進行役の Codex は `helper-<role>` も通常の `mcp_servers` に含める。以前の「外部補助役は常に未対応」という記録を受け取り部分について更新する。[MCP 設定](https://learn.chatgpt.com/docs/extend/mcp)

合成側は手動の Codex 用にも `helpers/<role>-<index>/` 以下に単独用の設定案と起動手順を残す。モデルを確認できなければ別モデルに切り替えない。独立した MCP 補助役、認証、モデル通信、サーバー起動は未実行。確認はオフラインテストのみ。
