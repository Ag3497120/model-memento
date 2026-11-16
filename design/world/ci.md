# 世界の索引を更新して公開する手順

確認日: 2026-11-15。担当は `.github/workflows/*.yml`、`scripts/check-rights.js`、この文書。

**GitHubでの実行はすべて未確認。** この作業場所はまだGitリポジトリではなく、リポジトリも公開されていない。予約実行、手動実行、依存関係の準備、全体のビルド、実際の公開物の受け渡し、Pagesへの公開、実際のキャッシュの復元・保存は一度も実行していない。以下のローカル確認と区別する。

## 入口と公開までの流れ

`auto-sync.yml` はUTC 03:17、日本時間12:17に実行する設定。月〜土は `delta`（新着と変更）、日曜日は `full`（開始日で絞らず確認）。日曜日にも新着の判定とツールの確認を行うため、日次更新を欠かさない構成。手動実行では方法を選べる。`dry_run`（公開しない試行）は初期値をtrueにした。

`pages.yml` のmain更新時の公開も同じ `world-pages.yml` を呼ぶ。これにより、別の公開経路が `world/` を消してしまうことを防ぐ。両方の入口で同じ `world-pages` の同時実行グループを使い、前回の状態を読むところから公開成功までを直列にする。途中の実行は取り消さない。共通手順は既定ブランチ以外では実行しない。再利用する手順の仕組みは[GitHubの説明](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)に基づく。

順番は次のとおり。

1. ソースと固定された依存関係をCI内で準備。`npm ci --ignore-scripts --no-audit --no-fund` は将来のCIの設定であり、この作業中には実行していない。
2. 前回公開した状態を復元する。
3. `npm run check:contrib`、`test/recipes/`、`web/js/recipes/data.test.js`、`test/world/` の全 `.test.js` を `node --test` で実行する。両方のテスト群が存在しない場合は失敗する。権利・容量の自己テストも実行する。
4. `npm run build:web -- --offline` で保存済みデータからサイトを作る。追加の無制限なモデル取得を避けるための `--offline`。ローカルでは担当外の生成ファイルを書き換えるので実行していない。
5. `scripts/world-build.js` とツール発見の関数で `.world-out/` を作る。
6. `web/` と生成した `world/`、`data/enrich-queue.json` を `$RUNNER_TEMP/pages/` にまとめ、`node scripts/check-rights.js "$RUNNER_TEMP/pages"` を通す。古い `web/world/` があっても新しい結果で置き換える。
7. 試行でない場合だけ、公式の `actions/configure-pages@v5`、`actions/upload-pages-artifact@v3`、`actions/deploy-pages@v4` を使う。[アップロード手順](https://github.com/actions/upload-pages-artifact)と[公開手順](https://github.com/actions/deploy-pages)を確認した。
8. 公開成功後だけ、その `world/` 全体を予備のキャッシュに保存する。

試行でも検査・取得・組み立ては行う。Pagesの準備、公開物のアップロード、公開、**状態のキャッシュ保存**は行わない。Nodeの依存関係用キャッシュは別物。AIへの依頼、ローカル調査の実行、コミット、push、PR作成の工程はない。既存の `ci.yml` は読取り権限と認証情報を残さないcheckoutに変更し、それ以外の既存のブラウザ検査は維持した。

## ビルド側との接続

最初に読んだ `lib/world/CONTRACT.md` には出力の配置と登録先の関数はあるが、`world-build.js` のコマンド引数はまだ記載されていない。このため、並行作業で実際に追加された `parseArgs`、`discoverRegistries`、`buildWorld` の公開関数に合わせた。CLIと同じ引数は次の形。

```text
node scripts/world-build.js --delta --budget 20 --out .world-out --state <前回の一覧のURLまたはパス>
node scripts/world-build.js --full --budget 10000 --out .world-out --state <前回の一覧のURLまたはパス>
```

実際のCIでは同じ引数を `parseArgs` に通し、規約を確認できた登録先だけを許すため、`buildWorld({ ...options, registries, toolDiscovery })` を呼ぶ。登録先7種類の実装がそろっていなければ失敗させる。返ったマニフェストは `memento.world-index.v1` を想定する。

ツールは `lib/world/tools/index.js` の `discoverTools` を、ビルド側の `toolDiscovery` に渡す。ツールの予算を各登録先20回に設定し、差分では前回の確認日の1日前から重ねて確認する。新着と版の変更の統合、件数・容量・SHA-256の記録、調査待ちの保存はビルド側でまとめて行う。CIは巨大な日別JSONを別の工程で丸ごと読み直さない。

次回の続きは、ビルド側が `world/tools-state.json` に保存する。W1では調査待ちを埋め込まず、別の正本 `world/data/enrich-queue.json` だけに保存する。`manifest.tools` に固定パス、容量、SHA-256、確認日時、取得回数、取りこぼしの情報を記録する。現行ワークフローは調査待ちをルート側の `data/enrich-queue.json` にもコピーするが、W1の共通契約ではこのコピー行を削除する必要がある（担当外のため未変更）。ツールの状態はビルド側が最大128 MBに制限する。CIはマニフェストの事前確認・生成後に最大10 MBという上限を設けた。日付はビルド開始日に統一する。

`full` は実行方法であり、全サービスの完全な収録を意味しない。規約で停止した登録先、取得回数の上限、公開APIの範囲、ツール検索の取りこぼしを表示できるように状態を残す。全件確認が上限に達した場合の続きはビルド側の責任で、CIから独自に開始位置を書き換えない。

## 前回の状態と初回公開

設定するリポジトリ変数は **`WORLD_SITE_URL` の一つ**。例は `https://example.github.io/model-memento/`。`/world` は含めない。専用ドメインでもよいが、HTTPS、認証情報・検索文字列・フラグメントを含まないURLにする。

毎回まず `<WORLD_SITE_URL>/world/manifest.json` を取得して形式を確認する。成功した場合はその公開URLをビルド側に渡す。ビルド側が前回の分割ファイルと新着履歴を読む。マニフェストだけでは差分公開で古い記録を保てないため、予備には**分割ファイル、新着履歴、ツール状態を含むworld全体**を保存する。

公開マニフェストの通信失敗・HTTP失敗・形式違いの場合は、最後に公開できたキャッシュの `.world-cache/world/manifest.json` を渡す。両方読めない場合は停止する。例外は、手動の `full` で公開マニフェストが404の場合だけで、これを初回公開として扱う。初回はURLを設定し、`full` + `dry_run: true` で確認した後に、同じ `full` + `dry_run: false` を実行する。新着だけの初回実行では不完全な初期状態を公開しない。

公開マニフェストは読めても、その後の分割ファイルやツール状態が壊れていたら公開を止める。途中から別の世代のキャッシュに混ぜない。ツール状態も容量とSHA-256を確認してから使う。前回の公開物の読取りは登録先APIへの要求とは別に数えられる。

キャッシュのキーにはOS、形式の版、実行ID、再試行番号を使い、復元時だけ同じ形式の前方一致を使う。失敗・取り消し・試行では保存しない。公開後のキャッシュ保存だけが失敗しても、既に公開したサイトは保持する。`actions/cache/restore@v4` と `actions/cache/save@v4` の分離は[公式のcache説明](https://github.com/actions/cache)に基づく。

## 上限と権限

| 対象 | この手順の設定 |
|---|---|
| 新着の公開ジョブ | 全体45分、モデル・ツールの組立て25分 |
| 全件の公開ジョブ | 全体180分、モデル・ツールの組立て150分 |
| 検査 / サイト組立て | 各10分 |
| 前回マニフェストの事前確認 | 工程2分、取得30秒 |
| Pages公開 | 工程10分、Action内部9分 |
| HF / models.dev系のモデル | 各登録先につき新着20要求、全件10,000要求を上限に渡す。通常models.devは一度の一覧取得で足りる |
| GitHub / npm / PyPIのツール | それぞれ20要求、合計60要求。日次・週次とも同じ |
| 停止した登録先 | 一覧・件数取得の通信とも0要求。件数不明はnull |
| 公開サイト | 合計1,000,000,000バイト以下。梱包の見積もりも同じ上限 |

要求数は速度の許可ではない。登録先の待ち時間、429、再試行の条件を守る実装を使う。実測の全件所要時間・容量は `unverified`。時間切れなら公開しない。完全収録を約束して上限を外すことはしない。

マニフェストの登録先ごとの `indexedCount` は収録済みの件数で、登録先の総数とは違う。停止した登録先でこれが0でも、総数0と解釈しない。停止した登録先の `count` は確認済みの総数がなければnullになる。

権限の種類は `contents: read`、`pages: write`、`id-token: write` のみ。checkoutでは `persist-credentials: false`。Pagesの書込みと実行元を証明する権限は[deploy-pagesの要件](https://github.com/actions/deploy-pages#security-considerations)に従った。ツール取得のGitHub認証はこの実行のトークンを `api.github.com` にだけ付け、他の取得先には渡さない。

依拠したGitHubの制限:

- 公開サイト最大1 GB、公開処理10分、月間転送量の目安100 GB。大規模な索引を毎日読み直す転送費用・利用量は未測定。通常の毎時10ビルド制限は独自Actionsで作って公開する場合には適用されない。[Pagesの制限](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- 公開用tarにリンクや通常ファイル以外を含めない。Actionの取扱い上の大きな上限を、Pagesの1 GB制限の代わりには使わない。[upload-pages-artifactの形式](https://github.com/actions/upload-pages-artifact#artifact-validation)
- GitHubホストのジョブの最大実行時間は6時間。この手順はそれより短い上限を設けた。[Actionsの制限](https://docs.github.com/en/actions/reference/limits)
- キャッシュは7日以上使われなければ削除対象で、標準の容量はリポジトリ当たり10 GB。保管庫として保証しない。毎回別キーなので古いものが退避対象になる可能性がある。[キャッシュの上限と削除](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching#usage-limits-and-eviction-policy)
- 予約実行は既定ブランチ上の設定が必要で、遅延・取りこぼしがありうる。公開リポジトリは60日間活動がないと予約実行が停止する。時刻を毎時の開始直後から外した。[scheduleの説明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

## 登録先の規約・出典とCIの判断

以下は本担当が読んだページとCIの方針。取得できなかった本文の内容を推定しない。各記録のURL・出典とライセンス名を残す。ロゴ、画像、説明文、カード、README、公開版の長文は転載しない。明示された個別のライセンス表示も削らない。

| 登録先 | 確認した内容 / 数値制限 / 出典表示 | このCIでの扱い |
|---|---|---|
| Hugging Face | 公開Hubの情報取得用APIが案内されている。規約では個別ライセンスの表示を維持。APIの匿名利用は5分で500要求という掲載値があるが変更されうる。429と応答の上限情報を優先。[規約](https://huggingface.co/terms-of-service)、[API](https://huggingface.co/docs/hub/api)、[上限](https://huggingface.co/docs/hub/rate-limits) | 一覧を許可。各記録に元のURL。モジュールの間隔と再開状態に従う |
| Civitai | 規約11.4は公式API等と自分の有効な認証情報による自動アクセスを例外として認める。数値の上限は本担当では `unverified`。[公式ソースの規約](https://raw.githubusercontent.com/civitai/civitai/main/src/static-content/tos.md)、[掲載先](https://civitai.com/content/tos) | このCIでは認証情報を設定していないため一覧停止。件数は未確認 |
| ModelScope | [規約](https://www.modelscope.cn/docs/agreements/terms)の本文を本担当の取得方法では読めなかった。自動一覧の許可、出典表示の条件、数値上限は `unverified` | 一覧停止。公開APIの存在だけでは許可と判断しない。件数は未確認 |
| Kaggle | [規約](https://www.kaggle.com/terms)の本文は本担当の取得では空。禁止条項の詳細、例外、数値上限、出典表示は `unverified`。登録先モジュールも一覧取得を停止している | 一覧停止。件数は未確認 |
| Ollama | 4節で許可のない自動アクセスを禁止。数値上限・一覧転載の許可は `unverified`。[規約](https://ollama.com/terms) | 件数だけの扱い。確認済みの件数がないのでnull。通信しない |
| NVIDIA NGC | 公開一覧の取得方法は案内されるが、Technology Access Terms 6(m)にデータ抽出の制限がある。別の契約との優先関係、一覧転載の許可、数値上限は `unverified`。[取得方法](https://docs.ngc.nvidia.com/sdk/api.html#guest-mode)、[規約](https://developer.nvidia.com/legal/terms) | 保守的に一覧停止。件数は未確認。取得方法の記述を包括的な転載許可とは解釈しない |
| APIモデル | models.devの公開APIとMITライセンスを参照。数値の取得上限は `unverified`。モデル名・事実・URLのみ利用し、配布元のライセンスと出典を維持。[公開APIの案内](https://models.dev/)、[ライセンス](https://github.com/anomalyco/models.dev/blob/dev/LICENSE)。OpenRouter 7(5)には自動取得・複写の制限がある。[OpenRouter規約](https://openrouter.ai/terms) | models.dev経由だけ。OpenRouterや提供元から直接の一覧取得はしない |
| GitHubのツール | API利用には過剰な要求や個人情報の不正利用の禁止がある。公開APIを使い、ウェブ画面を巡回しない。トークンは制限回避のために増やさない。公開リポジトリのURLを出典として記録。[API規約](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#h-api-terms)、[上限](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) | 検索と公開版の事実のみ。要求は直列、モジュールの待ち時間と応答に従う |
| npmのツール | 公開APIからの検索と複製を許可し、ウェブ画面の自動巡回を禁止。所有権表示の削除を禁止し、過剰な要求を禁止する。1分当たりの固定数値上限は `unverified`。[規約](https://docs.npmjs.com/policies/open-source-terms/) | 公開APIだけ。名前・版・ライセンス名・出典URLを残す。第三者のコードはコピーしない |
| PyPIのツール | API規約は過剰な利用を禁止。更新確認にはRSSを案内し、直列での取得と固有User-Agentを推奨する。固定の要求数を許可する約束ではない。[規約](https://policies.python.org/pypi.org/Terms-of-Service/#api-terms)、[利用方針](https://policies.python.org/pypi.org/Acceptable-Use-Policy/)、[API方針](https://docs.pypi.org/api/) | RSSとJSONの事実だけ。名前・版・ライセンス名・出典URLを残す |

ModelScopeや認証付きCivitaiを許可するには、レビューで規約・資格・取得先を確認した後、共通手順の登録先の許可リストを変更する。他担当の登録先実装は書き換えていない。

## 権利と容量の検査の範囲

`scripts/check-rights.js` は標準ライブラリだけの読取り専用ESM。画像の拡張子を大文字・圧縮済みの形も含めて拒否し、先頭4 KBの代表的な画像の識別情報も検査する。ロゴ、マスコット、画面写真等を示すファイル名・フォルダー名を拒否する。フォントファイル、シンボリックリンク、ハードリンク、特殊ファイル、空の公開物も止める。エラーは日本語で、表示は先頭40件に絞り、総件数を示す。

各ファイルの保存容量を合算し、tarのヘッダー、長いパス、小さいファイルの端数を余裕をもって見積もる。合計と梱包見積もりのいずれかが1,000,000,000バイトを超えたら失敗する。CLIでこの上限を引き上げる機能はない。容量超過では掲載件数・分割方法を見直すよう表示する。

これは著作権や商標の自動判定ではない。コードで描いたブランド形状、長文、遠隔画像への参照、任意の暗号化・独自形式・埋込み内容は判定しきれない。一般的なコード内の図形まで画像ファイルとは扱わない。出典のない事実やブランド形状については、引き続きレビューが必要。

## 実行した確認と未確認の項目

ローカルのNodeは `node --version` の出力が `v22.17.0`。インストール、コミット、push、PR、アプリやサーバーの起動、登録先のライブ一覧取得は本担当では行っていない。公開資料の調査だけを行い、本担当が収録したレジストリの実データ試料は0要求。

| 項目 | 実際に実行したコマンド / 出力 | 状態 |
|---|---|---|
| 寄稿の検査 | `npm run check:contrib` → `✓ openai-gpt-2-interactive.json`、終了0 | 完了 |
| 組み合わせの一部 | `node --test test/recipes/providers.test.js test/recipes/guide.test.js web/js/recipes/data.test.js` → tests 38 / pass 38 / fail 0 | 一部。全体の組み合わせテストは未実行 |
| 登録先・発見・調査の部品 | `node --test test/world/registries-1.test.js test/world/tools.test.js test/world/enrich.test.js` → tests 70 / pass 70 / fail 0 | 完了。通信・AIは注入した偽物だけ |
| 別の登録先群 | `node --test test/world/registries-2.test.js` → tests 22 / pass 22 / fail 0 | 完了。オフライン |
| 索引の読取り専用の部品 | `node --test --test-name-pattern='CLI has strict\|promotion boundaries\|live search delegates' test/world/index.test.js` → tests 3 / pass 3 / fail 0 | 一部。索引を生成するテストと大規模測定は未実行 |
| 権利・容量 | `node scripts/check-rights.js --self-test` → tests 5 / pass 5 / fail 0 | 完了。仮想ファイルで容量の境界・偽装画像・リンクも確認 |
| 現在の既存サイト | `node scripts/check-rights.js web` → 合格。実行時点で2,058ファイル、82,426,575バイト、梱包見積もり87,189,504バイト。生成直後の全worldを含む公開物ではない | 一部 |
| JavaScript構文 | `node --check scripts/check-rights.js` → 出力なし、終了0 | 完了 |
| CI内のNodeプログラム | 標準入力のNodeでYAML内の6本を取り出して `node --check --input-type=module` で構文を確認。最終結果は下記 | 構文だけ確認。YAML全体とActions固有の検証は未実行 |
| 状態とビルドの接続 | 標準入力のNode + `node:test` で実際の埋込みコードをメモリー上のfetch/fsと偽のビルド関数で実行 → tests 8 / pass 8 / fail 0 | 部品の確認。実際の公開・キャッシュ・全体のビルドではない |

最後の8件は、公開状態の優先、障害・形式不正時の予備、full+404だけの初期化、URL制限、fullの引数・規約による停止・ツール予算、deltaの状態と1日の重複確認、登録先不足での停止、10 MBを超える一覧での停止。GitHub用の認証がGitHub以外に付かないことも確認した。確認に使ったファイルはメモリー上だけに作った。ビルド側の実際の統合を含む全テストは未実行。

最終の構文・文字列検査の出力（終了0）:

```text
Parsed 6 embedded Node programs; 4 workflows have no tabs and are below 500 KB. YAML/Actions validation not run.
Read-only repository permissions, shared publication lock, official Pages actions and five dry-run guards verified as text.
```

レビューで残る事項:

- GitHubのYAML解釈、式、再利用する手順、Pages環境の設定、予約実行、権限、公開URL、キャッシュの実動作はすべて `unverified`。Pagesの公開元をActionsに設定し、`WORLD_SITE_URL` を設定してから試す必要がある。
- `CONTRACT.md` にビルドの引数と追加の `manifest.tools` / `tools-state.json` の扱いを明記してよいか。他担当のファイルなので本担当は変更していない。
- W1で未完了のfullは次のfullでも同じ位置から続けるよう変更した。CIは完全収録済みとは断定しない。
- 全件・全登録先の網羅性、4.4百万件での時間・メモリー・容量・転送量、全テスト一括実行、組み立てた最終サイト、権利上の最終判断は `unverified`。

## W1統合で変わった接続（ワークフロー自体は担当外）

共通形式は [CONTRACT.md](../../lib/world/CONTRACT.md) に明記した。ビルダーは未完了fullを次週のfullでも再開する。完了状態を次のdeltaに渡さず、巡回開始時刻から重ねる。新着は `.json.gz`、モデルは短い保存形式、作り手は分割先と行番号。旧入力は移行できる。索引単体650,000,000バイトの検査を入替え前に行う。

調査待ちの正本は `/world/data/enrich-queue.json`。tools-stateは状態だけを保存する。現行ワークフロー192行目の `/data/enrich-queue.json` へのコピーは削除が必要だが、この担当では編集していない。Civitaiの任意の環境変数名は `CIVITAI_TOKEN`。既存CIの停止方針や秘密情報の設定は変えていない。全件の合成測定とオフライン試験は [index.md](index.md) を参照。Pagesの実公開、Actions、実APIの動作は引き続きunverified。
