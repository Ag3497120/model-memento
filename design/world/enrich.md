# 本人の端末で行う追加調査（I7）

`lib/world/CONTRACT.md`を読み、調査済みへの昇格は人のレビューを通す、という境界に合わせた。実装ファイルは`lib/world/enrich.js`、入口は`scripts/enrich-local.js`、テストは`test/world/enrich.test.js`。この処理は一覧収集、件数取得、公開、既存データへの取り込みを行わない。

## 実行

```sh
node scripts/enrich-local.js --help
node scripts/enrich-local.js --queue .world-out/world/data/enrich-queue.json --dry-run --max 3
node scripts/enrich-local.js --queue https://example.org/world/data/enrich-queue.json --dry-run --max 3
node scripts/enrich-local.js --queue .world-out/world/data/enrich-queue.json --actor codex:利用できるモデル名 --max 3
```

最後の例のモデル名と、公開URLは本人の環境に合わせて置き換える。実在するモデル・公開サイトを示す例ではない。`--queue`の既定はこのプロジェクトの`.world-out/world/data/enrich-queue.json`。`ENRICH_QUEUE_URL`でも場所を渡せる。`--max`の既定は3で、0以上の整数だけを受け取る。一覧内で重複を除き、先頭から最大N件を処理する。

`--actor`は`claude-code:モデル名`、`codex:モデル名`、`ollama:モデル名`を明示する。既存の`lib/backends.js`の`complete`を、実際の調査を始めるときだけ読み込む。API課金の`api:`への自動切り替えも、モデル一覧を得るためのコマンド起動も追加しない。どのモデルを契約で使えるかはこの処理では判定しない。CI環境では入口が実行を止める。本人が手元で実行し、定期実行が必要なら本人が設定する。定期実行の設定自体は作らない。

試行モードは調査対象だけを表示する。バックエンドを読み込まず、AI・出典確認・下書き保存を行わない。公開URLを入力した場合は一覧のJSONだけをGETする。一覧は最大8 MiB。ローカルファイルも公開JSONも同じ検証を通す。

## 調査待ちの形

配列、`{ "items": [...] }`、`{ "queue": [...] }`を受け取る。

- モデル：契約の`{ r, id, n, url, ... }`、または`{ kind: "model", record: {...} }`。`memento.world-model.v1`と`memento.enrich-model.v1`のタグも認識する。
- 道具：`memento.world-tool.v1`、`kind: "tool" / "tool-version" / "version" / "release"`。道具の収集担当が出力する`{ schema: "memento.enrich-tool.v1", id, tool_id, registry, version, sources, ... }`にも対応する。
- 名前・出典URL・対象の版・識別子だけをAIへ渡す。説明本文や任意の追加フィールドは渡さない。入力や外部資料に書かれた命令に従わないよう指示する。

## 下書きと出典

保存先は常にプロジェクト内の`data/drafts/`。識別子をそのままファイル名に使わず、種類・識別子のハッシュ・乱数で名前を作る。既存ファイルを上書きしない排他作成で、権限は0600。`data`か`drafts`がシンボリックリンクなら保存しない。再実行時も新しい下書きができるため、先へ進む一覧の選択や重複下書きの整理は本人が行う。

モデルは`memento.model-draft.v1`に、既存の`data/curated/models-base.json`と同じキーの事実を置く。`id/name/vendor/family/parent/weights/real_model/aliases/lifecycle/specs/summary/evidence`を含む。人物像や架空の会話例は生成しない。未確認を明示するため、`weights`や`interface`などに`null`を認める。完全な`lib/schema.js`の`Profile`ではなく、レビュー用の事実の部分集合である。必須の人物像などを推測して補完しない。

道具と新しい版は`schema: "memento.design.v1"`をルートに持つ。`design/specs/*.json`と同じ`tool_id/name/vendor/kind/versions/corrections`、版ごとの`regions/controls/conversation/palette/typography/shape/empty_state/distinctive/must_not_copy/sources/confidence`を置く。版の`id`は`draft-1`などのローカル識別子に置き換え、調査対象の版は`queue_item.version`に保存する。対応する正式な版のidはレビュー時に決める。根拠がなければ`kind`は`unverified`、日付や色は`null`、根拠のない確度は0。フォントは無料のシステム代替を使う。`palette.source`は空のオブジェクトとし、色の出典も下記の`review.citations`に持つ。

すべての保存物に`status: "draft"`、作成日時、使った演者、調査待ちの識別情報、`sources`を付ける。道具には`harness_adapter_todo`として「接続処理（道具とアプリの仲介）は未実装」、対象の版・入出力・認証と利用条件・別の変更で作る接続処理とテストの確認項目を添える。生成コードを実行したり、接続処理を有効化したりしない。

AI回答は厳密なZodの形で検証し、許可されていない画像やコードの欄などは拒否する。要約や説明は短く制限し、引用欄は`null`に固定する。画像・ロゴ・マスコット・画面写真・製品の文字意匠・フォントファイル・長い原文を取得保存しない指示を出し、権利の注意と無料の代替書体は手元の固定値で上書きする。AIが自分の言葉で書いたかの最終判定はレビューが必要。

AIには各事実の場所と根拠URLを`citations: [{ path, sources }]`で返させる。`path`は`payload`からのJSON Pointer（例：`/specs/context_tokens`）。項目のまとまりを指すこともでき、細かい指定を優先する。ルート全体への指定は拒否する。出典情報そのものは、その情報のURLに結び付ける。

回答内のURL、出典欄のURL、既存バックエンドが返すURLを重複除去し、HEADで到達を確かめる。HEADが403・405・501ならGETを1回試す。GET本文は保存せず読み取りを止める。HTTP成功だけを採用し、404・認証要求・通信失敗・時間切れなどは`review.dropped_urls`へURLと理由を記録する。「存在しない」と「この環境で確認できない」は区別できないので、到達できないものを捏造だと断定しない。

除外URLを根拠にする値や、出典のない値は`null`または`unverified`に戻す。別の有効な根拠があれば残す。無効な出典行と、それを参照する公開日などの出来事は取り除く。生のAI回答は保存しない。`review.citations`と`review.unverified`の場所は、配列の除外前のAI回答の`payload`を基準とする、と保存物に明記する。URL到達は主張の裏付けや日付・利用条件を証明しない。人が内容との対応を確認する。

HTTP確認には10秒の上限、最大3回の転送、同じ登録先ごとに最低1秒の間隔・1実行最大20要求を設ける。HEAD、GETへの切替、転送もこの予算を消費する。429なら同じ登録先への要求をその実行中は止める。`Retry-After`が過ぎる前に再試行する処理はない。予算超過分は取得せず、除外理由を記録する。既知の登録先はサブドメインもまとめて数える。公開一覧の取得も同じ予算を使う。

認証情報入りURL、HTTP/HTTPS以外、標準以外のポート、ローカル宛先・非公開IPへの転送を拒否する。名前解決結果も確認する。ただし既存の`fetch`の再度の名前解決を固定していないため、この確認を敵対的なDNS変更に対する完全な隔離とみなさない。既存バックエンド内部のWeb検索は、このHTTP確認器を通らない。調査範囲・禁止ドメイン・20要求の指示は渡すが、内部の要求数をこの層で強制したり監査したりはできない。

AI呼出しは5分で中断する。失敗や不正な回答も`memento.enrichment-failure.v1`、`status: "draft"`の短い再確認メモにして次へ進む。例外の生の文章には設定や回答が含まれ得るため保存しない。回答を検証できない場合も、すでに確認したURLの結果は残す。保存失敗や本人による中断では終了する。失敗した項目があれば終了値1、全件成功・空の対象・試行モードなら0。

## 登録先の規約・API方針の調査

確認日：2026-11-15。以下は公開の規約・API資料を読めた範囲の記録であり、一覧の転載許諾を推測しない。I7はすべての登録先について一覧も件数も取得しない。自動一覧が禁止される登録先は、この層では数だけの上流集計を参照する想定。数を得るための収集も実装しない。

| 登録先 | 自動一覧について確認できた範囲 | 回数制限 | 帰属表示・I7の扱い |
| --- | --- | --- | --- |
| Hugging Face | [Hub API](https://huggingface.co/docs/hub/en/api)がモデルなどのAPIを案内する。[利用規約](https://huggingface.co/terms-of-service)では取得する内容の条件とライセンスが残る。一括再配布の包括許可はunverified。 | [回数制限](https://huggingface.co/docs/hub/en/rate-limits)はAPI・ファイル解決・ページを区別し、5分単位、429とヘッダーを案内。固定の数をここで推測しない。 | 規約では内容に伴うライセンス表示の除去を認めない。I7は短い事実と出典だけを残す。 |
| Civitai | [利用規約](https://civitai.com/content/tos)は取得できずunverified。[公式リポジトリのAPI案内](https://github.com/civitai/civitai/wiki/REST-API-Reference)は[新しい公式API資料](https://developer.civitai.com/site/reference)への移動を案内するが、移動先の本文は取得できずunverified。 | unverified | 帰属表示の要件もunverified。一覧取得を追加しない。 |
| ModelScope | [利用条件の候補URL](https://modelscope.cn/docs/protocol/terms)、[文書入口](https://www.modelscope.cn/docs/protocol)とも本文を取得できず、自動一覧の許可はunverified。 | unverified | 帰属表示の要件もunverified。一覧取得を追加しない。 |
| Kaggle | [利用規約](https://www.kaggle.com/terms)はクロール等と大量の内容保存を制限する。[API資料](https://www.kaggle.com/docs/api)があることを、サイト収集の許可とはみなさない。 | API資料では動的な制限と429後の待機を案内。固定値はunverified。 | 帰属表示の要件はunverified。I7ではkaggle.comへの自動URL確認を止め、`policy_blocked`とする。 |
| Ollama | [利用規約の第4節](https://ollama.com/terms)は許可のない自動アクセスを禁止する。 | 固定の公開値はunverified。 | 規約の第7節はブランド使用の権利を与えない。I7ではollama.comを`policy_blocked`とする。本人が既存のOllamaバックエンドを指定することとは別である。 |
| NVIDIA NGC | [公式カタログ資料](https://docs.nvidia.com/ngc/latest/ngc-catalog-user-guide.html)は公開内容の閲覧・一覧操作と、個別の利用条件の受諾を説明する。包括的な一括再配布の許可はunverified。 | unverified | 帰属表示は内容ごとの条件を追加確認。試した規約候補`https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-ngc-terms-of-use/`は404で、許可の根拠にしない。 |
| 閉じたAPIモデル：OpenRouter | [利用規約の第7節](https://openrouter.ai/terms)は自動手段による情報のスクレイピング・コピーを制限する。 | 一覧向けの確定値はunverified。 | 帰属表示の要件はunverified。I7ではopenrouter.aiを`policy_blocked`とする。 |
| 閉じたAPIモデル：models.dev | [公式サイトのAPI案内](https://models.dev/)がJSON入口を公開する。再配布や提供元ごとの許諾範囲はunverified。 | unverified | 帰属表示の要件はunverified。I7は一覧取得を追加しない。その他の提供元リストは各提供元の方針を別途確認する必要がある。 |

禁止を確認したドメインへのHEAD/GETも自動アクセスになるため、URLを取得する代わりに除外を記録する。到達確認の要求と規約が両立しない場合の安全側の実装である。未確認の規約を「許可」と扱わないようAIへも指示するが、既存バックエンド内部のアクセス制御をこの実装で保証はできない。

## 検証と残る確認

`node --test test/world/enrich.test.js`は実バックエンド・実DNS・実ネットワークを使わない。架空の名前と事実を持つ合成例だけを使い、偽バックエンド・偽HTTP応答・メモリー上の保存先で検証する。公開サンプルを取得して作ったモデルの事実は含めない。実ディスクへの下書き保存、契約によるモデルの起動、実際のWeb調査はこの作業では実行していない。

レビュー時には、利用できる演者で本人が少数件を実行し、構造化出力への対応・出典の内容・保存先の動作を確認する必要がある。既存バックエンドは作業用フォルダーやCLIの起動を持つため、本作業の実行禁止に従って読み込んでいない。人物像の未入力や`null`を解決してから、別のレビュー済み変更としてモデルデータや画面仕様へ取り込む。

## W1統合後の場所

調査待ちの正本は `world/data/enrich-queue.json`。`lib/world/queue.js` の定数を入口と発見処理・ビルダーで共用する。公開URLは `<サイト>/world/data/enrich-queue.json`。管理画面もこの場所を使う。旧ルートの `/data/` は正本にしない。AIやバックエンドを起動する検証はW1でも行っていない。
