# Hermes Agent 調査メモ

調査日: 2026-11-15。公開の公式資料と公式ソースだけを読んだ。インストールや起動は行っていない。`~/.hermes` の設定、履歴、キー、その他の私的な内容は読んでいない。

## このアダプターで作るもの

`plan()` は書き込みをせず、作成予定のファイル、環境変数、起動引数を返す。設定は `.config/hermes/config.yaml`、指示は `project/AGENTS.md`。`HERMES_HOME` に作業場所内の `.config/hermes` の絶対パスを渡す。通常の起動引数は `["hermes", "chat"]`、ACP 用は `["hermes", "acp"]`。起動時の作業場所は契約どおり `workspace/project`。根拠: [設定](https://hermes-agent.nousresearch.com/docs/user-guide/configuration)、[環境変数](https://hermes-agent.nousresearch.com/docs/reference/environment-variables)、[コマンド](https://hermes-agent.nousresearch.com/docs/reference/cli-commands)。

設定ファイルには JSON の表記を使う。これは YAML（設定を書く形式）でも読める表記で、文字列を引用符で囲み、意図しない型変換を避ける。公式実装の読み取り経路は `FileBackend.read_path` → `fast_safe_load` → `hermes_yaml.safe_load`。この経路をソースで確認したが、実物のパーサーによる実行確認はしていない。根拠: 下記の `config_backend.py`、`utils.py`、`hermes_yaml.py`。

モデルは `ctx.providers[id]` の公開情報から選ぶ。`{ meta: ... }` の形式と `Map` も受け取る。モデル名は一覧にある `models[].id` と一致するものだけを使う。提供元の種類は契約の `anthropic`、`openai`、`openai-compatible`、`ollama`、`gemini`。標準の直接接続は Hermes の `anthropic`、`openai-api`、`gemini` に対応させる。別の接続先は `providers.memento` に一覧の URL と `key_env`（キーを入れる環境変数の名前）を置き、`model.provider: custom:memento` で指定する。Anthropic 形式では `transport: anthropic_messages`、互換形式では `chat_completions` を明示する。キーの値は読まず、保存もしない。[提供元の公式説明](https://hermes-agent.nousresearch.com/docs/integrations/providers)。

MCP（外部の道具をつなぐ共通の方式）は `ctx.mcp` にある選択済み定義だけを `mcp_servers` に移す。指示の内容は `ctx.style.files = [{ path: "AGENTS.md", content: "…" }]`、`path: "project/AGENTS.md"`、または `files: { "AGENTS.md": "…" }` から受け取る。任意のファイル名は書き込み先に使わない。契約は `style: {...}` の内訳を定めていないため、この受け渡し形式はレビュー時の確認事項。

補助役として別の実行ツールから呼ぶ方法と、レシピの別の補助ツールを自動接続する方法は `unverified` とする。Hermes 内蔵の子エージェント機能があることと、この接続が実装できていることを分ける。補助役の計画はファイルと起動引数を返さない。`terminal` と `zed-acp` 以外の編集画面、内容のない指示、未知のモデルや MCP 定義も `unsupported` に返す。内蔵機能の根拠: [子エージェント](https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation)、[ACP](https://hermes-agent.nousresearch.com/docs/user-guide/features/acp)。

## 公式資料と確認できた内容

以下はすべて 2026-11-15 に参照。文章、画像、ロゴ、実装コードは転載していない。

| URL | 確認できたこと |
| --- | --- |
| https://github.com/NousResearch/hermes-agent | 公式リポジトリ、公式サイトへのリンク、CLI のインストール手順、子エージェントの案内。 |
| https://hermes-agent.nousresearch.com/docs/ （転送先 https://hermes-agent.nousresearch.com/docs） | 公式資料の入口。インストール、MCP、指示ファイル、スキルの各説明へのリンク。 |
| https://hermes-agent.nousresearch.com/docs/llms.txt | 公式資料の目次。子エージェント等の説明ページを見つけた。 |
| https://hermes-agent.nousresearch.com/docs/getting-started/installation | macOS/Linux/WSL2 の CLI は `curl -fsSL https://hermes-agent.nousresearch.com/install.sh \| bash` を案内。表示用の情報としてのみ採用した。既定のデータは `~/.hermes`、ソースは `~/.hermes/hermes-agent`、起動用ファイルは `~/.local/bin/hermes`。`HERMES_HOME` はデータの場所、インストーラーの `--dir` はソースの場所を変える。 |
| https://hermes-agent.nousresearch.com/docs/getting-started/quickstart | MCP を `config.yaml` に置く例と `hermes acp` の案内。通常インストールの追加機能一式に ACP が含まれるとの説明。 |
| https://hermes-agent.nousresearch.com/docs/user-guide/configuration | `config.yaml` が一般設定、`.env` が秘密情報、`auth.json` が認証情報。引数→設定→環境変数の補完→既定値の順。`terminal.cwd` で作業場所を指定できる。`HERMES_HOME` は実行ツール一般の `HOME` を隔離するものではない。 |
| https://hermes-agent.nousresearch.com/docs/user-guide/configuration/ | 検索結果で参照。末尾スラッシュなしの現行ページも読み、そちらを採用した。 |
| https://hermes-agent.nousresearch.com/docs/reference/environment-variables | `HERMES_HOME` が設定と利用者データの保存場所を変更する。POSIX の既定値は `~/.hermes`。実行環境に渡す変数であり、通常の設定追加コマンドでは書けない。 |
| https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp | MCP は利用者用の `config.yaml` の `mcp_servers` に置く。ローカル起動は `command`、`args`、`env`、必要なら `cwd`。HTTP/SSE 接続には `url` 等がある。この調査では独立したプロジェクト用 `.mcp.json` の自動読み取りは確認できなかったため使わない。今回は `HERMES_HOME` で設定を作業場所内に移す。 |
| https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files | 指示の種類は `.hermes.md`/`HERMES.md` が最優先、その後 `AGENTS.override.md`、`AGENTS.md`、`CLAUDE.md`、`.cursorrules`。Git の管理下ではルートから現在の場所までの AGENTS 指示を読み、深い場所の指示が後に来る。Git 管理外では現在の場所だけを確認する。`SOUL.md` は別枠で `HERMES_HOME` から読む。 |
| https://hermes-agent.nousresearch.com/docs/user-guide/features/skills | 既定のスキルは `HERMES_HOME/skills`。`skills.external_dirs` と `skills.create_dir` がある。Git プロジェクトの `.hermes/skills` と `.agents/skills` は明示的な信頼設定が必要。重複時は project → local → create_dir → external_dirs の順。空の作業フォルダーに Git 管理下であることを前提としたスキルは置かない。 |
| https://hermes-agent.nousresearch.com/docs/integrations/providers | `hermes model` は提供元の設定、`--model` は実行時の選択。Anthropic、OpenAI API、Gemini、互換 URL、Ollama、OpenRouter、Nous Portal、DeepSeek、Bedrock、Hugging Face 等を説明。Ollama の接続先の例は `http://localhost:11434/v1` で `custom` 経由。名前付きの接続先は `providers` の `api`、`key_env`、`transport` で表す。アダプターは追加の各提供元の個別ログインは自動化しない。 |
| https://hermes-agent.nousresearch.com/docs/integrations/providers/ | 検索結果で参照。現行の末尾スラッシュなしページを優先した。 |
| https://hermes-agent.nousresearch.com/docs/guides/google-gemini | Gemini の直接接続は `provider: gemini`、標準 URL は `https://generativelanguage.googleapis.com/v1beta`。キー名は `GOOGLE_API_KEY` と `GEMINI_API_KEY` の両方を扱う。 |
| https://hermes-agent.nousresearch.com/docs/user-guide/features/acp | ACP（編集画面とエージェントが対話する方式）は標準入出力で `hermes acp`。`hermes-acp`、`python -m acp_adapter` も案内。CLI と同じ保存場所、認証設定を使う。最小構成のインストールでは ACP の追加依存が必要。 |
| https://hermes-agent.nousresearch.com/docs/user-guide/features/acp/ | 古い検索結果では `uv pip install -e '.[acp]'` と旧 MCP 変数を案内していた。現行の末尾スラッシュなしページおよび環境変数ページと差があるため、この旧手順は生成しない。 |
| https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation | `delegate_task` が独立した会話を持つ子エージェントを作る。これはレシピで選ぶ他の実行ツールへの接続が確認できたことを意味しない。 |
| https://hermes-agent.nousresearch.com/docs/reference/cli-commands | `--version`。通常は `hermes chat`。`chat --query TEXT` は対話画面では最初の依頼、`chat --oneshot --query TEXT` は回答後に終了する。`--query-file PATH`（`-` は標準入力）、`--quiet`/`-Q`、`--format stream-json` も案内。引数は配列の別要素として使える。計画には依頼文の欄がないため、勝手に一回実行の依頼は作らない。 |
| https://hermes-agent.nousresearch.com/docs/reference/cli-commands?_highlight=logging | 検索結果の同じコマンド説明。採用した根拠 URL はクエリーなしのページ。 |
| https://hermes-agent.nousresearch.com/docs/developer-guide/programmatic-integration | ACP、独自の画面用通信、HTTP 接続の違いを説明。`--mode rpc` は存在しないと明記。 |
| https://hermes-agent.nousresearch.com/docs/developer-guide/model-provider-plugin | 提供元を追加する仕組みを説明。今回のアダプターで独自の提供元拡張は作らない。 |
| https://hermes-agent.nousresearch.com/docs/developer-guide/session-storage | データの保存場所の決定に `HERMES_HOME` を使うと説明。実際の利用者のデータベースは調べていない。 |

## ソースの確認

2026-11-15 に https://api.github.com/repos/NousResearch/hermes-agent/commits/main を読み、調査時点の `main` が `fd8a6c41ace59b476193c61002ce6a86d667b18a` であることを確認した。コミット: https://github.com/NousResearch/hermes-agent/commit/fd8a6c41ace59b476193c61002ce6a86d667b18a 。これは利用者のインストール済み版や安定版の番号を確認したものではない。

以下のソースはすべて上記コミットを指定して公開 GitHub API から読んだ。URL を `meta.sources` にも記載した。

| URL | 確認できたこと |
| --- | --- |
| https://github.com/NousResearch/hermes-agent/blob/fd8a6c41ace59b476193c61002ce6a86d667b18a/LICENSE | MIT ライセンス。 |
| https://github.com/NousResearch/hermes-agent/blob/fd8a6c41ace59b476193c61002ce6a86d667b18a/hermes_constants.py | `get_hermes_home()` と `get_process_hermes_home()` が `HERMES_HOME` を使う。 |
| https://github.com/NousResearch/hermes-agent/blob/fd8a6c41ace59b476193c61002ce6a86d667b18a/hermes_cli/config.py | `get_config_path()` は `get_hermes_home() / "config.yaml"`。 |
| https://github.com/NousResearch/hermes-agent/blob/fd8a6c41ace59b476193c61002ce6a86d667b18a/hermes_cli/config_backend.py | 通常のファイル設定は `<home>/config.yaml`。読み取りは `fast_safe_load` を使う。 |
| https://github.com/NousResearch/hermes-agent/blob/fd8a6c41ace59b476193c61002ce6a86d667b18a/hermes_yaml.py | 設定は安全な YAML 読み取りを使う。YAML 1.1 の変換規則を扱う。 |
| https://github.com/NousResearch/hermes-agent/blob/fd8a6c41ace59b476193c61002ce6a86d667b18a/utils.py | `fast_safe_load` が上記 YAML 読み取りへ渡す。 |
| https://github.com/NousResearch/hermes-agent/blob/fd8a6c41ace59b476193c61002ce6a86d667b18a/hermes_cli/_parser.py | `chat` の `--model`、`--provider`、`--query`、`--query-file`、`--oneshot` 等。トップレベルの `--oneshot PROMPT` と `chat --oneshot` は引数の取り方が異なる。 |
| https://github.com/NousResearch/hermes-agent/blob/fd8a6c41ace59b476193c61002ce6a86d667b18a/hermes_cli/providers.py | `openai-api`、`anthropic` の接続形式、Ollama 等を `custom` に対応させる定義。 |
| https://github.com/NousResearch/hermes-agent/blob/fd8a6c41ace59b476193c61002ce6a86d667b18a/agent/prompt_builder.py | `.hermes.md`/`HERMES.md` の検索、AGENTS の階層、各場所で `AGENTS.override.md` → `AGENTS.md` → `agents.md` の順。 |
| https://github.com/NousResearch/hermes-agent/blob/fd8a6c41ace59b476193c61002ce6a86d667b18a/tools/mcp_tool.py | `mcp_servers` 設定を使う MCP クライアント。 |

次の可変 URL も初期調査で読んだ。固定コミットの読み取りと公式資料を優先した。

| URL | 確認できたこと |
| --- | --- |
| https://raw.githubusercontent.com/NousResearch/hermes-agent/main/hermes_constants.py | `get_hermes_home()` は実行中の指定→環境変数→既定の場所の順。固定コミットでも再確認した。 |
| https://raw.githubusercontent.com/NousResearch/hermes-agent/main/hermes_cli/config.py | 設定ファイルの場所。固定コミットでも再確認した。 |
| https://raw.githubusercontent.com/NousResearch/hermes-agent/main/hermes_cli/main.py | CLI の入口と設定の読み取り。実際の引数定義は `_parser.py` で確認した。 |

## 実行確認と残る点

`node --test test/recipes/harness-hermes.test.js` を実行し、最初の版で `tests 14 / pass 14 / fail 0`、接続先を保つ回帰テスト追加後は `tests 15 / pass 15 / fail 0`、終了コード 0。テストは `node:test` と標準ライブラリーだけを使い、通信、Hermes の起動、ファイルの適用はしない。

`command -v hermes` は終了コード 1、標準出力なし。次の候補には `test -x` 相当の存在確認だけを行い、すべて出力なしだった: `~/.local/bin/hermes`、`~/.hermes/bin/hermes`、`~/.hermes/hermes`、`~/.hermes/venv/bin/hermes`、`~/.hermes/.venv/bin/hermes`、`~/.hermes/hermes-agent/hermes`、`~/.hermes/hermes-agent/venv/bin/hermes`、`~/.hermes/hermes-agent/.venv/bin/hermes`。`~/.hermes` の中身の一覧やファイル内容は読んでいない。実行できる Hermes を見つけられなかったため `hermes --version` は実行していない。この Mac の他の場所やアプリ内にあるかどうか、バージョン番号は `unverified`。

実際の MCP 接続、モデルへの接続、認証、ACP の通信、生成設定を Hermes が実際に読むことは `unverified`。起動禁止の条件に従い未実行。設定の保存場所の移動は端末から使う別の CLI まで隔離する機能ではない。根拠: [設定の `terminal.home_mode` 説明](https://hermes-agent.nousresearch.com/docs/user-guide/configuration)。

レビュー時には、コアの `ctx.style` と `ctx.providers` の受け渡し形式、現在の安定版が調査した名前付き提供元設定を読めるか、共有 `project/AGENTS.md` が他のアダプターの内容と競合しないかを確認してほしい。検証できるまでは補助役・別ツールの補助接続・未対応の編集画面・追加の指示形式を対応済みにしない。

## C2 追記: 公式の MCP サーバー追加機能（2026-11-15）

以前の補助役接続が未確認という記録を更新する。現在は公式の `mcp-serve` 追加機能で `hermes mcp-serve` を使う。以前の `hermes mcp serve` は新しい名前と導入方法を案内するだけ。`--tools` は会話の道具に加えて利用可能な検索などの道具を公開するが、作業の委任や端末実行は公開しない。[公式追加機能](https://github.com/NousResearch/hermes-official-plugins/blob/main/mcp-serve/README.md)、[本体のコマンド一覧](https://hermes-agent.nousresearch.com/docs/reference/cli-commands#hermes-mcp)

`asMcpServer` は `hermes mcp-serve --tools` に相当する接続を返す。モデル設定は `.config/helpers/<role>-<index>/hermes/config.yaml`、`HERMES_HOME` はそのフォルダー、指示書は共有の `project/AGENTS.md`。[保存先の根拠](https://hermes-agent.nousresearch.com/docs/reference/environment-variables)

この保存先への公式追加機能の手動導入が必要。会話を読むだけなら Gateway は不要だが、送信には同じ保存先の Gateway が必要。未設定の道具は公開されない。準備は PLAN.md に残し、独立した確認作業は **unverified** とする。[機能と条件](https://github.com/NousResearch/hermes-official-plugins/blob/main/mcp-serve/README.md)

進行役として受け取った補助役は通常の `mcp_servers` に含める。[MCP 設定](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp) 追加機能の導入、サーバー、認証、道具呼出しは実行していない。確認はオフラインテストのみ。
