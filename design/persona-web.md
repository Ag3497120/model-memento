# Web版のモデル役

## 自分について答える処理

選択中のモデルについて、名前、開発元、公開日、知識の時点、扱える文章の長さ、返せる長さ、料金、入力と出力の種類、得意なこと、弱点、話し方、言語、前のモデル、後継モデル、系列、提供状態、履歴、本物を試す入口、頼み方を判定する。日本語と英語の短い質問を受け付ける。主語を省いた質問も選択中のモデルに結び付ける。

回答は一人称の短い段落と出典一覧で返す。値が空欄、`unverified`、出典なしの場合は「記録では確認できません」と伝え、提供元の資料を確認する方法を添える。料金のゼロは値として扱う。`recordedSpecs` に明示された空欄も尊重する。「多言語」という記録だけの場合、日本語の対応範囲は確認できないと伝える。

「ほかの」「一覧」「比べて」や別のモデル名を含む質問には、既存の検索と比較を使う。日本語のモデル名と助詞が続く場合も照合する。「あなたの歴史」は、そのモデル自身の履歴を読む。現在の天気には地域名と天気予報の確認を促す。

`answer()` の返り値は従来の `text`、`facts`、`kind`、`cutoff`、`closed`、`forgotten` を保つ。`kind` に `self_release` などの自己質問の種類を追加した。出典は `facts[].sources` と回答の出典一覧に含める。現在の `app.js` は回答本文を `textContent` で表示するため、本文内のMarkdown形式のリンクは文字列になる。既存の「使った記録」にはクリックできる出典リンクがある。

## 話し方の根拠

`memento.persona.v1` の `resolution.kind` が `researched` で、特性の `basis` が `official` または `researched`、出典URLと正の確信度があるものを使う。引き継ぎと系列の既定値は話し方に反映しない。古い調査済み記録は、特性ごとの根拠IDが実際の出典につながる場合に読む。条件を満たす特性がないときは普通の落ち着いた文体にする。

作り直された応答例を本人の発言として提示する処理を外した。応答例の表示には、公式、観測、実測、データ集という来歴と、個別の出典URLが必要になる。

## 事前生成カード

`scripts/build-persona-cards.js` は、詳細な記録または調査済みの人物像があるモデルに、20問ずつ回答を作る。実行時のAI呼び出しはない。通常の出力先は `web/data/persona-cards/<xx>.json`。モデルIDから決まる2桁の分割名を使い、ファイルごとに置き換える。

今回の実行結果は123モデル、2,460回答、96ファイル。出典と事実キーを持つ1,435回答すべてが、画面と同じカタログ補完後の記録に照合できた。出典がない回答や一般的な頼み方は、同期処理のテンプレートでも返せる。

`data/curated/persona-cards/*.json` は、1回答のオブジェクトまたは回答の配列を受け付ける。必要な形を次に示す。例の名前とURLは試験用。

```json
{
  "schema": "memento.persona-card.v1",
  "model_id": "example-model",
  "q": "コンテキスト長は？",
  "a_ja": "私が一度に扱える文章の上限は100万トークンです。",
  "fact_keys": ["specs.context_tokens"],
  "sources": ["https://example.org/model"],
  "written_by": "原稿を作ったモデルや担当者",
  "reviewed": true
}
```

Web版のモデルIDと、対応する調査済み人物像の `model_id` を受け付ける。採用には `reviewed` が真であること、既存の事実キー、対応する出典URL、日本語の本文、執筆者が必要。日付、数字、万・億・K・Mなどの単位、漢数字、英語で書いた数を、引用された事実と照合する。引用にない数値や日付を含む原稿は落とす。文章全体の意味を検証する部分は人のレビューに委ねる。

代表的な事実キーは `name`、`vendor`、`release`、`specs.knowledge_cutoff`、`specs.context_tokens`、`specs.max_output_tokens`、`specs.languages`、`cost.input`、`cost.output`、`family`、`predecessor`、`successor`、`status`。人物像は `persona.tone.0` など、入口は `links.0` などになる。実際のキーと値は `modelFacts(model, context)` で取得できる。後継などの表示名を引用する場合は `relations.successor.name` のような名前の事実も指定する。

生成物には使用した値の控えを付ける。画面では値と出典を再照合してカードを使い、更新で食い違った場合は現在の記録から答える。カードはモデルごとに非同期で読み込む。初回の同期回答には同じ記録のテンプレートを使う。

## 小さな代役

WebLLM 0.2.88と、Qwen2.5-0.5B-Instructの `q4f16_1` 変換版を選んだ。WebLLMと元モデルはApache-2.0。変換版の説明は元モデルへの対応を示している。0.2.88の標準設定にこの変換版が含まれる。[WebLLMの版](https://github.com/mlc-ai/web-llm/releases/tag/v0.2.88) [WebLLMの利用条件](https://github.com/mlc-ai/web-llm/blob/v0.2.88/LICENSE) [元モデルの利用条件](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) [変換版の説明](https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/blob/main/README.md) [標準設定](https://github.com/mlc-ai/web-llm/blob/v0.2.88/src/config.ts)

配布ページの容量は約290 MB。画面には「約290 MB＋実行用データを読み込む」と表示し、そのボタンを押してからライブラリとモデルを読み込む。追加の実行用データを含む通信量の総計は `unverified`。固定版の配信URLはHTTP 200まで確認した。[モデルのファイルと容量](https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/tree/main) [使用する固定版の配信先](https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.88/+esm)

WebGPUという画面処理用の機能と、選んだ変換版に必要な半精度計算の機能を確認する。利用できないときは平易な説明と本物を試す入口を表示する。読み込みの失敗は解放して再試行できる。画面から外れた際も解放する。生成APIは公式資料の `MLCEngine`、`reload()`、`chat.completions.create()` を使う。[WebLLMの使い方](https://webllm.mlc.ai/docs/user/basic_usage.html) [選んだモデルの設定](https://github.com/mlc-ai/web-llm/blob/v0.2.88/src/config.ts)

生成前の共通指示には、出典がある話し方、選択中のモデルから取り出した少量の事実、代役であることを明言する指示を渡す。生成した回答には必ず「小さな代役モデルの答え（本物の◯◯ではありません）」を画面側で付ける。依頼は1,200文字まで、出力は512トークンまで。実機での速度、日本語の回答品質、モデル読み込み、生成の成功は `unverified`。

本物を試す入口は記録にある公式ページ、開発者向け窓口、公開お試しページを使う。特定の版が現在選べるかは窓口で確認するよう表示する。記録から新しいURLを推測しない。

## レビュー担当が追加する接続

カード出力先と `app.js` は担当ファイルの範囲外。カード生成は担当内の一時出力先で実行して確認した。公開用の生成物はまだ配置していない。

`build-web.js` のモデルと関連データを書いた後に追加する1行。

```js
await (await import('./build-persona-cards.js')).buildPersonaCards();
```

`app.js` の会話または設定パネルで、代役用の要素 `host` を用意して追加する1行。

```js
void import('./persona/standin.js').then(({ mountStandIn }) => mountStandIn(host, closureContext()));
```

`host` はそのパネルの生きている要素を渡す。戻り値の `dispose()` でも解放できる。同じ要素への再取り付けと、接続済みの要素の削除も検出する。

会話の本文にもクリックできる出典一覧を出すため、疑似的な逐次表示が終わった時点で追加する1行。復元した過去の回答にも同じ関数を使える。

```js
void import('./persona/render.js').then(({ renderPersonaAnswer }) => renderPersonaAnswer(view.text, result));
```

`renderPersonaAnswer` は本文を文字列として扱い、出典URLを確認してからリンクを作る。HTMLとしての解釈は行わない。現在の `app.js` への接続はまだ行っていない。

「頼み方のガイド」を押すと、G1の `web/js/guides/index.js` を動的に読み込み、`guidesSection({ modelId, family, toolId })` を呼ぶ。モジュールや関数がない場合は一般的な頼み方を表示する。実際のブラウザでG1の画面が描画されることは `unverified`。

## 測定

6モデルの126問を使った。自己質問、未知の項目、他モデルの質問、一覧、比較、コードと文章の依頼を含む。改善前の回答は `node eval/persona/run.js --capture-before` で実装前に保存した。質問文と保存した改善前の回答は変更していない。選択中のGPT-4に自身の料金を聞く1件について、期待値を他モデルへの質問から自己質問の不明回答へ修正した。元の質問票のハッシュと修正理由を残し、改善前の保存回答と改善後の回答を同じ最終の採点基準で採点している。

| 指標 | 改善前 | 改善後 |
| --- | --- | --- |
| 回答率 | 82/106、77.36% | 88/106、83.02% |
| 正しい値の率 | 23/76、30.26% | 64/76、84.21% |
| 正しい不明回答の率 | 18/20、90.00% | 20/20、100% |
| 種類・値・必要な出典を満たす率 | 34/126、26.98% | 108/126、85.71% |

回答率は、回答を期待する106問について、空でない本文があり `kind` が `unknown` 以外の割合。正しい値の率は、具体的な値を期待する76問について、その値が本文にあり、必要な出典があり、不明扱いでない割合。質問の種類の一致は最後の行で測る。不明回答は、不明を期待する20問について、`unknown` と明示的な不明表現の両方を求める。

この不明20問には天気、好み、非公開情報、Geminiの知識の時点、GPT-4自身の料金を含む。既存の `eval/vera/` の保留12問の再測定は実施していない。新しい評価は記録との一致を測っている。第三者の事実そのものの独立した再検証は `unverified`。

改善前の入力データのハッシュは取得していないため、前後のデータが完全に同一だったことは証明できない。改善後は入力ハッシュを保存し、評価中に記録が変わった場合に停止する。改善前の回答と当時の `closure.js` のハッシュは保存されている。

残る18件は、DeepSeek-R1の基本記録に出典がないことによる13件、GPT-4-0314の明示的な対応言語の空欄による2件、3モデルの出力上限の明示的な空欄による3件。値を期待する評価票と、確認できる記録の範囲に食い違いがあり、記録の担当者によるレビューが必要。

実行した主なコマンドと結果。

```text
node --test --test-reporter=spec test/persona-web/*.test.js
tests 68 / pass 68 / fail 0

node scripts/build-persona-cards.js --check
models 123 / cards 2460 / sourced_cards 1435 / shards 96 / accepted_drafts 0 / dropped []

node scripts/build-persona-cards.js --out test/persona-web/generated-cards
models 123 / cards 2460 / shards 96 / check false

node eval/persona/run.js
correct_all 108/126 / correct_value_rate 64/76 / correct_unknown_rate 20/20
```

一時出力は確認後に削除した。専用テストは通信なしで実行し、代役の処理には試験用のエンジンを使った。ブラウザ、サーバー、外部ツール、実モデルは起動していない。全体のWebビルドは他担当のファイルに書き込むため実行していない。

## Web版での役の進め方

自己質問には出典のある記録から即答し、足りない項目を明示する。文章やコードを新しく作る依頼には、容量を見て選ぶ小さな代役と、本物を試す入口を示す。代役の回答を常に識別できる表示にする。現在の天気や未記録の私的な情報には、確認できない旨と確認先を返す。静的な記録からは、本物の未収録の発言や現在の情報を生成できない。

## D4: speaking from the model's era (2026-11-16)

The public `answer()` and `crossAnswer()` paths now check time before using cards or reading a cross path. A sourced cutoff is an interval: a month includes its actual last calendar day. An absent or unsourced cutoff stays unknown. The model can identify itself and report its own recorded specifications; knowledge of other entities must pass the cutoff check. Its own release is allowed as self-knowledge. Later retirement/history events, successors and predecessors are kept outside the role. A second check examines every used fact so that a compound cross answer or a reviewed card cannot add a later event after the first routing check.

An answer can carry `speech`, `museumNote: { text, facts, sources }`, `eraBlocked`, `relayAllowed`, and `voice`. The existing `text`, `kind`, and `facts` remain usable. `text` includes a bilingual “Museum note (outside the role)” label, so the current text renderer still distinguishes archive material. `renderPersonaAnswer()` additionally puts the note in an `aside > small` using text nodes. Date precision and missing evidence are handled without inferring a launch date from a model name. A tool's first recorded edition is explicitly described as an edition, not its launch.

`kind` continues to describe the recorded topic (`self_successor`, `self_status`, `model_lookup`), even when `eraBlocked` is true. This preserves existing callers and prevents the app's `kind === 'unknown'` relay fallback from replacing a known era refusal. The old aggregate benchmarks count values in museum notes as correct recorded values; they do **not** measure whether speech stayed in its era. The new benchmark scores `speech` and `museumNote` separately.

The voice renderer applies once to cards, cross answers, self answers, unknowns, free-form refusals, memory and archive responses. It accepts only researched personas with a sourced official/researched trait. Completion format, conversational phrasing, restrained wit, detailed paragraph layout and sourced numbered formatting are rendering choices based on those traits. They are not quotations or claims of measured fidelity. Unverified voice traits stay plain. No model is made to repeat an unsupported catchphrase. Failures or fabricated facts described in a trait are never deliberately reproduced.

Source checks performed for this change:

- GPT-2's next-word and continuation interface: [OpenAI's February 2019 description](https://openai.com/index/better-language-models/). Its end-of-2017 training-data cutoff: [official GPT-2 model card](https://github.com/openai/gpt-2/blob/master/model_card.md). The curated alias now covers the site's `gpt-2-1.5b`; the browser matcher also handles a parameter-count suffix in a display name.
- Original ChatGPT's dialogue behavior, excessive verbosity and repeated language-model descriptions: [November 2022 launch article](https://openai.com/index/chatgpt/). The added self-description is a short authored paraphrase, not a model quotation. It applies to the original persona, not automatically to a later snapshot.
- Claude's early conversational, detailed-answer descriptions: [Anthropic's March 2023 launch article](https://www.anthropic.com/news/introducing-claude). These were selected partner reports; they are not an independent measurement.
- Early Grok's intended wit: [official announcement](https://x.ai/news/grok). This is a design intention, not a claim that the base Grok-1 weights have the chat product's voice.

The catalogue's existing cohort `reviewed_at` stamp is retained because its current catalogue test requires that exact stamp. The two added trait notes explicitly record the 2026-11-16 source check. Full persona re-review is unverified. Other existing model specifications were not independently re-researched.

Follow-ups use recent **user-authored** subjects, never names or values extracted from an assistant's museum note. “And the price?” keeps the previous model, explicit “your own” returns to the selected model, successor follow-ups follow the sourced relationship, and “why?” cites the relevant record while leaving an undocumented cause unknown. A `model_id` boundary ends this carry-over; the current app already clears messages on a model switch. No conversation state is stored globally. `modelGreeting(model, context)` returns one line, and `answer('Hello', context)` / `answer('こんにちは', context)` return a sourced greeting result. An unfinished self-description for a completion model produces a labelled continuation from recorded identity facts, rather than a chat greeting.

The optional stand-in prompt excludes current access, retirement and successor facts from role knowledge. Recorded future-entity questions receive the same deterministic era answer before a generation request is made. No real stand-in engine was loaded or run; these paths were checked with an offline fake engine.

### Evaluation and remaining integration

`eval/persona/era-voice.json` was written before implementation and before its first run. It has 14 paired Japanese/English cases with synthetic records for era, voice, follow-ups, unknown cutoffs, greeting and completion behavior. Synthetic specifications make this a routing/evidence test, not third-party factual research. Four immutable before snapshots retain the fixture hash, source hashes, responses and facts. After snapshots must match the frozen fixture hash. The legacy input hashes matched between the captured D4 before and after runs.

| Evaluation | Japanese before → after | English before → after |
| --- | --- | --- |
| New template path | 1/14 → 14/14 | 1/14 → 14/14 |
| New normal / cross-then-template path | 1/14 → 14/14 | 1/14 → 14/14 |
| New standalone cross path | 1/14 → 11/14 | 1/14 → 11/14 |
| Legacy persona, all criteria | 96/126 → 96/126 | not a separate legacy set |
| Legacy cross base, all criteria | 82.35% → 82.35% | 100% → 100% (40 questions) |
| Legacy cross paraphrases, normal path | 86.21% → 86.21% | not a separate legacy set |

Standalone cross intentionally returns null for personal unknowns and free-form requests when its subject/predicate sections do not agree. Those three cases are completed by the normal fallback. The new report leaves those misses visible. Every legacy correctness, answer, value and unknown rate was preserved; latency is separately reported and was not treated as a correctness score. The older 108/126 result above this section is historical: the actual D4 starting copy scored 96/126. Its old free-form expectations, missing fields and missing evidence were not silently rewritten.

Commands used (all offline Node evaluation; no app, server, agent, external tool or real model launched):

```text
node eval/persona/era-voice-run.js --capture-before
node eval/persona/era-voice-run.js --english --capture-before
node eval/persona/era-voice-run.js --cross --capture-before
node eval/persona/era-voice-run.js --cross --english --capture-before
node eval/persona/era-voice-run.js
node eval/persona/era-voice-run.js --english
node eval/cross/era-voice-run.js
node eval/cross/era-voice-run.js --english
node eval/persona/run.js
node eval/cross/run.js
node eval/cross/run.js --english
node --test test/persona/*.test.js test/persona-web/*.test.js test/cross/*.test.js test/i18n/E2.test.js
npm test
```

The final exact counts and command outcomes are in `eval/persona/d4-verification.json`; raw final test output is in `eval/persona/d4-focused.log` and `eval/persona/d4-npm-test.log`. Earlier failed runs caught and corrected an unsupported `note_en` field in my additions. No build was run directly against the shared output directories. The full test suite runs its own build fixtures.

Three small app hooks remain outside D4's allowed files:

1. In `selectModel`, show a sourced greeting after assigning the selected model and resetting messages. For example, take `const intro = answer(tr('こんにちは', 'Hello'), closureContext())` and create the initial assistant message from `intro.speech`, `intro.facts`, and `intro.kind` before rendering. The current switch handler does not call the greeting API, so automatic on-switch greeting is **partly done**.
2. After streaming, use `renderPersonaAnswer(view.text, result)` (and for restored messages preserve `speech` and `museumNote`) to render the small note semantically. The fallback text label already works; the separate small-note rendering is unverified in a real browser.
3. Change the relay fallback condition to `result.kind === 'unknown' && result.relayAllowed !== false`. The closure now explicitly marks unsupported/unknown answers as `relayAllowed: false`. Specific era refusals already avoid the existing fallback because they retain a non-unknown topic kind. The relay source/prompt/checker and `app.js` were not edited. A deployed relay's voice and enforcement for every unknown question remain **unverified** until the owner of those files connects this flag.

The build owner should regenerate public persona data and persona cards using the existing build after merging the curated changes. Screenshots, browser rendering, live relay behavior, perceived model fidelity, Japanese quality of an actual stand-in and real historical-model outputs are all **unverified**. The benchmark establishes deterministic evidence and routing behavior, not a claim that the real model would have emitted these sentences.

Final verification on this copy: focused persona/cross/English/schema suite **144 tests, 144 pass, 0 fail**; `npm test` **902 tests, 901 pass, 0 fail, 1 skipped** (exit 0). Earlier full runs also exposed a daily-build fixture syntax failure and a navigation `AbortError` after a test ended; those files were not edited by D4. The final run passed after the shared workspace changed. Final legacy correctness metrics and all captured legacy input hashes were checked for equality. After-snapshot source hashes were also checked against the final code.

Current access links are kept in museum notes for both real-access questions and free-form refusals. They are not presented as an old model's contemporary knowledge.
