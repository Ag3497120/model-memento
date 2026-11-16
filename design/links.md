# 本物のモデルへの案内とリンクの確認

担当モジュールは `lib/links/real.js`、`lib/links/check.js`、`lib/links/inventory.js`、
`web/js/links/status.js`。取り込み時に通信やファイルへの書き込みはしない。
モデルの取得やコマンドの実行は一切しない。

## 本物を使う案内

`realUseLinks(record)` は通信しない関数。世界索引の `{ r, id, a, url }`、既存の
`{ id, url, real_model }` を受け取る。`real_model` は登録名の文字列、または
`{ id }` / `{ hfId }` / `{ repo }` / `{ url }`。API モデルはレシピの
`provider:model` と世界索引の `provider/model` に対応する。提供元は
`lib/recipes/providers/` の情報にある正確なモデル名と照合する。
過去のモデル名から現在の別モデルに誘導しない。

戻り値は `{ kind, label, url, sources, verification, ... }[]`。
種類は `registry`（登録ページ）、`download`（ファイル一覧）、`local-command`
（手元で動かす手順）、`local-search`（手元のアプリで探す説明）、`official-api`
（提供元の窓口の案内）、`playground`（試用ページ）、`space`（公開された試用ページ）。
`command` は表示専用の文字列。HTML は返さない。表示には `textContent` を使う。

Hugging Face の `tree/main` を開く。重みの取得はこのアプリでは行わない。
ファイルを選んで取得する方法の根拠:
https://huggingface.co/docs/hub/models-downloading 。

Ollama の対応表は `lib/links/ollama.js` の `ollamaPublicData` から
`buildOllamaIdMap()` で作る。初期の表は 4 モデルだけ。各行には正確な
Hugging Face 登録名、Ollama のタグ、双方の公開ページ、確認日を持たせた。
表にないモデルは類似名で補わない。世界索引の Ollama レコード自体を渡した場合は、
登録名と `https://ollama.com/library/<id>` が一致する時だけ手順を出す。
Ollama の配布物は圧縮版で、元の重みとのバイト単位の同一性は主張しない。
初期表の公開情報:

- https://ollama.com/library/llama3.1:8b-instruct-q4_K_M と https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct
- https://ollama.com/library/qwen2.5:7b-instruct と https://huggingface.co/Qwen/Qwen2.5-7B-Instruct
- https://ollama.com/library/gemma2:9b-instruct-q4_0 と https://huggingface.co/google/gemma-2-9b-it
- https://ollama.com/library/deepseek-r1:7b と https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B

LM Studio は検索欄へ Hugging Face の登録名・URL を貼る方法が公式に説明されている:
https://lmstudio.ai/docs/app/basics/download-model 。モデル検索画面を直接開く URL の形式は
`unverified`。そのため `searchUrl: null`、`searchUrlVerification: "unverified"` とし、
説明ページと貼り付ける `searchText` を返す。モデルの対応形式は確認したと主張しない。

API の案内・試用ページは提供元情報の `apiUrl` / `docsUrl` / `sources[0]` と
`playgroundUrl` / `playground` から取る。提供元情報に試用ページがなければ作らない。
各モデルの現在の提供可否は `modelAvailability: "unverified"`。API の URL が存在するだけで
モデルを利用できるとは表示しない。

## Spaces の確認

`await realModelLinks(record, options)` は `{ links, spaces, spacesStatus, ... }` を返す。
`options.spaces = false` で通信なし。`findModelSpaces(hfId)` は試用ページだけを返す。
一覧 API の `models=<正確な登録名>`、`sort=likes`、`direction=-1` と
`expand=models&expand=likes&expand=runtime&expand=sdk` を使う。
API の `models` にも登録名が完全一致し、`runtime.stage` が `RUNNING` / `SLEEPING` の
公開ページだけを、いいね数順に返す。`hardware`、`requestedHardware`、`sdk`、`stage` を保存し、
欠けた値は null。上位が停止中なら次のページも確認する。既定は 100 件ずつ最大 3 ページ、
表示は上位 8 件。全件を調べ切っていない場合は `complete` / `spacesComplete` が false。
失敗は `spacesStatus: "unverified"`。試用ページが実際にそのモデルを実行したことや出力の品質は未確認。
モデルとの関連付けと実行状態は公開者・API の申告として扱う。

API の根拠:
https://huggingface.co/docs/huggingface_hub/package_reference/hf_api#huggingface_hub.HfApi.list_spaces 、
https://huggingface.co/docs/huggingface_hub/package_reference/space_runtime 、
https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/hf_api.py 。

`options.fetch` と `options.requestJson` を差し替えられる。日次処理と同じ制限を適用する時は
`const checker = createLinkChecker(options)` の `checker.requestJson` を渡す。
単独の Spaces 検索は最大ページ数と 15 秒の応答待ち時間を持つが、日次の通信予算は共有しない。

## 日次ワークフローに追加する正確なコマンド

静的サイトと世界索引を `site/` に作った**後**、前回の `links-status.json` をキャッシュまたは
前回公開物から `site/links-status.json` に復元し、次を実行する。初回は復元ファイルがなくてよい。
既存のビルドは `site/` を消すので、前回結果の復元は必ずビルドの後に行う。

```sh
node scripts/check-links.js --artifact site --input data/curated --input recipes/catalog --budget 500 --request-budget 5000 --concurrency 4 --host-delay-ms 1000 --timeout-ms 15000 --max-run-ms 900000
```

出力は **`site/links-status.json` のみ**。サイトと一緒に公開し、次回のためにキャッシュへ保存する。
結果を git に追加しない。外の保存先に前回結果を残す構成なら `--previous <保存したJSONのパス>` を指定できる。
明示した前回結果が読めない・壊れている時は失敗し、巡回を最初からやり直さない。

`--artifact` 以下と各 `--input` 以下の JSON、JSONL、`.json.gz`、`.jsonl.gz`、HTML、JS、CSS、Markdown にある
公開 HTTP(S) URL を集め、重複と `#見出し` を除く。世界索引の JSONL は一行ずつ読む。
モデルのファイル一覧・手元用手順・提供元の窓口は `realUseLinks()` で補う。
出典は項目名に依存せず拾うので、デザイン、人格の証拠、ニュース、配布ページも含む。
前回結果自身とシンボリックリンクは収集対象にしない。
端末内・認証情報入り・公開ネットワーク以外の URL は対象外。
サイト内部の相対リンクの検査はこの外部リンク確認の対象外。

**取り込み側で必要なこと:** 画面で動的に取得して表示する Spaces や入手先の情報も、公開物の
`site/data/real-links.json` などへ出力するか、`--input` でその JSON の保存先を指定する。
閲覧時に初めて API から得た URL は、公開物にも入力にもない限り日次処理は知ることができない。
このスクリプトから数百万モデル分の Spaces API を巡回しない。
ローカル利用者の保存先へは暗黙に読み書きしない。

収集だけを確認するコマンド（通信・書き込みなし）:

```sh
node scripts/check-links.js --artifact site --input data/curated --input recipes/catalog --inventory
```

## 確認の動作と結果の形式

HEAD → 失敗時に GET。HEAD の 404 も GET で確かめる。429 は追加アクセスしない。
GET の通常の本文は読まずに閉じ、`Range: bytes=0-1023` を付ける。
モデルの重みや配布ファイルを保存しない。
移動は最大 8 回、各段階を `{ from, to, status, method }` として記録し、
移動先の robots.txt も確認する。リクエストごとに公開ネットワークの宛先か確かめる。

同時通信は既定 4 件、同じホストは 1 件ずつ・1 秒以上の間隔。
robots.txt の `Crawl-delay` が長い場合は長い方を使う。
429/503 の `Retry-After` と全体の時間上限も守る。
robots.txt は実行ごとにホストの公開元につき一度取得し、ルールの長さ・Allow の優先・
ワイルドカード・終端指定・文字の符号化・専用 User-agent の指定を解釈する。
取得不能、401/403/429/5xx の場合は対象ページを調べず `blocked` / `robots-unavailable` とする。
robots.txt の 404 など、ほかの 4xx は禁止指定なしとして扱う。
実装上の根拠: https://www.rfc-editor.org/rfc/rfc9309.html 。

`--budget` は一回に選ぶリンク数、`--request-budget` は通信回数の厳密な上限。
robots.txt、移動先、GET の再確認、Spaces の状態 API も通信回数に含む。
上限で調べられなかったリンクに確認日を付けない。
未確認、最後の確認日の古い順、同日は URL 順で選ぶ。
固定された M 件の一覧で一日 B 件を調べ終えれば `ceil(M/B)` 日で一巡する。
実際の予定値は `rotation.daysAtLinkBudget`、予算・時間不足は `rotation.deferred` で分かる。
通信予算が足りない日やリンクが増えた場合は、この日数を保証しない。

結果は `schema: "memento.links-status.v1"`、`links` は URL をキーにした表。
各結果に `checkedAt`、`lastOkAt`、`state`、`status`、`finalUrl`、`redirects`、`attempts`、
`failureCount`、`consecutiveFailures` がある。

| state | 意味 |
| --- | --- |
| ok | 2xx で開けた |
| redirected | 移動を経て 2xx で開けた |
| gone | GET でも 404/410 |
| failing | 5xx、時間切れ、通信失敗など。失敗回数を増やす |
| blocked | 401/403/429、巡回禁止、確認できない robots.txt など。消失扱いにしない |

成功時だけ `lastOkAt` を更新する。遮断は失敗回数に加えず、連続失敗の記録も消さない。
成功時に連続失敗を 0 に戻す。現在の一覧から消えた URL は結果から除く。
Space のページが対象なら `/api/spaces/<id>/runtime` から `runtime.stage`、機材と確認日も保存する。
`PAUSED` / `BUILD_ERROR` もそのまま記録し、ページの 404 と区別する。
API が読めない場合は前回の状態を `stale: true` として保持し、未確認と表示する。

## 画面とルートへの取り込み

サーバーでは既存の認証・モデル解決を行った後、`realModelLinks(record)` を呼び、戻り値を JSON として返す。
例: `GET /api/models/<id>/real-links`。専用ルートやサーバーの起動はこの作業では追加していない。
利用者から渡された URL を直接 fetch するルートにせず、既存カタログのモデルレコードを渡す。
必要なら `createLinkChecker()` の `requestJson` を共有する。

画面では `web/js/links/status.js` の次の関数を使う。

```js
const index = await loadStatuses(); // 既定は公開サイト直下の links-status.json。配置が違う場合は { url } を渡す。
const record = linkStatus(anchor.href, index);
statusElement.textContent = statusLabel(record);
decorateLink(anchor, index); // title と data-link-state を設定。リンク先は変更しない。
```

例: `最終確認 2026-11-15 ・ 見つかりません ・ 最後に開けた日 2026-10-01`。
確認していない項目・結果ファイルがない場合は「まだ確認していません」。
試用ページの古い状態は現在の状態として表示しない。

## 検証と未確認の範囲

オフラインの固定データのみ:

```sh
node --test test/links/*.test.js
```

テストは外部通信、サーバー起動、ツールの起動、重みの取得を行わない。
一時ファイルは `test/links/` 内で作り、終了時に削除する。
実際の公開 API をこのコードで呼ぶ統合確認、数百万リンクでのメモリー使用量、
日次ワークフローの実行、画面・サーバールートへの取り込みは未実施。
モデルの現在の提供可否、LM Studio の直接検索 URL、Spaces の実際の推論結果、
対応表の 4 件以外の Ollama 名の対応付けは `unverified`。
