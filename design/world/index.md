# 世界の一覧の統合（W1）

確認日：2026-11-15。形式と状態の正本は [共通の約束](../../lib/world/CONTRACT.md)。
この文書の測定は合成データであり、実サービスの全件取得ではない。

## 実行

```sh
node scripts/world-build.js --full --budget 20
node scripts/world-build.js --delta --budget 20 --state .world-out/world/manifest.json
node scripts/world-build.js --full --budget 20 --state .world-out/world/manifest.json
node --test test/world/*.test.js test/recipes/*.test.js
WORLD_BENCHMARK=1 node --max-old-space-size=1024 --test --test-name-pattern=4400000 test/world/index.test.js
```

既定は `--delta --budget 20 --out .world-out`。前回の状態は明示して渡す。
公開manifestのURLも指定でき、旧ファイルはハッシュを検証しながら順に読む。
作業フォルダーで全体を組み立て、すべて成功してから `world/` を入れ替える。
処理を続けられないエラー、壊れた旧ファイル、容量超過では前回の公開物を残す。
予算不足などで未完了の状態を正常に返した場合は、取得できた範囲と前回の記録を公開する。
公開サイトや設定の変更は行わない。同じ出力先への同時実行には対応しない。

## 容量と読み込み

[GitHubの現在の説明](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)は、
公開したPagesサイトを1 GB以下としている。索引の独自上限は650,000,000バイト。
残り350 MB以上を既存サイトと成長の余裕に使う。索引はmanifest込みで確認し、超えると公開物の入替えを止める。
サイト全体と梱包の確認は既存の権利・容量検査の担当。

容量を減らした箇所は次の通り。

1. URLを登録先とIDから組み立てる。標準形と違う出典URLは保持する。
2. 保存時だけキーを短くし、用途は固定の番号にする。IDから分かる名前と作り手、未知のnullを省く。
3. 作り手の一覧はIDを複製せず、分割先と0始まりの行番号をまとめて保存する。さらに近い行番号の差にしてgzipが縮めやすくする。
4. 登録先とIDで並べた日別の新着にもgzipを使う。モデル、作り手、主な記録もgzip。

読み込み時には元の論理レコードに戻す。用途の辞書とURL規則はクライアントとmanifestにあり、
追加の辞書要求はない。まだ一覧を読んでいない状態のID検索は **manifest + モデル分割ファイル1個の2要求**。
作り手の一覧は必要な分割ファイルを追加で読む。ページ順は分割先と行番号の順。
IDが新規かの判定は、新旧を正確なID順に並べて照合する。確率的な見落としは使わない。

新着の出力は `world/new/<日付>.json.gz`。旧 `.json` も入力として読める。
ブラウザーは `iterateArrivals()` で順次展開し、`newArrivals()` は既定120件で止める。
巨大な新着を丸ごとCache APIに複製しない。HTTP側で展開済みの応答も読める。

[Compression標準](https://compression.spec.whatwg.org/#supported-formats)にはBrotliが追加されている。
ただし、この作業環境で次を実行した結果は `v22.17.0 gzip supported / v22.17.0 brotli TypeError`。
実ブラウザーの対応は測定していないためgzipを採用した。Brotliがどの環境でも使えないという主張ではない。

```js
for (const format of ['gzip', 'brotli']) {
  try { new DecompressionStream(format); console.log(process.version, format, 'supported'); }
  catch (error) { console.log(process.version, format, error.name); }
}
```

## 状態と成人向けへの変更

すべてのモデル登録先と道具の `result.state` に `memento.world-progress.v1` を使う。
共通項目は `registry / complete / excludedNsfw`。登録先固有の位置と待機時刻を同じ状態に残す。
`done / nsfw / nsfwCount / state:null` は旧入力の移行だけで対応する。
完了したモデルの状態は次の差分の前に捨てる。
未完了の全件巡回はdeltaでも次週のfullでも同じページから続け、完了時に巡回開始時刻を確認済み時刻にする。
次のdeltaはその開始時刻の1日前から重ねる。完了日まで時刻を進めて取りこぼすことを避ける。

成人向けになったIDは、各登録先が `{remove:{r,id,reason:'nsfw'}}` を一時的に返す。
名前や内容は含めず、ビルダーはモデル、作り手、主な記録、過去を含む新着から取り除く。
行番号は毎回作り直すので、作り手の参照もずれない。
`nsfwThisRun` は今回観測した数で、再開した状態の累計との差を取り、削除通知と二重計上しない。
登録先が返さなかったモデルの世界全体の除外数は `null`。

Civitaiは `nsfw=true` で変更後の区分も受け取り、安全と確認できたレコードだけを通常出力する。
[公式の引数説明](https://github.com/civitai/civitai-developer-docs/blob/main/site/reference/models.md)では
`false` は成人向けを含めず、`true` は含める。地域によっては無視される条件もある。
返されない変更や今回の予算外のページの変更まで、同じ実行で反映できる保証はない。

Civitaiの任意の認証情報は環境変数 **`CIVITAI_TOKEN`** からだけ渡す。
値はHTTPヘッダーにだけ使い、保存しない。プログラムからのbuildでも同じ扱い。
[認証資料](https://github.com/civitai/civitai-developer-docs/blob/main/site/guide/authentication.md)は匿名で応答する一覧も説明するが、
[規約§11.4](https://raw.githubusercontent.com/civitai/civitai/main/src/static-content/tos.md)は公式の自動接続にも本人の有効な認証情報を条件にする。
このため未設定ではモデル一覧・件数のAPI要求は0回、総数はnull、状態は認証待ちとする。

## 調査待ちの接続

唯一の場所は `world/data/enrich-queue.json`。
定数は `lib/world/queue.js`。ビルダー、発見用の `toolArtifacts()`、同期CLI、enrich-localで共用する。
ローカルの既定は `.world-out/world/data/enrich-queue.json`、公開先は `<サイト>/world/data/enrich-queue.json`。
後の管理画面も同じ場所と `manifest.enrichQueue` を参照する。
`tools-state.json` には進み具合だけを書き、調査待ちを複製しない。旧形式の埋込みqueueは移行時に読める。
道具専用の同期CLIは既存manifestを壊さないよう、その出力先にmanifestがあると止まる。
既存索引の更新にはworld-buildを使う。

## 440万件の段階別測定

10,000の作り手、4,400,000の異なるID、64件に1件の主な記録（68,750件）。
Node v22.17.0 / macOS darwin / arm64。禁止するfetchを注入し、通信要求は0回。
各段階は入力生成から並べ替え、全出力、入替えまでのビルドを実行する。
後の段階は前の段階の変更をすべて含む。圧縮だけの推計ではない。

```sh
WORLD_BENCHMARK=1 WORLD_BENCHMARK_STAGE=urls node --max-old-space-size=1024 --test --test-name-pattern=4400000 test/world/index.test.js
WORLD_BENCHMARK=1 WORLD_BENCHMARK_STAGE=compact node --max-old-space-size=1024 --test --test-name-pattern=4400000 test/world/index.test.js
WORLD_BENCHMARK=1 WORLD_BENCHMARK_STAGE=offsets node --max-old-space-size=1024 --test --test-name-pattern=4400000 test/world/index.test.js
WORLD_BENCHMARK=1 WORLD_BENCHMARK_STAGE=deltas node --max-old-space-size=1024 --test --test-name-pattern=4400000 test/world/index.test.js
WORLD_BENCHMARK=1 node --max-old-space-size=1024 --test --test-name-pattern=4400000 test/world/index.test.js
```

基準の再測定は変更前に最後のコマンドで実施した。
変更後は `WORLD_BENCHMARK_STAGE=baseline` で同じ保存形式を選べる。
比較用の旧形式だけは650 MB制限をテスト内で緩める。本番の既定では緩めない。

<!-- W1_BENCHMARK_TABLE_START -->
| 段階 | モデルgzip | 作り手gzip | 新着 | 主な記録gzip | manifest | 公開合計 bytes | 時間 秒 | 最大RSS bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 基準（変更前） | 60,834,107 | 9,906,711 | 1,063,334,802 | 1,158,505 | 156,975 | 1,135,391,100 | 370.302 | 186,155,008 |
| ＋ URLの復元 | 45,251,281 | 9,906,711 | 808,623,202 | 848,665 | 157,595 | 864,787,454 | 365.300 | 191,758,336 |
| ＋ 短いキー・用途の番号・重複項目の省略 | 25,173,488 | 9,906,711 | 523,111,602 | 478,692 | 157,338 | 558,827,831 | 382.052 | 190,496,768 |
| ＋ 作り手を分割先・行番号で参照 | 25,173,488 | 12,791,504 | 523,111,602 | 478,692 | 157,344 | 561,712,630 | 383.429 | 211,501,056 |
| ＋ 作り手の行番号を差で保存 | 25,173,488 | 8,224,649 | 523,111,602 | 478,692 | 157,259 | 557,145,690 | 388.503 | 206,749,696 |
| ＋ 新着をgzip（最終） | 25,173,488 | 8,224,649 | 11,713,333 | 478,692 | 157,255 | **45,747,417** | 373.028 | 207,929,344 |
<!-- W1_BENCHMARK_TABLE_END -->

全6段階がそれぞれ終了0、`tests 1 / pass 1 / fail 0 / skipped 0`。
最終の公開物は **45,747,417バイト（45.75 MB）**、基準から約95.97%減。
索引の650 MB上限まで604,252,583バイトの余裕がある。
最終フォルダーの515ファイルを標準ライブラリで別に合算し、manifestの合計と一致した。
全サイトの1 GB上限とは区別する。実データの圧縮率の保証ではない。

最終のクライアント確認は、NodeのcreateReadStreamを偽のfetchにつなぎ、サーバーを起動せず実施。
先頭・末尾のID、作り手、少数の新着、主な記録の検索の5確認が成功した。
最初のID検索はmanifest込みで **2 fetch**。
新着は3件で止め、11,713,333バイトの圧縮ファイルから読んだ量は **131,072バイト**。
読み込み確認も含めた最大RSSは225,722,368バイト。表のRSSはビルド時の値。
最終TAP全体は373858.51575 ms。

行番号をそのまま保存した段階は、IDをgzipにした段階より2,884,793バイト増えた。
この実測を受けて、次の段階では近い行番号の差をまとめる形式にした。

基準の再測定：ビルド370.302272667秒、最大RSS186,155,008バイト、公開物1,135,391,100バイト。
`tests 1 / pass 1 / fail 0 / skipped 0`、TAP全体372466.605209 ms、終了0。
元のI3測定の357.998288875秒と容量は一致する。時間は同じ機械でも変動する。

出力は `.world-out/benchmark-<段階>/world/`。測定ログは `.world-out/w1-*.log`。
全件をMapに置かず、小さな並べ替えファイルと最大32本の段階的な結合を使う。
一時ディスクの最大使用量、実データの分布、全登録先を合わせた実サービスの取得時間・転送量は `unverified`。

## 検証とレビューで残る点

`test/world/integration.test.js` は、2要求のID検索、行番号の再構築、負の差や飛び飛びの行を含む作り手のページ送り、週をまたぐfullの再開、
完了後のdelta、4種類の実モジュールでの後日の成人向け判定、旧形式からの移行、容量超過時の原本保持、
調査待ちからローカルの試行までを、偽のHTTP応答だけで確認する。
全テストと各段階の結果は下の最終記録を参照。

担当外のファイルは変更していない。次はレビューで必要な接続変更。

- `.github/workflows/world-pages.yml:192` は今も調査待ちを `/data/enrich-queue.json` に複製している。
  コピー行を削除し、唯一の公開先 `/world/data/enrich-queue.json` に揃える必要がある。
- `web/js/world/screen.js` はクライアントの順次読み込みを使えるが、直接ダウンロードのリンクと代替の読取りは旧 `.json`。
  `manifest.new` の `path` を使う変更が必要。
- `lib/admin/runner.js:41` の既定は `.world-out/data/enrich-queue.json`。管理画面を接続するときは
  `.world-out/world/data/enrich-queue.json` に変更するか、同じ場所をqueueFile設定で指定する必要がある。
- 現在のCIはCivitaiとModelScope等を明示的に停止している。任意トークン対応だけでは許可リストは変えない。
  実API、資格、規約をレビューした後にCI担当が判断する。

実ブラウザー、認証後の実Civitai API、Pagesへの公開、GitHub Actions、キャッシュ復元は実行していない。
登録先が通知しないNSFW変更、削除済み・非公開の全面照合、ModelScopeの公開範囲を超えた全件収録、
models.devデータの大量再配布時の帰属表示の最終判断は `unverified`。

## 実行記録

```text
node --test test/world/*.test.js test/recipes/*.test.js
終了0 / tests 360 / pass 359 / fail 0 / skipped 1 / duration_ms 7108.270459
```

省略した1件は440万件のベンチマークで、上表の専用コマンドで別に実行する。
すべての登録先の応答と時計は偽物。レシピ側もプロジェクトのNodeの試験用処理だけを使い、
実際のAIやハーネス、サーバー、アプリは起動していない。

```text
node scripts/sync-upstream.js --targets tools --dry-run --limit 0 --world-out .world-out/w1-tools-preview
終了0 / tools.status ok / requests.total 0 / github 0 / npm 0 / pypi 0 / pending 24 / unverified 11

node scripts/enrich-local.js --help
終了0 / 既定の一覧 .world-out/world/data/enrich-queue.json を表示

node --check scripts/world-build.js
node --check scripts/sync-upstream.js
node --check scripts/enrich-local.js
node --check web/js/world/index-client.js
いずれも終了0、出力なし
```

コードの変更範囲は `lib/world/{codec,progress,queue}.js`、全7登録先、`lib/world/tools/index.js`、
`lib/world/CONTRACT.md`、3本のCLI（world-build / sync-upstream / enrich-local）、
`web/js/world/index-client.js`、worldのindex・integration・registries-1・registries-2試験、
`design/world/` の6文書。レシピや他担当の実装は変更していない。
