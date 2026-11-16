# モデルごとの話し方

`lib/persona/` は、モデルの話し方を公開資料から記録し、資料のないモデルには近いモデルの特徴を借りるための部品です。既存の画面やサーバーは変更していません。

## 保存形式

`schema.js` の `Persona` / `PersonaSchema` は `memento.persona.v1` を検証します。

- `model_id`, `name`, `family`, `aliases`: 識別名、表示名、系列、明示した別名。
- `reviewed_at`: 元にした資料を確認した日。引き継ぎの場合は親の資料の確認日。
- `traits`: `tone`（口調）、`verbosity`（長さ）、`formatting_habits`（書き方）、`refusal_style`（断り方）、`humour`（ユーモア）、`self_description`（自分の説明）、`knowledge_cutoff`（知識の時点）。`quirks`（癖）、`failure_modes`（間違いやすい点）、`typical_strengths`（得意なこと）は配列です。
- `traits.interface`: 既存の演じるエンジンに合わせる追加項目。`completion` は文章の続きを書く形式、`chat` は対話です。
- 各特性の `value`, `source`, `basis`, `confidence`, `note`: 説明、出典 URL、根拠の種類、0〜1 の確信度、根拠の弱さや適用範囲の注意。
- `resolution`: 本人の資料か、親からの引き継ぎか、系列の仮の特徴か、未確認か。`path` はたどった識別名、`links` は一つずつのつながりと出典です。

`basis` は `official`（公式説明）、`researched`（調査や報告からの判断）、`inherited-from:<識別名>`（引き継ぎ）、`family-default`（系列の仮の特徴）のいずれかです。公式説明も、独立した測定や実際の出力の証明ではありません。

確認できなければ `value: null`, `source: null`, `confidence: 0` にします。値がある特性には HTTP / HTTPS の出典が必須です。`unverified` も未確認として扱います。知らない締切や口調を、名前や公開日から作りません。

## 通信せずに決める

```js
import { createPersonaResolver } from '../lib/persona/derive.js';

const resolvePersona = createPersonaResolver({
  // 省略時は data/curated/personas/*.json の小さな目録だけを読む。
  profiles: alreadyLoadedResearchedProfiles,
  lineage: localLineageMap,
  getRecord: id => localWorldLookup(id), // 同期で返す。通信しない。
});
const persona = resolvePersona(worldRecord); // 文字列の識別名でもよい。
```

優先順位は本人の調査済み項目 → 最も近い調査済みの親 → 名前や作者が示す系列 → 未確認です。本人の調査済み `Profile` を渡すと、付属の目録より優先します。`memory`, `stub`, `seed` の旧データは調査済みとして扱いません。

親は `base_model`、`cardData.base_model`、`base_model:…` タグ、または `lineage` から読みます。単一の親と複数の親に対応し、近い順に探します。距離が同じなら識別名の順で決め、複数の親の性格を勝手に混ぜません。これらの親指定は [Hugging Face のモデルカードの仕様](https://huggingface.co/docs/hub/model-cards#specifying-a-base-model)を参考にしています。

`lineage` と `records` は識別名をキーにした `Map` またはオブジェクトです。`lineage` の値は文字列、文字列の配列、または `{ base_model: '親の識別名', source: 'https://…' }`。`parents` も配列の別名として使えます。記録からの親指定にはその記録の `url`、地図からの親指定には `source` を残します。出典がなければ `null` と未確認の注意を残します。

全世界の名簿を読まず、必要な親だけを引きます。既定の上限は深さ 32、記録数 256。輪になった系譜は止め、上限に達した場合も注意を返します。`createPersonaResolver` をサーバーごとに一度作って使い回してください。`derivePersona(record)` は既定の目録を使う簡単な入口です。

引き継ぎでは全項目の根拠を `inherited-from:…` に替え、確信度を距離に応じて下げ、上限を 0.65 にします。系列の名前や作者だけによる推測は上限 0.4、親子関係は未確認です。親の知識の締切は子に移しません。名前だけの推測では入出力形式も移しません。画像生成や埋め込み用など、対話用と確認できない記録は普通の未確認のモデル像を返します。

旧 `Profile` の変換は `personaFromProfile(profile)`。特性に結びついた公開 URL がある説明だけを取り込みます。旧形式の `failure_modes`, `specs.knowledge_cutoff` は項目単位の出典を持たないため自動変換しません。私的なプロファイルのフォルダーは読みません。標本、引用文、会話、補正データは保存しません。

## サーバーや画面への接続

呼び出し元で world の記録を引き、`resolvePersona(record)` の結果を JSON として返してください。例として `GET /api/persona?r=hf&id=…` の読み取り処理に接続できます。モデル名からファイルのパスを組み立てる必要はありません。ファイル読み取りは固定の目録フォルダーに限られます。

```js
import { buildPersonaSystemPrompt, playPersonaTurn } from '../lib/persona/play.js';

// 指示文だけを確認する。
const prompt = await buildPersonaSystemPrompt(persona, { today, actor });

// 既存の「呼ぶ」の処理や POST /api/persona/play の実装から使う。
const result = await playPersonaTurn(persona, history, {
  actor, today, signal,
  onText: text => sendExistingTextEvent(text),
});
```

演じ手の選択、応答の通信、会話の長さの扱いは `lib/emulate.js` の `buildSystemPrompt` / `emulateTurn` をそのまま呼びます。別の演じるエンジンは作っていません。実際に演じ手へ渡せる能力や文脈の数値は未確認なので、ここで作る `Profile` の数値は空です。元モデルの画像・音声・道具の能力が、文字の再現で使えるわけではありません。

`play.js` は読み込み時に演じるエンジンを初期化せず、実行時にだけ読みます。既存エンジンの読み込みには、ローカルの保存場所の初期化や道具の検出という副作用が残っています。本番での読み込みは呼び出し元の実行許可に従ってください。今回、実際の演じ手は起動していません。

`playPersonaTurn` は毎回、返す文字列と配信する文字列の両方の先頭に `【再現】…別の AI で再現しています` を付けます。画面が `result.text` を出すか、`onText` の断片を出すか、どちらでも表示されます。`buildPersonaSystemPrompt` だけを使う場合は、返る `notice` も会話欄に表示してください。元モデルだと偽ったり、未確認の特徴を事実としたり、間違いをわざと作ったりしない指示を、既存の指示文の後半に加えます。これは指示であり、演じ手の完全な従順さを保証するものではありません。失敗の頻度は調べていないため、既存の頻度つき失敗欄には数値を足していません。

画面には `resolution.warnings` と各特性の `source`, `basis`, `confidence`, `note` を出し、未確認の項目には「未確認」と表示してください。`play.js` の `TRAIT_LABELS` は日本語の項目名です。継承された項目を「調査済み」の印に変えないでください。

## 付属資料と残る穴

72 件を時代と系列の幅を重視して選びました。利用頻度の順位は未確認です。GPT-2 / GPT-3 davinci / ChatGPT 3.5 / GPT-4 系列、Claude 1〜5、Bard / PaLM 2 / Gemini、Llama 1〜4、Mistral / Mixtral / Codestral、DeepSeek V/R、Qwen、Grok、Phi、Gemma を含みます。各特性の出典はそれぞれの JSON に残しています。

公式の発表やモデルカードは、得意な課題と入出力形式の根拠が中心です。冗談、自分の名乗り方、通常の箇条書きの頻度など、資料から確認できない項目は空のままです。初期 Claude の利用者の声、GPT-4o の選ばれた音声デモ、Sonnet 4.5 の一利用者の報告などは、少ない根拠であることを明記しています。旧版 API と製品の会話は同一とは限らず、名前の似た将来の版は本人の資料として扱いません。

world の最小記録には親の情報が必須ではありません。十分な引き継ぎには、呼び出し元がローカルの系譜地図か追加の親指定を渡す必要があります。world の収集処理は今回の担当外です。全 440 万件を使った走査や、実際のモデル相手の再現精度は未検証です。

## 確認方法

`node --test test/persona/*.test.js`。通信や演じ手を起動せずに、保存形式、72 件の出典、別名、近い親の選択、複数の親、輪、探索上限、既存 Profile の変換、未確認への落ち方、再現の表示を検証します。実際の既存プロンプト関数は、テスト中だけその関数本体を読み、道具一覧を空にして実行します。既存モジュール全体の初期化は実行していません。
