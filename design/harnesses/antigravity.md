# H8: Google Antigravity 調査記録

調査日: **2026-11-15（日本時間）**。対象はデスクトップの **Antigravity App**。実装は `lib/recipes/harnesses/antigravity.js`。アプリ、IDE、CLI、SDK は公式資料で別々に案内されているため、CLI や SDK の機能をアプリの機能として扱わない。
出典: https://antigravity.google/docs/getting-started/

## 公式資料と採用した事実

以下はすべて 2026-11-15 に公開ページを閲覧した記録。長文や画像、ロゴ、製品コードは取り込んでいない。URL はアダプターの `meta.sources` にも収録している。

| URL | 確認できた内容・実装への反映 |
| --- | --- |
| https://antigravity.google/download | App、CLI、IDE の配布を区別。アプリは OS ごとのダウンロード。`install.how` は `download`。取得やインストールは実行していない。 |
| https://antigravity.google/docs/getting-started/ | macOS は DMG から Applications に移す。アプリ一覧から起動し、ログインしてプロジェクトにフォルダーを追加する。Linux は展開後 `./Antigravity`。CLI の名前は `agy` で、別のインストーラーを使う。 |
| https://antigravity.google/docs/customization-discovery/ | App と CLI が `.agents/` と個人用 `~/.gemini/config/` を読む。MCP は両方の場所の `mcp_config.json`。作業フォルダーからリポジトリーの根まで探索し、Git 管理外では作業フォルダーだけを探索する。規則はすべて累積。技能・独自 AI の同名衝突は「リポジトリー内の個人フォルダー、作業場所、個人設定、組み込み」の順。`.gemini/config.json` の `personal_customization_dir` は個人用追加設定の指定であり、アプリ全体の保存先変更とは確認できない。 |
| https://antigravity.google/docs/rules/ | `AGENTS.md`、`GEMINI.md`、`.agents/AGENTS.md`、`.agents/GEMINI.md`、`.agents/rules/*.md` を読む。旧 `.agent/rules/` も掲載。`AGENTS.md` と `GEMINI.md` は特別な冒頭設定不要で常時有効。規則フォルダー内は `trigger` を含む YAML の冒頭設定が必要。下位フォルダーの規則は自動探索しない。1 ファイル 24,000 バイトで切られ、常時有効な全規則の合計枠は 20,000 トークン。アダプターは大きすぎる文章を黙って切らず `unsupported` にする。 |
| https://antigravity.google/docs/skills | App の技能は `<workspace>/.agents/skills/<name>/SKILL.md` と `~/.gemini/config/skills/<name>/SKILL.md`。関連時に本文を読む。CLI 専用の旧技能フォルダーを App の探索先に加えない。`supports.skills: true`。レシピの契約に技能ファイルの入力欄はないため、このアダプターで技能は生成しない。 |
| https://antigravity.google/docs/mcp | JSON の根は `mcpServers`、その中をサーバー名で分ける。ローカル接続は `command`、`args`、`env`。App の画面は Customizations → Installed → MCP Servers。設定場所のコピー、再起動等がある。CLI/IDE の説明にも `.agents/mcp_config.json` と `~/.gemini/config/mcp_config.json` が掲載。App の作業場所対応は上の customization-discovery の表でも確認。アダプターは `project/.agents/mcp_config.json` だけを生成する。 |
| https://antigravity.google/docs/models/ | 入力欄下の選択メニューでモデルを切り替え、選択は会話内で維持される。掲載モデルには Gemini、Claude Sonnet/Opus 5.5 と 4.6、GPT-OSS 120B がある。契約ごとの利用制限あり。4.6 と GPT-OSS は 2026-11-18 に削除予定との注記がある。名前は手動案内用の固定表にだけ使い、接続先や API 用のモデル ID として推測しない。 |
| https://antigravity.google/docs/subagents/ | App の親 AI が `invoke_subagent` で補助 AI を呼べる。独自 AI は `.agents/agents/<name>.md` または `<name>/agent.md`、個人用は `~/.gemini/config/agents/`。冒頭設定で名前、説明、道具、役割、モデル階級等を記す。`supports.subagents: true` はこのアプリ内の機能を指す。別の実行環境から App を補助役として呼ぶ方式とは確認できない。 |
| https://antigravity.google/docs/cli/acp/ | **CLI のみ**。通信を始めるコマンドは `agy acp`。標準入出力で JSON-RPC を使う。初回は対話ログイン、または `agy acp --login`。App 用のコマンドには転用しない。アダプターの `acp` は `null`。 |
| https://antigravity.google/docs/cli/headless/ | **CLI のみ**。`agy -p <prompt>`、同義の `--print` / `--prompt`。`--output-format` は `text`、`json`、`stream-json`。`--input-format`、`--print-timeout` 等も掲載。App の画面なし操作とは確認できないため `unsupported`。 |
| https://antigravity.google/docs/cli/reference | **CLI のみ**。`--model`、`--effort`、`--agent` 等。設定は `~/.gemini/antigravity-cli/settings.json`。App の設定ファイルや起動引数としては使わない。 |
| https://antigravity.google/docs/sdk/local-models/ | **Python SDK のみ**。`LocalOpenAIAgentConfig` は Ollama、LM Studio、vLLM 等の OpenAI 互換接続、`LiteRTAgentConfig` は端末上のモデル用。App に同じ接続設定があるという根拠にはしない。 |
| https://support.apple.com/en-bn/guide/terminal/apdb66b5242-0d18-49fc-9c47-a2498b7c91d5/mac | Apple は `open -a MyProg.app` をアプリ起動方法として説明。macOS の `argv` は `['open', '-a', 'Antigravity.app']`。これは OS の起動操作で、App に作業場所やモデルを渡す機能ではない。実際には起動していない。 |

## 対応範囲と未確認事項

| 項目 | 結果 |
| --- | --- |
| 指示ファイル | `project/AGENTS.md` を生成。規則は累積するため、個人設定を上書きできるとはしない。出典: https://antigravity.google/docs/rules/ |
| 2 個以上の MCP | `ctx.mcp` のうち `recipe.tools` で選ばれた定義のみを JSON 化。上記の公式形式を使う。出典: https://antigravity.google/docs/mcp |
| グローバル設定 | 書かない。App は個人設定も読むため、作業場所内への出力だけでは設定全体を分離できない。出典: https://antigravity.google/docs/customization-discovery/ |
| 設定保存先の環境変数・引数 | **unverified**。`ANTIGRAVITY_HOME`、`AGY_HOME`、汎用 `HOME` の差し替えや VS Code 系の `--user-data-dir` で App の全設定を移せるとは確認できない。`configHomeEnv: null`、`env: {}`、`unsupported: config-home`。 |
| 外部 Anthropic / OpenAI の認証情報 | **unverified**。内蔵の Claude / GPT-OSS を選べることと、利用者の API 接続先を選べることは区別する。出典: https://antigravity.google/docs/models/ |
| OpenAI 互換 URL / Ollama / 他の任意接続先 | App については **unverified**。SDK の説明を App に流用しない。出典: https://antigravity.google/docs/sdk/local-models/ |
| `supports.models` | 空配列。これは外部 provider 接続を確認できなかったという保守的な宣言。内蔵モデルの選択は手動案内に残し、モデル自動設定を `unsupported` にする。出典: https://antigravity.google/docs/models/ |
| App の ACP / 画面なし実行 | **unverified**。CLI には上記の正確なコマンドがある。App の `supports.acp` は false、`plan().acp` は null。出典: https://antigravity.google/docs/cli/acp/ と https://antigravity.google/docs/cli/headless/ |
| 補助役・確認役として外から App を呼ぶ | **unverified**。`ctx.role: helper` はファイルと起動引数を空にして `unsupported`。指示ファイルを上書きしない。内蔵補助 AI の出典: https://antigravity.google/docs/subagents/ |
| 異なる実行環境の補助役の連携 | **unverified**。レシピに helpers があれば報告する。内蔵補助 AI があることだけで外部の補助役まで動かせるとしない。 |
| App に作業場所を起動引数で渡す | **unverified**。macOS では OS の起動操作だけを返し、フォルダー追加は手動。macOS 以外では `argv: []` と `unsupported: launch`。OS の起動例: https://support.apple.com/en-bn/guide/terminal/apdb66b5242-0d18-49fc-9c47-a2498b7c91d5/mac |
| 公式 App ソース・ライセンス | 公開リポジトリーと再利用可能なライセンスを確認できず **unverified**。`repo` / `license` は null。VS Code や Gemini CLI のソースから App の動作を推定していない。 |

## 純粋な `plan()` の入力とレビュー時の注意

`CONTRACT.md` は `ctx.style` の中身を規定していない。ここでは `style.files: [{path: 'AGENTS.md', content: '…'}]`（または固定の `project/AGENTS.md`）と、単一文章の `style.content` を受け付ける。どちらも生成済みの Markdown。既知の形式がなければ `unsupported: instructions:agents-md` とし、文章を捏造しない。コアの最終スタイル形式が別なら、この入力の接続をレビューする必要がある。

出力先は固定の 2 パスだけ。レシピの ID、題名、目的、モデル文字列、スタイルの任意パスをパス・起動引数・環境変数にしない。MCP のコマンド等は契約上の信頼済みカタログ `ctx.mcp` から選び、余分な属性は捨てる。`ctx.providers` は保存しない。ファイル生成・起動・ログインは `plan()` では一切行わない。

`detect()` は渡された `which` で `antigravity`、`Antigravity` の順に探索するだけ。何も見つからなければ `{installed:false, version:null, bin:null}`。PATH にない App は検出できない。`open` や別製品の `agy` があるだけでインストール済みとしない。デスクトップ版の安定したバージョン取得口は **unverified** のため、検出時はプロセスを起動しない。

## 補助的に閲覧した URL

いずれも 2026-11-15。検索結果の古い文章より、上表の現在の公式ページ本文を優先した。

- https://antigravity.google/docs → `/docs/getting-started` への案内。
- https://antigravity.google/docs/rules-workflows → `/docs/rules` への案内。
- https://antigravity.google/docs/cli/install/ → `/docs/install?tab=cli` への案内。アプリ用の設定保存先変更は確認できない。
- https://antigravity.google/docs/install/ → 各製品のログイン方法。App は Google アカウント、SDK のローカル接続とは別。
- https://antigravity.google/docs/projects/ → App のプロジェクトは複数フォルダーを持てる。概要表にはカスタマイズを個人設定で管理する説明もあり、詳細な探索場所は上表の customization-discovery を採用。
- https://antigravity.google/docs/features → App / CLI 等の機能概要。具体的なファイル形式は各専用ページで確認。
- https://antigravity.google/docs/changelog?tab=hub&version=2.29.0 → App の履歴。検索結果の版の違いがあるため、機能対応は現在の専用ページに限定。
- https://antigravity.google/docs/changelog?ide=visual-studio&tab=extensions → 各製品の更新履歴。App と CLI が別の製品であることを再確認。
- https://www.antigravity.google/docs → 古い開始案内が検索に出た。現在の正規ホストの本文を優先。
- https://antigravity.google/docs/download → 読み込み失敗。ダウンロードの根拠は有効な `/download` を使用。
- ルール、探索、補助 AI のページの見出しアンカー付き URL も閲覧した。内容は上表と同じ。

未確認の探索には公式ドメイン内で `config-dir`、`ANTIGRAVITY_HOME`、`AGY_HOME`、`user-data-dir`、`baseUrl`、`base_url`、`ANTHROPIC_API_KEY`、`OPENAI_API_KEY`、App の起動コマンドと公開ソースを検索した。見つからなかったことを製品全体での機能不存在の証明にはしない。

## ローカル確認

- `node --version`: `v22.17.0`。
- `command -v antigravity` / `command -v agy`: どちらも出力なし。PATH 上には見つからなかった。
- `/Applications/Antigravity.app/Contents/Info.plist` を読み取り、App バンドルの存在を確認。アプリを起動して操作したわけではない。
- `'/Applications/Antigravity.app/Contents/MacOS/Antigravity' --version`: **終了コード 134、標準出力なし**。バージョン取得は成功していない。原因は **unverified**。
- 比較用に既存の `'/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide' --version` を実行: 終了コード 0、出力は `1.107.0`、`9e3a5da5d6731effd57d47d88bbe5df14ac6ccdd`、`arm64` の 3 行。これは **IDE 側の出力**で、App のバージョンとして採用しない。配布製品の区別: https://antigravity.google/download
- `node --test test/recipes/harness-antigravity.test.js`: 終了コード **0**。実出力の集計は `tests 12`、`pass 12`、`fail 0`、`cancelled 0`、`skipped 0`、`todo 0`。テストはファイル計画をメモリー上で確認するだけで、App / MCP / 補助 AI は起動しない。

## C2 追記: デスクトップアプリの補助役公開（2026-11-15）

このアダプターは引き続きデスクトップアプリを対象とする。公式の MCP 資料は外部の道具を追加する説明で、アプリ自身を MCP サーバーにする方法は **unverified**。別部分の agy CLI や Python SDK についても、今回読んだ説明から公式の MCP サーバー接続を確認できなかった。`asMcpServer` は公開しない。[MCP](https://antigravity.google/docs/mcp)、[CLI](https://antigravity.google/docs/cli/reference)

進行役の場合は `helper-<role>` を `project/.agents/mcp_config.json` に通常の道具と一緒に残す。アプリで作業場所を開き、接続の読み込みを手動で確認する。[接続設定](https://antigravity.google/docs/mcp) 補助役の場合は、合成側が `helpers/<role>-<index>/` に指示書などの案を残し、手動の依頼と表示する。

アプリ起動、認証、モデル選択、実 MCP 接続は未実行。確認はオフラインテストのみ。
