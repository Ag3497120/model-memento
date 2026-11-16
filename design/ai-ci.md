# AI による日次保守

既存の収集・組み立て・公開処理はそのまま動かす。AI は資料の変更案だけを返す。
既定は人が確認する PR。直接反映は管理者が明示して選ぶ。

```text
auto-sync.yml（日次の決まった処理）→ world-pages.yml → 公開済みデータ
  ↓ 成功した workflow_run、既定ブランチ、同じリポジトリだけ
ai-maintain.yml（全体を ai-maintain の同時実行グループで直列化）
  collect [読取りのみ、AIなし、秘密なし]
    公開済み一覧＋保存済みの確認状態＋リポジトリの資料
    → ai-input（ai-work.json、sources/*.json、本文のない state.json）
  ai [contents:readのみ、モデルの鍵だけ]
    固定プロンプト＋資料のデータファイル
    → ai-patch/ai-patch.json（JSONの差分、プログラムではない）
  validate [新しいcheckout、AIなし、秘密なし]
    元ファイルのハッシュ→保存先→形式→出典→権利→容量→npm test
    → ai-validated/ai-validation.json、実行結果の要約
  land [AIなし、この段階だけGitHubの書込み権限]
    元ブランチが検査時と同じか再確認、書込みは非強制更新
    ├ 既定: ai/daily-YYYY-MM-DD にコミットしてPR
    └ AI_AUTOMERGE=true: 既定ブランチへ AI保守 YY.N
       → pages.yml を明示的に起動 → world-pages.yml の既存検査と公開・保存・巻戻し
```

## 設定する名前

秘密は `ANTHROPIC_API_KEY` または `OPENAI_API_KEY`。両方あれば前者を選ぶ。
どちらもなければ AI を呼ばず、検証・反映も見送る。秘密の有無は ai ジョブ内で判定する。
GitHub の `if` には秘密を直接置けないため、鍵のない場合にも ai ジョブの準備までは動く。
[GitHub の秘密の扱い](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#using-secrets-in-a-workflow)

リポジトリ変数は `AI_MAINTAIN`、`AI_AUTOMERGE`、既存の `WORLD_SITE_URL`。
`AI_MAINTAIN=off` で各ジョブを止める。停止中の処理には実行の取り消しも使う。
`AI_AUTOMERGE` を未設定または `false` にすると PR、`true` にすると直接反映。
手動の `dry_run=true` は AI の利用と検査だけを行い、GitHub への反映と確認状態の保存をしない。
既定ブランチの保護規則が直接反映を許可しなければ、その反映は失敗する。規則を回避しない。
PR 作成はリポジトリ側でも Actions に許可する必要がある。
[GitHub のトークン権限](https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)

独自の書込み用秘密は不要。`GITHUB_TOKEN` の書込み権限は land の
`contents:write`、`pull-requests:write`、`actions:write` だけ。
最後の権限は、直接反映後の `pages.yml` の明示起動に使う。
`GITHUB_TOKEN` による通常の push は別の workflow を起動しない一方、
`workflow_dispatch` は起動するため、この一手間が必要。
[GitHub の起動規則](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow)

## 作業候補と確認状態

`collect.js` は `WORLD_SITE_URL` の `data/models.json`、`data/news-snapshot.json`、
`links-status.json` を優先し、リポジトリ内の一覧・自動同期データを補う。
上流の実行から実行ファイルを受け取らない。公開済みのデータだけを取得する。
大きい世界索引の全件展開はしない。サイトに昇格したモデルが対象で、未昇格の世界索引は対象外。
新着一覧に出典がなければモデル名から URL を想像せず見送る。

- モデル: 一日3件まで。既存 persona の識別名と別名を調べる。既存の lifecycle がないモデルは
  記録不足として model-records と models-updates の候補にもする。これは記録ページの存在そのものの検査ではない。
  日付と予約済み識別名を状態に保存し、同日の再実行でも上限を共有する。
- ニュース: 既存の要約を除いて8件まで。本文を取得できなくても見出しだけの要約は可能。
- ガイド: G1 の発行元ごとのファイルを読み、資料の本文からタグと script/style を除いた文章の
  sha256 が変わったものを5ファイルまで。初回も点検対象。`publisherSchema` で形式を検査する。
- リンク: gone/failing の5件まで。blocked は消滅と判断しない。移動先など既存の出典だけから候補を作る。
  調査資料のないリンクは candidate:null、status:unverified の説明だけにする。URLの自動置換はしない。
- 傾向: 最後に採用した prompting-trends の checkedAt から7日以上経過したら、prompting/research の
  ニュースをもとに候補を作る。採用されなければ次回も点検対象。

`.ai-state/state.json` に保存するページの情報は URL、ETag、Last-Modified、文章の sha256、確認日時だけ。
最大500ページ。ページ本文を cache、コミット、確認状態へ入れない。
既存の共通 public fetcher は条件付きヘッダーを送らないため、現在の実運用では本文を再取得して
sha256 で変更を判定する。ETag/Last-Modified は将来の条件付き取得にも使える記録として保存する。
注入可能な fetcher では304にも対応する。失敗や拒否を「変更あり」と判断しない。
HTTP応答、認証情報、非公開IP、リダイレクトを拒否する既存の寄稿用取得処理を使う。
DNS の検査と接続先の固定も既存処理に任せる。

## 上限

取得は24回、1応答100,000バイト、AIに渡す文章は1資料24,000バイト。
資料の artifact は1日で削除、差分と検証結果は7日で削除する。
差分は600,000バイト、24ファイル、1ファイル300,000バイト、1ファイルの増加24,000バイト、
合計増加120,000バイト。curated 全体は梱包見積もりも含め10MB以内。
この制限は一つの実行ごとの制限であり、全履歴の永久的な無制限保存を許可するものではない。

Claude は8ターン・3米ドルまでを CLI 引数で指定。Codex は読取り用の道具と
出力形式を限定し、ai ジョブ全体を12分で打ち切る。Codex の厳密なターン数・金額の上限は
この action の確認済み入力にはないため **unverified**。アカウント側にも支出上限を設定する。
時間制限は金額の保証ではなく、課金単価や返金も保証しない。
[Claude の CLI 引数](https://code.claude.com/docs/en/cli-reference)
[Codex action の入力](https://github.com/openai/codex-action/blob/bdf19a4a223ec2549a3e2274a0cf61556bc07675/action.yml)

## 公式アクションと固定した版

2026-11-16 に公開ページとタグの参照先・action.yml を読み、次の action を完全なコミット番号で固定した。
実際の GitHub 実行や有料 API 呼出しは実施していない。

|用途|版|コミット|確認元|
|---|---|---|---|
|Claude Code|v1.0.276|f3b070c88125d33dbae5653df5f143101d4ea9dc|[タグ](https://github.com/anthropics/claude-code-action/tree/v1.0.276)、[入力と出力](https://github.com/anthropics/claude-code-action/blob/f3b070c88125d33dbae5653df5f143101d4ea9dc/action.yml)|
|Codex|v1.13|bdf19a4a223ec2549a3e2274a0cf61556bc07675|[タグ](https://github.com/openai/codex-action/tree/v1.13)、[入力](https://github.com/openai/codex-action/blob/bdf19a4a223ec2549a3e2274a0cf61556bc07675/action.yml)|
|checkout|v7.0.1|3d3c42e5aac5ba805825da76410c181273ba90b1|[リリース](https://github.com/actions/checkout/releases/tag/v7.0.1)|
|setup-node|v7.1.0|949feb2413d6458794dcd2491c4babbbce0c15c1|[リリース](https://github.com/actions/setup-node/releases/tag/v7.1.0)|
|upload-artifact|v7.0.2|cf430e030ddbb5b0abf93d22962f4752f3646cd9|[リリース](https://github.com/actions/upload-artifact/releases/tag/v7.0.2)|
|download-artifact|v8.0.2|9000827ccba6bdab643e8b6fd33ac0654aef8333|[リリース](https://github.com/actions/download-artifact/releases/tag/v8.0.2)|
|cache restore/save|v6.1.0|55cc8345863c7cc4c66a329aec7e433d2d1c52a9|[リリース](https://github.com/actions/cache/releases/tag/v6.1.0)|

Codex の CLI も `0.169.0` に固定した。
[CLI の公開版](https://github.com/openai/codex/releases/tag/rust-v0.169.0)
Claude action 内部の CLI とその内部依存はこの変更では固定できていない。
既存の contrib-intake.yml の action の版は今回変更していないため、この作業では **unverified**。

## 制限できる道具と残る危険

Claude は `--tools Read` と明示した許可・拒否、空の MCP 設定を指定し、
資料の読取りだけを依頼する。プロンプトは追跡対象の固定ファイルで、ページ本文を連結しない。
公式 action は GitHub 用の基本の道具を独自に追加する場合がある。
道具の制限はネットワーク全体の防火壁ではなく、これだけで任意の送信が不可能とは保証しない。
独自の GitHub App の書込みトークンを取得させないよう `github_token` に contents:read の
実行トークンを明示している。AI への書込み用トークンはない。
[Claude action の道具設定](https://github.com/anthropics/claude-code-action/blob/f3b070c88125d33dbae5653df5f143101d4ea9dc/docs/configuration.md)

Codex は `:read-only` と `drop-sudo`、web_search=disabled、shell_tool=false を指定。
併せてコマンド実行の別経路、子エージェント、アプリ、プラグイン、フックなども無効にする。
専用の codex-home に、今回の資料だけを返す Node 製の stdio の道具 read_data を設定する。
HTTP待受けはなく、任意の保存先・コマンド・URLを引数で渡す機能もない。
この道具を起動する Node スクリプトは scripts/ai-maintain/ 内だけ。
Codex 本体の shell_tool の設定は公式ソースにも存在する。
[設定項目のソース](https://github.com/openai/codex/blob/rust-v0.169.0/codex-rs/features/src/lib.rs)
action の権限設定とプロセスの権限削減は別の防御。
モデルAPIと action 自身の配布物取得には通信が必要であり、それらを含むジョブ全体の通信先制限は
この workflow 単体では保証しない。必要なら隔離した使い捨て実行環境の出口制限を追加する。
[Codex action の安全策](https://github.com/openai/codex-action/blob/bdf19a4a223ec2549a3e2274a0cf61556bc07675/docs/security.md)

|危険|対策|保証できないこと|
|---|---|---|
|ページ中の悪意ある指示|固定プロンプト、データファイル化、読取り用の道具、AIと書込みジョブの分離|意味を理解した誤った文章の生成|
|秘密の送信|AIにはモデルの鍵だけ、GitHubは読取りのみ、Codexは権限削減、ログをartifactにしない|CLI/action自体の欠陥、モデル用の鍵の完全な秘匿|
|コードの混入|厳密なJSON差分、保存先一覧、元ファイルのハッシュ、画像・HTML・秘密の形式検査|文章だけの誤情報や権利侵害の完全な判定|
|外部・内部URLへの取得|収集でのみ公開HTTPSを検査、接続先IP固定、リダイレクト拒否、回数と容量の上限|出典URLが主張を本当に裏付けるかの自動保証|
|増え続けるデータ|件数・増分・全体容量・資料保持日数|将来の整理不要の保証。上限到達時は人が整理する|
|古い結果による上書き|基準コミット固定、着地前のHEAD比較、非強制更新、world-pagesとの反映直列化|検査後に他の公開が番号を先に使う競合|

## 手元で実行する

以下は利用者が後で明示して実行するコマンド。この実装作業では CLI の起動・有料AI利用・インストールを行わない。
既存の Node 20以上と依存関係、本人が設定済みの `claude` または `codex` が必要。

```sh
node scripts/ai-maintain/collect.js --offline --out .ai-input
node scripts/ai-maintain/apply-local.js --actor claude
node scripts/ai-maintain/apply-local.js --actor codex --online
node scripts/ai-maintain/apply-local.js --proposal path/to/ai-patch.json
node scripts/ai-maintain/validate.js --patch path/to/ai-patch.json --work .ai-input/ai-work.json
node --test test/ai-maintain/*.test.js
```

apply-local は .ai-maintain/local/run-* の別のコピーで検証し、元の作業コピーには反映しない。
Codex の手元用には `--skip-git-repo-check` を指定し、git の履歴がない配布コピーにも対応する。
[CLI の引数定義](https://github.com/openai/codex/blob/rust-v0.169.0/codex-rs/exec/src/cli.rs)
依存関係は既存のものをコピーし、新規インストールはしない。状態やCLIのログを寄稿に含めない。
validate.js 単体は渡した作業コピーへ適用するので、使い捨てのコピーで実行する。
CLIの手元の契約や認証・企業設定による挙動は **unverified**。本人の既存設定を変更しないが、
CLI自身の通常の履歴・認証ファイルの書込みまで制御する仕組みではない。

管理画面の job 定義は `lib/admin/jobs/ai-maintain.js`。
現状の jobs.js は自動読込みをしないため、所有者による次の3点の接続が必要。
import で `AI_MAINTAIN_JOB, createAIMaintainJob` を読み、JOBS に前者を追加し、
createJobs の戻り値へ `'ai-maintain': createAIMaintainJob(options)` を追加する。
actor は CLI 名 claude/codex を `aiMaintainActor` で渡す。既存の actor の値が別名なら変換する。
この作業の許可ファイル外なので jobs.js と管理画面は編集していない。

## 誰でも変更案を寄稿する

手元の `ai-patch.json` を確認し、リポジトリの Issue 本文へ JSON のコード欄一つとして貼る。
管理者が作成した `ai-maintain` ラベルを付けた Issue の opened/edited イベントで同じ validator が動く。
外部利用者がラベルを付けられない場合は管理者がラベルを付けてから本文を編集して起動する。
添付URLの取得、Issue本文のシェル展開、投稿者のブランチの実行はしない。
大きい差分は分割して送る。公開する内容に個人情報や秘密を含めない。

既存 lib/contrib の contributionSchema は任意のAI差分を表す種類を持たない。
そのため今回の追加はAIラベルの差分の検査と実行結果の要約まで。
従来の署名付きの寄稿受付へ自動採用はしない。後続の既存受付はこの形式を拒否することがある。
合格した差分は人が取り出して PR にし、同じ検査へ回す。persona-draft/news-summary など、
既存の寄稿形式へ項目を分けて提出する場合は従来の受付をそのまま使える。
任意差分の自動受付まで必要なら lib/contrib の所有者が schema と審査待ちの受渡しを追加する。

## 更新番号・変更記録・巻戻しと接続点

land は lib/patch/version.js の createPatch と lib/patch/releases.js の history を使う。
独自の番号計算はしない。採用ファイル・差分ハッシュ・元コミット・増分を
data/curated/ai-maintain-history/実行番号.json に、AIを介さず記録する。
PRでは予約番号、直接反映ではコミット名 `AI保守 YY.N` となる。
再実行で同じ日の PR ブランチがあれば安全のため失敗させ、既存のレビュー内容を強制上書きしない。

サイト公開では既存 world-pages.yml が scripts/patch-notes.js を実行し、
公開物の差分・日本語の記録・保存された公開物・rollback_to を作る。
通常は land が選んだ次番号と一致するが、間に別の公開が入ると一致する保証はない。
厳密に同じ番号を引き継ぐなら、world-pages の patch-notes 呼出しに、HEADに対応する
ai-maintain-history の番号を `--id` で渡す接続が必要。既存の --id は番号の再利用を拒否する。
これは担当外の workflow なので変更していない。

記録ページは既存の models-updates の new_curated_models にも追加すれば既存 build-web が取り込む。
model-records、news-summaries、prompting-trends は検査できる新しい資料形式。
これらを画面へ出すには build-web / ニュース画面 / 傾向画面の所有者が読込みを接続する必要がある。
ガイドと persona は既存・G1の読込み形式に合わせている。
読込みの共通関数は scripts/ai-maintain/read-curated.js の `loadAIMaintainedData(root)`。
ニュースの組み立て箇所には、読み込んだ summaries を使う
`items = overlayNewsSummaries(items, summaries)` の一行で要約を重ねられる。
記事の識別名とURLが一致する場合だけ採用する。trend と records も同じ読込み関数が形式検査して返す。

元の資料に戻す場合はAIの着地コミットを取り消して再公開する。
公開済みの保存物へ戻す場合は既存 auto-sync/pages の rollback_to に更新番号を指定する。
失敗時に秘密・本文を表示しないため、CLIのエラーメッセージは一般的な説明にしている。

## この作業での確認

2026-11-16、オフラインの `node --test test/ai-maintain/*.test.js` は23件成功・失敗0件。
`npm test` は706件中705件成功・1件スキップ・失敗0件。
`node scripts/check-rights.js --self-test` は5件成功。
`collect.js --offline` の実データ確認は候補3件・ページ取得0回。
GitHub 上の workflow、有料 AI、手元の CLI、PR作成、直接反映、公開は実行していない。
workflow の検査は依存関係を増やさない小さな YAML 部分構文のパーサーであり、
GitHub側の完全な意味検査や実際のアクション実行の代わりではない。
