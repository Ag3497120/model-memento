# Gemini CLI アダプターの調査記録

確認日: 2026-11-15（日本時間）。公式サイトと公式リポジトリのソースを読んだ。以下は確認日の記録で、今後の版に対する保証ではない。コマンドは情報として記載するだけで、導入や実行は行っていない。

## 出典と確認した内容

以下の17件はすべてアダプターの `meta.sources` にも入れてある。説明は独自の要約。

| 出典（全件 2026-11-15 に確認） | 確認した内容 |
| --- | --- |
| https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/cli/package.json | パッケージ名は `@google/gemini-cli`、実行名は `gemini`。リポジトリは `google-gemini/gemini-cli`。ライセンス欄は Apache-2.0。読み取った版の表記は `0.70.0-nightly.20261110.g1603e9bab` であり、このMacの導入版を示すものではない。 |
| https://geminicli.com/docs/get-started/installation/ | npmでの導入例は `npm install -g @google/gemini-cli`。通常の起動名は `gemini`。Homebrewなど別の導入方法も掲載。アダプターはnpmの表示例を返すだけ。 |
| https://geminicli.com/docs/reference/configuration/ | JSON形式の設定。個人用は `~/.gemini/settings.json`、プロジェクト用は `.gemini/settings.json`。優先順は低い方から、組み込み値、システム既定、個人、プロジェクト、システム強制、環境変数、起動時の指定。`model.name` と `context.fileName` がある。システム設定の読み込みまで無効にするとは扱わない。 |
| https://geminicli.com/docs/cli/gemini-md/ | 指示ファイルの既定名は `GEMINI.md`。全体、作業フォルダーと親、必要時に読む細かい指示の順で内容を集める。内容は連結され、単一ファイルの上書きではない。`context.fileName` で `AGENTS.md` を含む複数名を指定できる。本文の公開更新日: 2026-06-18。 |
| https://geminicli.com/docs/cli/skills/ | 手順をまとめたフォルダーを必要時に読む機能がある。低い優先順から、組み込み、拡張、個人、作業フォルダー。個人用は `~/.gemini/skills/` と `~/.agents/skills/`、作業用は `.gemini/skills/` と `.agents/skills/`。同じ階層の同名手順は `.agents/skills/` が優先。本文は `SKILL.md` に置く。 |
| https://geminicli.com/docs/tools/mcp-server/ | 外部の道具への接続は `settings.json` の `mcpServers` オブジェクト。ローカル起動は `command`、文字列配列の `args`、`env`。`url` はSSE、`httpUrl` はHTTP接続。`env` の `$NAME` と `${NAME}` は実行時に展開される。`gemini mcp add` は個人・プロジェクトの範囲を選べる。本文の公開更新日: 2026-10-06。 |
| https://geminicli.com/docs/cli/enterprise/ | `GEMINI_CLI_HOME` で個人用設定や履歴の基点を変えられる。指定先そのものではなく、その下の `.gemini` を使う。したがって本計画は `<workspace>/.config/gemini-cli` を指定する。 |
| https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/core/src/utils/paths.ts | `homedir()` は `GEMINI_CLI_HOME` があればその値を返す。なければOSのホームを使う。文書の保存先変更の説明と一致する。 |
| https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/core/src/config/storage.ts | 設定の基点は上記 `homedir()` に `.gemini` を足したもの。個人用設定名は `settings.json`。共通の `.agents` もこの基点を使用する。 |
| https://geminicli.com/docs/get-started/authentication/ | Googleログイン、Gemini APIの鍵、Google Cloud Vertex AIが文書化されている。鍵の変数名は `GEMINI_API_KEY`。Vertex AIにはGoogle Cloud側の認証・プロジェクト等の設定が必要。この計画はログインまたは鍵の用意を手動項目にし、値を保存しない。 |
| https://geminicli.com/docs/cli/model/ | `/model` で選択でき、`--model` もある。主担当に対するモデル指定は内蔵の補助担当のモデル指定を上書きしない。各アカウントでの利用可否までは確認できていない。 |
| https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/cli/src/config/config.ts | `--model` / `-m`、`--prompt` / `-p`、`--prompt-interactive` / `-i` を定義。モデルは起動時指定、`GEMINI_MODEL`、`settings.model.name` の順で選ぶ。`--acp` があり、旧 `--experimental-acp` は非推奨の別名。 |
| https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/core/src/core/contentGenerator.ts | Googleログイン、Gemini API、Vertex AI、Google系の実行環境、gatewayという認証区分がある。gatewayも `GoogleGenAI` を使い、`GOOGLE_GEMINI_BASE_URL` 等を渡す。URLを変更できることだけからOpenAI形式への対応とは判断しない。 |
| https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/reference/configuration.md | `GOOGLE_GEMINI_BASE_URL` と `GOOGLE_VERTEX_BASE_URL` は各Google API向けの接続先変更として説明される。Gemma 4をGemini APIで使う設定と、実験的なローカルLiteRT-LM向け振り分け設定もある。後者をOllama対応とは扱わない。 |
| https://geminicli.com/docs/cli/acp-mode/ | ACP（編集画面からAIを操作する共通方式）を利用できる。起動は `gemini --acp`。標準入出力でJSON-RPCをやり取りする。 |
| https://geminicli.com/docs/core/subagents/ | 内蔵の補助担当と独自の補助担当をサポート。独自定義は `.gemini/agents/*.md` または `~/.gemini/agents/*.md`。先頭のYAML設定と本文の指示で定義する。現行文書では既定で有効。これは別製品の補助役を自動接続できる証拠ではない。本文の公開更新日: 2026-06-08。 |
| https://geminicli.com/docs/cli/headless/ | 対話画面を使わない実行は `-p` / `--prompt`、または端末でない入力で有効になる。`--output-format json` と `--output-format stream-json` が文書化されている。本文の公開更新日: 2026-03-10。 |

補足として開いた公式ページ・ソース（全件 2026-11-15）:

- https://raw.githubusercontent.com/google-gemini/gemini-cli/main/package.json — Nodeの条件は `>=20.0.0`、公式リポジトリの場所も確認できた。
- https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/cli/gemini-md.md — 上記の指示ファイル文書の元。既定名と階層的な読み込みの説明を照合した。
- https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/cli/src/config/settings.ts — 設定の読み込み処理と、環境変数を解決する処理への参照を確認した。独立した追加対応は主張していない。
- https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/cli/src/config/trustedFolders.ts — 作業フォルダーを信頼するか判定する処理を確認した。この計画はその確認を自動的に解除しない。
- https://geminicli.com/docs/cli/generation-settings/ — 設定文書からリンクされたモデルの詳細設定を開いた。独立した追加対応は主張していない。
- https://geminicli.com/docs/cli/model-config/ — 取得に失敗。根拠として使っていない。

## 計画の範囲とコア側の受け渡し

`plan()` は計画を返すだけで、ファイル、ネットワーク、環境変数、プロセスに副作用を起こさない。生成先は固定の `project/.gemini/settings.json` と、指定された場合の `project/AGENTS.md` / `project/GEMINI.md`。任意のスタイル内のパスを出力先として使わない。`GEMINI_CLI_HOME` は作業フォルダー内だけを指す。実行時の作業場所は契約どおり `<workspace>/project`。

`ctx.mcp` の確認済みデータから、レシピが選んだ道具だけをJSONにする。接続の鍵らしい環境変数には `$NAME` / `${NAME}` の参照だけを受け付ける。値の直書き、不足、不正な設定は報告して除外する。テストの道具のコマンドは架空の固定データであり、サーバーを起動していない。

`ctx.providers` はプロバイダー定義、または `{ meta: 定義 }` の配列・オブジェクトを受け付ける。`<provider.id>:<model.id>` が一致する確認済みモデルだけを `--model` に渡す。対応するAPI形式は `gemini`。通常のGoogle接続先またはnull、鍵名は `GEMINI_API_KEY` またはnullに限定する。独自の接続先、別のAPI形式、カタログにないモデルは `unverified` にし、起動引数を空にする。`supports.models` はAPI形式を示し、提供中のモデル一覧ではない。

契約は `ctx.style` の内部構造を定義していないため、ここでは以下の受け渡しを明記する。コアの確定した形式と一致するかレビューで照合が必要。

```js
style: {
  id: 'plan-then-act', // 任意。あればレシピのstyleと照合
  files: [{ path: 'AGENTS.md', content: '描画済みの指示本文' }]
}
```

`project/AGENTS.md`、`GEMINI.md`、`project/GEMINI.md` も対応。単一の本文なら `{ content: '...' }` も受け付ける。本文を渡さないときは、指示ファイルを作ったと報告しない。スタイルや本文を他のワーカーのファイルから読み込まない。

ターミナルの起動例は `['gemini', '--model', 'gemini-2.5-pro']`。モデル部分はカタログから取得する。ACPの接続定義は `command: 'gemini'` と `args: ['--acp', '--model', モデル名]`、保存先を移す環境変数を含む。`zed-acp` を選んだ場合は `argv` もACP用にする。エディターの個人設定は変更しない。

## 未確認・未対応・レビュー事項

- Anthropic、OpenAI、OpenAI互換形式のURL、Ollamaへの直接接続: **unverified**。公式ソースで今回確認したGoogle形式とは区別し、対応一覧に入れない。任意の変換サービスを前提にしない。
- 別ツールとの補助役連携、およびレシピの `helpers` を内蔵の補助担当に変換する処理: **unverified**。`unsupported` で報告する。`ctx.role: 'helper'` の場合は共有設定を上書きする計画を返さない。
- VS Codeや `skin:*` の自動設定、`agents-md` / `gemini-md` 以外の指示形式: **unverified**。組み込みの手順フォルダーの対応は調査したが、今回のレシピから手順ファイルを生成する機能は実装しない。
- `--acp`、手順フォルダーの別名、補助担当が利用可能になった最低の安定版: **unverified**。現行文書とmainのソースに基づく。導入済みの版での動作保証はしていない。
- 実際のログイン、モデルへの要求、MCP接続、ACP接続、実行後の保存先: **unverified**。今回の許可範囲では起動していない。
- ライセンスは上のパッケージの出典でApache-2.0と確認済みだが、契約の型が `"MIT" | null` なので `meta.license` はnull。コアの型にApache-2.0を追加するかはレビュー担当の判断が必要。他のファイルは変更していない。

## 実行した確認

`node --version` の出力:

```text
v22.17.0
```

`node --test test/recipes/harness-gemini-cli.test.js` は終了コード0。実出力の集計部分:

```text
1..10
# tests 10
# suites 0
# pass 10
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

`command -v gemini` と `command -v gemini-cli` はどちらも標準出力が空、終了コード1。PATH上で実行ファイルが見つからないため、Gemini CLIの `--version` は実行していない。導入も行っていない。テストはオフラインで、実際のCLI、MCPサーバー、エディターは起動していない。

## C2 追記: MCP を受け取る役と公開する役（2026-11-15）

公式資料で確認できた MCP 設定は外部の道具を受け取る側の設定。コマンド資料と画面なし実行も調べたが、Gemini CLI 自身を MCP サーバーにするコマンドや公式 SDK 接続は **unverified**。画面なし実行を MCP と読み替えず、`asMcpServer` は公開しない。[MCP](https://geminicli.com/docs/tools/mcp-server/)、[コマンド一覧](https://geminicli.com/docs/reference/commands/)、[画面なし実行](https://geminicli.com/docs/cli/headless/)

補助役の場合は `meta.helperMcpReason` の出典つき理由を PLAN.md に残し、合成側が `helpers/<role>-<index>/` に単独用の設定案を残す。進行役の場合は `helper-<role>` を通常の `mcpServers` に含める。以前の補助役未対応という記録を受け取り部分について更新する。[設定の形式](https://geminicli.com/docs/tools/mcp-server/)

サーバー、認証、モデル通信は未実行。確認はオフラインテストのみ。「unverified」は未確認という意味であり、機能が存在しないという断定ではない。
