# 公式の入手先へ案内する

更新日: 2026-11-15。担当範囲は `lib/recipes/obtain.js`、`recipes/catalog/obtain.json`、
`test/recipes/obtain.test.js`、この文書です。

アプリが取得するのは版の番号やファイルの大きさなどの情報だけです。配布ファイルを保存したり、
インストールしたり、別の場所で配り直したりする処理はありません。人が公開元のページを開き、
自分で入手します。画面との接続は担当ファイル外なので、この変更には含めていません。

## 呼び出し方

Node 20 以上の ESM と、既存の `zod` を使います。

```js
import { obtainInfo, listReleases } from './lib/recipes/obtain.js';

const current = await obtainInfo('codex');
const history = await listReleases('codex', { page: 1, perPage: 100 });
// 人が一覧で版を選んだ後に呼ぶ場合。配布ファイルは取得しません。
const selected = await obtainInfo('codex', { tag: 'rust-v0.1.0' });
```

上のタグは引数の例で、存在や画面の見た目を確認した版ではありません。

`obtainInfo` の返り値:

| 項目 | 内容 |
| --- | --- |
| `kind` | `github-release` / `npm` / `pypi` / `brew` / `official-page` / `web-only` / `none` |
| `url` | 公開元の配布ページ、登録ページ、またはウェブ版のページ。未確認なら `null` |
| `version` | 今回取得した最新の版、選んだタグ、以前に確認した版。未確認なら `null` |
| `assets` | GitHub の配布ファイルの候補。`name`、`url`、バイト単位の `size`、`sha256` を持つ |
| `license` | 公開元の利用条件の短い表記。未確認なら `null` |
| `notes` | 日本語の説明。確認できない点もここに残す |
| `sources` | 根拠の URL。取得した情報には対応する API の URL も加える |
| `checkedAt` | 版の情報を取得した時刻。取得していなければ `null` |
| `stale` | 有効期限を過ぎた保存情報を使った場合は `true` |
| `verification` | 配布元を個別に確認済みなら `verified`、未確認なら `unverified` |
| `releaseHistoryUrl` | リポジトリが分かる場合の GitHub の版一覧ページ。それ以外は `null` |

知らない識別名は `kind: "none"` で返し、ネットワークへ名前を渡しません。
`web-only` はこのカタログ項目がウェブ画面を扱うという意味です。同じ製品にアプリがないという主張ではありません。
`brew` は公式の導入手順のページへ案内する区分です。Homebrew のコマンドや配布ファイルは取得しません。

## 公開元の対応表

静的な事実は `recipes/catalog/obtain.json` に集めています。`tools` が識別名と配布元の対応、
`aliases` がアダプターなどの別名です。外部カタログは `repo` / `github` に書かれた値を使い、
ツール名から npm / PyPI の名前を作ることはしません。

この時点で 5,392 件のカタログ項目と 9 個のアダプターの識別名をカバーしています。
5,395 個の直接の項目があり、別名から同じ項目を参照します。
そのうち 5,365 個の直接の項目は、元のカタログの公開先を転記しただけで、配布元を個別確認していません。
これらは `verification: "unverified"`、`license: null` です。API が応答しても公式と確認済みには変えません。
画面では `unverified` を確認済みの公式配布として表示しないでください。

使う登録名は、登録ページと公開元の説明を照合しています。

| 道具 | 登録名 | 根拠 |
| --- | --- | --- |
| Aider | PyPI の `aider-chat` | [登録ページ](https://pypi.org/project/aider-chat/)、[導入手順](https://aider.chat/docs/install.html) |
| Gemini CLI | npm の `@google/gemini-cli` | [登録ページ](https://www.npmjs.com/package/%40google/gemini-cli?activeTab=versions)、[導入手順](https://geminicli.com/docs/get-started/installation/) |
| OpenCode | npm の `@opencode/cli` | [登録ページの検索結果](https://www.npmjs.com/package/%40opencode/cli)、[公式の説明](https://opencode.ai/docs/) |
| OpenClaw | npm の `openclaw` | [登録ページ](https://www.npmjs.com/package/openclaw)、[登録情報](https://registry.npmjs.org/openclaw/latest) |
| Pi | npm の `@earendil-works/pi-coding-agent` | [登録情報](https://registry.npmjs.org/@earendil-works/pi-coding-agent)、[移転の案内](https://pi.dev/changelog/2026/5/7/pi-has-a-new-home) |

npm のウェブ画面には 403 応答もありました。OpenCode と Gemini CLI は検索から読めた登録ページ、
Pi は読めた npm の JSON 登録情報でも名前を照合しています。ローカルの JavaScript 環境からの
npm への直接取得は DNS エラーだったため、動作確認の根拠にはしていません。

静的に残した版は Aider `0.86.2`、Gemini CLI `0.68.0`、OpenClaw `2026.11.3` です。
根拠は上表の各登録ページです。更新取得が失敗した場合は「最新の版を確認できませんでした」と表示します。
それ以外の版は、確認できた値がない限り `null` です。

通常の配布ページも静的に登録しています。例として [ChatGPT](https://chatgpt.com/download/)、
[Claude](https://claude.com/download)、[Cursor](https://cursor.com/download)、
[Antigravity](https://antigravity.google/download) があります。
[Windsurf の配布先](https://windsurf.com/download) は確認時に
[Devin の配布ページ](https://devin.ai/download) へ移動しました。この点と、過去版の配布先が未確認であることを説明に残しています。

## 実行時の取得と保存

HTTPS の GET だけを使います。固定した配布元と登録名から URL を作ります。

- GitHub: `/repos/{owner}/{repo}/releases/latest` または `/releases/tags/{tag}`。
  利用条件には `/repos/{owner}/{repo}` の `license.spdx_id` を使います。
  `NOASSERTION` などの不明な値は `null` にします。
- npm: `https://registry.npmjs.org/{package}/latest`。
  返ってきた名前が対応表の名前と一致することを確認します。
- PyPI: `https://pypi.org/pypi/{package}/json`。
  名前の大小文字と `-` / `_` / `.` の表記差をそろえて確認します。

API の根拠: [GitHub の版 API](https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28)、
[GitHub のリポジトリ API](https://docs.github.com/en/rest/repos/repos#get-a-repository)、
[npm の登録 API](https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md)、
[PyPI の JSON API](https://docs.pypi.org/api/json/)。

認証なしで取得できます。`GITHUB_TOKEN` があれば GitHub API にだけ渡します。
転送先へ認証情報が流れないよう、HTTP の自動転送は許可しません。転送が必要な移転先は対応表で見直します。
接続と JSON の読み込みを合わせ、各要求の待ち時間は最大 15 秒です。

確認した情報は `~/.model-memento/cache/obtain/` に 24 時間保存します。ファイル名は URL の SHA-256 値です。
保存するのは検査済みの必要な項目、取得元 URL、時刻、次のページの情報だけです。
認証情報、長い公開説明、配布ファイルは保存しません。ファイルは権限 `0600` の一時ファイルから置き換えます。
保存先の経路にシンボリックリンクがあれば書き込みを拒否し、保存失敗時も公開先への案内は返します。
取り込みだけでは保存先を作りません。

有効期限を過ぎた情報は、再取得できないときに限り説明付きで表示します。
404 / 410 の応答では古い配布情報を戻しません。未知の版、利用条件、日付、チェックサムは作りません。
GitHub の利用条件は現在のリポジトリの情報なので、過去の版の利用条件を保証する値ではありません。

## Mac 用の候補と過去の版

候補を出すのは GitHub の公開された版に含まれるファイルだけです。URL が同じリポジトリの
`releases/download/` に属することを確認します。ファイル名に Mac を示す語または `.dmg` と、
`arm64` / `aarch64` / `universal` / `universal2` のいずれかがあるものを選びます。
Windows / Linux の名前、署名、チェックサム一覧などは除外します。
名前だけでは対応環境を保証できないので、公開ページで必要な環境を確認する説明を添えます。
CPU の種類を示さない配布ファイルは、人が公開ページで確認します。

`sha256` は GitHub が `digest: "sha256:…"` として返した 64 桁の値だけです。
提供されない場合は `null`。チェックサム用ファイルも取得しません。
参照: [GitHub の配布ファイル API](https://docs.github.com/en/rest/releases/assets?apiVersion=2022-11-28)。

`listReleases` は `{ releases, nextPage, sources, notes, checkedAt, stale, verification }` を返します。
各行は `{ tag, publishedAt, url, prerelease }` です。日付が不明なら `null`。
1 ページ最大 100 件で、続きがあれば `nextPage` を返します。次のページは呼び出し側が要求します。
未公開の下書きは除外し、試用版は印を付けます。
GitHub の公開されたリリースにひも付くタグが対象で、すべての Git タグを列挙するものではありません。
参照: [GitHub の一覧 API](https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#list-releases)。

npm / PyPI / 公式ページを優先する道具でも、確認できる `repo` があれば GitHub の版一覧を使えます。
日付と公開ページを手がかりに人が選びます。思い出の画面と一致することや、今の Mac で動くことは未確認です。

## オフラインでの確認

`createObtainClient` は `fetch`、`cacheStore`、`now`、`catalog`、`githubToken`、`timeoutMs` を差し替えられます。
`cache: false` なら保存先に触れません。テストは偽の取得処理とメモリー内の保存先を使い、通信もホームへの書き込みもしません。

レビュー環境での実行コマンド:

```sh
node --test test/recipes/obtain.test.js
```

この作業中は「ハーネスや第三者ツールのプロセスを開始しない」という指示に従い、上のコマンドは実行していません。
すでにある JavaScript 実行ツール内でモジュールを取り込み、偽の取得処理を使って確認しています。
ファイルによる保存、実際のネットワークを使ったモジュールの取得、画面との接続は未検証です。
テストファイルの構文を文字列からコンパイルする確認も、実行環境の制限で実施できませんでした。

今回の JavaScript 実行ツール内での確認結果（`node:test` の実行結果ではありません）:

```text
PASS: module import; GitHub assets and checksum; npm/PyPI versions; aliases; unknown id; GET-only; token isolation; cache redaction.
PASS: 24-hour cache hit and exact expiry boundary.
PASS: complete catalog validation; coverage = 5392 tools + 9 adapters.
PASS: fetch and JSON-body deadlines.
PASS: release dates, draft/foreign-link filtering, preview marking and pagination.
PASS: selected GitHub tag, URL encoding and invalid tag rejection.
PASS: rate-limit stale fallback and deleted-release handling.
PASS: registry identity mismatch and persistent unverified publisher marking.
node:test cases authored: 21; test runner not started.
```

レビューで残る確認は、上記テストコマンド、実ファイルの保存、実際の API 応答、画面側からの呼び出しです。
大量の `unverified` 項目を個別に調べる必要も残っています。`null` の版と利用条件、
名前だけで示される Mac 対応、過去の画面との一致についても、確認済みとは扱わないでください。

## F3 追記 2026-11-15

### 入手先の不足

開始時に `node --test test/recipes/obtain.test.js` を実行。21件中20件が成功し、
一覧全件の対応を調べる検査が `deepseek` の不足で失敗した。現在の一覧で不足していたのはこの1件。
`antigravity` と9個の接続処理には既存の入手先があった。

DeepSeek は公式トップページの「DeepSeek Web」「Chat with DeepSeek」から案内される
ウェブ版を `web-only` として追加した。公式ページからの案内先を確認した範囲で
`verification: "verified"` とした。利用条件と版番号は `null` のまま。
根拠は公式トップページと、そのページが示す案内先。
[公式トップページ](https://www.deepseek.com/en/)、[ウェブ版の案内先](https://chat.deepseek.com/)。

ウェブ版自体への読み取りはHTTP 403になった。ログイン後の動作と過去版の選択可否は
`unverified`。配布用の登録名やソースコードの置き場所は追加していない。
[確認した案内先](https://chat.deepseek.com/)。

修正後に同じ対応をNodeで調べた実出力。

```text
Coverage: 5394 tools + 9 adapters; missing routes: 0
Existing unverified routes: 5365
Recorded defaults: 188 ids + 97 nulls
```

既存の5365件の `unverified` は個別確認していない。

`node --test test/recipes/obtain.test.js` も修正後に再実行し、終了番号0。
実出力は `# tests 21`、`# pass 21`、`# fail 0`、`# duration_ms 219.261084`。

### 画面のモデル選択

`web/js/app.js` の初期表示と道具・版の切替で `defaultModel` を読む。
値が `null` の版では選択状態を `null` にし、上部の既存のモデル欄に
「当時の既定のモデルは未確認です」を表示する。選択状態の保存にも `null` を使う。
モデル未選択時の設定、思い出、投票、応答処理も空の状態を扱うようにした。

モデル固定を外している間、上部の選択候補は公開日がその版の時期までのものに絞る。
年月だけの版は同じ月まで、日付付きの版はその日までを含める。
公開日がないモデルは候補に含めない。空の欄から人がモデルを選ぶと、現在の版を保つ。
古いデータに `defaultModel` 欄がない場合だけ、当該版の一覧と公開日が合うモデルを探す。

保存された「モデル固定」の選択は初期表示と版切替で維持する。
URLにモデルを明示した場合は、その版の時期に収まる選択、またはモデル固定中の選択を使う。
固定していない保存済みモデルを自動的に既定値に使う処理は、記録された初期モデルの選択に置き換えた。

### 実行結果

今回の依頼で許可されたNode実行を使用した。実行環境は `v22.17.0`。
指定の検査を最後に再実行し、終了番号0を確認した。

```sh
node --test test/recipes/*.test.js web/js/recipes/data.test.js eval/vera/scoring.test.js
```

最終の標準出力の末尾。

```text
1..271
# tests 277
# suites 0
# pass 277
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 6684.720042
```

`node --check web/js/app.js` も終了番号0。標準出力は空。

`node --input-type=module` に検査コードを標準入力で渡し、F1記録内の要素ツリーを使って
実際の `app.js` を読み込んだ。ChatGPT 2022-11/12の未選択と年代内候補、初期・切替時の
記録ID、空欄からの選択、モデル固定の維持と解除を4件で確認した。通信はローカルJSONの
読み取りに差し替え、ブラウザーは起動していない。実出力の集計。

```text
# tests 4
# pass 4
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

同じ要素ツリーを使った285版の追加確認では、選択状態は188件の記録IDと97件の `null` に
全件一致した。描画は284版で完了し、1版で例外が出たため、この追加確認の終了番号は1。
実出力から保存状態・版名・例外を抜粋し、ファイル位置はプロジェクト内の表記にそろえた。

```text
Selection state verified: 188 exact default ids + 97 nulls
Element-tree renders completed: 284/285
Rendering failures: [
  {
    "version": "cline-2025-11",
    "error": "Cannot set properties of null (setting 'textContent')",
    "location": "web/js/tools/cline.js:112:54"
  }
]
```

`web/js/tools/cline.js` の当該版は `.empty-state p` の文字列を書き換えるが、
`web/js/surface.js` の `thread` はこの説明文を段落要素に包まず追加している。
レビュー担当による、この2ファイルの要素構成の整合が必要。

### オフライン構築

`npm run build:web -- --offline` をNodeの子プロセスから実行し、終了番号0。
担当外ファイルへの書き込みを避けるため、Nodeの事前読み込み設定で生成ファイルを
メモリー内に保持した。後続の読み取りもその保持内容を参照する。
`MODEL_MEMENTO_HOME` は存在しないプロジェクト内の場所を指定した。
ネット接続は検査内で拒否し、npmのログ保存と更新通知もこの実行の環境変数で無効にした。

主な実出力。

```text
> model-memento@0.1.0 build:web
> node scripts/build-web.js --offline
recipes: 9 apps, 17 styles, 4 examples
```

構築処理が出力した一覧は90モデル、1638件の追加モデル、5394道具、22470版。
生成した一覧にも `defaultModel` 欄が285版分あった。検査側が出力した保存先の確認結果。

```text
F3 build outputs held in memory: 929 files; disk writes: 0
F3 generated defaultModel fields: 285
npm run build:web -- --offline exit code: 0
```

標準エラーには、オフライン用の保存済み一覧を使用したことを示す次の行が出た。

```text
closedCatalog fallback: offline build: using saved closed catalog
```

生成物を実ファイルへ書く構築の確認と、ブラウザーでの表示・操作は `unverified`。
上記Clineの例外もレビュー側での確認・修正が必要。
