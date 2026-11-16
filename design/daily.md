# 日次更新 / Daily publication

`auto-sync.yml` is the sole scheduled entry. It calls `world-pages.yml` at 03:17 UTC, using delta collection Monday–Saturday and a resumable full scan on Sunday. `pages.yml` and accepted contributions call the same reusable workflow. The `world-pages` concurrency group serializes publication.

日次実行は `auto-sync.yml` 一つ。UTC 03:17 に起動し、月曜から土曜は差分、日曜は続きから全件を確認する。ソース更新と寄稿も同じ公開手順を使う。

```text
restore published state, with successful-run caches as fallback
  → bounded world delta/full + GitHub/npm/PyPI tool discovery
  → tool release facts + news headlines + rotating link checks
  → build:web, including the live closed-model catalog with committed fallback
  → contribution validation + patch notes
  → input counts + relay/facts + module integrity + rights/size checks
  → one-day daily-site review artifact
  → configure-pages → upload-pages-artifact → deploy-pages
  → mark successful patch, retain release archive, save successful state caches
```

`dry_run=true` performs collection, assembly and checks and uploads `daily-site`. Deployment, release reservation and published-state cache saves are gated off. State stays in published data, caches and existing patch release archives. The workflows contain no git push commands. A first publication can bootstrap only after a real HTTP 404 for the world manifest. Other failures require readable previous state. The first patch number is initialized when patch release history is empty.

`dry_run=true` でも収集・組み立て・検査と確認用 artifact の保存を行う。公開成功後にだけ次回の状態を保存する。世界索引の初回作成は HTTP 404 のときに進む。

## ビルド入力 / Build inputs

|Input|Purpose|
|---|---|
|`design/era/*.json`|Era records and their English siblings|
|`data/captured-screens/manifest.json`, `design/specs/*.json`|Source metadata|
|`data/curated/harness.json`, `designs.json`|Reviewed tools and layouts|
|`data/curated/r3/{versions,fonts,harness-sources,registries,availability}.json`|Historical research|
|`data/curated/editions/{chat,ide-cli,tools-2026-11}.json`|Reviewed editions|
|`web/data/tools/index.json`, `detail/*.json`, `specs/*.json`|Committed R5 index, release details and Tier B layouts|
|`data/curated/{models-base,roster,models-updates,closed-fallback}.json`|Recorded model data and offline catalog|
|`data/auto-sync/{models,editions,discoveries,registries,sync-report,vcross-status}.json`|Collector state, seeded from the checkout and advanced from successful publications|
|`data/curated/i18n/catalog-en.json`|Catalog display translations|
|`data/curated/{memories,instructions,relay}.json`|Public memories, instruction archive and relay URL|
|`data/curated/guides/*.json`, `recipes/catalog/styles/*.json`|Guides, taxonomy and style references|
|`lib/recipes/{harnesses,providers}/`, `recipes/catalog/{mcp.json,styles/}`, `recipes/examples/*.json`|Recipe metadata and examples|
|`data/curated/personas/*.json`, optional `data/curated/persona-cards/*.json`|Validated personas and sourced card drafts|
|`web/data/contrib/{build-input,credits}.json`|Validated public contribution inputs, restored before rebuilding|
|`web/js/`, `web/lib/`, `lib/core.js`, `web/css/`, `web/index.html`|Browser modules and layout. Core is copied into web/lib before versioning|
|`web/data/module-version.json` and its hashed sibling modules|Previous published module generations|

Online builds read the public catalog through the existing `closedCatalog()` implementation. `MODELSDEV_CACHE_FILE` is an explicit optional online input. Offline builds ignore it. `MODEL_MEMENTO_RELAY_URL` can explicitly override the committed relay URL. `MEMENTO_CONTRIB_BUILD_INPUT` can explicitly select validated contribution input. The public build reads committed inputs independently of `site/`, `.work/`, `.world-out/` and the maintainer's HOME archive. Missing R5 indexes, detail shards, Tier B layouts and required curated files fail the build.

オンライン時は既存の提供元一覧を取得し、失敗時とオフライン時は保存済み一覧を使う。手元のアーカイブと作業中の調査ファイルは公開入力から外した。必須入力の欠落は失敗として扱う。

The staged site is `.daily-out/pages`, inside the checkout so `check-links.js` accepts its location. It includes the entire built `web/`, including `data/relay.json` and `data/facts/`, plus the current world output and daily input snapshot. The input check compares output counts with a baseline captured before collection. Published world data remains authoritative, with `.world-cache` as a successful-deployment fallback. Public `data/daily-inputs.json` and `.daily-cache` retain the auto-sync inputs. News and link rotation state are read from the published site.

公開フォルダーはチェックアウト内の `.daily-out/pages`。中継設定と事実の分割ファイルを含む `web/` 全体を引き継ぐ。件数は収集前の基準と比較する。

## モジュールの版 / Module versions

Every build hashes the complete browser JS graph and writes immutable sibling files such as `js/app.memento-<sha256>.js`. An import map covers every local module, including lazy imports. Sibling placement preserves relative data/CSS URLs computed with `import.meta.url`. Before building, the workflow restores published versioned modules and verifies their SHA-256 values. It retains the preceding generation and all generations from the last 24 hours, including across cache misses. Old HTML can therefore resolve its recorded module graph during the Pages cache interval. Rollbacks restore the saved HTML, map and module files together.

ブラウザー用 JS 全体のハッシュで版を付け、遅延読込みも import map に含める。前の公開版を検証して残すため、古い HTML が読まれた場合も同じ版のモジュールを参照できる。ブラウザー実機での公開直後の動作は **unverified**。

## GitHub の設定 / Repository settings

- Set Settings → Pages → Source to **GitHub Actions**. Allow the official Pages actions. The workflow requests `pages:write` and `id-token:write`, with the `github-pages` environment. Configure its branch policy to allow the default branch. / Pages の公開元を GitHub Actions にし、既定ブランチを公開環境で許可する。[Pages workflow setup](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- Enable Actions and the scheduled `auto-sync.yml` on the default branch. Run a manual `dry_run=true`, review `daily-site`, then use `dry_run=false` to publish. / Actions と日次処理を有効にし、まず試行の artifact を確認する。[Workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- `WORLD_SITE_URL` is optional for this project URL. Set it for custom domains or another Pages location. The default is the repository's owner/name Pages URL. / 独自ドメインの場合は公開 URL を変数に設定する。
- AI maintenance starts with a secret-presence job. With neither API key it exits successfully and skips collection, validation and landing. Set repository secret `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to enable it, and use `AI_MAINTAIN=off` to disable it. Its existing read-only AI and separate validation/landing fences remain. / 鍵がないと AI 保守全体を見送る。寄稿の署名用秘密は既存の `MEMENTO_CONTRIB_KEY`。[Secret handling](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets#using-secrets-in-a-workflow)

## Action の固定 / Action pins

Verified 2026-11-16 by reading each public GitHub tag reference and the pinned `action.yml`. Annotated tags were dereferenced to their commit. These are the direct workflow pins. Existing AI pins and their sources are also listed in `ai-ci.md`.

公開タグと固定コミットの action.yml を取得して確認した。GitHub 上での実行は **unverified**。

|Action|Tag read|Pinned commit and source|
|---|---|---|
|actions/checkout|v4|[11d5960a326750d5838078e36cf38b85af677262](https://github.com/actions/checkout/blob/11d5960a326750d5838078e36cf38b85af677262/action.yml)|
|actions/setup-node|v4|[49933ea5288caeca8642d1e84afbd3f7d6820020](https://github.com/actions/setup-node/blob/49933ea5288caeca8642d1e84afbd3f7d6820020/action.yml)|
|actions/cache restore/save|v4|[0057852bfaa89a56745cba8c7296529d2fc39830](https://github.com/actions/cache/blob/0057852bfaa89a56745cba8c7296529d2fc39830/action.yml)|
|actions/configure-pages|v5|[983d7736d9b0ae728b81ab479565c72886d7745b](https://github.com/actions/configure-pages/blob/983d7736d9b0ae728b81ab479565c72886d7745b/action.yml)|
|actions/upload-pages-artifact|v3|[56afc609e74202658d3ffba0e8f6dda462b719fa](https://github.com/actions/upload-pages-artifact/blob/56afc609e74202658d3ffba0e8f6dda462b719fa/action.yml)|
|actions/deploy-pages|v4|[d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e](https://github.com/actions/deploy-pages/blob/d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e/action.yml)|
|actions/upload-artifact|v4|[ea165f8d65b6e75b540449e92b4886f43607fa02](https://github.com/actions/upload-artifact/blob/ea165f8d65b6e75b540449e92b4886f43607fa02/action.yml)|
|actions/download-artifact|v4|[d3f86a106a0bac45b974a628896c90dbdf5c8093](https://github.com/actions/download-artifact/blob/d3f86a106a0bac45b974a628896c90dbdf5c8093/action.yml)|
|actions/github-script|v7|[f28e40c7f34bde8b3046d885e986cb6290c5673b](https://github.com/actions/github-script/blob/f28e40c7f34bde8b3046d885e986cb6290c5673b/action.yml)|
|browser-actions/setup-chrome|v1|[c785b87e244131f27c9f19c1a33e2ead956ab7ce](https://github.com/browser-actions/setup-chrome/blob/c785b87e244131f27c9f19c1a33e2ead956ab7ce/action.yml)|

## 確認 / Verification

The empty-HOME offline and real-network copies completed successfully with the following counts. Each copy contained the committed R5 directory and omitted local state directories.

|Output|Committed web|Empty-HOME offline|Empty-HOME live catalog|
|---|---:|---:|---:|
|models|90|90|90|
|closed|1,638|1,638|1,635|
|tools|5,394|5,394|5,394|
|versions|22,470|22,470|22,470|
|era|287|287|287|
|guides|103|103|103|
|facts shards|255|255|256|

The live catalog build reported `catalogFallback=false`. Its closed-model count and resulting shard distribution depend on the public response at build time. The offline artifact passed rights/size checks with 2,535 files, 99,666,551 bytes and a 105,544,704-byte tar upper-bound estimate. The real-network verification test passed. [Catalog API](https://models.dev/api.json)

オンライン実行は提供元一覧の取得に成功した。取得時点の一覧が異なるため、closed の件数と事実の分割数も変わる。オフライン公開物は権利・容量検査に合格した。

`node --test test/daily/build.test.js` repeats the copy using an empty HOME/TMPDIR, tests ignored local overrides, exercises failed and successful online catalog fixtures, checks relay/facts and rights, and rejects a missing R5 index. It is offline by default. `D1_VERIFY_ONLINE=1 node --test test/daily/build.test.js` additionally attempts the real online catalog. Results for the final shared working tree are recorded in the handoff because concurrent workers can change its inputs.

`npm test` completed with 901 tests, 900 passed, one skipped and zero failures. The focused daily/workflow command completed with 11 passed and zero failures. `node scripts/check-rights.js --self-test` completed with five passed and zero failures.

オフラインとオンラインの検証は上記の件数で成功した。全体テストは900件成功・1件スキップ・失敗0件。GitHub Actions 実行、Pages 公開、公開中のキャッシュ切替えは **unverified**。
