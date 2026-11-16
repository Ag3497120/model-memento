# AP1 アプリの統合とレビューへの引き継ぎ

2026-11-15。実装とオフライン確認を行いました。全体テストには、担当外の古い期待値による失敗が2件残っています。公開、インストール、外部の AI の実行は行っていません。

## 項目ごとの状態

| 項目 | 状態 | 実装・確認 |
| --- | --- | --- |
| 1 一つのアプリ | done | `/` と `/w/` は `web/`、`/legacy/` は旧画面。`/api/status` の `app: true` と機能一覧でアプリの操作を有効にする。HTTP スモークで確認 |
| 2 各部品の接続 | done | 人物像の取得と再現会話、利用先、ニュース、管理、寄稿の閲覧、更新番号を接続。管理は接続元・Host・Origin・起動ごとのトークンを検査 |
| 3 メニュー | done | 登録口に「探す」「組み合わせる」「ニュース」「世界のモデル」「管理」「設定」。組み合わせは既存の常設ボタンを維持。管理はアプリ判定とページのトークンがある場合にだけ登録 |
| 4 モデルのページ | done | 記録の段階、事実と出典、話し方の根拠、再現である説明、会話への入口、本物の利用先と確認日、試用ページの動作状態、更新番号。文書を模したテストで表示を確認 |
| 5 利用報告と成功率 | done | `recipe-run` を追加。受理済み入力から `web/data/recipe-stats.json` を生成し、レシピのカードへ表示。120件の合成報告で「成功 8 割・利用 120 件」を確認。実際の利用実績を120件として載せたわけではない |
| 6 公開手順 | done（設定） | 寄稿受付、更新番号と巻き戻し、ニュース取得、リンク確認を `.github/workflows/` に接続。埋め込まれた Node プログラムの構文を確認。Actions 上の実行は unverified |
| 7 全体確認 | partly | 追加の統合テスト9件は成功。全体は559件中556件成功・2件失敗・1件スキップ。オフラインビルドは生成物をメモリーへ保持する保護付きで成功 |
| 8 軽量配布 | partly | 配布対象の許可リスト、公開データの取得とキャッシュ、5 MB の検査を追加。既存の `private: true` と `bin` 未設定は変更していないため、npm への公開と通常の npx 起動の設定はレビュー担当の作業 |
| 9 引き継ぎ修正 | done（接続箇所） | キューの複製を削除、管理の既定パスを修正、新着の `.json.gz` を使用、画面監査の案内終了とメニュー操作を修正。世界のテストは130件中129件成功・1件スキップ。旧パスを期待する管理テストの更新は担当外 |

## 起動とデータ

公開サイトを指定する設定は `MODEL_MEMENTO_SITE_URL` です。末尾に `/world` を付けない、HTTPS のサイト URL を指定します。既定値は `server.js` の `DEFAULT_SITE_URL` 一か所に置きました。

現在の既定値 `https://ag3497120.github.io/model-memento/` は **unverified** です。所有者の公開先は作業コピー内で確認できません。配布前に実際のサイトへ置き換えるか、環境変数を設定してください。

画面のコードは配布物から読み、`data/`、`world/`、`links-status.json` の要求は公開サイトから必要なファイルだけを取得します。公開先ごとのキャッシュは通常 `~/.model-memento/cache/published/<公開先を区別する値>/` です。テストではプロジェクト内の保存先へ変更しました。通常の確認間隔は1時間で、通信できないときは保存済みの内容を返します。世界の分割ファイルは、一覧に書かれた版を別々に保存します。新しい一覧と古い分割ファイルを混ぜません。重み、画像、動画、フォントは取得しません。

配布物には `web/data`、`world`、`.work`、`site`、`data/curated`、レシピの大量データを含めません。`scripts/check-package-size.js` は圧縮後と展開後をそれぞれ5,000,000バイト以下に制限し、禁止したデータが配布物に入っていないかも確認します。この数値に npm が別に取得する依存関係は含みません。

公開用の小さなデータは `lib/contrib/build.js` が作ります。人物像、実行に必要なレシピの情報、利用先の案内、寄稿の公開用入力と協力者一覧、成功率が対象です。`scripts/build-web.js` の最後から一行で接続しました。レシピの実行に必要な設定本文は、画面表示用の短い一覧と別に `data/recipe-runtime.json` へ出します。アプリは実行用の部品を配布物から読み、設定はこの公開データと組み合わせます。

## HTTP の入口と管理のトークン

| 入口 | 用途 |
| --- | --- |
| `GET /api/status` | `app`、機能一覧、演じ手の候補 |
| `GET /api/persona?id=…&r=…` | 人物像。登録先は任意 |
| `POST /api/persona/play` | `id`、任意の `r`、選んだ `actor`、会話。既存の再現エンジンを使用 |
| `GET /api/links?id=…&r=…` | 本物の利用先、試用ページ、公開済みのリンク確認結果 |
| `GET /api/model/links` | 上と同じ処理の別名 |
| `GET /api/news`、`GET /api/news/sources` | ニュースと情報源。HEAD にも対応 |
| `/api/admin/…` | 既存の管理ハンドラー。読み取りにも起動ごとの確認が必要 |
| `GET /api/contrib/credits`、`GET /contributors` | 掲載を希望した協力者だけを表示 |
| `GET /api/admin/contrib`、`GET /admin/contributions` | 非公開の確認待ち一覧。管理と同じ制限 |
| `GET /api/patch` | 更新番号 |
| `/api/recipes/…` | 既存の目録・候補・計画・作成・入手先を維持 |

管理のトークンはサーバーを作るたびに変わります。手元の要求にだけ HTML の `#memento-bootstrap` へ埋め込みます。ページは最初に通常の状態 API も確認します。管理の要求にはこのトークンを付けます。実行記録の継続受信と保存用リンクでは、同じページで設定した `HttpOnly; SameSite=Strict` の Cookie を読み取り専用の確認に使います。書き込みには明示したヘッダーが必要です。ページの保存・別サイトからの埋め込みも制限します。

Host、Origin、接続元の確認は `lib/admin/routes.js` の既存関数を使用します。外国の Origin、外国の Host、別サイトからの要求、トークンなしを実際の HTTP 要求で拒否したことを確認しました。画面へ埋め込んだトークンと既存ハンドラーのトークンを一致させるため、ハンドラーに一行の接続用変更を加えました。

確認待ちの寄稿は公開サイトへ置きません。アプリの既定の読み込み先は `~/.model-memento/cache/contributions/review-queue.json`、変更する設定は `MODEL_MEMENTO_CONTRIB_DIR` です。管理者が非公開の保存物からこのファイルを用意していない場合は503で応答します。管理で作ったニュースの見出し要約は、元の記事の ID・URL・見出しが一致するときだけニュースへ重ねます。

## 利用報告の形

共通の `schema`、`kind`、個人情報などを含めない宣言に加え、次の5項目だけを受け付けます。表示名、質問文、会話、ログ、ファイル名、自由記述を追加すると拒否します。

```json
{
  "schema": "memento.contribution.v1",
  "kind": "recipe-run",
  "declarations": {
    "noPersonalData": true,
    "ownWords": true,
    "noRestrictedAssets": true
  },
  "recipeId": "example-recipe",
  "harnessIds": ["codex"],
  "outcome": "ok",
  "failingStepClass": null,
  "appPatchId": "26.1"
}
```

結果は `ok`、`partial`、`failed`。失敗の種類は `setup`、`authentication`、`connection`、`handoff`、`execution`、`verification`、`other` の固定一覧です。成功時は種類を `null` にし、一部完了と失敗では一覧から選びます。同じ寄稿者・レシピ・道具の組・更新番号の重複報告は一件として扱い、編集を反映します。公開する集計には利用者の識別情報を含めません。

成功は `ok` の件数を全報告数で割り、1割単位に丸めます。`partial` と `failed` も分母に数えます。20件未満、集計なし、不正な集計は「まだ少ないため表示しません」。これは利用者の自己申告であることを表示します。既存の寄稿状態には200投稿という上限があり、この変更では上限を増やしていません。

## 公開の設定

`contrib-intake.yml` は提示された受付手順を設置し、受付が成功したら共通の公開手順へ接続します。照合用の秘密 `MEMENTO_CONTRIB_KEY` と、初回の状態作成を許す設定は元の `design/contrib.md` と同じです。受付と返信と公開で権限を分けています。受付は既定ブランチのコードだけを読みます。本文をコマンドにしません。

公開する際は、非公開の寄稿状態をもう一度検査して、リンクの期限と出典も再確認します。過去に受け付けた寄稿があるのに照合用の状態がなくなった場合は停止します。公開用入力だけから非公開の状態を作り直しません。

`pages.yml` と `auto-sync.yml` は共通の `world-pages.yml` を呼びます。毎日の世界の更新と同じ処理でニュースとリンクも確認します。前回公開されたリンク結果とニュースの状態を引き継ぎ、生成物だけを Pages と版ごとの保存先へ渡します。ソースへの追加・保存・送信は行いません。調査待ちの正本は `world/data/enrich-queue.json` 一つです。更新番号、版の保存、直近5版の保持、巻き戻しは提示された `design/patch-workflow.md` を適用しました。

Actions 上の公開、Release の保存・削除、巻き戻し、秘密の設定、待機列、キャッシュの復元、実サイトとの通信は **unverified** です。ローカルでは YAML 全体の専用検査器を実行していません。Node プログラムの構文と、必要な接続・ソースへの保存操作がないことだけを追加テストで確認しました。

## 実行した確認

| コマンド | 実際の結果 |
| --- | --- |
| `node --test --test-reporter=spec test/app/*.test.js` | 終了0。9件すべて成功 |
| `npm test` | 終了1。559件、成功556、失敗2、スキップ1 |
| `node --test --test-reporter=spec test/world/*.test.js` | 終了0。130件、成功129、失敗0、スキップ1 |
| `NODE_OPTIONS='--import=./test/app/build-guard.js' npm run build:web -- --offline` | 終了0。90 models、1638 closed、5394 tools、22470 versions、`catalogFallback: true`。`AP1 output guard: 937 generated files held in memory; no build files written.` |
| `npm run check:package-size` | 終了0。最終数値は下記。`npm pack --dry-run --json --ignore-scripts` を内部で実行 |
| `node --check` を `server.js`、`web/js/app.js`、`web/js/nav.js`、新しい画面部品、`scripts/check-web.js` へ実行 | 終了0、構文エラーなし |

ビルドの保護は、共有コピーの担当外の生成物を変更しないためです。実際のビルドを走らせ、書き込みとコピーだけをメモリーへ保持し、読み戻しにも対応しました。通信は失敗させています。これは生成処理の確認であり、生成した937ファイルをディスクへ配備した検証ではありません。`test/app/build.test.js` では、許可されたテスト用フォルダーに実際に公開用データを書いて読み戻し、片付ける確認も行っています。

HTTP スモークは `server.js` の `createMementoServer()` をランダムなループバックのポートで起動し、終了時に閉じます。外部の実行ファイルの探索は止め、人物像の資料、ニュース、リンク、演じ手をオフラインの代用品へ置き換えました。実在する AI、ブラウザー、アプリ、別のエージェントは起動していません。試用ページの `RUNNING` も合成の返答です。

## 担当外へ加えた接続の変更

次の各変更を除き、他の担当の実装とテストは変更していません。

| ファイル | 一行の接続または明示された引き継ぎ修正 |
| --- | --- |
| `lib/admin/routes.js` | 起動側で作ったトークンを既存ハンドラーが使えるように一行変更 |
| `lib/admin/runner.js` | 項目9で指定された既定のキューを `.world-out/world/data/enrich-queue.json` へ変更 |
| `lib/recipes/guide.js` | 呼び出し元の検査済みの目録を使う一行変更。配布物に設定データを含めないため必要 |
| `web/js/recipes/combine.js` | 接続用 import 一行、状態 API による判定一行、成功率の表示部品を挿す一行 |
| `web/js/world/screen.js` | モデル画面の import 一行と入口一行。項目9で指定された新着の取得先と保存先リンクをそれぞれ `.json.gz` に変更 |
| `scripts/build-web.js` | 公開用データの生成部品を呼ぶ一行 |
| `scripts/check-web.js` | 項目9の明示指定。初回案内を閉じ、メニューを開いて出典を押し、再びメニューを開いて状態を確認する |
| `scripts/check-package-size.js` | 項目8の明示指定による新規ファイル |

`package.json` は scripts と、項目8で明示された `files` だけを変更しました。依存関係、版、`private`、公開用の起動口は変更していません。

通常の担当ファイルは `server.js`、`package.json`、`web/js/app.js`、`web/js/nav.js`、`web/js/model/{index,runtime}.js`、`lib/contrib/{schema,intake,artifacts,recipe-stats,build}.js`、`.github/workflows/{ci,pages,auto-sync,world-pages,contrib-intake}.yml`、`test/app/**`、この文書です。

## レビュー担当に残る変更と未確認

1. **担当外のテスト2件。** `test/admin/runner.test.js:36` の期待するキューを新しいパスへ変更してください。`test/patch/workflow.test.js:6` は「未適用のワークフローへ差分を当てられる」ことを調べる旧テストです。適用済みの設定を検査する形に更新が必要です。現在は `diff context drift in .github/workflows/pages.yml` で失敗します。追加した `test/app/workflows.test.js` は実際に設置した設定を検査します。失敗を隠す除外やスキップは追加していません。
2. **公開先の確定。** 実際のサイト URL と、生成した公開データがそこへ載ることは unverified です。既定 URL を確認してください。
3. **npm / npx の起動口。** 既存の `private: true` と `bin` 未設定をどう扱うかはレビュー担当に残します。通常の `npx model-memento` の起動は未実装・未実行です。配布容量はコードの梱包だけを検査しています。
4. **公開と実画面。** Actions、Pages、巻き戻し、ブラウザーでの配置とキーボード操作、実際の AI による会話、実際に動作中の試用ページ、管理の外部更新処理は unverified です。画面監査のコードは直しましたが、ブラウザーを起動する `npm run check:web` は実行していません。
5. **実行環境。** 手元の Node は `v22.17.0`、npm は `10.9.2`。Node 20 での実行は unverified です。インストール、コミット、push、ロゴ・画像・フォントの追加、他の作業者の設定の変更は行っていません。

配布サイズの最終結果は `package: 766665 bytes packed; 2654504 bytes unpacked; 214 files; limit 5000000 bytes`。終了0でした。

## X1 追記：テストの更新とコマンドからの起動

2026-11-16。この追記は、上記の「担当外のテスト2件」「bin 未設定」と配布サイズについての最新の結果です。

| 項目 | 状態 | 内容 |
| --- | --- | --- |
| 1 古い期待値の修正 | partly（期待値修正済み、全体は終了1） | 管理テストは `.world-out/world/data/enrich-queue.json` を正確に比較する。公開手順のテストは設置済みの3ファイルを読み、入力の既定値、同時公開の防止、通常公開と巻き戻しの条件、保存から公開までの順番、公開成功後の保存状態の確定と整理、埋め込まれた Node プログラムの構文を確認する |
| 2 コマンドの入口 | partly（起動口実装済み、実際の待ち受けは unverified） | `bin/model-memento.js` と `package.json` の `bin` を追加。説明と版の表示は、アプリ本体を読み込まずに終了する。別のフォルダーからリンクを経由する起動も確認した |
| 配布サイズ | done | 圧縮後も展開後も 5,000,000 バイト未満 |

### 起動の使い方

公開後に使うコマンドの例です。この作業では、インストールや npm への公開は実行していません。

```sh
npx model-memento
npx model-memento --port 5177 --open
npx model-memento --help
npx model-memento --version

npm i -g model-memento
model-memento
```

番号を省いた場合と `--port 0` の場合は、空いているポート（接続先の番号）を選ぶ実装です。待ち受け先はこの端末の `127.0.0.1` に固定し、選ばれた番号を含む URL を表示します。番号を指定して使用中だった場合は、日本語で説明して終了1になります。空いている番号の自動選択は [Node の待ち受けの仕様](https://nodejs.org/api/net.html#serverlistenport-host-backlog-callback)に基づきます。

ブラウザーを開くのは `--open` を付けたときです。開けなかった場合は、表示した URL を貼り付ける案内を出します。Ctrl+C または終了の合図を受けると新しい接続の受付を閉じ、処理中の接続には5秒待ちます。5秒経過、または二度目の Ctrl+C で残りの接続を閉じます。通信を使わない代用品と、実際の Node プロセスへの Ctrl+C で終了処理を確認しました。

公開データの取得先は、既存の `server.js` の `DEFAULT_SITE_URL` と `MODEL_MEMENTO_SITE_URL` をそのまま使います。定数の `https://ag3497120.github.io/model-memento/` は引き続き **unverified** です。**配布前に、所有者が確認した HTTPS のサイト URL を `MODEL_MEMENTO_SITE_URL` に設定するか、担当者が既定値を確定する必要があります。** 末尾に `/world` を付けません。公開済みデータを実際に取得できることも確認してください。

コマンドの入口を指定する `bin` の形は [npm の説明](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#bin)に合わせました。現在の `private: true` は npm への公開を止める設定です。[npm の説明](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#private)。X1 の変更許可は `package.json` の `bin/files/scripts` に限られるため、この設定の解除はレビュー担当に残ります。公開先の URL も未確定なので、現時点で通常の `npx model-memento` が公開済みのこの実装を取得できるとは確認していません。

### 実行した確認と制限

| コマンド | 実際の結果 |
| --- | --- |
| `node --test test/admin/cli.test.js test/admin/runner.test.js test/patch/workflow.test.js` | 終了0。18件成功、失敗0、保留0。うち新しい起動の検査は9件 |
| `npm test` | 終了1。568件中566件成功、失敗1、既存の保留1件。残る失敗は `test/app/smoke.test.js` の `listen EPERM: operation not permitted 127.0.0.1`。この環境の実行制限によるもので、検査の除外や保留の追加はしていない |
| `npm run check:package-size` | 終了0。`package: 768782 bytes packed; 2660877 bytes unpacked; 215 files; limit 5000000 bytes` |
| `node --check bin/model-memento.js` | 終了0。構文エラーなし |
| `node bin/model-memento.js --version` | 終了0。`0.1.0` |
| `node bin/model-memento.js --help` | 終了0。日本語の説明、4つの指定、公開先の設定を表示 |
| `node --import <test/admin 内の一時的な保護用ファイル> bin/model-memento.js --port 0` | 終了1。「接続の待ち受けが許可されていません。端末の実行制限を確認してください。」。保護用ファイルは、外部の実行ファイルの探索と通信を止めるために用意し、確認後に削除した |

`npm test` の終了0は、この環境では達成できていません。レビュー担当は待ち受けが許可される環境で再実行してください。実際のポートの自動選択、指定したポートでの HTTP 応答、実サーバー起動後の Ctrl+C、ブラウザーの起動、npm からの取得、全体インストール、公開サイトとの通信、Node 20 での実行、Actions 上の公開手順の実行は **unverified** です。ブラウザーを開く各 OS の処理は、外部のアプリを起動せず、渡す引数と失敗時の処理を確認しました。

X1 の変更ファイルは `test/admin/runner.test.js`、`test/admin/cli.test.js`、`test/patch/workflow.test.js`、`bin/model-memento.js`、`package.json` の `bin`、この文書への追記です。
