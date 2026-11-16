# I2：Civitai・Ollama・NVIDIA NGC・APIモデル

確認日：2026-11-15。`lib/world/CONTRACT.md` に従い、担当の4モジュール、試験、保存した試験用応答だけを追加した。説明文、画像、モデルの本体、ロゴ、フォント、認証情報は保存しない。元のサービスの実装コードもコピーしていない。

## 取得条件と実装の範囲

| 取得元 | 確認した条件・出典 | この実装 |
| --- | --- | --- |
| Civitai | 規約 §11.4 は、本人の有効な認証情報と利用制限を守った公式API等の自動利用を例外として認める。[公式規約](https://civitai.com/content/tos) | 認証付きの公式APIのみ使う。ウェブページは巡回しない。 |
| Ollama library | 規約 §4 は許可のない自動アクセスを禁止する。[公式規約](https://ollama.com/terms) | 名前・タグの自動収集を実装しない。`listingAllowed:false`。総数を確認できる独立した取得先も未確認のため `count:null`。 |
| NVIDIA NGC | NGCが案内する規約の入口と同名の Technology Access Terms を確認。§6(m) はデータ抽出用ツールを制限する。[NGC規約入口](https://ngc.nvidia.com/legal/terms)・[読める公式規約](https://developer.nvidia.com/legal/terms) | この条項を保守的に適用し、一覧取得を実装しない。総数の独立した取得先も未確認のため `count:null`。 |
| models.dev | 公開JSON APIを案内し、元のデータと実装のリポジトリはMITライセンス。[API案内](https://models.dev/)・[ライセンス](https://github.com/anomalyco/models.dev/blob/dev/LICENSE) | `https://models.dev/api.json?type=all` を1回取得し、提供元別にモデルを出力する。 |
| OpenRouter直接取得 | モデル一覧APIの案内はある一方、規約 §7(5) は自動的な収集・複製を禁止する。[一覧API案内](https://openrouter.ai/docs/guides/overview/models)・[公式規約](https://openrouter.ai/terms) | 公開APIがあることだけでは収集許可と判断せず、直接取得を実装しない。`meta.directOpenRouter` に停止と未確認の総数を記録する。models.devに載っている同提供元の名前・事実はmodels.dev経由で扱う。 |

NGCの制限は「User Content」の節にある。これが読み取り専用の公開一覧取得にどこまで適用されるか、NGC向けの別契約が例外を与えるかは **unverified**。現状は許可を仮定しない。公開コンテンツをゲストが閲覧できるという案内は、再配布用の大量収集の許可とは区別した。[公式利用案内](https://docs.nvidia.com/ngc/latest/ngc-catalog-user-guide.html)

取得を止めた2モジュールの `list()` は、通信せず `disabled:true, complete:false` の状態だけを返す。`count()` は `null` と `unverified` を返す。未取得を「0件」「一覧をすべて取得した」と扱わない。

## 回数制限と出典の表示

- Civitai：時間あたりの公開一覧の公称上限は **unverified**。公式文書で確認できたのは、1回100件まで、ページ番号×件数が1000を超えると429になり、その先はカーソル（続きの位置）を使うという制限。[モデル一覧](https://github.com/civitai/civitai-developer-docs/blob/main/site/reference/models.md)・[続きの取得](https://github.com/civitai/civitai-developer-docs/blob/main/site/guide/pagination.md)。実装独自の控えめな間隔として要求の間を最低1秒空ける。1秒はサービスの公称値ではない。
- models.dev：数値による回数上限は **unverified**。公式が案内するJSONを1回取得する。[API案内](https://models.dev/)。日次の取得を想定し、同じ完了状態を渡して再取得を繰り返さない。
- Ollama・NGC・OpenRouter直接取得：収集は停止。収集の数値上限は **unverified**。公開APIの存在や推論（モデルに質問して答えを作らせる処理）の制限を、一覧収集の許可・上限には読み替えない。根拠は上表の規約。
- 429では `Retry-After` の秒数またはHTTP日時に従い、`state.retryAt` を保存する。ヘッダーがない場合は実装側の待機を1分、2分、4分と増やし、最大1時間にする。指定時刻より前の再開では要求しない。長時間の待機で実行を止めず、最後の状態を返して次回へ延期する。
- 自動収集の許可とは別に、独立した追加のクレジット表示義務は Civitai・Ollama・NGC・OpenRouter では **unverified**。各モジュールの `meta.terms`、`meta.sources`、各レコードの `url` に根拠を残す。models.devにはMITの著作権・許諾表示の保持条件がある。[MITライセンス](https://github.com/anomalyco/models.dev/blob/dev/LICENSE)。保存した6件は名前と事実だけの短い標本で、元のソフトウェアや説明文を含まない。大量の元データを再配布する際のライセンス表示は公開側でも保持する必要がある。

## Civitaiの安全確認

W1では変更後の成人向けIDも検出するため、一覧は `nsfw=true` を要求し、さらに返されたモデルと各版の `nsfw` / `nsfwLevel` を確認する。区分は公式の定義に従い PG=1、PG13=2 を許可し、R=4、X=8、XXX=16、Blocked=32 を含むものを除外する。[公式の区分定義](https://github.com/civitai/civitai/blob/main/docs/features/nsfw-filtering.md)。`nsfw:false` でも成人向けのビットがあれば除外する。区分0・不正な値・安全を確認できるフラグのない行は `skippedUnrated` に数えて出力しない。画像の内容やモデル名から区分を推測しない。

`state.excludedNsfw` はこの巡回で実際に受け取って除外した件数。名前やIDの一覧は状態に保存しない。IDだけの一時的な削除通知を返し、再開時の集計には累計の差を使う。外側のnsfwCountは新規出力しない。APIの安全フィルターが最初から返さなかったモデルの総数は分からないため、`state.excludedNsfwTotal:null` とする。

`count()` は認証付きで `limit=1&nsfw=false` の `metadata.totalItems` がある場合だけ、その安全条件付きの総数を返す。追加のローカルなフラグ確認より前の値であり、最終的に掲載できる件数とは限らない。総数がなかったり、返された行があるのに総数が0なら未確認を返す。文書は全エンドポイントが総数を返すわけではないと説明している。[公式の続きの取得案内](https://github.com/civitai/civitai-developer-docs/blob/main/site/guide/pagination.md)

`token` または `authenticated:true` を追加引数として受け取る。前者はHTTPヘッダーにだけ入れ、後者は呼び出し元が渡す `fetch` に認証が設定済みであることを示す。環境変数を勝手に読み取らない。どちらもなければ通信せず `requiresToken:true` を返す。自分の認証情報を用いる必要がある根拠は規約 §11.4。[公式規約](https://civitai.com/content/tos)

一覧が返した次のURLは直接使わず、同じ公式APIの続き位置だけを取り出して安全条件付きURLを組み直す。外部ホスト、埋め込まれた認証情報、循環した続き位置、カーソルのない深いページは拒否する。

## レコードと再開状態

- Civitaiの `id` はモデルID。版ごとに別レコードにしない。ダウンロード数は `stats.downloadCount`、評価数は `stats.thumbsUpCount` を区分にする。[公式の応答定義](https://github.com/civitai/civitai-developer-docs/blob/main/site/reference/models.md)。元の数値がなければ `null`。複数の利用条件フラグからライセンス名を推測せず `lic:null`。公開状態が `Public` の場合だけ `gated:false`、それ以外は不明として `null`。
- APIモデルの `id` は `${providerId}/${modelId}`。提供元の辞書のキーとモデルの辞書のキーをそのまま使う。`a` はこの提供元のキーで、実際に学習した組織を推測するものではない。OpenRouter側のモデルIDに `/` が含まれていても保持する。違う提供元が同じモデルを掲載している場合は別レコード。すべて `r:"api"` とし、重みが公開されているモデルもAPI経由で掲載されていれば含める。出典は各行の `url` に置くmodels.devのJSON。[公式API](https://models.dev/api.json?type=all)・[APIの項目の説明](https://github.com/anomalyco/models.dev)
- APIの `t` は明示された `type` がある場合だけ保存する。用途、利用条件、利用許可、ダウンロード・評価数を名前や出力形式から推測せず、未確認は `null`。契約の数値区分には「不明」がないため、0件を捏造しない安全な拡張として `d/l/gated` の `null` を使う。
- 日付は実在する年月日だけを保存する。月だけの日付を1日に補わない。Civitaiの `u` は返されたモデル更新日と各版の公開・更新日の最大値、`c` は明示されたモデル作成日だけを使う。APIの `c/u` は `release_date/last_updated`。[Civitaiの応答定義](https://github.com/civitai/civitai-developer-docs/blob/main/site/reference/models.md)・[models.devの項目定義](https://github.com/anomalyco/models.dev)
- `since` は日単位、当日を含む。Civitaiの `Newest` が更新日順であるとは仮定できないため、古い行を見つけても先を取得する。日付が不明な行は差分から落とさない。サーバー側の `since` 引数は文書にないため送らない。[Civitaiの取得引数](https://github.com/civitai/civitai-developer-docs/blob/main/site/reference/models.md)
- 最後に必ず `{state}` を返す。共通schemaは `memento.world-progress.v1`。状態は `version:1` と `registry`、`since`、`complete`、今回の要求数、待機時刻、数の集計を含む。Civitaiでは続き位置も保存する。`budget` は0以上の整数で、429や失敗した要求も含む。`budget:0` は通信しない。
- `complete:true` の同じ状態を渡すと追加取得しない。次の巡回は状態を省略するか、異なる日付の `since` を指定する。`since` が変わった場合は前のカーソルを捨てる。
- HTTP失敗、通信失敗、不正な応答では、未完了の状態を一度返してから例外を送る。公開元の説明文やエラー本文を状態に保存しない。

## 標本と実際に実行した確認

- models.devのJSON取得は調査1回、保存用1回の計2回。保存用はHTTP 200。3提供元から各2件、計6件を許可フィールドだけに絞って `test/world/fixtures/api/models-dev.json` に保存。標本のURLと取得日時は同じフォルダーの `provenance.json`。完全な一覧や一時的な実データはプロジェクトへ保存していない。
- CivitaiのモデルAPIは0回。本人の認証情報がないため、公式文書の応答例からフラグと続き位置だけを保存した。例に成人向け区分が含まれるため実在モデルの名前とIDも保存しなかった。出典は `test/world/fixtures/civitai/provenance.json`。テスト内で作る安全なモデルは架空の検証用データであり、実測のモデル情報ではない。
- Ollamaのライブラリ一覧・タグページへの要求は0回。規約ページだけを調査した。NGCのモデルAPIは0回。NGCのトップページ・規約へのリンク・公開JavaScriptの規約案内・公式文書を調査したが、抽出したモデル一覧は保存していない。OpenRouterのモデルAPIは0回。規約とAPI案内だけを調査した。
- 全テストは注入した `fetch` だけを使用し、グローバルの `fetch` を失敗する関数に置き換えてオフラインで実行する。時計と待機も注入し、実際の待機やネットワーク通信に頼らない。
- 実行コマンド：`node --test test/world/registries-2.test.js`。実出力は `tests 24 / pass 24 / fail 0`。

## レビュー時の接続事項（担当外ファイルは変更していない）

W1でビルダーと全登録先の状態を統合した。共通項目は `schema / registry / complete / excludedNsfw`。Civitaiの認証情報は任意の環境変数名 `CIVITAI_TOKEN` からヘッダーにだけ渡す。未設定なら一覧・件数のAPI要求は0回。匿名でも応答する入口があるという[認証資料](https://github.com/civitai/civitai-developer-docs/blob/main/site/guide/authentication.md)と、自分の資格情報を求める[規約§11.4](https://raw.githubusercontent.com/civitai/civitai/main/src/static-content/tos.md)を区別する。

後日の成人向け判定はIDだけの一時的な削除通知で返し、モデル・作り手・主な記録・過去の新着から除く。Civitaiの一覧は `nsfw=true` に変更した。countは従来どおり `nsfw=false` 条件のAPI集計であり、公開する件数とは異なる。未観測の変更、予算外のページ、地域制限によりAPIが返さない変更は未確認。詳細は [共通の約束](../../lib/world/CONTRACT.md)。

未確認：Civitaiの実APIの認証後の挙動・現在の総数・フィルターが省いた成人向けモデル総数、models.dev/Civitai一覧の公称時間あたり上限、Ollamaの名前とタグの完全な範囲と総数、NGCの一覧収集への個別許可と総数、OpenRouter直接取得への個別許可と総数。これらを動作確認済みとは主張しない。
