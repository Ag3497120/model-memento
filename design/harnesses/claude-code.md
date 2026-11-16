# Claude Code 調査とアダプターの範囲

調査日: 2026-11-15。以下は当日に読んだ公開の一次資料。実行確認は末尾に分けた。画像、製品の図案、他社の実装コード、長い原文は転用していない。

## 資料と確認できたこと

各項目の確認日はすべて 2026-11-15。公開ページの内容は、その日に取得できた内容であり、特定の配布版すべてでの動作を意味しない。

1. <https://github.com/anthropics/claude-code>
   - Anthropic の公開リポジトリーで、公式の説明書にリンクしている。端末で動く開発支援ツールとして紹介されている。メタ情報の製品名、種別、リポジトリーの根拠。
2. <https://raw.githubusercontent.com/anthropics/claude-code/main/README.md>
   - macOS/Linux の直接インストーラー、Homebrew、Windows のインストーラー、WinGet を案内。npm による導入は非推奨と明記。導入後の実行名は `claude`。
3. <https://raw.githubusercontent.com/anthropics/claude-code/main/LICENSE.md>
   - Anthropic の商用利用規約に従う旨が記載されている。MIT 等のライセンス名を推定せず、`meta.license` は `null` とした。
4. <https://code.claude.com/docs/en/setup>
   - 推奨の直接導入コマンドは macOS/Linux/WSL の `curl -fsSL https://claude.ai/install.sh | bash`。Homebrew は `brew install --cask claude-code`。導入確認は `claude --version`。本作業では導入していない。メタ情報の導入表示は Homebrew の方法を採用。
5. <https://code.claude.com/docs/en/memory>
   - 指示ファイルは `CLAUDE.md`、`.claude/CLAUDE.md`、`CLAUDE.local.md`。ユーザー用と組織用の置き場所もある。親から作業フォルダーへ順に内容を加え、同じ階層では個人用を後から加える。単純な上書きではなく、文脈として連結される。
   - `AGENTS.md` の直接読み込みは 2.1.277 以降。既定では親または作業フォルダーに Claude 用の指示があると、そちらが選ばれる。組織や個人の指示は別途読み込まれる。両方読む設定もある。古い版などで使える方法は、同じ場所の `CLAUDE.md` から `@AGENTS.md` を参照すること。本アダプターはこちらを使う。
6. <https://code.claude.com/docs/en/skills>
   - 作業手順をまとめるスキルは `.claude/skills/<名前>/SKILL.md`。個人用は `~/.claude/skills/`、追加機能ではその `skills/` に置く。`SKILL.md` は先頭の設定欄と Markdown 本文で構成する。本アダプターはスキルを生成せず、未対応の指示ファイル要求として報告する。
   - 同名のスキルは組織用、個人用、作業フォルダー用の順に優先。追加機能のスキルは名前に接頭辞が付くため共存する。スキル本文は使う際に読み込まれる。
7. <https://code.claude.com/docs/en/settings>
   - JSON の設定ファイルは、ユーザー用 `~/.claude/settings.json`、共有 `.claude/settings.json`、個人の作業用 `.claude/settings.local.json`。組織の設定、起動引数、作業用、共有、ユーザー用の順で優先する。配列などの結合には例外がある。
8. <https://code.claude.com/docs/en/mcp>
   - 外部ツールをつなぐ MCP の共有設定は作業フォルダー直下の `.mcp.json`。最上位は `mcpServers`。標準入出力でつなぐサーバーは `type: "stdio"`、`command`、`args`、`env` を持つ。
   - MCP の個人の作業用設定と全作業共通の設定は、どちらも通常 `~/.claude.json` に保存される。一般の `.claude/settings.local.json` とは異なる。同名では個人の作業用、共有、全作業共通の順に優先する。
   - `${変数名}` の環境変数参照を使える。これにより秘密の値を設定ファイルに埋め込まずに済む。共有設定を自動読み込みする対話起動では承認があるが、`-p` では同じ承認画面は出ない。本アダプターは明示の設定ファイル指定を使い、承認画面が必ず出るとは約束しない。
9. <https://code.claude.com/docs/en/env-vars>
   - `CLAUDE_CONFIG_DIR` は通常 `~/.claude` にある設定先を変更する。設定、会話履歴、追加機能が移る。作業用の設定内では無効なので、起動元の環境変数として渡す。
   - `ANTHROPIC_BASE_URL` は接続先の変更に使う。`CLAUDE_CODE_USE_BEDROCK`、`CLAUDE_CODE_USE_VERTEX`、`CLAUDE_CODE_USE_FOUNDRY`、`CLAUDE_CODE_USE_ANTHROPIC_AWS`、`CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD`、`CLAUDE_CODE_USE_MANTLE` は接続するサービスの選択に使う。空文字はサービス選択では未設定として扱う。このアダプターは既存の選択を空文字で解除する。
10. <https://code.claude.com/docs/en/authentication>
    - 初回の `claude` でログインできる。API キーは `ANTHROPIC_API_KEY`。macOS では通常キーチェーンにログイン情報を保存する。設定先を変更すると対応するキーチェーン項目も分かれるが、保存先がすべて作業フォルダーになるわけではない。ファイル方式の `.credentials.json` は設定先に置かれる。
    - API キーを作らない Console ログインには、設定先の変更だけでは分離されない例外もある。したがって本アダプターの保証は生成するファイルと返すパスの範囲であり、実行時の全アクセスの隔離ではない。
11. <https://code.claude.com/docs/en/model-config>
    - モデル選択は実行中の `/model`、起動時の `--model`、`ANTHROPIC_MODEL`、設定ファイルの `model` 等で行う。モデル別名または完全な識別子を指定できる。このアダプターは登録済みモデルから選び、`--model` と設定ファイルに同じ値を出す。
12. <https://code.claude.com/docs/en/third-party-integrations>
    - Anthropic への直接接続のほか Amazon Bedrock、Claude Platform on AWS、Google のサービス、Microsoft Foundry の導入方法が案内されている。本アダプターはクラウド各社の認証や契約を自動設定しない。
13. <https://code.claude.com/docs/en/llm-gateway>
    - 中継サービスへの接続を案内するが、Claude 以外のモデルに中継する利用を Anthropic が支援するわけではない。接続先 URL を変えれば OpenAI 形式もそのまま通る、とは判断していない。
14. <https://code.claude.com/docs/en/llm-gateway-protocol>
    - 対応する API（サービス間の呼び出し形式）を説明している。Anthropic の Messages 形式やクラウド各社の形式が対象。OpenAI の呼び出し形式を直接使える根拠にはしていない。
15. <https://code.claude.com/docs/en/cli-reference>
    - 対話起動は `claude`。`--model`、`--mcp-config`、`--strict-mcp-config` を確認。後者は指定ファイル以外からの MCP 読み込みを抑えるが、組織の管理設定には別の規則がある。通常設定の読み込み先は `--setting-sources`、別設定は `--settings` でも指定できる。
    - `--agent` は起動するエージェントを選ぶ。`--print`、`--output-format`、`--max-turns` などの非対話向けの引数もある。ネイティブの `--acp` 起動引数は本調査では確認できなかった（unverified）。
16. <https://code.claude.com/docs/en/sub-agents>
    - 補助エージェントを使用できる。共有定義は `.claude/agents/`、個人用は `~/.claude/agents/`、一時定義は `--agents`。Markdown 本文の前に名前、説明、使えるツール、モデル等の設定を置く。これは他の実行環境への役割付き依頼が自動でつながることを意味しない。本アダプターはその受け渡しを実装しない。
17. <https://code.claude.com/docs/en/headless>
    - `-p` または `--print` と依頼文を渡すと非対話で実行する。出力形式は `--output-format json` または `stream-json` 等。読み込みを省く `--bare` は指示ファイル、スキル等の自動発見も省くので、本計画には使わない。レシピ契約には非対話の選択欄がないため、返す起動引数は対話起動とした。
18. <https://docs.ollama.com/integrations/claude-code>
    - Ollama 自身の一次資料が Anthropic と同じ呼び出し形式での接続を案内。直接接続では `ANTHROPIC_AUTH_TOKEN=ollama`、空の `ANTHROPIC_API_KEY`、`ANTHROPIC_BASE_URL=http://localhost:11434`、`claude --model <モデル名>` を示す。本アダプターはこのローカル接続のみを対応範囲にした。
    - `ollama launch claude` も案内されているが、モデルを取得する動作を避けるため計画には使わない。Ollama の文書での案内であり、Anthropic による非 Claude モデルの動作保証ではない。実行確認はしていない。
19. <https://github.com/agentclientprotocol/claude-agent-acp>
    - Claude Agent SDK を ACP 対応エディターから使う別プロジェクト。旧 URL <https://github.com/zed-industries/claude-code-acp> はここに転送された。Claude Code 本体の起動引数と同一視しない。
20. <https://raw.githubusercontent.com/agentclientprotocol/claude-agent-acp/main/README.md>
    - ACP 接続、クライアントから渡す MCP、補助エージェントの記録に対応すると説明。配布物の起動名は `claude-agent-acp`。独立の導入が必要なため、このアダプターは自動起動の対象にせず、手動の案内を返す。
21. <https://raw.githubusercontent.com/agentclientprotocol/claude-agent-acp/main/package.json>
    - 実行名 `claude-agent-acp` を `bin` で定義。パッケージ名は `@agentclientprotocol/claude-agent-acp`。Node は 22 以上。このパッケージは追加していない。
22. <https://raw.githubusercontent.com/agentclientprotocol/claude-agent-acp/main/src/index.ts>
    - 通常起動で ACP 接続を開始する入口と `--version` の分岐を確認した。コードは転記していない。

## 実装の境界と受け渡す値

`plan()` はファイルを保存しない純粋関数。書く予定の内容、起動引数、環境変数、手作業、未対応項目を返す。`detect()` だけが、呼び出し側の `which('claude')` の結果に対して `--version` を実行する。

対応するのは進行役の端末起動。補助役、他の実行環境への依頼、ACP を含む画面との接続は `unsupported` に明記する。`supports.subagents` と `supports.skills` は製品の文書上の機能を示す。レシピの補助役や任意のスキルを変換する実装があるという意味ではない。`supports.acp: false` と `acp: null` は、このアダプターが別の橋渡しプログラムを起動しない判断を表す。

生成するファイルは指示の要求に応じて2〜4ファイルになる。

- `.config/claude-code/settings.json`: モデルと、接続先を選ぶ固定の環境変数。`CLAUDE_CONFIG_DIR` はこのフォルダーを指す。
- `project/.mcp.json`: 登録済みのコマンド、引数、環境変数参照から作る標準入出力の接続。HTTP 等は今回の契約の `ctx.mcp` に URL の定義がないため未対応。
- `project/AGENTS.md`: 要求された場合に、登録済みスタイルの内容を保存。
- `project/CLAUDE.md`: `AGENTS.md` を参照する。Claude 用の指示も要求されていれば、その後に加える。

起動時の作業フォルダーは契約通り `<workspace>/project`。引数は `['claude', '--model', 登録済みのモデル名, '--strict-mcp-config', '--mcp-config', '.mcp.json']`。シェルを使う文字列にはしない。環境変数の値には固定値と作業フォルダー内の絶対パスだけを返す。API キーの値や呼び出し元の環境変数は読まない。

契約で未指定の細部には、以下の呼び出し規則を設けた。コアの担当者はここを確認してほしい。

- `ctx.providers` は提供元 ID をキーにしたカタログ。値は契約の provider meta、または `{ meta }` のモジュール。モデルの `id` は単独名と提供元付きの両方を受ける。レシピの未登録モデルは起動しない。
- 提供元 ID と種類は `anthropic` または `ollama`。接続先は前述の固定 URL だけ。OpenAI、OpenAI 互換、任意の中継 URL、クラウド各社の導入は推測で代用せず未対応にする。
- `ctx.style.files` は描画済みの `{ path, content }` の配列。パスは `AGENTS.md` / `project/AGENTS.md` または `CLAUDE.md` / `project/CLAUDE.md` のみ対応。内容が空、欠けている、同じ対象が重複する場合は未対応にする。スタイル ID があればレシピとの一致も確認する。
- 指示 ID は `agents-md` と `claude-md`。他の名前やスキルの出力は未対応。スタイルの任意パスをそのまま書くことはしない。
- `ctx.mcp` は信頼済みのカタログ。要求された ID に対応する `command`、文字列配列の `args`、文字列を値に持つ `env` を使う。秘密を示す名前の環境変数は `${名前}` 形式の参照だけを認め、値の埋め込みは未対応にする。カタログは秘密の値やシェルによる実行をそもそも含めないこと。
- パスに関する保証は計画の出力に限る。保存時のリンクや既存ファイルの検証は、契約通りコアの `apply()` が担う。組織の設定や祖先フォルダーの指示をすべて排除する実行環境ではない。

## 未確認のこと

- unverified: 非対話、MCP 接続、モデルの推論、ログイン、設定先変更後の実際の保存先、Ollama、補助エージェント、ACP 橋渡しの実機動作。ハーネスは起動していない。
- unverified: Claude Code 本体のネイティブな ACP 起動コマンド、および OpenAI / OpenAI 互換の呼び出し形式を直接使う方法。橋渡しプログラムの存在から本体対応を推測していない。
- unverified: 並行して実装されるコア・スタイルの実際のデータ形状との結合。上記の明示した呼び出し規則だけで試験している。他の `lib/recipes/` の実装はインポートしない。
- 未対応: 他のハーネスとの自動の依頼・結果の受け渡し、任意のスキル生成、クラウド各社の認証、Ollama のリモート接続、任意の中継 URL。

## 実行確認

2026-11-15、この Mac で `command -v claude` は `/opt/homebrew/bin/claude` を返した。`claude-code` という実行名は見つからなかった。

実行したコマンド: `/opt/homebrew/bin/claude --version`

終了コード: 0。標準出力: `2.1.267 (Claude Code)`。それ以外の Claude Code コマンドやハーネスの起動は行っていない。

オフライン確認: `node --test test/recipes/harness-claude-code.test.js`。終了コード 0。実出力の集計は `# tests 14`、`# pass 14`、`# fail 0`、`# skipped 0`。2つの接続定義、指示の参照、作業フォルダー内の出力先、入力を変更しないこと、個別の起動引数、未対応の報告、未導入時の検出を検査した。接続先にアクセスする試験ではない。

## C2 追記: 補助役を道具として接続する（2026-11-15）

以前の補助役接続の未実装という記録を更新する。公式の `claude mcp serve` は標準入出力（プログラム同士の入力と出力）で道具を公開する。ただし公開するのは Claude Code の道具であり、独立した Claude モデルへの作業依頼ではない。呼出先の確認操作は接続元が担当する。[公式資料](https://code.claude.com/docs/en/mcp#use-claude-code-as-an-mcp-server)

`asMcpServer` を実装した。補助役のモデルを既存の照合処理で確かめ、設定を `.config/helpers/<role>-<index>/claude-code/settings.json` に残す。専用の `CLAUDE_CONFIG_DIR` と `['mcp', 'serve']` を返す。指示書は共有の `project/AGENTS.md` と `CLAUDE.md`。設定先とモデル設定の根拠は [環境変数](https://code.claude.com/docs/en/env-vars) と [モデル設定](https://code.claude.com/docs/en/model-config)。サーバーでのモデル利用と指示書の自動読み込みは **unverified** と PLAN.md に残す。

補助役用の空の `.mcp.json` は出力せず、進行役の設定を上書きしない。進行役として受け取った `helper-<role>` は通常の MCP 接続に含める。直接の `plan(..., {role: 'helper'})` は従来どおり単独起動を返さず、新しい接続は `asMcpServer` から作る。

サーバー、認証、モデル通信、道具呼出しは実行していない。確認はオフラインテストのみ。独立した確認役モデルへの依頼には、別の公式な接続方法の確認が必要。
