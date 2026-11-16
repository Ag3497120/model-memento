import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { scoreAnswer, summarize, extractClaims } from './scoring.js';
import { validateQuestions, transformClosed, createWebContext } from './run.js';
import { findDataErrors } from './data-errors.js';

const source = 'https://example.org/model-a';
const model = { id: 'model-a', name: 'Model A', vendor: 'Maker A', specs: { context_tokens: 100000 }, weights: 'open' };
const records = [model, { id: 'model-b', name: 'Model B', vendor: 'Maker B', specs: { context_tokens: 200000 }, weights: 'closed' }];
const question = {
  question: 'Model A の文脈長は？',
  expected: { claims: [{ model_id: model.id, field: 'context', value: 100000, source_url: source }] }
};
const fact = (id, text, sources = [source]) => ({ id, text, sources });
const response = facts => ({ text: facts.map(item => item.text).join('\n\n'), facts, kind: 'model_lookup', closed: true });
const score = (q, answer, extra = {}) => scoreAnswer(q, answer, { records, activeModel: model, ...extra });

test('事実と出典を別々に採点する', () => {
  const result = score(question, response([fact('model-a:specs', '文脈長: 100,000 tokens')]));
  assert.equal(result.fact_score, 'correct');
  assert.equal(result.citation_score, 'complete');
  assert.equal(result.citation_verified_score, 'complete');
});

test('closed:true は回答拒否ではない', () => {
  assert.equal(score(question, response([fact('model-a:specs', '文脈長: 100,000 tokens')])).declined, false);
});

test('別モデルに同じ正解の数字があっても加点しない', () => {
  const result = score(question, response([fact('model-b:specs', '文脈長: 200,000 tokens')]));
  assert.equal(result.score, 'wrong');
  assert.equal(result.missing.length, 1);
});

test('入力にあるが公開元と違う値は誤答であり作り話ではない', () => {
  const q = { ...question, expected: { claims: [{ ...question.expected.claims[0], value: 200000 }] } };
  const result = score(q, response([fact('model-a:specs', '文脈長: 100,000 tokens')]));
  assert.equal(result.score, 'wrong');
  assert.equal(result.invented.length, 0);
  assert.equal(result.contradictions.length, 1);
});

test('引用URLがあっても入力にない数値は作り話', () => {
  const result = score(question, response([fact('model-a:specs', '文脈長: 999,999 tokens')]));
  assert.equal(result.fact_score, 'wrong');
  assert.equal(result.citation_score, 'complete');
  assert.equal(result.invented.length, 1);
});

test('同じレコード内でも出力上限を文脈長に流用できない', () => {
  const result = score(question, response([fact('model-a:specs', '文脈長: 200,000 tokens')]), {
    records: [{ ...model, specs: { context_tokens: 100000, max_output_tokens: 200000 } }]
  });
  assert.equal(result.fact_score, 'wrong');
  assert.equal(result.invented.length, 1);
});

test('入力にない会社名と重み公開の反転を検出', () => {
  assert.equal(score(question, response([fact('model-a:lifecycle', '提供元: Maker Z')])).invented.length, 1);
  assert.equal(score(question, response([fact('model-a:availability', '重み: クローズド')])).invented.length, 1);
});

test('facts の中だけに隠した正解では加点しない', () => {
  const answer = response([fact('model-a:specs', '文脈長: 100,000 tokens')]);
  answer.text = '記録にありません。';
  assert.equal(score(question, answer).fact_score, 'wrong');
});

test('正しい facts に続く本文の作り話も調べる', () => {
  const answer = response([fact('model-a:specs', '文脈長: 100,000 tokens')]);
  answer.text += '\n文脈長: 999,999 tokens';
  const result = score(question, answer);
  assert.equal(result.fact_score, 'wrong');
  assert.equal(result.invented.length, 1);
  assert.equal(result.contradictions.length, 1);
});

test('出典なしでも正しい事実は正答で、未確認URLも分けて報告する', () => {
  const missing = score(question, response([fact('model-a:specs', '文脈長: 100,000 tokens', [])]));
  assert.equal(missing.fact_score, 'correct');
  assert.equal(missing.citation_score, 'missing');
  const unchecked = score(question, response([fact('model-a:specs', '文脈長: 100,000 tokens', ['https://example.org/unrelated'])]));
  assert.equal(unchecked.fact_score, 'correct');
  assert.equal(unchecked.citation_score, 'complete');
  assert.equal(unchecked.citation_verified_score, 'missing');
});

test('比較の左右を反転すると入力にない断定として検出', () => {
  const answer = response([fact('compare:model-a:model-b:window', '文脈長・出力上限: Model A [context 200,000 / output 不明] vs Model B [context 100,000 / output 不明]')]);
  const claims = extractClaims(answer.facts[0], records);
  assert.deepEqual(claims.map(item => [item.model_id, item.value]), [['model-a', '200000'], ['model-b', '100000']]);
  assert.equal(score(question, answer).fact_score, 'wrong');
  assert.equal(score(question, answer).invented.length, 2);
});

test('出力値を知らないことと全面的な回答拒否を区別', () => {
  const answer = response([fact('model-a:specs', '文脈長: 100,000 tokens')]);
  answer.text += '\n最大出力は記録にありません。';
  assert.equal(score(question, answer).declined, false);
  assert.equal(score(question, answer).score, 'correct');
});

test('K表記と年月日を対応する項目として照合', () => {
  assert.equal(score(question, response([fact('model-a:specs', '文脈長: 100K tokens')])).score, 'correct');
  const q = { question: 'Model A の公開日は？', expected: { claims: [{ model_id: model.id, field: 'release', value: '2023-07-11', source_url: source }] } };
  assert.equal(score(q, response([fact('model-a:lifecycle', '公開: 2023年7月11日')]), { records: [{ ...model, release: '2023-07-11' }] }).score, 'correct');
});

test('存在しないモデルと未解析の自由文を区別して報告する', () => {
  assert.equal(score(question, response([fact('model:unknown', '存在しないモデルの紹介です。')])).invented.length, 1);
  const result = score(question, response([fact('model-a:summary', '銀河の全言語を完全に理解します。')]));
  assert.ok(result.unverified.length);
  assert.equal(result.fact_score, 'wrong');
});

test('壊れた facts を保留の成功例として扱わない', () => {
  assert.equal(score({ question: '不明なモデルは？', should_decline: true }, { text: '記録にありません。', facts: [null] }).score, 'wrong');
});

test('正しい保留・不適切な保留・無回答を区別', () => {
  const unknown = { question: '記録にないモデルは？', should_decline: true };
  const answer = { text: '記録にありません。', facts: [], kind: 'unknown' };
  assert.equal(score(unknown, answer).score, 'declined-correctly');
  assert.equal(score(question, answer).score, 'declined-wrongly');
  assert.equal(score(unknown, { text: '', facts: [] }).score, 'wrong');
  assert.equal(score(unknown, response([fact('model-a:specs', '文脈長: 100,000 tokens')])).score, 'wrong');
});

test('質問の中の偽の値を引用しても断定と数えない', () => {
  const q = { ...question, question: 'Model A は999999トークンですか？' };
  const answer = response([fact('model-a:specs', '文脈長: 100,000 tokens')]);
  answer.text = `Q: ${q.question}\nA: ${answer.text}`;
  assert.equal(score(q, answer).score, 'correct');
});

test('正しい値があれば追加の未解析文で事実の点を落とさない', () => {
  const answer = response([fact('model-a:specs', '文脈長: 100,000 tokens')]);
  answer.text += '\n銀河で最高のモデルです。';
  const result = score(question, answer);
  assert.equal(result.fact_score, 'correct');
  assert.ok(result.unverified.length);
});

test('求めていない項目の矛盾と記録にない断定は事実の点と別に残す', () => {
  const answer = response([fact('model-a:specs', '文脈長: 100,000 tokens'), fact('model-a:lifecycle', '提供元: Maker Z')]);
  const result = score(question, answer, { referenceClaims: [{ model_id: model.id, field: 'vendor', value: 'Maker A' }] });
  assert.equal(result.fact_score, 'correct');
  assert.equal(result.additional_contradictions.length, 1);
  assert.equal(result.invented.length, 1);
});

test('質問票は60問で、全件保留しても満点にはならない', async () => {
  const dataset = validateQuestions(JSON.parse(await readFile(new URL('./questions.json', import.meta.url), 'utf8')));
  const results = dataset.questions.map(item => ({ category: item.category, should_decline: item.should_decline === true,
    ...scoreAnswer(item, { text: '記録にありません。', facts: [] }, { records }) }));
  const summary = summarize(results);
  assert.equal(summary.total, 60);
  assert.equal(summary.counts['declined-correctly'], 12);
  assert.equal(summary.counts['declined-wrongly'], 48);
  assert.equal(summary.rates.correct_all, 0);
  assert.deepEqual(summary.fact, { correct: 0, wrong: 48, 'not-applicable': 12 });
  assert.deepEqual(summary.citation, { complete: 0, partial: 0, missing: 48, 'not-applicable': 12 });
  assert.equal(summary.decline['failed-to-decline'], 0);
  assert.equal(Object.values(summary.counts).reduce((a, b) => a + b), 60);
});

test('画面の closed 変換で仕様・状態・参照元を勝手に補正しない', () => {
  const input = [{ id: 'a', knowledge: '2024-01', context: 1234, output: 100, release: '2025-01-01', open: true }];
  const converted = transformClosed(input)[0];
  assert.equal(converted.specs.context_tokens, 1234);
  assert.equal(converted.recordedSpecs.context_tokens, 1234);
  assert.equal(converted.lifecycle.status, 'open-weights');
  assert.deepEqual(converted.evidence, [{ url: 'https://models.dev' }, { url: 'https://openrouter.ai/models' }]);
  assert.equal(input[0].specs, undefined);
});

test('画面の初期モデルは質問の対象ではなく版に合う先頭モデル', () => {
  const data = { models: records, closed: [], catalog: { tools: [{ id: 'chatgpt', versions: [{ id: 'chatgpt-2023-03' }] }] } };
  const context = createWebContext(data, { modelFits: m => m.id === 'model-b', resolveVeraProfile: () => { throw new Error('初期選択では不要'); } });
  assert.equal(context.model.id, 'model-b');
  assert.deepEqual(context.messages, []);
});

test('200kの紹介文と100,000の仕様が両方あれば誤答', () => {
  const q = { ...question, expected: { claims: [{ ...question.expected.claims[0], value: 200000 }] } };
  const answer = response([fact('model-a:summary', 'Model A: 200kコンテキスト。'), fact('model-a:specs', '文脈長: 100,000 tokens')]);
  const result = score(q, answer, { records: [{ ...model, summary: '200kコンテキスト。' }] });
  assert.equal(result.fact_score, 'wrong');
  assert.equal(result.missing.length, 0);
  assert.equal(result.contradictions.length, 1);
  assert.equal(result.invented.length, 0);
});

test('長文の途中の正しい日付は出典なしでも正答', () => {
  const q = { question: 'Model A の公開日は？', expected: { claims: [{ model_id: model.id, field: 'release', value: '2025-01-20', source_url: source }] } };
  const answer = { text: '紹介を続けます。\nModel A は2025年1月20日に公開されました。\n追加の説明も続きます。', facts: [] };
  const result = score(q, answer);
  assert.equal(result.fact_score, 'correct');
  assert.equal(result.citation_score, 'missing');
  assert.equal(result.invented.length, 0); // 公開元で確認した値はローカル未収録でも作り話ではない。
});

test('factsの外でも同じ項目の別の値を検出する', () => {
  const answer = response([fact('model-a:specs', '文脈長: 100K tokens')]);
  answer.text += '\nModel A の文脈長は200Kトークンです。';
  const result = score(question, answer);
  assert.equal(result.fact_score, 'wrong');
  assert.equal(result.contradictions.length, 1);
});

test('自然文の比較ではモデルごとの値を保ち、factsなしでも採点できる', () => {
  const q = { ...question, expected: { claims: [...question.expected.claims, { model_id: 'model-b', field: 'context', value: 200000, source_url: source }] } };
  const good = score(q, { text: 'Model A は100Kトークン、Model B は200Kトークンです。', facts: [] });
  const bad = score(q, { text: 'Model A は200Kトークン、Model B は100Kトークンです。', facts: [] });
  assert.equal(good.fact_score, 'correct');
  assert.equal(bad.fact_score, 'wrong');
  assert.equal(bad.contradictions.length, 2);
});

test('出典は画面に出る先頭3件だけ数え、部分的な出典も報告する', () => {
  const q = { ...question, expected: { claims: [...question.expected.claims, { model_id: 'model-b', field: 'context', value: 200000, source_url: source }] } };
  const result = score(q, response([
    fact('model-a:specs', '文脈長: 100K tokens', ['https://example.org/a', 'https://example.org/b', 'https://example.org/c', source]),
    fact('model-b:specs', '文脈長: 200K tokens', [])
  ]));
  assert.equal(result.fact_score, 'correct');
  assert.equal(result.citation_score, 'partial');
  assert.equal(result.citation_verified_score, 'missing');
});

test('本文のURLを出典に数えるが隠れたfactsのURLは数えない', () => {
  const visible = score(question, { text: `Model A の文脈長は100Kトークンです。 ${source}` });
  assert.equal(visible.fact_score, 'correct');
  assert.equal(visible.citation_score, 'complete');
  const hidden = score(question, { text: 'Model A の文脈長は100Kトークンです。', facts: [fact('model-a:specs', '非表示の別の文脈長: 100K tokens')] });
  assert.equal(hidden.fact_score, 'correct');
  assert.equal(hidden.citation_score, 'missing');
});

test('Anthropicのwww有無は同じ確認済みURLとして扱う', () => {
  const q = { ...question, expected: { claims: [{ ...question.expected.claims[0], source_url: 'https://www.anthropic.com/news/claude-2-1' }] } };
  const result = score(q, response([fact('model-a:specs', '文脈長: 100K tokens', ['https://anthropic.com/news/claude-2-1/'])]));
  assert.equal(result.citation_verified_score, 'complete');
});

test('別サービスと明記した終了日は矛盾ではない', () => {
  const q = { question: 'Model A の通常APIの終了日は？', expected: { claims: [{ model_id: model.id, field: 'retired_on', value: '2026-03-26', source_url: source }] } };
  const answer = response([
    fact('model-a:lifecycle', '終了記録: 2025-06-06 (Azure OpenAI版が提供終了)'),
    fact('model-a:availability', 'API終了日: 2026-03-26')
  ]);
  assert.equal(score(q, answer).fact_score, 'correct');
  answer.facts[0].text = '終了記録: 2025-06-06';
  answer.text = answer.facts.map(f => f.text).join('\n');
  assert.equal(score(q, answer).fact_score, 'wrong');
});

test('入力の誤った値とJSONの場所をまとめ、同じ問題を二重に数えない', () => {
  const q = { ...question, expected: { claims: [{ ...question.expected.claims[0], value: 200000 }] } };
  const result = { id: 'test-1', expected: q.expected, ...score(q, response([fact('model-a:specs', '文脈長: 100K tokens')])) };
  const input = { models: [{ ...model, recordedSpecs: { context_tokens: 100000 } }] };
  const before = JSON.stringify(input);
  const audit = findDataErrors([result], input);
  assert.equal(audit.errors.length, 1);
  assert.equal(audit.errors[0].record_id, model.id);
  assert.equal(audit.errors[0].wrong_value, 100000);
  assert.equal(audit.errors[0].right_value, 200000);
  assert.equal(audit.errors[0].source_url, source);
  assert.deepEqual(audit.errors[0].locations.map(l => l.path), ['[0].specs.context_tokens', '[0].recordedSpecs.context_tokens']);
  assert.deepEqual(audit.affected_questions, ['test-1']);
  assert.equal(JSON.stringify(input), before);
});

test('欠けた値と、入力にはない誤答をデータの誤った値に混ぜない', () => {
  const input = { models: [{ ...model, specs: { context_tokens: null } }] };
  const result = { id: 'missing', expected: question.expected, ...score(question, { text: '別の説明です。', facts: [] }) };
  const audit = findDataErrors([result], input);
  assert.equal(audit.errors.length, 0);
  assert.equal(audit.omissions.length, 1);
  assert.equal(audit.omissions[0].wrong_value, null);
  const invented = { id: 'invented', expected: question.expected, ...score(question, response([fact('model-a:specs', '文脈長: 999K tokens')])) };
  assert.equal(findDataErrors([invented], { models: records }).errors.length, 0);
});

test('事実の正答、出典、保留、記録にない断定は独立した集計', () => {
  const answer = response([fact('model-a:specs', '文脈長: 100K tokens', []), fact('model-a:lifecycle', '提供元: Maker Z', [])]);
  const result = { category: 'test', should_decline: false, ...score(question, answer) };
  const summary = summarize([result]);
  assert.equal(summary.fact.correct, 1);
  assert.equal(summary.citation.missing, 1);
  assert.equal(summary.inventions.answers, 1);
  assert.equal(summary.inventions.claims, 1);
  assert.equal(summary.decline['not-needed'], 1);
});

test('問題になった3件の公開日を出典なしの長文でも正答にする', async () => {
  const { questions } = JSON.parse(await readFile(new URL('./questions.json', import.meta.url), 'utf8'));
  for (const id of ['V1-06', 'V1-07', 'V1-08']) {
    const q = questions.find(item => item.id === id);
    const c = q.expected.claims[0];
    const result = scoreAnswer(q, { text: `説明が続きます。\n${c.model_id} の公開日は${c.value}です。\nさらに説明が続きます。`, facts: [] }, { records: [{ id: c.model_id, name: c.model_id, release: c.value }] });
    assert.equal(result.fact_score, 'correct', id);
    assert.equal(result.citation_score, 'missing', id);
  }
});

test('APIの日付やモデルの系統名を別モデルの主張と取り違えない', () => {
  const input = [{ ...model, release: '2023-01-01' }, { id: 'family', name: 'Family' }];
  const result = score(question, response([fact('model-a:specs', '文脈長: 100K tokens'), fact('model-a:lifecycle', '系統: Family / 公開: 2023-01-01')]), { records: input });
  assert.equal(result.invented.length, 0);
  assert.ok(result.claims.every(c => c.model_id === model.id));
  const rank = scoreAnswer({ question: '未知のモデルは？', should_decline: true }, response([fact('rank:other', 'Other [other] (Maker, 公開: 2023-01-01, 状態: open-weights, ctx: 100,000, out: 1,000)')]), {
    records: [{ id: 'other', name: 'Other', release: '2023-01-01', context: 100000, output: 1000, open: true }]
  });
  assert.equal(rank.invented.length, 0);
  assert.equal(rank.decline_score, 'failed-to-decline');
});

test('表示されたモデル名をfactsの対象IDで上書きしない', () => {
  const result = score(question, response([fact('model-a:specs', 'Model B の文脈長は100Kトークンです。')]));
  assert.equal(result.fact_score, 'wrong');
  assert.ok(result.missing.some(c => c.model_id === model.id));
});

test('間違った値の否定は矛盾する断定に数えない', () => {
  const result = score(question, { text: 'Model A の文脈長は200Kトークンではなく100Kトークンです。', facts: [] });
  assert.equal(result.fact_score, 'correct');
  assert.equal(result.contradictions.length, 0);
  const release = { question: 'Model A の公開日は？', expected: { claims: [{ model_id: model.id, field: 'release', value: '2025-01-20', source_url: source }] } };
  assert.equal(score(release, { text: 'Model A は2025-01-20です。', facts: [] }).fact_score, 'correct');
});
