# 登録先 I1：Hugging Face・ModelScope・Kaggle

確認日：2026-11-15。`lib/world/CONTRACT.md` に従い、モデルの名前と事実だけを返す。画像、説明文、モデルカード、配布ファイルは保存しない。外部サービスの情報は下記の出典と、許可された場所に保存した小さな応答見本に基づく。

## 到達した範囲

| 登録先 | 一覧・再開 | 日付による差分 | 総数 |
| --- | --- | --- | --- |
| Hugging Face | 応答の続き位置を使う方式を実装。全件走査は未実行 | 更新が新しい順。指定日時より前で停止 | 公開一覧ページの `numTotalItems`。見本取得時は **3,239,123**。除外対象も含む。[API説明](https://huggingface.co/docs/huggingface_hub/package_reference/hf_api#huggingface_hub.HfApi.list_models)・[一覧ページ](https://huggingface.co/models) |
| ModelScope | 公開APIの上限 **3,000件** まで。上限では未完了を明示 | 更新が新しい順。指定日時より前で停止。上限に届けば未完了 | `total_count`。見本取得時は **289,328**。除外対象も含む。[公開仕様](https://www.modelscope.cn/.well-known/openapi.json)・[取得元](https://modelscope.cn/openapi/v1/models?page_number=1&page_size=50&sort=last_modified) |
| Kaggle | 規約に従い無効。ネットワーク呼び出しなし | 無効 | **null / unverified**。独立した総数取得方法を確認できず。[規約4節](https://www.kaggle.com/terms)・[調べた公開ページ](https://www.kaggle.com/models) |

ModelScope の全件列挙、Kaggle の列挙と数値の取得は達成していない。制限を回避するための非公開API、検索語の大量分割、別ホストへの切り替えは実装していない。

## 規約・自動利用・出典の表示

### Hugging Face

公式資料は公開情報を読むAPIと公式クライアントを案内している。利用規約の公開ユーザー内容に関する許諾と、個別ライセンスを尊重する条件を読んだ。公開APIから名前・数値・タグを取得する実装とした。これは当実装の適用判断であり、規約の例外や特別な許可を得たという意味ではない。[API方針](https://huggingface.co/docs/hub/api)・[利用規約「Your Content」](https://huggingface.co/terms-of-service)

公表値は未ログインのAPIが **500回/5分**、無料ログインが **1,000回/5分**。未ログイン値は変更される可能性がある。HTMLの件数確認には別のページ枠 **100回/5分** が適用される。コードはAPIを650ミリ秒、件数ページを3,100ミリ秒以上の開始間隔で扱い、応答ヘッダーのより厳しい条件を優先する。[回数制限](https://huggingface.co/docs/hub/rate-limits)

利用規約では個別のライセンス表示を取り除かないことを求めている。各レコードに元ページの `url` と確認できた `lic` を残す。サービスの図柄やロゴは使わない。[利用規約](https://huggingface.co/terms-of-service)

### ModelScope

ユーザー規約の版は2025-08-20更新、2025-08-27発効。3.2.1 は公開ユーザー内容の利用について定め、3.3 と5.1.3 は個別ライセンスの遵守を求める。4.1 のサービス妨害禁止にも従う。公式案内が構造化データの大量検索に公開OpenAPIを案内しているため、この入口だけを使う。[ユーザー規約](https://www.modelscope.cn/docs/agreements/terms)・[公式の接続案内](https://www.modelscope.cn/llms.txt)

取得回数の公表値は **unverified**。推論APIの枠をモデル一覧の枠と同一視しない。当実装の初期間隔を1秒とし、429応答と待ち時間の指定に従う。各レコードの `url` と `lic` に出典と利用条件を残す。[調べた公開仕様](https://www.modelscope.cn/.well-known/openapi.json)・[規約](https://www.modelscope.cn/docs/agreements/terms)

公開仕様は `page_size <= 50` かつ `page_number * page_size <= 3000`。`sort` は `default / downloads / likes / last_modified` であり、作成日時の並べ替えは利用できない。実際に `created_at` を試した1回はHTTP 400で、許される値を返した。公式SDKも3,000件の制限を検査している。[公開仕様](https://www.modelscope.cn/.well-known/openapi.json)・[公式SDK](https://github.com/modelscope/modelscope_hub/blob/main/src/modelscope_hub/_openapi.py)

このため全289,328件の取得を完了扱いにしない。60ページ目の後は `page: 61, complete: false, reason: "source-limit"` を返す。続けても追加の要求は送らない。全件用の公式書き出し、または別の正式な取得方法が必要であり、その存在は **unverified**。[総数を確認した応答](https://modelscope.cn/openapi/v1/models?page_number=1&page_size=50&sort=last_modified)・[取得上限の仕様](https://www.modelscope.cn/.well-known/openapi.json)

### Kaggle

2025-06-22発効の規約4節はページ・データの巡回取得を禁止し、大きな部分の保存も禁じている。一方、公式APIの案内は自動スクリプト向け認証を紹介し、公式クライアントにはモデル一覧機能もある。API案内だけで全件の再掲載が許可されたと判断せず、今回の「禁止なら一覧を実装しない」という指示を優先した。[利用規約](https://www.kaggle.com/terms)・[API案内](https://www.kaggle.com/docs/api)・[公式クライアント](https://github.com/Kaggle/kaggle-api/blob/main/src/kaggle/api/kaggle_api_extended.py)

`meta.automatedListing: false` を設定。`list()` は `mode: "count-only", disabled: true, complete: false, reason: "terms"` の状態だけを返す。公開モデルページの小さな確認では総数を見つけられなかった。`count()` は `null / unverified` を返す。回数制限、専用の集計口、一覧再利用の追加許可は **unverified**。追加の問い合わせは送信していない。[規約](https://www.kaggle.com/terms)・[調べたページ](https://www.kaggle.com/models)

## Hugging Face の全件取得方法と費用

採用した要求は次の形。`expand` は返す項目を絞る指定で、README、モデルカード、配布ファイル一覧を要求しない。ライセンスは `license:` タグから読む。[項目選択の公式説明](https://huggingface.co/docs/huggingface_hub/package_reference/hf_api#huggingface_hub.HfApi.list_models)

```text
GET https://huggingface.co/api/models
  ?limit=1000&sort=lastModified&direction=-1
  &expand=author&expand=createdAt&expand=lastModified
  &expand=downloads&expand=likes&expand=pipeline_tag
  &expand=tags&expand=gated&expand=private
```

次ページは `Link` ヘッダーの `rel="next"` から不透明な `cursor`（続き位置）だけを取り出す。指定したURLをそのまま実行せず、同じホスト・同じAPIかを確認し、固定した項目選択と並べ替え条件で要求を作り直す。公式クライアントもLink方式を利用し、公式リポジトリの協力者がcursor利用を説明している。[公式クライアントのページ処理](https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/utils/_pagination.py)・[公式リポジトリでの案内](https://github.com/huggingface/huggingface_hub/issues/2741)

公開の一括データとして **cfahlgren1/hub-stats** を確認した。カードは日次更新とApache-2.0を表示し、モデル用のParquetファイルを案内する。公式CLI資料もこのデータを例に使っている。ただし、今回読んだ資料では、会社が提供する完全な公式書き出しである保証、欠落なしの保証、最新時点の保証を確認できない。**公式の完全な一括書き出しとしては unverified** とし、依存しない。Parquetを読む追加ライブラリも入れていない。[データカード](https://huggingface.co/datasets/cfahlgren1/hub-stats)・[公式CLI資料](https://huggingface.co/docs/huggingface_hub/en/guides/cli)

見本は `test/world/fixtures/hf/sample.json`。2026-11-15 13:14 UTC前後に、更新順の連続2ページを調べた。各ページで **1,000件** と次ページのLinkを確認した。これは1,000件で動く測定であり、すべての過去ページや、より大きなページサイズの成功を確認したという主張ではない。[実際の取得入口](https://huggingface.co/api/models?limit=1000&sort=lastModified&direction=-1&expand=author&expand=createdAt&expand=lastModified&expand=downloads&expand=likes&expand=pipeline_tag&expand=tags&expand=gated&expand=private)

| 測定 | 1ページ目 | 2ページ目 |
| --- | ---: | ---: |
| 受信件数 | 1,000 | 1,000 |
| `fetch` 開始から本文受信まで | 464 ms | 383 ms |
| 展開後のJSONバイト数 | 357,651 | 350,811 |
| 応答の枠 | 500回/300秒 | 500回/300秒 |

表は保存した応答見本の測定値。別途、作成順の確認を1要求だけ行い、1,000件・425 ms・355,769 bytesだった。モデル一覧の小さな確認は計 **3要求**。全件を取得する実験はしていない。[取得API](https://huggingface.co/api/models)

以下は、見本と公開総数からの**計算上の見積もり**であり、全件実測ではない。

- 3,239,123件を1,000件ずつ読むと **ceil(3,239,123 / 1,000) = 3,240要求**。開始時点をちょうど320万件とするなら3,200要求。総数確認はさらに1ページ要求。[件数の出典](https://huggingface.co/models)
- 公表API枠で単純に割ると、未ログインは **32.4分相当**、無料ログインは **16.2分相当**。5分固定枠の開始位置による待ち方は変わるため、これは厳密な最低経過時間ではない。[枠の出典](https://huggingface.co/docs/hub/rate-limits)
- 実装の650 msの開始間隔なら **約35.1分**。2ページの平均423.5 msが続く仮定では回数間隔が支配的になる。応答遅延、他の利用者による同一IP枠の消費、429、再試行、再開待ちは加算される。[見本の取得入口](https://huggingface.co/api/models)・[共有枠の説明](https://huggingface.co/docs/hub/rate-limits)
- 同じJSON量が続く仮定では **約1.15 GB** の展開後データ。ただし、タグの数がページによって変わるので、通信量の保証ではない。配布ファイルは読まない。[項目の説明](https://huggingface.co/docs/huggingface_hub/package_reference/hf_api#huggingface_hub.HfApi.list_models)

## 再開、差分、予算

実装上の約束：

- `budget` はその呼び出しで実行する要求数。429の再試行も1回に数える。省略時は100回、0なら要求も待機もしない。明示的な `Infinity` は許す。
- JSONに保存できる状態に `v / registry / since / cursor` または `page / complete / reason / notBefore` と数値の観測件数を残す。`requests` だけは呼び出しごとに0から数える。完了後も最終状態を返し、同じ完了状態を渡した再実行は通信しない。
- `since` は更新日時の下限。UTC日付はその日の0時、日時は指定した瞬間を使う。境界は含む。同じ続き位置で `since` を変えることは拒否する。新規到着だけ欲しい呼び出し側は `c` で選ぶ。
- 不明な更新日時では停止しない。モデル登録先が保証する更新順を前提に、最初の古い日時で止める。[HFの並べ替え項目](https://huggingface.co/docs/huggingface_hub/package_reference/hf_api#huggingface_hub.HfApi.list_models)・[ModelScopeの並べ替え項目](https://www.modelscope.cn/.well-known/openapi.json)
- 429は `Retry-After` の秒数/HTTP日付、`RateLimit` の残り時間、`RateLimit-Policy` の枠を読み、厳しい方を守る。指定がなければ1、2、4…最大60秒の待機。待機期限を `notBefore` に残すので予算切れ後も次回の取得を早めない。[HFのヘッダー説明](https://huggingface.co/docs/hub/rate-limits)
- 通信失敗、HTTPエラー、壊れた応答では未完了の状態を返す。エラー本文やモデルの説明を状態に写さない。正常に読み終えたページだけ位置を進める。
- 追加の `sleep / now` 注入はオフライン試験用。実運用で省略すれば標準タイマーを使う。通信は必ず注入された `fetch` だけを使う。

更新中の登録先を一瞬の完全なスナップショットとして扱える保証は **unverified**。一覧の先頭へ移動したレコードや走査中に増えたレコードを補うため、呼び出し側は全件走査の**開始前の日時**を保存し、完了後にその日時以前から差分を重ね、同じidを上書きする必要がある。削除検出と、既に公開したモデルが後日NSFWになった際の除去は、従来の件数だけの契約では表せなかった。W1では除外対象のIDだけを一時的な削除通知で返し、公開物から取り除く。未観測のページの変更は未確認のまま。

## レコードの対応と除外

| 契約の項目 | Hugging Face | ModelScope |
| --- | --- | --- |
| `id / a / n` | `id`、`author`（なければidの所有者部分）、idの末尾 | `id`、idの所有者部分、idの末尾 |
| `t` | `pipeline_tag` | `tasks` の先頭の文字列。登録先の分類をそのまま残す |
| `c / u` | `createdAt / lastModified` をUTC日付へ | `created_at / last_modified` をUTC日付へ |
| `d / l` | `downloads / likes` を契約の段階値へ | 同左 |
| `lic` | `license:` タグ。カード本文は読まない | `license` |
| `gated` | falseはfalse、true/auto/manualはtrue、不明はnull | 同じ変換。見本でtrue/falseを確認 |
| `url` | モデルの公開ページ | モデルの公開ページ |

項目の出典：[HFの一覧とModelInfo](https://huggingface.co/docs/huggingface_hub/package_reference/hf_api#huggingface_hub.HfApi.list_models)・[ModelScopeの公開仕様](https://www.modelscope.cn/.well-known/openapi.json)。段階値は外部サービスの定義ではなく本契約の区切りで、0、1–99、100–999、1,000–9,999、10,000–99,999、100,000–999,999、1,000,000以上。数値がない場合は0と決めつけずnull。

HFはNFAAの表示を公式方針に含め、実応答でも `not-for-all-audiences` タグを確認した。実装はこのタグと `nsfw` を除外し、`state.excludedNsfw` の累計を残し、IDだけの一時的な削除通知も返す。実データの除外対象の名前は見本にも残さない。[コンテンツ方針](https://huggingface.co/content-policy)・[確認した一覧](https://huggingface.co/api/models)

ModelScopeにも同じ明示タグ、`custom_tag:nsfw` と明示的な `nsfw: true` を拒否する防御を入れた。ただし、専用の公式NSFW分類や、そのタグ体系の網羅性は **unverified**。安全性の自動判定や名前からの推測はしない。`private: true` も出力しない。見本取得時に非公開データは要求していない。[項目・タグの仕様](https://www.modelscope.cn/.well-known/openapi.json)

## オフライン試験と見本

実際に実行した環境：`node --version` → `v22.17.0`。

`node --test test/world/registries-1.test.js` の最終結果：`tests 32 / pass 32 / fail 0 / skipped 0`（初回は26件すべて合格。その後、再開をまたぐ待機増加、成功応答の残り枠、不正なidの条件を追加）。小さな応答見本に偽の `fetch` と時計を使い、ページ継続、JSON保存後の再開、429の待機、予算0/1/2、日付境界、不明日付、エラー時の位置保持、段階値、公開対象の選別、他ホストのLink拒否、ModelScope上限、Kaggle無通信を確認した。実際の登録先を試験中には呼ばない。

`hf/sample.json` は連続2ページから安全な数件だけを残したもの。`modelscope/sample.json` は50件ページから2件だけ。元の受信件数と総数は別の数値として残した。`cases.json` は架空の `fixture/*` による追加条件で、実在モデルについての主張ではない。NSFW例も架空。Kaggleは `policy.json` に判断と未知の総数だけを残す。

## レビュアーへの接続上の注意

W1で状態を `memento.world-progress.v1` に統合した。完了は `complete`、巡回中の累計除外数は `excludedNsfw`。旧done/nsfwは読み込み時だけ移行する。ビルダーは累計の差を数え、削除通知と二重に足さない。完了したモデル状態は次のdeltaの前に捨てる。予算に達したfullは次週のfullでも続きから進む。ModelScopeのsource-limit、Kaggleのtermsは未完了のまま。詳しくは [共通の約束](../../lib/world/CONTRACT.md)。

未確認事項：HF全件走査の成功と実時間、公式完全書き出しの存在保証、ModelScopeの全件用正式ルート・回数枠・専用NSFW分類、Kaggleの総数・回数枠・再掲載の追加許可。いずれも推測値を本番の事実にしていない。
