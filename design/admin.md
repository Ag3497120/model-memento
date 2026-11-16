# アプリのお手入れ画面（M4）

実装は `lib/admin/**`、`web/js/admin/**`、`web/css/admin.css`、検証は `test/admin/**`。
この担当では `server.js`、`web/js/app.js`、公開用の生成物には変更していません。

## サーバーへの取り付け

既存の要求処理で、静的ファイルや他の API を処理する前に次を呼びます。
`url` は既存の `URL` オブジェクトです。処理した場合は `true` を返します。

```js
import { handleAdmin } from './lib/admin/routes.js';

if (await handleAdmin(req, res, url)) return;
```

設定を渡したい場合は、アプリ起動時に一度だけ作ります。
要求ごとに作ると確認用トークンが変わるため、一度作った関数を使い回してください。

```js
import { createAdminRunner } from './lib/admin/runner.js';
import { createAdminHandler } from './lib/admin/routes.js';

const runner = createAdminRunner({
  root: projectRoot,
  actor: configuredSubscriptionActor,
  newsActor: configuredLocalActor,
  page: configuredContributePage,
});
const admin = createAdminHandler({ runner, enabled: true });
// 要求の処理中: if (await admin(req, res, url)) return;
```

このルートは接続元が `127.0.0.1` / `::1` の場合だけ使えます。Host は
`localhost` / `127.0.0.1` / `[::1]` と任意のポートだけを許可します。
Origin があれば同じ場所であることを確認し、他サイトからの要求を拒否します。
転送ヘッダーでこの制限を解除する処理はありません。
書き込み要求には `GET /api/admin/status` で受け取った確認用トークンが必要です。
CI の設定がある環境では管理ジョブを開始しません。

## 画面への取り付け

手元のアプリが配るページだけで CSS を読み込み、ボタンの置き場を渡してください。
`/w/` の下で `web/` を配る現在のサーバーなら次の形です。

```html
<link rel="stylesheet" href="/w/css/admin.css">
```

```js
import { mountAdmin } from '/w/js/admin/index.js';

const adminScreen = await mountAdmin({ target: toolbar, localApp: true });
// 画面を破棄するとき: adminScreen.destroy();
```

`localApp` の既定値は `false` です。静的版では呼び出さないか、`false` のままにします。
その場合は通信もボタンの作成もしません。`true` でもループバックのホスト名と
管理 API の応答を確認するまでボタンを表示しません。
ニュース・履歴・差分・下書きはすべて文字として描画します。
ボタンの選択、ダイアログの開閉、下書きの最終確認に対応しています。
この担当では実ブラウザーの表示・フォーカス移動を実行検証していません。

## 管理設定

ブラウザーから渡せる実行指定は既定のジョブ ID だけです。
件数・保存先・モデル名・実行ファイル・コマンドをブラウザーから指定できません。
管理設定はサーバーを取り付ける側が設定します。

| 設定 | 既定値と用途 |
| --- | --- |
| `home` | `${MODEL_MEMENTO_HOME または ~/.model-memento}/admin` |
| `actor` | `MODEL_MEMENTO_ADMIN_ACTOR`。未設定なら AI が必要な処理は実行できません |
| `newsActor` | `MODEL_MEMENTO_ADMIN_NEWS_ACTOR`。省略時は `actor` |
| `page` | `MODEL_MEMENTO_CONTRIBUTE_URL`。寄稿先が未設定なら URL は `null` |
| `budget` | 5（1〜20）。小さな更新の取得回数 |
| `linkSample` | 20（1〜100）。リンク確認の対象件数 |
| `enrichMax` | 3（1〜20）。詳しく調べる件数 |
| `newsMax` | 10（1〜30）。要約する記事数 |
| `newsFile` | `.world-out/news/news.json` |
| `queueFile` | `.world-out/data/enrich-queue.json` |
| `linkStatusFiles` | `[".world-out/links-status.json"]` |
| `timeoutMs` | 30分。ジョブ全体の上限 |

`actor` は既存の `lib/backends.js` の `codex:<モデル名>` /
`claude-code:<モデル名>` / `ollama:<モデル名>` の形式です。
保守の修正提案には前の2種類だけを使います。ローカル推論でニュースを要約する場合は
`newsActor` に利用者が使える `ollama:<モデル名>` を設定します。
モデル名やログインの可否は自動で推測しません。実際の接続は **unverified**。
バックエンドは処理時に遅延読み込みし、画面を表示するために起動しません。

## 既定のジョブ

| ID | サーバー側で固定した処理 |
| --- | --- |
| `refresh-quick` | `node scripts/world-build.js --delta --budget 5 --out .world-out` → `node scripts/sync-upstream.js --targets tools --limit 5 --world-out .world-out` → `node scripts/news-fetch.js --out .world-out/news --budget 5` → `node scripts/check-links.js --artifact .world-out --input data/curated --input recipes/catalog --budget 20 --request-budget 100 --max-run-ms 120000` |
| `enrich` | `node scripts/enrich-local.js --max 3 --actor <管理設定> --queue .world-out/data/enrich-queue.json` |
| `summarize-news` | 取得済み記事を検証し、出典に到達できる見出しを AI で日本語の1〜2文にする |
| `maintain` | 下記の別作業フォルダーでの検査・修正提案 |
| `review-drafts` | 下書きの形・引用の対応・到達確認・権利の事前判定を保存 |
| `contribute` | 新しい確認結果を寄稿の形に検証し、ファイルを保存。投稿の画面を開く |

更新の4処理は順番に動き、一つの終了コードが0以外でも残りを確認します。
ファイルがない処理は `未導入`、全体は一部完了として記録します。
外部スクリプトの引数は、この作業中に存在したソースを読んで合わせました。
実際の通信を伴う実行は **unverified** です。

ニュース要約には本文を取得せず、見出しだけを渡します。`AI による要約` と
`summaryBasis: "headline"` を付け、出典を保持した結果を
`admin/news-summaries.json` に保存します。画面でも「見出しの要約」と表示します。
ニュース画面へ反映する場合、レビュー担当はこのファイルを読むか、
既存のニュース要求処理で元の記事一覧と突き合わせてください。
静的版へ自動公開する処理は含みません。

## AI による保守と取り込み

1. まず元のフォルダーが履歴のある git 作業フォルダーか調べます。
   この配布作業コピーのように git がなければ `未導入` で終えます。
2. `HEAD` を元に `memento/admin-<実行ID>` という新しい枝を作り、
   `admin/worktrees/<実行ID>` に別の作業フォルダーを作ります。
   `node_modules` があれば、そのコピーを別のフォルダーに用意します。インストールはしません。
3. 検査は最初から別の作業フォルダーで行います。元の未保存の変更は持ち込みません。
   `npm run check:contrib`、`node --test <test/, tests/, web/js/ の *.test.js / *.spec.js>`、
   `npm run build:web -- --offline`、`node scripts/check-rights.js web` を順番に実行します。
   検査用の `MODEL_MEMENTO_HOME` と npm のキャッシュも管理用の場所へ分けます。
4. 失敗があれば既存バックエンドに、失敗の記録と対象ファイルの全文を渡します。
   AI にはコマンドを渡さず、修正したいファイルの全文と説明を JSON として返させます。
   読めた追跡済みの `lib/`, `scripts/`, `test/`, `web/`, `design/` の
   テキストファイルだけが対象です。最大20ファイル・合計500 KB、提案は1回です。
5. 許可した別作業フォルダーだけに提案を適用し、同じ4検査をやり直します。
   全検査が通り、検査中に提案ファイルの内容が変わっていなければ、別の枝にローカル保存します。
   名前・メール設定はそのコマンドだけのものです。push はありません。
6. 履歴に説明・前後の検査結果・差分を表示します。人が「内容を確認して取り込む」を押した時だけ、
   元の枝・元の版が変わっていないこと、元の作業フォルダーに変更がないこと、
   提案の枝の版が変わっていないことを確認して `git merge --ff-only` します。
   この取り込みだけが、本人の作業ファイルを更新する操作です。

別の作業フォルダーを作る操作は git の管理情報を元のリポジトリにも書きますが、
検査・AI 修正の保存先は別の作業フォルダーです。枝と別フォルダーは消さずに残します。
保守用のプログラムは OS の隔離環境ではありません。既存のプロジェクトの検査コードは
信頼して実行する前提です。AI 自身はそのコードを実行する権限を持たず、データだけを返します。

この方式の git の動作の根拠は [git worktree](https://git-scm.com/docs/git-worktree) と
[git merge](https://git-scm.com/docs/git-merge) の公式説明です。
本担当で実際に git・npm・AI を起動したことはありません。偽物への呼び出しで経路を検証しました。

## 下書きと人の判断

`data/drafts/**` の JSON を対象にし、隣へ `<元のファイル名>.review.json` を書きます。
ファイルの内容の SHA-256 を保存し、内容が変わると以前の判定を使えません。
現在の詳しい調査処理の `memento.model-draft.v1` / `memento.design.v1` を既存の形の検証で確認します。
未知の形やニュース由来の未完成な指示書の下書きは、要修正の判定を付けます。
壊れた JSON も個別に判定し、他の下書きを止めません。

出典は公開 HTTPS ページだけを、DNS で確認した接続先に固定して HEAD で確認します。
リダイレクト先も再確認し、本文は保存しません。ジョブごとに最大80回、同じホストには1秒以上空けます。
HEAD を受け付けないページ、検索条件付き URL、非公開の宛先、容量や時間の上限を超える場合は
到達確認を **unverified** とします。到達確認だけで記述の正しさや権利を確定しません。
画像・ロゴ・長い原文・持ち込みコードについては、形の確認と AI の判定に加えて人の確認が必要です。

画面で下書きと出典を開き、内容と権利を確認した印を付けると採用できます。
API でも内容のハッシュを再確認します。採用時は再度到達確認を行い、
`data/curated/admin/<識別ID>-<内容のハッシュ先頭>.json` に上書きせず保存し、元の下書きを取り除きます。
採用の控えを `admin/accepted/` に残します。見送る場合は原本を残して判定に記録します。
レビュー担当は公開用の読み込みに `data/curated/admin/` を追加してください。
同じユーザー権限を持つ別プロセスが保存先の親を差し替える操作までを防ぐ OS 隔離ではありません。

## 寄稿ファイル

実装時点の `lib/contrib/schema.js` は1ファイルに1件の
`memento.contribution.v1` を受け付けます。独自の複数件の形式は作っていません。
リンクの結果を既存の形式に写し、採用済みのモデル下書きから名前・文脈の長さを
出典の結び付きとともに、画面の下書きから配置・色・書体名・操作を取り出します。
出典数や安全性を含む既存の `validateContribution()` に通るものだけを保存します。
型に写せない項目や出典の条件を満たさない項目は件数を記録して見送ります。
端末内のパス、履歴、AI の接続設定、採用の控え、本文は寄稿へ入れません。

`admin/contributions/<実行ID>-<内容のハッシュ先頭>.json` を用意し、
ダウンロード時の名前は既存の受け付け口に合う `contribution.json` にします。
「新しい」は前回ファイルにまとめた時点からの差分です。自動アップロードはしません。
以前のファイルは履歴から保存し直せます。再度まとめたことを投稿済みとは扱いません。

寄稿ボタンのクリックで新しいタブを確保し、結果の用意ができたら、設定された
リポジトリの投稿画面へ移動します。ポップアップが拒否された場合もリンクを表示します。
タイトルだけを埋めます。現在の寄稿の受け付け口は添付リンクだけの本文を要求するため、
説明文は本文へ入れません。人が1ファイルずつ添付して投稿します。
実際のリポジトリの URL、投稿テンプレート、Discussion のカテゴリは **unverified**。
レビュー担当が実際の `page` を設定し、添付の流れを確認してください。

## 要求の一覧

| 方法・場所（すべて `/api/admin/` の下） | 内容 |
| --- | --- |
| `GET status` | `{ localApp: true, token, jobs }` |
| `GET jobs` | `{ jobs }`。履歴一覧 |
| `POST jobs` | `{ job: <既定ID> }`。202 と `{ job }` |
| `GET jobs/<id>` | `{ job }`。最近500イベントを含む |
| `GET jobs/<id>/events` | SSE。`log`, `state`。`Last-Event-ID` または `?after=` から再生 |
| `POST jobs/<id>/cancel` | `{}`。子プロセスのグループへ終了要求、必要なら強制終了 |
| `POST jobs/<id>/merge` | `{}`。検査済みの保存版を取り込む |
| `GET drafts` | `{ drafts }`。内容に合う判定だけを返す |
| `GET drafts/<id>` | `{ draft, hash }` |
| `POST drafts/<id>/decision` | `{ decision: "accept" または "reject", hash }` |
| `GET contributions/<id>` | `contribution.json` として保存 |

POST は `Content-Type: application/json` と `X-Memento-Admin: <token>` が必要です。
余分な項目や4 KBを超える本文を拒否します。同種のジョブはアプリ間でも重ねて実行できません。
各ジョブの子プロセスの出力は2 MiBまで、履歴は直近500イベント、ログ送出は最大2000行です。
ログの書き込みをまとめて、短時間に大量の行が出ても保存待ちが際限なく増えないようにします。
履歴は最終状態の保存が終わってから処理を解放します。
死んだプロセスの履歴は再起動時に中断へ変えます。所有者が確認できないロックは自動削除しません。
保存先を変えた場合や手動でロックを整理する場合は、まず実行中のアプリを確認してください。

## 実行した検証と未確認

この担当が実行したコマンドは `node --test test/admin/*.test.js`。
28件合格・0件失敗（最終の実行）。偽物の Node スクリプト、偽物の git/npm/AI、
HTTP 要求・応答のオブジェクト、偽物の DNS/HTTPS を使い、実サーバーは起動しませんでした。
実際の履歴を保存する場所も `test/admin/.fixture-*` の中だけに作り、終了時に消しました。

実ブラウザー、実 AI、実 git worktree / merge、他担当の更新スクリプトの通信、
プロジェクト全体の検査、公開用ビルド、権利検査の実行は **unverified** です。
これらをこの作業コピーで実行すると担当外の生成物やプロセスに触れるため、実行していません。
ファイルの取り込み・ニュース表示・サーバーと画面への取り付けは上記の取り付け手順を使ってください。
