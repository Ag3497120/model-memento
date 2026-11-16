# ニュースの実装と取り込み方

担当範囲だけを追加しています。`server.js`、`web/js/app.js`、世界図鑑のコード、ビルド、公開の設定は編集していません。サーバー、アプリ、実際の AI は起動していません。

## 情報源と権利

`data/curated/news-sources.json` は51件。公式ブログ・更新履歴16件、開発元リポジトリの公開版23件、arXiv の2分類、個人の書き手4件、公式の頼み方・会話形式ガイド6件です。各行の `evidence`、`url`、`feedUrl` が、その行の情報の出典です。`verification` は公開先へ実際にアクセスした結果です。HTTP の成功は、内容の正しさや再配布許諾の確認を意味しません。

GitHub の公開版は、添付ファイルの一覧が大きい JSON の代わりに、実際に確認した Atom 配信を選びました。JSON の公開版一覧にも実装は対応しています。参照：[GitHub の公開版 API](https://docs.github.com/en/rest/releases/releases)。arXiv は見出しに頼み方・言語モデル・自律作業などの語を含むものだけを採用します。週末など配信に該当記事がない日は0件になります。[arXiv の配信の説明](https://info.arxiv.org/help/rss.html)

フィードが確認できないブログと公式ガイドはページの変更を監視します。`main`、次に `article`、なければページからスクリプトなどを除いた文字列の SHA-256 だけを保存します。初回は比較用の記録を作り、ニュースを発行しません。次の変更で「更新を確認」という記事を作ります。表示日は確認日で、個々の記事の公開日やガイドの改訂日だとは扱いません。画面にもその違いを表示します。ページ監視では個々の記事の見出しを抽出しません。

本文・要旨・画像・外部の文章の抜粋は、取得中のメモリー以外に保存しません。出力は `memento.news.v1` の見出し、リンク、発行元、日付、種類、タグ、対応する既存 ID と、自作の短い AI 要約だけです。過去の保存データを再開するときにも同じ項目の検査を通し、余分な本文フィールドを除きます。フィクスチャの文章・見出し・ドメインはテスト用の架空資料です。

すべての情報源で本文の再配布許諾は **unverified** と明記しました。コードのライセンスから公開版の説明文の転載許諾を推定しません。長文、ロゴ、画面写真、製品の図版、フォントは収録していません。

## 取得と保存

```sh
node scripts/news-fetch.js --out artifacts/news
```

これはレビュー後の実行例です。この作業では `artifacts/` を作っていません。公開するファイルは `news.json`、次回の再開に使うファイルは `snapshot.json`。後者には ETag、Last-Modified、ページのハッシュ、待ち時間と取得の続き位置も入ります。本文はどちらにも入りません。次回は同じ保存先の `snapshot.json` を自動で読みます。別の場所の保存結果を使う場合は `--previous` で指定してください。

通信の既定上限は60回、合計32 MB、1返答2 MB、1情報源10秒、1実行120秒です。移動先の取得も回数に含みます。量の上限を超える受信部分で読み込みを打ち切るため、計測した受信量は最後の1部分の分だけ上限を超える場合があります。その本文を出力には含めません。上限で後半の情報源が毎回取り残されないよう、次の情報源から再開します。429・503 の待ち時間を保存し、その発行元の追加取得を止めます。その他の失敗でも前の記事を残します。保存件数は新しい順に最大2,000件で、日付のない記事は後ろになります。古い返答の本文は残しません。

ETag と Last-Modified は正常に解析した返答だけから保存します。HTTP 304 では前回の記事をそのまま使います。壊れた配信やログイン画面で保存状態を更新しません。HTTP の移動は最大3回。登録先と移動先は公開 HTTPS に限り、IP アドレス、ローカル名、資格情報付き URL は拒否します。DNS の再束縛に対する専用の検証はしていません。情報源はレビューされた一覧から渡してください。

重複は追跡用パラメーターなどを除いた URL、または同じ日付・完全に同じ見出しで判定し、発行元をまとめます。意味の近さでは統合しません。日付が分からない記事に当日の日付を補いません。記事に日付がなく配信全体の掲載日がある場合は `dateBasis: "feed"` で区別します。arXiv は版番号を外して同じ論文へまとめます。

世界図鑑と組み合わせとの接続は、呼び出し元が渡す配列・Map・ID 辞書だけを使います。世界図鑑の `n` / `name`、組み合わせの `title` / `name` が、見出しに大文字小文字も含めて正確に現れる場合に既存 ID を付けます。長い名前の一部だけを前方一致させたり、似た名前を推測したりしません。世界図鑑の短縮形レコードの `r`、`id` も保持します。

```js
import { fetchNews } from './lib/news/fetch.js';
const next = await fetchNews({
  sources, previous, fetch,
  entities: { world: worldRecords, recipes: recipeRecords },
});
```

CLI では `--world` と `--recipes` でこれらの JSON を指定できます。全世界の大きな索引を自動で走査しません。名前の照合に必要な、主要な記録の配列を渡してください。保存先はプロジェクト内の専用フォルダーを明示し、リンクされたフォルダーを拒否します。書き込みは一時ファイルから置き換えます。2ファイル同時の切り替えはしないため、中断直後には公開用一覧が再開用一覧より1回古い場合があります。

## 要約とプロンプト術

```js
import { summarizeItem } from './lib/news/summarize.js';
const itemWithSummary = await summarizeItem(item, {
  actor: selectedActorId,
  complete: authorizedComplete,
});
```

`complete(actor, options)` は既存の呼び出し形式です。モジュール自身はバックエンドを読み込まず、プロセスを起動しません。最大2文・280文字の日本語だけを採用し、「AI による要約」と表示します。既定では見出しにある情報だけを使い、「見出しの情報から作成」と表示します。呼び出し元が権利と内容を確認した本文を `text` に渡せば、一時的な入力として最大12,000文字を使います。その本文は返り値に含めません。生成した要約の事実性・品質は **unverified** であり、原文確認の代わりにはなりません。

`summarizeNews(items, { complete, actor, maxCalls: 10 })` は順に処理し、既存の要約は残します。`CI` / `GITHUB_ACTIONS` が有効なら、`ci: false` が渡っても AI を呼びません。CLI は常に AI 呼び出しなしで一覧を発行します。画面から要約を自動生成する操作や、書き込み用の HTTP 経路は追加していません。利用者が選んだ AI への接続はレビュー側で行ってください。

```js
import { writeTechniqueDrafts } from './lib/news/techniques.js';
await writeTechniqueDrafts(items, { root: projectRoot, existingStyles });
```

または手元で `node scripts/news-fetch.js --out artifacts/news --drafts`。`kind: "prompting"` だけが `data/drafts/styles/<固定ID>.json` へ進みます。CI はこの操作を拒否します。既存の ID、出典や同名の登録済みスタイルを確認し、再実行でも人の編集を上書きしません。公開カタログの保存先は指定できません。

下書きは共有の `memento.style.v1` 検査を通るレビュー用の入口です。発行元、元記事、掲載月、確認が必要な点を持ち、`status: "draft"`、`reviewRequired: true` です。通常の取得では `files: []`、`stage: "needs-source-review"` の確認候補を作ります。見出しだけから個別の命令文を推定しません。

手元の AI で手順案まで作る場合は `extractTechniqueDraft(item, { complete, actor, text })` に、呼び出し元が確認した資料を一時的に渡してください。短い日本語の手順2〜6件を検査し、固定の `project/AGENTS.md` 向けの案を下書き内に作ります。長い連続した引用や未知の項目・保存先は採用せず、資料の本文は返しません。結果は `stage: "needs-instruction-review"`、「AI が作成した下書き」となり、人の確認が必要です。実行も公開も自動では行いません。

まとめて保存する場合は `writeTechniqueDrafts(items, { root, existingStyles, sourceTexts: { [newsId]: text }, extraction: { complete, actor }, maxCalls: 3 })`。作成済みの下書きのために AI を再度呼ばず、件数の上限と CI での AI 禁止も守ります。資料や AI がない場合、不正な返答、時間切れの場合は本文のない確認候補を残します。効果、初出日、アプリとの相性、抽出した手順の正しさは **unverified**。公開カタログには自動で入りません。この作業では担当外の実際の `data/drafts/` には書いていません。テスト用のプロジェクト内に作って削除しています。

## サーバーと画面への取り付け

サーバーにはこの読み取り専用ハンドラーを、既存の経路処理より前へ取り付けてください。`getSnapshot` が読むファイルはホスト側が固定します。クエリーから任意のパスを渡さないでください。

```js
import { createNewsHandler } from './lib/news/routes.js';
const newsHandler = createNewsHandler({
  sources,
  getSnapshot: async () => JSON.parse(await readFile(newsArtifactPath, 'utf8')),
});
// 既存の Node HTTP ハンドラー内で:
if (await newsHandler(req, res)) return;
```

`GET /api/news` は公開する項目だけを返し、`GET /api/news/sources` は発行元と出典・権利の注記を返します。HEAD にも対応し、他の操作には405を返します。マウント位置は `basePath` で変更可能です。

```js
import { mountNewsScreen } from './js/news/screen.js';
const screen = mountNewsScreen(container, {
  endpoint: '/api/news',
  staticUrl: './data/news.json',
  onEntity: entry => openExistingEntity(entry),
});
await screen.ready;
// 画面を離れるとき: screen.destroy();
```

CSS は1回だけ読み込み、`.memento-news` 内に限定しています。静的版は取得で作った `news.json` を公開成果物へコピーして、URL を `staticUrl` に渡してください。既定は画面モジュールから見た `web/data/news.json` です。静的ページでは取得処理や AI は動きません。世界図鑑のビルドや既存の app.js への接続は担当外です。

画面には「ニュース」「プロンプト術」、今日・今週・すべて、種類、検索があります。日本時間の今日と月曜日始まりの今週でまとめ、未来の日付を掲載済みとして表示しません。原文の見出しは言語を保持し、日本語の案内を添えます。発行元、日付、要約の根拠、原文へのリンクを分け、取得エラーや古い確認日も表示します。全件を一度に描かず40件ずつ表示します。外部のデータはテキストとして挿入し、HTML として扱いません。外部リンクには `noopener noreferrer` を付けます。

生成画像、ブランドの装飾、製品の画面の再現はありません。余白、細い罫線、暗い緑のアクセントと、端末の標準フォントだけを使いました。操作は通常のボタンと選択欄なのでキーボードでも届き、更新状況は読み上げ用の領域を持ちます。

## 実行した確認と残る点

オフラインの確認:

```sh
node --test test/news/*.test.js
node scripts/news-fetch.js --sources test/news/fixtures/sources.json --offline test/news/fixtures/run.json --out test/news/.cli-check --budget 2
```

31テストで、RSS / Atom / JSON、名前の正確な照合、重複、304、時間・量・回数の上限、再開、429、ページ変更、本文の除外、AI の注入と不正な返答、CI での AI 禁止、手順案の抽出、下書きの排他的作成・リンク拒否、HTTP ハンドラー、画面の操作と再取得競合を確認しました。テストの画面は最小限の文書オブジェクトを使っています。**ブラウザーでのレイアウト、読み上げソフト、実際の AI 要約・手順抽出、サーバーへの接続、公開サイトでの継続運用は unverified** です。

公開先への通信は、情報源の到達確認と、`fetchNews` を使ったメモリー内での試行だけを実行しました。受信本文や実ニュースの一覧はプロジェクトに保存していません。到達確認は51件で成功。最終の解析確認では、次のコマンドを実行しました。

```sh
node --input-type=module <<'NODE'
import {readFile} from 'node:fs/promises';
import {fetchNews} from './lib/news/fetch.js';
const sources=JSON.parse(await readFile('data/curated/news-sources.json','utf8'));
const result=await fetchNews({sources,budget:{maxBytes:32000000}});
console.log(JSON.stringify({sources:sources.length,items:result.items.length,stats:result.stats,ok:result.statuses.filter(s=>s.status==='ok').length,other:result.statuses.filter(s=>s.status!=='ok')},null,2));
NODE
```

実際の出力は `sources: 51`、`items: 794`、`requests: 54`、`bytes: 20372612`、`ok: 51`、`other: []`。初回はページ監視の14件が比較用のハッシュだけを作るので、成功数は記事のある情報源の数とは異なります。arXiv や公開版の配信にも、その時点で記事がない場合があります。この結果は実行時点のもので、継続的な可用性を保証しません。

オフラインの CLI の実出力は `ニュース: 4件、通信 2回、取得 1505バイト、エラー 0件`。保存結果の検査は `{"items":4,"bodySentinelsStored":false,"privateStatePublished":false}` でした。テスト専用の `test/news/.cli-check` は確認後に削除しました。テストの最終出力は `tests 31`、`pass 31`、`fail 0` です。

レビュー側で必要な判断は、サーバーの固定保存先、画面への入り口、静的成果物のコピー先、利用者の AI 呼び出しを渡す操作、下書きから命令文を記入する編集・レビュー手順です。
