# 更新番号と公開の巻き戻し

確認日 2026-11-15。以下はレビュー後に適用する差分です。GitHub上での公開と巻き戻しは未実行で、動作は unverified です。

## 保存方式と上限

公開物全体を `memento-patch-<id>` のGitHub Release（版ごとにファイルを保存する場所）へ `site.tar.gz` として添付します。1ファイルは2 GiB未満で、コードでも検査します。GitHubの説明では1つのReleaseに最大1000ファイル、Release全体の容量と帯域には上限がありません。[Releaseの上限](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases#storage-and-bandwidth-quotas)

成功した更新を番号順で直近5版残します。現在公開中の版と、公開処理が途中の保存物も保持します。古い添付ファイルの削除は公開成功後です。番号を重複させないため、Releaseの本文とタグは台帳として残します。作成、変更、下書きの一覧取得、添付ファイルの保存と削除には公式APIを使います。[Release API](https://docs.github.com/en/rest/releases/releases)、[添付ファイルAPI](https://docs.github.com/en/rest/releases/assets)

Actionsの保存物は標準で90日、公開リポジトリでは1〜90日、非公開では1〜400日に設定できます。この案では巻き戻し用の保存先をReleaseにし、日数による消去を設定しません。[Actionsの保存期間](https://docs.github.com/en/organizations/managing-organization-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-organization)

Pagesへの受け渡しは既存の公式Actionを使います。Pagesの公式対応の容量上限は1 GBで、通常ファイルとフォルダーだけを渡します。公開に必要な権限は既存の `pages: write` と `id-token: write` です。[Pagesの梱包条件](https://github.com/actions/upload-pages-artifact#artifact-validation)、[Pagesの公開権限](https://github.com/actions/deploy-pages#security-considerations)

## 実行方法

3つの既存ワークフローへ下の差分を適用します。既存の `world-pages` 同時実行グループが読取りから公開完了まで直列化します。Release保存のため、呼出元と共通手順に `contents: write` を追加します。

最初の一回は手動実行で `patch_initial: true` を指定します。世界の一覧も初回なら `mode: full` を使います。`dry_run: true` で確認し、その後 `dry_run: false` で公開します。保存済み番号がある状態では初回指定を拒否します。次回から `patch_initial: false` にします。

通常の更新は `WORLD_SITE_URL` の `data/patch-manifest.json` と比較用ファイルを読みます。実際に公開中の版が差分の基準です。番号は下書きを含むRelease台帳の最大値より先へ進めます。年はUTCの2000〜2099年に対応し、年が変わると1から始まります。初回の変更記録には現在の全項目が追加として現れます。

巻き戻しは手動実行で `rollback_to: 26.47` と `dry_run: false` を指定します。保存物のSHA-256、容量、展開先、ファイルの種類、内部の更新番号、既存の権利・容量検査を通して公開します。更新日時と番号も保存物から戻ります。保存物が削除されていれば停止します。取得先への認証情報はGitHub API宛てにだけ付けます。[添付ファイルの取得](https://docs.github.com/en/rest/releases/assets#get-a-release-asset)

保存から公開成功の記録までの途中で失敗すると、Releaseの下書きが残り、番号は予約済みになります。Pages公開後に記録だけ失敗した場合も、その番号を `rollback_to` に指定して保存物を再公開できます。古い保存物の整理が失敗した場合は保持数が増えます。

## 適用する差分

```diff
--- a/.github/workflows/pages.yml
+++ b/.github/workflows/pages.yml
@@ -5,13 +5,21 @@
     branches: [main]
   workflow_dispatch:
     inputs:
+      rollback_to:
+        description: '保存した更新番号に戻す。例 26.47。空欄なら新しく公開'
+        type: string
+        default: ''
+      patch_initial:
+        description: '更新番号を導入する最初の一回だけ指定する'
+        type: boolean
+        default: false
       dry_run:
         description: '検査と組み立てだけ行い、公開と状態の保存をしない'
         type: boolean
         default: true
 
 permissions:
+  contents: write
-  contents: read
   pages: write
   id-token: write
 
@@ -25,3 +33,5 @@
     with:
       mode: delta
       dry_run: ${{ github.event_name == 'workflow_dispatch' && inputs.dry_run || false }}
+      rollback_to: ${{ inputs.rollback_to || '' }}
+      patch_initial: ${{ inputs.patch_initial || false }}
--- a/.github/workflows/auto-sync.yml
+++ b/.github/workflows/auto-sync.yml
@@ -12,13 +12,21 @@
         type: choice
         options: [delta, full]
         default: delta
+      rollback_to:
+        description: '保存した更新番号に戻す。例 26.47。空欄なら新しく公開'
+        type: string
+        default: ''
+      patch_initial:
+        description: '更新番号を導入する最初の一回だけ指定する'
+        type: boolean
+        default: false
       dry_run:
         description: '検査と組み立てだけ行い、公開と状態の保存をしない'
         type: boolean
         default: true
 
 permissions:
+  contents: write
-  contents: read
   pages: write
   id-token: write
 
@@ -33,3 +41,5 @@
     with:
       mode: ${{ github.event.schedule == '17 3 * * 0' && 'full' || inputs.mode || 'delta' }}
       dry_run: ${{ github.event_name == 'workflow_dispatch' && inputs.dry_run || false }}
+      rollback_to: ${{ inputs.rollback_to || '' }}
+      patch_initial: ${{ inputs.patch_initial || false }}
--- a/.github/workflows/world-pages.yml
+++ b/.github/workflows/world-pages.yml
@@ -6,19 +6,25 @@
       mode:
         type: string
         default: delta
+      rollback_to:
+        type: string
+        default: ''
+      patch_initial:
+        type: boolean
+        default: false
       dry_run:
         type: boolean
         default: true
 
 permissions:
+  contents: write
-  contents: read
   pages: write
   id-token: write
 
 jobs:
   publish:
     # 手動実行も既定ブランチに限定する。呼出元で読取りから公開まで直列化する。
+    if: github.ref == format('refs/heads/{0}', github.event.repository.default_branch) && inputs.rollback_to == ''
-    if: github.ref == format('refs/heads/{0}', github.event.repository.default_branch)
     runs-on: ubuntu-latest
     timeout-minutes: ${{ inputs.mode == 'full' && 180 || 45 }}
     environment:
@@ -131,6 +137,9 @@
           NODE
           node scripts/check-rights.js --self-test
 
+      - name: 更新番号と差分をオフラインで検査
+        run: node --test test/patch/*.test.js
+
       - name: サイトを保存済みのデータから組み立てる
         timeout-minutes: 10
         run: npm run build:web -- --offline
@@ -192,9 +201,52 @@
           await fs.copyFile('.world-out/world/data/enrich-queue.json', path.join(out, 'data/enrich-queue.json'));
           NODE
 
+      - name: 更新番号と日本語の変更記録を付ける
+        id: patch
+        env:
+          GITHUB_TOKEN: ${{ github.token }}
+          PATCH_INITIAL: ${{ inputs.patch_initial }}
+        run: |
+          node --input-type=module <<'NODE'
+          import fs from 'node:fs/promises';
+          import path from 'node:path';
+          import { run } from './scripts/patch-notes.js';
+          import { patchReleases } from './lib/patch/releases.js';
+          const store = patchReleases({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN });
+          const history = await store.history();
+          const initial = process.env.PATCH_INITIAL === 'true';
+          if (initial && history.length) throw new Error('保存済みの更新があります。初回の指定を外してください。');
+          const historyFile = path.join(process.env.RUNNER_TEMP, 'patch-history.json');
+          await fs.writeFile(historyFile, JSON.stringify(history));
+          const args = ['--new', path.join(process.env.RUNNER_TEMP, 'pages'), '--history', historyFile];
+          if (initial) args.push('--initial');
+          else args.push('--previous', process.env.WORLD_SITE_URL);
+          const result = await run(args);
+          await fs.appendFile(process.env.GITHUB_OUTPUT, 'id=' + result.patch.id + '\n');
+          await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, result.summary);
+          NODE
+
       - name: 画像・ロゴ・公開容量の検査
         run: node scripts/check-rights.js "$RUNNER_TEMP/pages"
 
+      - name: 公開するフォルダー全体を保存用にまとめる
+        if: ${{ !inputs.dry_run }}
+        run: tar --create --gzip --file="$RUNNER_TEMP/patch-site.tar.gz" --directory="$RUNNER_TEMP/pages" .
+
+      - name: 更新番号を予約して公開物を保存する
+        if: ${{ !inputs.dry_run }}
+        env:
+          GITHUB_TOKEN: ${{ github.token }}
+        run: |
+          node --input-type=module <<'NODE'
+          import fs from 'node:fs/promises';
+          import path from 'node:path';
+          import { patchReleases } from './lib/patch/releases.js';
+          const patch = JSON.parse(await fs.readFile(path.join(process.env.RUNNER_TEMP, 'pages/data/patch.json'), 'utf8'));
+          const store = patchReleases({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN });
+          await store.prepare({ patch, archive: path.join(process.env.RUNNER_TEMP, 'patch-site.tar.gz'), sha: process.env.GITHUB_SHA });
+          NODE
+
       - name: Pagesを準備
         if: ${{ !inputs.dry_run }}
         uses: actions/configure-pages@v5
@@ -214,6 +266,31 @@
         with:
           timeout: '540000'
 
+      - name: 公開に成功した更新を記録する
+        if: ${{ !inputs.dry_run && steps.deployment.outcome == 'success' }}
+        env:
+          GITHUB_TOKEN: ${{ github.token }}
+          PATCH_ID: ${{ steps.patch.outputs.id }}
+        run: |
+          node --input-type=module <<'NODE'
+          import { patchReleases } from './lib/patch/releases.js';
+          const store = patchReleases({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN });
+          await store.markDeployed(process.env.PATCH_ID);
+          NODE
+
+      - name: 直近5版の公開物を残す
+        if: ${{ !inputs.dry_run && steps.deployment.outcome == 'success' }}
+        continue-on-error: true
+        env:
+          GITHUB_TOKEN: ${{ github.token }}
+          PATCH_ID: ${{ steps.patch.outputs.id }}
+        run: |
+          node --input-type=module <<'NODE'
+          import { patchReleases } from './lib/patch/releases.js';
+          const store = patchReleases({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN });
+          await store.prune(process.env.PATCH_ID);
+          NODE
+
       - name: 公開できた状態を予備用にまとめる
         if: ${{ !inputs.dry_run && steps.deployment.outcome == 'success' }}
         run: |
@@ -242,3 +319,117 @@
           const line = `公開結果: ${process.env.DEPLOYMENT_OUTCOME || '未実行'}。登録先ごとの上限: モデル ${process.env.WORLD_REQUEST_BUDGET}回、ツール ${process.env.WORLD_TOOLS_BUDGET}回。\n`;
           await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, line);
           NODE
+
+  rollback:
+    if: github.ref == format('refs/heads/{0}', github.event.repository.default_branch) && inputs.rollback_to != ''
+    runs-on: ubuntu-latest
+    timeout-minutes: 30
+    environment:
+      name: github-pages
+      url: ${{ steps.deployment.outputs.page_url }}
+    env:
+      ROLLBACK_TO: ${{ inputs.rollback_to }}
+      GITHUB_TOKEN: ${{ github.token }}
+    steps:
+      - name: 確認用のソースを読む
+        uses: actions/checkout@v4
+        with:
+          persist-credentials: false
+
+      - name: Node.jsを準備
+        uses: actions/setup-node@v4
+        with:
+          node-version: '22'
+
+      - name: 指定した更新の保存物を検証して取得する
+        run: |
+          node --input-type=module <<'NODE'
+          import path from 'node:path';
+          import { patchReleases } from './lib/patch/releases.js';
+          const store = patchReleases({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN });
+          await store.download(process.env.ROLLBACK_TO, path.join(process.env.RUNNER_TEMP, 'patch-site.tar.gz'));
+          NODE
+
+      - name: 保存物の展開先とファイルの種類を検査する
+        run: |
+          node --input-type=module <<'NODE'
+          import path from 'node:path';
+          import { spawnSync } from 'node:child_process';
+          const file = path.join(process.env.RUNNER_TEMP, 'patch-site.tar.gz');
+          const names = spawnSync('tar', ['--list', '--gzip', '--file', file], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
+          const types = spawnSync('tar', ['--list', '--verbose', '--gzip', '--file', file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
+          if (names.error || types.error || names.status !== 0 || types.status !== 0) throw new Error('保存物の一覧を読めません。');
+          for (const name of names.stdout.trim().split('\n')) {
+            if (!name || name.startsWith('/') || name.includes('\\') || name.split('/').includes('..')) throw new Error('展開先の外を指すファイルがあります。');
+          }
+          for (const line of types.stdout.trim().split('\n')) {
+            if (!['-', 'd'].includes(line[0])) throw new Error('通常のファイルとフォルダーだけを展開できます。');
+          }
+          NODE
+
+      - name: 保存した公開物を展開する
+        run: |
+          mkdir -p "$RUNNER_TEMP/pages"
+          tar --extract --gzip --no-same-owner --no-same-permissions --file="$RUNNER_TEMP/patch-site.tar.gz" --directory="$RUNNER_TEMP/pages"
+
+      - name: 更新番号と公開物を検査する
+        run: |
+          node --input-type=module <<'NODE'
+          import fs from 'node:fs/promises';
+          import path from 'node:path';
+          import { parsePatchId } from './lib/patch/version.js';
+          parsePatchId(process.env.ROLLBACK_TO);
+          const root = path.join(process.env.RUNNER_TEMP, 'pages/data');
+          const patch = JSON.parse(await fs.readFile(path.join(root, 'patch.json'), 'utf8'));
+          const manifest = JSON.parse(await fs.readFile(path.join(root, 'patch-manifest.json'), 'utf8'));
+          if (patch.id !== process.env.ROLLBACK_TO || manifest.patch?.id !== patch.id) throw new Error('保存物の更新番号が一致しません。');
+          await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, '更新 ' + patch.id + ' の保存物を確認しました。\n');
+          NODE
+          node scripts/check-rights.js "$RUNNER_TEMP/pages"
+
+      - name: Pagesを準備
+        if: ${{ !inputs.dry_run }}
+        uses: actions/configure-pages@v5
+
+      - name: 保存済みのサイトを渡す
+        if: ${{ !inputs.dry_run }}
+        uses: actions/upload-pages-artifact@v3
+        with:
+          path: ${{ runner.temp }}/pages
+          retention-days: 1
+
+      - name: 指定した更新をPagesに公開
+        if: ${{ !inputs.dry_run }}
+        id: deployment
+        timeout-minutes: 10
+        uses: actions/deploy-pages@v4
+        with:
+          timeout: '540000'
+
+      - name: 公開した更新の保存状態を確定する
+        if: ${{ !inputs.dry_run && steps.deployment.outcome == 'success' }}
+        run: |
+          node --input-type=module <<'NODE'
+          import { patchReleases } from './lib/patch/releases.js';
+          const store = patchReleases({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN });
+          await store.markDeployed(process.env.ROLLBACK_TO);
+          NODE
+
+      - name: 戻した世界の状態を予備にまとめる
+        if: ${{ !inputs.dry_run && steps.deployment.outcome == 'success' }}
+        run: |
+          node --input-type=module <<'NODE'
+          import fs from 'node:fs/promises';
+          import path from 'node:path';
+          await fs.rm('.world-cache', { recursive: true, force: true });
+          await fs.mkdir('.world-cache', { recursive: true });
+          await fs.cp(path.join(process.env.RUNNER_TEMP, 'pages/world'), '.world-cache/world', { recursive: true, dereference: false });
+          NODE
+
+      - name: 戻した状態を予備に保存
+        if: ${{ !inputs.dry_run && steps.deployment.outcome == 'success' }}
+        continue-on-error: true
+        uses: actions/cache/save@v4
+        with:
+          path: .world-cache
+          key: ${{ runner.os }}-world-published-v1-${{ github.run_id }}-${{ github.run_attempt }}
```

## 入出力と比較の範囲

`node scripts/patch-notes.js --new <公開フォルダー> --previous <公開URLまたは前回のフォルダー>` を使います。初回だけ `--initial` にします。`--history <使用済み番号のJSON配列>` と、ビルド側で予約した `--id` も渡せます。

- `data/patch.json` は `{ id, at, previous, counts, changes }` です。`counts` は種類別の現在件数、`changes` は追加・削除・変更件数です。
- `data/patch-notes/<id>.json` は全変更、出典URL、未確認の表示、日本語の要約を含みます。
- `data/patch-notes/<id>.txt` はテンプレートで作る日本語の要約です。例は各種類最大3件です。
- `data/patch-manifest.json` と `data/patch-state/<id>/<種類>/<分割名>.jsonl.gz` は次回の比較用です。内容、容量、件数、順番を確認します。比較用ファイルには短い事実と、説明文の内容を照合するハッシュ値を保存します。

必須入力は `data/models.json`、`data/closed.json`、`data/catalog.json` です。任意入力は `data/recipes.json`、`links-status.json` または `data/links-status.json`、`data/vera.json`、`world/manifest.json` とその分割ファイル・道具の状態です。道具の状態の版は登録先ごとの現在の版を比較します。通常一覧と世界の一覧は識別名の先頭で区別するので、件数はそれぞれの登録件数の合計です。

事実の変更は上位の項目名で記録し、仕様、料金、日付、提供状況などは変更前後の値も含めます。説明文などは変更した項目名を記録します。リンクは状態、HTTPの応答番号、移動先の変更前後を含みます。Veraの点数はモデル内の `vera.score`、`veraScore`、`vera_score`、または `data/vera.json` の `{ id?, name?, score, sources? }` を読みます。数値が無ければnullです。現在の公開データではVeraの点数とリンクの確認結果が未確認です。定期確認の日時と処理時間は比較から除きます。

使い捨ての公開フォルダーで実行してください。同時実行はロックで拒否します。比較用ファイルを分割し、並べ替えと変更記録の生成にディスクを使います。通常のJSON一覧は1ファイル128 MB、前回の比較用一覧は10 MBまでです。世界の分割ファイルは順に読みます。通信失敗、内容不一致、前回の入力一覧の欠落で停止します。途中で失敗した公開フォルダーは破棄して作り直してください。

## ページへの接続

各ページの表示位置へ次を加えます。importの相対パスはページの階層に合わせてください。`patch.json` の場所はモジュール自身のURLから解決します。取得失敗時は「この情報の更新時点は未確認です」と表示します。

```html
<span data-patch-label></span>
<script type="module">
  import { showPatchLabels } from './js/patch/label.js';
  await showPatchLabels();
</script>
```

過去の変更記録ページでは `showPatchLabels({ patch: notes })` で、その記録の番号を表示できます。

## 確認状況

`node --test test/patch/*.test.js` でオフライン検査を実行します。GitHub APIはテスト用の応答です。実際のGitHub権限、添付ファイルの保存と再取得、Pages公開と巻き戻し、YAML全体のGitHub側での受理、大規模データの所要時間と容量は unverified です。担当外のHTMLへの接続と、このdiffの適用はレビュー担当者に残っています。
