# 世界のモデル・道具の一覧：共通の約束

2026-11-15、W1統合。以前の各担当の設計メモと食い違う場合は、この文書を優先する。
取得するのは名前と短い事実だけ。画像、説明、README、モデルカード、認証情報は公開物に入れない。
登録先の総数や全件取得の許可を推測しない。不明な値は `null` または `unverified`。

## 三つの掲載段階

| 段階 | 内容 | 保存先 |
| --- | --- | --- |
| 調査済み | 出典付きの詳しい事実・人物像・画面の設計 | レビュー済みの `data/curated/` |
| 主な記録 | 登録先の事実と固定の選定規則による掲載 | 公開時に生成 |
| 一覧のみ | IDと少数の事実。名前・作り手から探せる | 分割した公開ファイル |

追加調査は本人の端末、または独立した ai-maintain.yml の ai ジョブだけで実行する。AI に GitHub の書込み権限を渡さず、収集・検証・反映の決まった処理は従来どおり AI を呼ばない。下書きは別ジョブで形式・出典・権利・容量・テストを検査してから原則 PR でレビューし、管理者が AI_AUTOMERGE=true を設定した場合だけ検査後に直接反映する。

## 読み込み時のモデル：`memento.world-model.v1`

登録先の `list()` とブラウザーのクライアントは次の論理レコードを扱う。
公開ファイルの短い保存形式と区別する。

```js
{ r: 'hf', id: 'maker/model', a: 'maker', n: 'model',
  t: 'text-generation', c: '2026-01-01', u: '2026-11-15',
  d: 5, l: null, lic: null, gated: false,
  url: 'https://huggingface.co/maker/model' }
```

`r` は `hf / civitai / modelscope / kaggle / ollama / ngc / api`。
日付はUTCの年月日、不明は `null`。`d/l` は0件=0、1〜99=1、100〜999=2、
1,000〜9,999=3、10,000〜99,999=4、100,000〜999,999=5、100万以上=6。不明は `null`。
`gated` も不明は `null`。IDの大文字・小文字と登録先の違いを保つ。

## 登録先と進み具合：`memento.world-progress.v1`

```js
export const meta = { code, name, homepage, api, terms, rateLimit, needsToken, sources };
export async function* list({ fetch, since, state, budget }) {
  // 論理レコード、必要なら削除の通知、最後に一度だけ { state } を返す。
}
export async function count({ fetch }) {} // { count, method, at }。不明はnull。
```

すべての登録先と道具の発見の `result.state` は同じ共通項目を使う。

```js
{ schema: 'memento.world-progress.v1', registry: 'hf',
  complete: false, excludedNsfw: 3,
  since: null, cursor: '続きの位置' /* 登録先ごとの追加項目 */ }
```

- `complete` は今回の巡回を最後まで終えたか。予算切れ、待機、取得範囲の上限、認証待ち、取得停止はfalse。
- `excludedNsfw` は**同じ巡回で観測した累積の除外件数**。全世界の件数ではない。
  ビルダーは再開前との差だけを今回の件数にする。削除通知と状態の数を二重に足さない。
- `excludedNsfwTotal` を明示できない限り、世界全体の成人向け件数は `null`。
- `cursor/page/since/notBefore/retryAt` などの続きの項目は登録先が管理する。
  本文・画像・除外対象のID一覧は状態に残さない。要求回数は呼び出しごとに数える。
- `state.done / state.nsfw`、`{state:null}`、外側の `nsfwCount` は**旧形式の読み込みだけ**で受け付ける。
  新しい組み込みモジュールは `complete / excludedNsfw` と共通のschemaだけを出力する。
- モデルの完了済み状態は、次の差分巡回に渡す前に捨てる。
  道具の状態には既知の道具や版の台帳もあるので台帳を残し、完了した検索位置だけを次の日にリセットする。
  道具の `complete` は今回用意した検索・待ち仕事を終えたかであり、サービス全体の網羅性ではない。
  取りこぼしは別の `coverage` に残す。

`budget` は失敗と429の再試行も含む最大HTTP要求数。fetchは注入された関数だけを使う。
待機と429への対応は登録先が行い、上限に達する前に保存可能な状態を返す。
ビルダー側も別に回数を数える。状態が返らなければ前の位置を維持する。

ビルダーは巡回開始時刻 `scanStartedAt`、巡回方法 `scanMode` と `since` を保存する。
**未完了の全件巡回は、次の日のdeltaでも次週のfullでも同じ位置から再開する。**
完了後のdeltaは、その巡回を始めた時刻の1日前から重ねて確認する。
完了したfullの次にfullを指定すると、新しい全件巡回を始める。

## 成人向けに変更されたモデル

以前安全だったIDが成人向けと分かったら、登録先は次だけを一時的に返す。

```js
{ remove: { r: 'hf', id: 'maker/model', reason: 'nsfw' } }
```

名前、説明、画像は返さない。ビルダーはこの実行でモデル・作り手・主な記録・過去を含む新着から削除し、
収録件数を作り直す。削除通知は公開せず、その回の作業用ファイルだけに置く。
変更をまだ返していないページ、予算外のページ、登録先が知らせない変更を先回りして検出する保証はない。
削除済み・非公開モデルの全面照合はこの変更の対象外。

Civitaiの一覧は `nsfw=true` で区分も受け取り、成人向けは削除通知と件数だけにする。
`nsfw=false` だと変更されたID自体を返さなくなるためである。
この引数の意味と、地域によって無視される条件は[公式モデルAPI資料](https://github.com/civitai/civitai-developer-docs/blob/main/site/reference/models.md)を参照。
全件・認証後の実サービスでの確認は `unverified`。

## Civitaiの認証

環境変数名は **`CIVITAI_TOKEN`**。任意であり、値の収集や保存はしない。
CLIとプログラムからのビルドの両方で、値はCivitaiモジュールのAuthorizationヘッダーにだけ渡す。
公開ファイル・URL・状態・ログには入れない。認証済みfetchを注入する場合は `authenticated:true` も使える。

[認証資料](https://github.com/civitai/civitai-developer-docs/blob/main/site/guide/authentication.md)では一覧APIの一部は
匿名でも応答する。しかし[公式規約§11.4](https://raw.githubusercontent.com/civitai/civitai/main/src/static-content/tos.md)は
公式の自動接続にも本人の有効な認証情報を条件にしている。
そのため、このアプリはトークンも認証済みfetchもない場合、一覧・件数のAPI要求を**0回**とし、
`requiresToken:true / complete:false / count:null` を返す。以前公開した事実のローカル読取りだけを続ける。
匿名APIの応答可否を、自動巡回の許可とは解釈しない。

## 公開する配置と保存形式

```text
world/manifest.json
world/shards/<r>/<xx>.jsonl.gz
world/authors/<r>/<xx>.json.gz
world/new/<UTCの日付>.json.gz
world/notable.json.gz
world/tools-state.json
world/data/enrich-queue.json
```

`manifest.schema` は引き続き `memento.world-index.v1`。追加の `encoding` で保存形式を識別する。
`encoding.records = memento.world-compact.v1`、`encoding.authors = shard-deltas.v1`、
`encoding.urls` は登録先ごとのURLの組立て規則。
分割先は `sha1(id.toLowerCase())` の先頭2桁。作り手も同じ計算を `a` に使う。
各ファイルに圧縮後のバイト数とSHA-256、展開後のバイト数を残す。モデルはID順で保存する。

短いモデルレコードの例：

```js
{ i: 'maker/model', t: 0, c: '2026-01-01', u: '2026-11-15', d: 5, g: 0 }
```

`i=id / s=lic / g=gated(0か1)`。不明はキーを省き、読み込み時にnullに戻す。
ID末尾から分かる名前と、最後の `/` より前から分かる作り手は省く。異なる値と明示nullは残す。
登録先はモデル分割ファイルでは省き、複数登録先を含む新着・主な記録では `r` を残す。
URLは `encoding.urls` とIDから復元する。一致しない出典URLは `x` に残す。
用途の固定の番号は `lib/world/codec.js` の `TASKS` 順。未知の用途は元の短い文字列を保つ。
道具のレコードは元の `memento.world-tool.v1` のまま保存する。
Node側の正規化とブラウザー側の復元が元の論理レコードに一致することをテストする。
旧形式のJSONL・圧縮されていない新着も入力として読み、次回のビルドで新形式へ移行する。

作り手の値は `{ "maker": [["00", 5, 2], ["a1", -2, 1]] }` のように、
分割先と行番号の差をまとめる。この例は00の行5・7、a1の行3・4を指す。
各グループの最初の数は、前のグループの最初の行番号との差（最初のグループだけ0との差）。
その後は同じグループの前の行番号との差。読み込み時に**0始まりの行番号**に戻す。
作り手ごとに差の基準をリセットする。負の差も許す。IDは繰り返さない。
比較測定用の `shard-offsets.v1` は差にせず行番号をそのまま保存する形式で、クライアントは両方読める。
分割先、行番号の順でページ送りする。作り手の表示には必要なモデル分割ファイルの取得が追加される。
ID検索はmanifestと該当するモデル分割ファイルだけで、まだ一覧を読んでいない状態でも**最大2 fetch**。
追加の辞書ファイル取得はない。

新着は登録先とIDでまとめ、日別にgzipで保存する。圧縮されたバイトを順次展開して読む。
HTTP側が展開した応答も識別できる。Brotliは[現在のCompression標準](https://compression.spec.whatwg.org/#supported-formats)にあるが、
この環境のNode v22.17.0は `new DecompressionStream('brotli')` をTypeErrorにした。
実ブラウザーの対応は未測定のためgzipを使う。

公開索引はmanifest込みで**650,000,000バイト**を上限とし、超えれば入れ替える前に止める。
[GitHub Pagesの現在の上限](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)は公開サイト全体で1 GB。
650 MBはこのプロジェクト独自の余裕を持たせた上限であり、サイト全体は別に検査する。
測定の各段階と結果は `design/world/index.md`。

## 道具の発見と一つの調査待ち一覧

`discoverTools({fetch,since,state,budget})` は `{records,queue,state,stats,warnings,coverage}` を返す。
ビルダーは道具・版の到着をモデルと同じ日別ファイルに入れる。
`tools-state.json` は `{schema:'memento.world-tools-publication.v1', state}` のみ。
旧ファイルにある `queue` も移行時には読めるが、新規の状態には複製しない。

調査待ちの場所は **`world/data/enrich-queue.json` の一つ**。
`lib/world/queue.js` の `ENRICH_QUEUE_PATH` はworldからの相対位置、
`DEFAULT_WORLD_DIRECTORY` は `.world-out/world`。
ビルダー、道具の `toolArtifacts()`、同期CLI、enrich-localが同じ定数を使う。
同期CLIの道具専用出力とローカル調査の既定もこの場所。
公開URLは `<サイト>/world/data/enrich-queue.json`。後の管理画面も同じパスと
`manifest.enrichQueue` のハッシュ・件数を参照する。`/data/` に別の正本を作らない。
既にmanifestがある出力を道具専用CLIで書き換えるとハッシュが壊れるため拒否し、world-buildを使う。

全体は出力先内の作業フォルダーで組み立て、すべて成功してから `world/` を入れ替える。
前回の状態とファイルは公開URLまたは明示したローカルmanifestから読み、ソース管理へは入れない。
