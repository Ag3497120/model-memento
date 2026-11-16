# 「DeepSeek harness」の確認

確認日: **2026-11-15**。公開資料と公開ソースの説明を読んだ。導入、起動、APIへの接続は行っていない。この文書は調査と接続部品の案であり、接続部品の実装は含まない。

## 結論

**DeepSeek自身が公開するDeepSeek Harnessが存在する。** 公式リポジトリは `deepseek-ai/deepseek-harness`、コマンド名は `dsh`。READMEは開発元をDeepSeek AIと明記し、DeepSeekのAPI資料もこのHarnessの案内へリンクしている。したがって、依頼者の「DeepSeek harness」はこの公式製品を指す候補として扱える。本人がどれを意図したかまでは `unverified`。[公式README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md)・[DeepSeek APIの案内](https://api-docs.deepseek.com/)

「harness」は、モデルに加えてファイル操作などの道具と作業の進め方をまとめる実行役。この公式Harnessでは、画面から作業フォルダーを選び、エージェントにファイルの読み書きやコマンド実行を依頼できる。モデルそのもののAPIとは別のものとして扱う。[公式の利用手順](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/index.md)

## 公開状態と導入経路

| 確認したこと | 内容 | 出典 |
| --- | --- | --- |
| 開発元 | DeepSeek AI | [README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md) |
| 公開状態 | 開発者向けの試用版。互換性が変わる変更を予定している | [READMEのDeveloper preview](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md#developer-preview) |
| 利用許諾 | MIT | [READMEのLicense](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md#license) |
| npmからの実行手順 | `npx @deepseek-ai/dsh web` | [READMEのRun from npm](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md#run-from-npm) |
| 公開パッケージとコマンド名 | `@deepseek-ai/dsh`、実行ファイル `dsh` | [CLIのpackage.json](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/package.json) |
| ソース上の宣言 | 版 `0.2.2-rc.3`、Node.js `>=24.9.0` | [同じpackage.json](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/package.json) |
| 画面の起動 | `dsh web`。`--no-open` を付けるとブラウザーを自動で開かない | [READMEの起動説明](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md#run-from-npm) |
| エディターとの接続 | `dsh --profile acp`。ACP（エディターと実行役がやり取りする共通方式）で標準入出力を使う | [CLIのEntry modes](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md#entry-modes) |
| 自動処理向けの起動 | `dsh --profile headless`、`dsh --profile sdk` などを公開 | [同じEntry modes](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md#entry-modes) |

以上により、**導入・実行の経路が公式に文書化されている**と判断する。ここで示したコマンドは表示用で、実行していない。ソース上の版とnpmで現在配布されている版が同じか、各OSで導入できるかは `unverified`。このプロジェクトのNode.js要件と、外部の `dsh` が要求するNode.jsの版は別に扱う。[CLIの実行環境宣言](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/package.json)

## レシピへの接続部品の案

以下はModel Memento側の設計案。実行役の候補IDを `deepseek-harness` とし、モデル提供元のID `deepseek` と区別する。

1. **導入と検出。** 導入は人が行う手順として表示する。起動計画で `npx` による取得やインストールを始めない。導入済みの `dsh` を探し、検出時に実行する候補は `dsh --version` のみとする。`--version` は公式に記載があるが、この調査では実行していない。[CLIの動作説明](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/reference/README.md)

2. **設定場所。** `configHomeEnv` の候補は `DSH_HOME`。計画では `<workspace>/.config/deepseek-harness` に向ける。Harnessはこの環境変数で保存場所を変更でき、既定値は `~/.dsh`。共有の指示・スキルの保存場所は別に `DSH_AGENTS_HOME` で変更できるため、こちらも `<workspace>/.config/deepseek-harness/agents` に向ける案とする。両方を指定しても全プラグインの書き込みがこの範囲に収まるかは `unverified`。[公式の保存場所説明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/util/home-paths/README.md)

3. **起動計画。** 作業場所を `<workspace>/project`、画面用の引数を `["dsh", "web", "--no-open"]` とする案。ACPに接続する場合はコマンド `dsh`、引数 `["--profile", "acp"]` を別に返す。どちらも起動自体は利用者が行う。引数を文字列に連結せず、固定した配列として返す。起動形式は資料で確認したが、Model Mementoからの接続は `unverified`。[README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md)・[CLIの起動形式](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md)

4. **モデル設定。** 最初の実装は人が画面の「設定 → モデル」で設定する `manual` 手順でも成立する。公式手順にはDeepSeekのキー入力、他社提供元の追加、独自のOpenAI形式などの接続先の追加がある。自動生成する場合は、その版の設定形式に合わせ、カタログで選ばれたIDと固定URLだけを対応付ける。Model Mementoはキー値を保存せず、`DEEPSEEK_API_KEY` のような環境変数の名前だけを参照する。Harness自身は画面で保存したキーを `$DSH_HOME/.credentials.yaml` に置くと説明しているため、その保存先も作業領域内であることを確認する。[公式モデル設定](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md)・[DeepSeekキーの環境変数参照](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/llm/llm-deepseek-api-key/README.md)

5. **道具と指示。** MCP（外部の道具をつなぐ共通方式）、`AGENTS.md`、スキル（再利用する作業手順）、補助役の設定をレシピからどう書き込むかは、この調査では `unverified`。接続部品を実装するときは版ごとに出典を確認し、それまでは `unsupported` に残す。保存場所説明には共有 `AGENTS.md` とスキルの読み取り先があるが、それだけでレシピの全機能に対応済みとはしない。[共有の指示・スキルの保存場所](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/util/home-paths/README.md)

接続部品が設定を作るときも、既定のグローバル設定は変更せず、作業領域内だけへ書く。これは [Model Mementoの契約](../../lib/recipes/CONTRACT.md) による設計条件。

## モデル提供元としてのDeepSeek

公式Harnessがあることとは独立して、DeepSeekは他の実行役が使えるモデル提供元でもある。公式資料はOpenAI形式 `https://api.deepseek.com` とAnthropic形式 `https://api.deepseek.com/anthropic` を掲載し、Claude Codeなどから使う案内も持つ。したがってレシピは、実行役として公式Harnessを選ぶ場合と、他の実行役からDeepSeekモデルを使う場合を表せる。[DeepSeek APIの始め方](https://api-docs.deepseek.com/)・[Anthropic形式の説明](https://api-docs.deepseek.com/guides/anthropic_api/)

提供元の実装は [deepseek.js](../../lib/recipes/providers/deepseek.js)。主な形式を `openai-compatible`、別の接続先を `additionalEndpoints` の `anthropic` として記録した。現行IDと確認日は [提供元一覧](../providers.md) にまとめた。

## 未確認事項とレビュー事項

- `unverified`: 依頼者が意図した製品名、npmで配布中の最新版、導入成功、`dsh --version` の実際の出力、OSごとの動作。
- `unverified`: 上記の起動案とACPをModel Mementoから動かした結果、設定の自動生成、全プラグインの保存先の隔離、レシピでのMCP・指示・スキル・補助役の対応、API接続と認証。
- この調査は公式製品の存在を確認したため、同名のコミュニティ製品の利用数や人気の順位は判定していない。広く使われているという主張は `unverified`。
- レビューで決めること: 公式Harnessの接続部品を別タスクで追加するか。今回はモデル提供元だけを実装し、Harness側のファイルは作っていない。
