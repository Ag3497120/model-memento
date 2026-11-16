# M5 寄稿の受付と次のサイト更新への受け渡し

この実装は寄稿を決まった規則で検査し、次のビルド用入力、確認待ちの下書き、協力者一覧を生成する。AI、外部プログラムの起動、gitへの書き戻しは使わない。担当範囲外のビルド、サーバー、画面、ワークフローへの接続はレビュー担当が行う。この作業コピーではFactoryのイベント受付実装を発見できなかったため、その実装との互換性は **unverified**。

## 投稿する形

`lib/contrib/schema.js` の `contributionSchema` が正本。1投稿につき1件。余分な項目を拒否し、次の共通項目を必須にする。

```json
{
  "schema": "memento.contribution.v1",
  "kind": "link-status",
  "url": "https://docs.github.com/en",
  "state": "ok",
  "checkedAt": "2026-11-15T00:00:00Z",
  "declarations": {
    "noPersonalData": true,
    "ownWords": true,
    "noRestrictedAssets": true
  }
}
```

この例の状態と日時は書式説明用で、実際のリンク検査結果ではない。利用時に確認し直す。`declarations` は「個人情報を含まない」「自分の言葉で書いた」「禁止された画像や素材を含まない」という投稿者の申告。refresh/enrich側では選んだ事実だけをこの形にし、実行ログや設定ファイルを丸ごと送らない。申告を本人が確認してから投稿する。

掲載名を希望する場合だけ `"credit": { "optIn": true, "displayName": "選んだ表示名" }` を追加する。40文字以内の呼び名を使い、連絡先や本名を入れない。GitHubのログイン名を自動で掲載名にしない。

| kind | 固有の項目 | 結果 |
| --- | --- | --- |
| `link-status` | `url`, `state`: `ok` / `redirect` / `broken` / `unreachable`, `checkedAt`: 時差付き日時 | 別アカウント2件の一致、またはCIの確認で次回入力へ |
| `fact` | `target: {type: model/tool, id}`, `field`, `value`, `sources` | 全出典をCIが読み直して値を発見した場合だけ次回入力へ |
| `persona-draft` | `target`, `summary`（500文字以内）, `traits`（1〜8件、各120文字以内）, `sources` | 管理者の確認待ち |
| `design-draft` | `target`, `layout`（1〜8件、各160文字以内）, `colors`（最大12個の `#rrggbb`）, `fonts`（最大4個の書体名）, `interactions`（最大8件、各160文字以内）, `sources` | 管理者の確認待ち |
| `news-summary` | `target`, `title`（80文字以内）, `summary`（500文字以内）, `publishedAt`（YYYY-MM-DD）, `sources` | 管理者の確認待ち |

出典は2〜6件で、URLの重複を認めず、少なくとも2つの異なるホストを必要とする。別ホストであることは別の運営者であることの証明ではない。HTTPSで、認証情報、検索条件、断片、通常以外のポートを含まない公開ページに限る。画像・フォント・動画・圧縮ファイルなどのURLを拒否する。書体名は説明だけに使い、サイト側は無料の代替書体を使う。ロゴや画面写真の再現は受け付けない。

事実の更新項目は固定する。

- 文字列：`name`, `releasedAt`, `retiredAt`, `license`, `website`。日付は実在するYYYY-MM-DD、websiteは公開HTTPS URL。
- 数：`contextTokens`（整数）, `inputPricePerMillion`, `outputPricePerMillion`。0〜1兆。
- はい／いいえ：モデルの `openWeights`、道具の `supportsMcp`, `supportsAcp`。値はJSONの `true` / `false`。MCPは外部の機能を呼ぶ接続の決まり、ACPは編集画面と作業役をつなぐ決まりを指す。この文は本アプリの項目の定義で、個別製品の対応状況を主張していない。

## イベントと添付の境界

CLIはイベントファイルのパス1つと任意の `--dry-run` だけを受け付ける。公開リポジトリのIssueまたはDiscussionを本人が作成／編集したイベントに限り、`sender.id` と投稿の `user.id` の一致、`type: User`、投稿番号、更新時刻を検査する。PR、コメント、ボット、別人の編集を受け付けない。GitHubのイベント構造については[Webhookの説明](https://docs.github.com/en/webhooks/webhook-events-and-payloads)と[Actionsの対象イベント](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)を参照。

本文はJSON1個そのもの、`json` または `memento-contribution` のコード囲み1個、または次の添付リンク1個だけ。挨拶や命令、追加リンクは混ぜない。GitHubが投稿へのファイル添付を提供していることは[添付の説明](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)で確認した。以下の形は本実装の受入方針で、GitHubの将来のURL形式を保証するものではない。

```text
[contribution.json](https://github.com/user-attachments/files/123/contribution.json)
```

添付URL全体を `ATTACHMENT_PATTERN` と照合する。ホストの部分一致、旧形式、`assets`、認証情報、検索条件、`..`、符号化されたファイル名、任意の保存パスは認めない。添付はHTTP 200かつJSON／テキスト／バイナリ汎用の応答種別のみで、内容は必ず厳密なJSONとして検査する。転送先を一切追わない。実際の添付が転送を要求する場合の利用は **unverified** であり、本文のJSONを使う。

| 上限 | 値 |
| --- | --- |
| イベントファイル | 1 MiB |
| 本文 | 64 KiB |
| 寄稿JSON・添付 | 32 KiB |
| 出典ページ1件 | 256 KiB |
| 保存状態 | 8 MiB、200投稿 |
| JSONの深さ | 16 |
| CIからの確認 | 最大80回／受付処理、添付取得は別に最大1回 |
| DNS確認・各HTTP要求 | それぞれ8秒 |
| リンク報告 | 過去30日以内、未来のずれは最大5分 |

受信量を実際のバイト数で数え、長さの事前申告だけに頼らない。圧縮入力を拒否する。公開先の名前を引いた結果を全件検査し、ローカル／予約アドレスを拒否し、接続先を固定してDNSの差し替えを防ぐ。HTTP要求には認証情報を渡さない。通信先の転送、401/403/429、サーバー障害、時間切れを「リンク切れ」の証拠にしない。

メール、電話、住所の一部形式、秘密のトークン、端末内の場所、制御文字、HTML、実行用記述、素材の要求、制限されたコードや転載を示す記述を検査する。誤検出と見逃しの両方があり、権利の帰属や個人情報を完全には判定できない。本文を持つ3種類は全て管理者の確認待ちにし、自動掲載しない。元本文、GitHubのログイン名やメール、出典の本文、危険な値、内部例外の内容を返信やログに出さない。

## 自動反映の規則

`intake(event, options)` が受付、`buildArtifacts(state, options)` が再確認と出力、`validateState` が保存状態の読取り用。ネットワークは注入した `fetch` だけを使い、CLIでは `createPublicFetcher()` にする。テストは全て偽の応答を注入する。

リンクはアカウントごと・URLごとに最後の有効な報告を1票とする。同じアカウントの複数投稿、別名、再実行で票を増やさない。2つ以上の異なるアカウントが同じ状態を報告した場合は反映する。食い違いがある場合や1票だけの場合はCI自身が確認し、一致した報告だけ反映する。2xxを `ok`、404/410を `broken`、公開HTTPSへの3xxを `redirect` とする。転送先には接続しない。`unreachable` は2アカウントの一致が必要。別アカウントが同一人物でないことは **unverified** であり、この仕組みだけでは複数アカウントによる不正を防げない。

事実は各出典を再取得し、JSONの同じオブジェクト内でID・項目名・値が一致するか、短い本文の範囲にID・項目名・完全な値が揃っていることを確認する。`8192` を `81920` の一部として認めず、別のモデルの値を認めない。HTML内のscript/style/noscriptを外す。短い値は構造化された一致を必要とする。全出典が一致しなければ確認待ち。同じ対象・項目で確認済みの値が衝突した場合も全て保留する。同じ出典の再取得は1回の処理内でまとめ、確認回数を使い切った項目は保留する。

この照合は出典の正確さを保証せず、異なる単位や言い換えの推測もしない。実際のページが日本語の説明だけで項目名を持たない場合などは確認できず保留になる。出典の運営者の信頼性は **unverified**。より厳しい出典の許可リストが必要なら、管理者が `fetch` の手前で設定する。

同じ投稿の編集は置き換え、同じ更新時刻の再実行は重複させない。投稿の更新時刻が保存済みより古いイベントは拒否する。同じ秒に複数編集された場合の完全な順序は **unverified**。Issue削除や別人による編集では保存内容を取り消さないため、管理者が保存状態から削除する。掲載名の取消しは元の投稿から `credit` を除く編集で行える。元の公開投稿に書いた個人情報は本実装から消せないので、最初から送らない。

## 出力とクレジット

`MEMENTO_CONTRIB_OUT` に既存ではないフォルダーを指定する。上書きを拒否し、以下を生成する。失敗した生成物を公開しないこと。

| ファイル | 内容 | サイトに渡せるか |
| --- | --- | --- |
| `build-input.json` | 自動確認済みのリンク・事実、出典・確認方法 | 次回ビルドの入力だけ |
| `credits.json` | 希望した表示名と反映件数 | 可 |
| `review-queue.json` | 下書き3種類 | 管理者の画面だけ |
| `pending.json` | 自動確認できなかった内容の識別子と理由 | 管理者用 |
| `state.json` | 次回用の投稿、匿名の照合値、時刻 | 公開サイトに含めない |
| `reply.txt` | 日本語の受付結果 | 元投稿への返信用 |

`MEMENTO_CONTRIB_KEY` は32バイト以上の秘密。アカウントIDと投稿の場所を鍵付きのハッシュに置き換え、同じ人か同じ投稿かだけ照合する。元のIDやログイン名を保存しない。ただしこの照合値も内部用の仮名データとして扱い、公開しない。秘密の値自体は保存しない。秘密が変わると既存状態の読取りを拒否する。鍵の変更、古い投稿の削除、200件の整理は管理者の作業になる。

協力件数はそのビルドに反映された内容だけ。保留や下書きは数えない。同じアカウントの同じリンク状態／同じ事実をまとめ、同じ表示名の異なるアカウントは1行に合算する。件数は累計ではなく、出典の再確認や取消しで変わる。協力者一覧にはアカウント照合値、連絡先、元投稿の場所を一切入れない。

## CLIとワークフローの取付け

```sh
node scripts/contrib-intake.js --dry-run test/contrib/fixtures/issue.json
node --test test/contrib/*.test.js
```

dry-runは返信文だけを標準出力に出し、ファイルやコメントを作らない。保存状態を読まないdry-runだけは一時的な鍵で試せる。本番では次を信頼できるCIの環境変数から与える。投稿本文で設定させない。

- `MEMENTO_CONTRIB_KEY`：固定した秘密。
- `MEMENTO_CONTRIB_STATE`：前回の `state.json` のパス。初回のみ省略可。
- `MEMENTO_CONTRIB_OUT`：新しい出力フォルダー。
- `MEMENTO_CONTRIB_REPLY`：任意の返信文ファイル。拒否時も一般的な理由だけを作成。既存ファイルを拒否する。
- `GITHUB_REPOSITORY`：期待するリポジトリ名。CLIでは一致を要求する。

単体CLIは受理で終了コード0、投稿の拒否で2、設定や保存の失敗で1。`run()` を呼ぶワークフローは拒否を通常の結果として扱い、返信だけを作る。添付や本文をコマンド文字列へ展開しない。[GitHubの注入攻撃の説明](https://docs.github.com/en/actions/concepts/security/script-injections)を参照。

レビュー担当は `design/contrib-workflow.yml` を既定ブランチの `.github/workflows/contrib-intake.yml` に置く。`MEMENTO_CONTRIB_KEY` をリポジトリのSecretに設定する。初回だけVariable `MEMENTO_CONTRIB_ALLOW_EMPTY=true` で状態を作り、成功後すぐfalseに戻す。以後キャッシュが無い場合は停止し、保存済みの `state.json` を管理者が復元する。キャッシュ喪失を「初回」として扱い既存の票を消してはいけない。[cacheアクション](https://github.com/actions/cache)は保存と読取りを提供する。本実装の動作確認はオフラインであり、実際のキャッシュ復元は **unverified**。

ワークフローは受付と返信の権限を分け、既定ブランチのコードだけを実行する。共有状態の更新は `queue: max` の同じ組で直列化する。GitHubの待機上限は100件なので、上限を超えて取消しになった実行は管理者が再実行する。[同時実行制御の説明](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)。返信には[IssueコメントAPI](https://docs.github.com/en/rest/issues/comments#create-an-issue-comment)と[Discussionへのコメント操作](https://docs.github.com/en/graphql/reference/discussions#adddiscussioncomment)を使う。

公開用の受け渡し名は `memento-contrib-build-input`（build-inputとcreditsだけ）。管理者用は `memento-contrib-review-and-state`。Actionsの生成物の受け渡しは[公式説明](https://docs.github.com/en/actions/tutorials/store-and-share-data)に従う。管理者用とは「Pagesに置かない」の意味で、Actionsの生成物を秘密の保管庫とみなしてはいけない。ここにも元の個人情報を入れない。

## ビルドとサーバーの取付け

次の公開処理は、このリポジトリの既定ブランチでこの受付ワークフローが成功した実行からだけ生成物を取得する。PRの生成物、任意のURL、投稿で指定した実行番号を信頼しない。保存状態とビルド用入力には署名を付けていないので、この取得元の確認が必須になる。

毎回の公開ビルドで、保存状態を `validateState` に通し、`createPublicFetcher()` を渡して `buildArtifacts` でもう一度確認する。これによりリンクの期限と出典の再確認を反映できる。古い `build-input.json` を無期限に使い回さない。`buildArtifacts` を直接呼ぶ場合は、先に必ず `validateState` を呼ぶ。生成し直した `credits` だけを公開データとして保存する。

```js
import { validateState, buildArtifacts } from './lib/contrib/intake.js';
import { createPublicFetcher } from './lib/contrib/fetch.js';
import { applyBuildInput } from './lib/contrib/artifacts.js';

const state = validateState(savedState, { contributorKey: process.env.MEMENTO_CONTRIB_KEY });
const checked = await buildArtifacts(state, { fetch: createPublicFetcher() });
applyBuildInput(checked.buildInput, { setFact, setLink });
```

`setFact(target, field, value, {sources, evidence})` と `setLink(url, state, {checkedAt, evidence})` はビルド側の関数。既存IDの確認と各データ形式への項目の対応付けを行う。存在しないIDから新しいレコードやファイルを作らない。引数をパス、コマンド、環境変数にしない。`applyBuildInput` は全件の検査を終えてからコールバックを呼ぶ。コールバックの失敗時にはビルド全体を公開しない。既存レコードのどの項目を置き換えるかはレビュー担当が取付け時に決める。

サーバーは `createContributionHandler({readArtifact, authorize})` をほかのルートより前に呼ぶ。`readArtifact` は信頼できる生成物から指定のファイル名だけをJSONで返す関数、`authorize` は既存の管理者認証を確認する関数。未指定なら管理者ルートを拒否する。未処理のURLはfalseを返す。

```js
import { createContributionHandler } from './lib/contrib/routes.js';
const contributions = createContributionHandler({ readArtifact, authorize: existingAdminCheck });
// 既存のリクエスト処理の先頭：
if (await contributions(req, res)) return;
```

- 公開：`GET /api/contrib/credits` と `GET /contributors`。
- 管理者：`GET /api/admin/contrib` と `GET /admin/contributions`。下書きの一覧と出典を文字として表示する。画面を返す `renderCreditPage` / `renderReviewPage` も公開している。
- 管理者は出典と権利を確認後、既存のレビュー付き公開手順へ下書きを渡す。このモジュールには下書きの自動承認や公開操作はない。

`server.js`、`scripts/world-build.js`、`scripts/build-web.js`、`.github/**`、`web/**`、refresh/enrichの既存ファイルは変更していない。取付けと実際のサイト反映、管理者認証の結合、GitHub返信、ブラウザでの見た目、実サイトの出典取得は **unverified**。

## 検査

`node --test test/contrib/*.test.js` は通信や外部プロセスを使わず、架空のイベント・応答と担当テストフォルダー内の一時ファイルで検査する。攻撃的な本文、容量超過、別ホスト、余分な項目、個人情報、権利の申告、同じ人の再投稿、古い編集、複数人の一致、出典の相違、転送、DNS、管理者以外のアクセス、実際のCLIの保存処理を含む。

ワークフロー自体のGitHub上での実行やYAML検証器は実行していない。CI用の依存関係準備はワークフロー案の中に記載しただけで、この作業中にインストールは行っていない。
