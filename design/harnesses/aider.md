# Aider アダプターの調査メモ

確認日: 2026-11-15。対象は公式の Aider-AI/aider CLI。下記は公式文書と公開ソースを読んだ結果であり、モデルへの接続や編集の実行結果ではない。文章と設定は独自に作成し、画像や製品の図柄、ソースコードのまとまった転載は含めていない。

## 出典と確認した内容

各 URL の閲覧日はすべて 2026-11-15。アダプターの `meta.sources` に、実装の判断に使った URL を収録した。

| URL | 確認した内容 |
| --- | --- |
| https://github.com/Aider-AI/aider | 公式リポジトリ。端末で使う AI による開発支援ツール。 |
| https://raw.githubusercontent.com/Aider-AI/aider/main/LICENSE.txt | ライセンスは Apache-2.0。 |
| https://aider.chat/docs/install.html | 推奨手順に `python -m pip install aider-install`、続いて `aider-install`。別の選択肢に `pipx install aider-chat`、uv、pip がある。`install.how` の列挙に合う pipx を表示用に採用した。インストールは実行していない。 |
| https://aider.chat/docs/config/aider_conf.html | `.aider.conf.yml` は YAML。ホーム、git のルート、現在のフォルダーの順に読み、後の値が優先。`--config <filename>` は指定した一つの設定ファイルを読み込むと説明されている。`read` は一つまたは複数のファイル名を取る。 |
| https://aider.chat/docs/usage/conventions.html | 例は `CONVENTIONS.md`。`--read`、`/read`、設定の `read` で読み取り専用の指示書を渡す。アダプターはこの仕組みで `AGENTS.md` を明示的に渡す。自動探索や階層別の優先順位を保証するものではない。 |
| https://aider.chat/docs/config/options.html | `--model`、`--openai-api-base`、`--set-env`、`--config`、`--read`、`--chat-language`、`--no-git`、`--no-auto-commits`、利用状況送信と更新確認の設定を掲載。現在の自動確認フラグは `--yes-always`。MCP、ACP、skills の設定は確認できなかった。 |
| https://aider.chat/docs/config/dotenv.html | `.env` と `AIDER_` で始まる設定名の説明。秘密の値を計画に含める必要はない。 |
| https://aider.chat/docs/llms/openai.html | モデルを `--model` で選ぶ。`OPENAI_API_KEY` と `openai/` のモデル一覧を説明。 |
| https://aider.chat/docs/llms/anthropic.html | Anthropic モデルと `ANTHROPIC_API_KEY`、`anthropic/` のモデル一覧を説明。 |
| https://aider.chat/docs/llms/openai-compat.html | OpenAI 互換の接続先は `OPENAI_API_BASE` と `OPENAI_API_KEY` を使い、モデル名は `openai/` を付ける。アダプターでは接続先を YAML の `openai-api-base` に保存する。 |
| https://aider.chat/docs/llms/ollama.html | `OLLAMA_API_BASE` で接続先を指定し、`ollama_chat/<model>` を推奨。必要な場合の `OLLAMA_API_KEY` も説明されている。 |
| https://aider.chat/docs/llms/gemini.html | Gemini と `GEMINI_API_KEY`、`gemini/` のモデル一覧を説明。 |
| https://aider.chat/docs/llms/other.html | LiteLLM（モデル提供元との接続を担うライブラリ）を使う。さらに多くのモデルへ接続できると説明。全提供元をこのアダプターで実装したという意味ではない。 |
| https://aider.chat/docs/usage/modes.html | code、ask、architect、help のモード。architect は提案と編集のモデルを分ける機能であり、別のハーネスの補助役へ委任できる証拠としては扱わない。 |
| https://aider.chat/docs/scripting.html | `--message` または `--message-file` で一つの依頼を処理して終了できる。`--no-stream`、`--no-auto-commits` も掲載。古い `--yes` の記載より現在の options/args の `--yes-always` を優先した。 |
| https://raw.githubusercontent.com/Aider-AI/aider/main/aider/args.py | YAML の設定を読むパーサー、`AIDER_` 接頭辞、`--read`、`--config`、`--set-env`、`--yes-always` の定義を確認。MCP、ACP、skills の起動引数は見つからなかった。 |
| https://raw.githubusercontent.com/Aider-AI/aider/main/aider/main.py | 指定した read ファイルを読み取り専用の一覧へ追加する処理を確認。`AGENTS.md` を特別扱いする処理や `AIDER_HOME` は見つからなかった。`.env`、モデル設定、モデル情報はホームなども探索する。`--env-file` だけではホームの探索を止める根拠にならない。 |
| https://raw.githubusercontent.com/Aider-AI/aider/main/aider/analytics.py | 利用状況送信の初期化時にホームの `.aider/analytics.json` を読み、必要なら作る。送信を無効にすることと、ホームへの保存をなくすことは別。 |

補助的に確認した公式ページ:

- https://aider.chat/docs/llms.html — 2026-11-15。OpenRouter、Groq、xAI、Azure、Cohere、DeepSeek、Vertex AI、Bedrock、LM Studio などへの案内がある。提供元の全機能の検証はしていない。
- https://aider.chat/docs/llms/deepseek.html — 2026-11-15。`DEEPSEEK_API_KEY` と `deepseek/deepseek-chat` の例。アダプターは独自の DeepSeek 経路を持たず、対応するカタログがあれば OpenAI 互換の経路を使う。
- https://github.com/Aider-AI/aider/issues/4506 — 2026-11-15。native MCP と Agent Mode を求める未完了の要望。利用者が書いた要望なので、これだけで現行版に機能がないとは断定しない。公式 options/args の調査と合わせ、未確認とする。
- https://raw.githubusercontent.com/Aider-AI/aider/main/aider/__init__.py — 2026-11-15。main の基準版文字列は `0.86.3.dev`。手元の `0.86.1` と同じ版ではない。main の URL は変わり得る。
- https://aider.chat/docs/config.html — 2026-11-15。引数、YAML、環境変数、`.env` という設定方法の概説。
- https://aider.chat/docs/install/optional.html — 2026-11-15。git、接続用の秘密の値、Playwright、音声、編集アプリとの連携は追加の準備として案内されている。これらの準備は実行していない。
- https://aider.chat/docs/troubleshooting/imports.html — 2026-11-15。依存パッケージの版が合わない場合に備え、aider-install、uv、pipx による環境の分離を推奨している。
- https://github.com/Aider-AI/aider/issues/1182 — 2026-11-15。Anthropic の独自接続先に関する過去のやり取り。環境変数の挙動について見解や報告が変わっており、現行版での接続先上書きの確約には使わない。

## 計画にする範囲

`plan()` はファイルを保存せず、相対パスと本文を返すだけ。作成する候補は `project/.aider.conf.yml` と、選択された場合の `project/AGENTS.md` だけ。起動時の現在のフォルダーは契約どおり `<workspace>/project`。

起動引数は `['aider', '--config', '<workspace>/project/.aider.conf.yml', '--model', '<mapped-model>']`。パスに空白があっても一つの配列要素であり、シェル用の文字列にはしない。`--model` を明示し、周囲の `AIDER_MODEL` にモデル選択を任せない。YAML は日本語での会話を指定し、git 操作、自動コミット、利用状況送信、更新確認、公開情報の表示を無効にする。根拠: https://aider.chat/docs/config/options.html 。これは実行時のすべての保存先や通信を隔離する設定ではない。

モデルは `ctx.providers` のオブジェクトまたは Map にある提供元とモデルの一致が必要。値は契約の提供元データそのもの、または `{ meta }` を受け付ける。モデル名、URL、秘密の値の変数名を検査する。レシピの自由文、MCP のコマンド、秘密の値、端末の環境変数を設定へ転記しない。モデルの存在、課金、接続成功は検証していない。

カタログのモデル名は接続先に渡す名前として扱い、そこへ固定の経路名を追加する。例えば互換接続先での名前が `openai/test-model` なら、Aider に渡す名前は `openai/openai/test-model`。名前空間を削らない。根拠: https://aider.chat/docs/llms/openai-compat.html 。Anthropic と Gemini のカタログは `baseUrl: null` で標準の接続を使う。これらに明示的な接続先がある場合、上書き方法は **unverified** とし、別の接続先へ黙って向けず、起動コマンドを空にする。調査範囲: https://aider.chat/docs/llms/anthropic.html 、https://aider.chat/docs/llms/gemini.html 、https://aider.chat/docs/config/options.html 、https://github.com/Aider-AI/aider/issues/1182 。

OpenAI 互換提供元はカタログの接続先を使う。カタログの秘密の値の名前が `OPENAI_API_KEY` と違う場合、端末で両方の名前を使えるようにする手動手順だけを返す。根拠: https://aider.chat/docs/llms/openai-compat.html 。値を取得・保存・展開する処理はない。

`CONTRACT.md` には `ctx.style` の内部形式がない。連携のため、`{ id, files: [{ path: 'AGENTS.md' または 'project/AGENTS.md', content }] }`、または `{ id, agentsMd: '本文' }` を受け付ける。パスは固定の二つだけを認識し、出力先は必ず `project/AGENTS.md`。本文は書き換えない。本文がない場合は指示書を未対応として報告し、存在しないファイルを `read` に設定しない。コア側とこの受け渡し形式を合わせる必要がある。

## 未確認・未対応とレビュー時の注意

- MCP の公式設定ファイル名、場所、形式、プロジェクト単位と全体設定の違い: **unverified**。選択されたサーバーごとに未対応を返し、架空の MCP JSON/YAML は作らない。調査範囲: https://aider.chat/docs/config/options.html と https://raw.githubusercontent.com/Aider-AI/aider/main/aider/args.py 。
- ACP の公式起動コマンド: **unverified**。`acp: null`。外部の橋渡しプログラムは採用していない。調査範囲: https://raw.githubusercontent.com/Aider-AI/aider/main/aider/args.py 。
- skills フォルダーの探索、入れ子の指示書の優先順位、自動的な補助役の起動と連携: **unverified**。独立した端末セッションを自動連携と取り違えない。補助役の計画はファイルと argv を空にする。調査範囲: https://aider.chat/docs/usage/conventions.html 、https://aider.chat/docs/usage/modes.html 、https://aider.chat/docs/scripting.html 、https://raw.githubusercontent.com/Aider-AI/aider/main/aider/args.py 。
- 全設定・状態の保存先を移す専用の環境変数やフラグ: **unverified**。`configHomeEnv: null` とし、常に `config-home` の制限を報告。`--config` は設定ファイルの選択であり、全体のホーム移動ではない。HOME や他のアプリの設定は変更しない。根拠: https://aider.chat/docs/config/aider_conf.html 、https://raw.githubusercontent.com/Aider-AI/aider/main/aider/main.py 、https://raw.githubusercontent.com/Aider-AI/aider/main/aider/analytics.py 。
- Aider を実際に起動したときのホームへの保存は、この計画だけでは防げない。作業場所の外への保存を禁止した状態での実行が必須なら、この制限を解決する別の仕組みが必要。根拠: https://raw.githubusercontent.com/Aider-AI/aider/main/aider/analytics.py 。
- headless（一度の依頼を処理して終了する使い方）は公式に説明されているが、このレシピの契約に実行する依頼文はないため、通常の対話用 argv を返す。自動承認は付けない。根拠: https://aider.chat/docs/scripting.html と https://aider.chat/docs/config/options.html 。

## 実行した確認

- `command -v aider` — 終了コード 0、`/opt/homebrew/bin/aider`。
- `/opt/homebrew/bin/aider --version` — 終了コード 0、`aider 0.86.1`。
- `node --test test/recipes/harness-aider.test.js` — 最終の再実行は終了コード 0。実際の集計出力: `# tests 13`、`# pass 13`、`# fail 0`、`# cancelled 0`、`# skipped 0`、`# todo 0`。進行役、二つの MCP の未対応報告、AGENTS.md、作業場所内のパス、空白を含む argv、モデル名の名前空間、接続先を無視しないこと、秘密の値を保存しないこと、未確認の機能、which の未検出を確認した。設定ファイルを Aider に読み込ませる実行はしていない。

インストール、Aider の対話起動、モデル API 呼び出し、MCP サーバー起動、ACP 接続は実行していない。

## C2 追記: 補助役を公開する方法の確認（2026-11-15）

公式に確認できたのは画面なし実行と Python から呼ぶ方法。MCP サーバーとして公開する公式コマンドや公式 SDK 接続は **unverified**。独自の接続プログラムで対応済みと見なさず、`asMcpServer` は公開しない。[プログラムからの実行](https://aider.chat/docs/scripting.html)、[起動設定](https://aider.chat/docs/config/options.html)

MCP の接続元としての公式設定も **unverified**。Aider が進行役なら、補助役にサーバーモードがあっても自動で呼べるとは表示しない。[起動設定](https://aider.chat/docs/config/options.html) 補助役としては、合成側が `helpers/<role>-<index>/` に単独用の設定案を残し、出典つきの手動理由を PLAN.md に書く。

実起動、モデル通信、MCP 接続は未実行。確認はオフラインテストのみ。
