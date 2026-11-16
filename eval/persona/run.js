import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = new URL('../../', import.meta.url);
const read = async name => JSON.parse(await readFile(new URL(name, root), 'utf8'));
export const digest = value => createHash('sha256').update(value).digest('hex');

export async function loadContext() {
  const names = ['models', 'closed', 'catalog', 'research', 'counts', 'personas', 'real-links'];
  const inputs = await Promise.all(names.map(async name => {
    const filename = `web/data/${name}.json`;
    const text = await readFile(new URL(filename, root), 'utf8');
    return { name, filename, value: JSON.parse(text), hash: digest(text) };
  }));
  const data = Object.fromEntries(inputs.map(input => [input.name, input.value]));
  const inputHashes = Object.fromEntries(inputs.map(input => [input.filename, input.hash]));
  const closed = data.closed.map(m => ({ ...m,
    specs: { knowledge_cutoff: m.knowledge, context_tokens: m.context, max_output_tokens: m.output },
    recordedSpecs: { knowledge_cutoff: m.knowledge, context_tokens: m.context, max_output_tokens: m.output },
    lifecycle: { status: m.status || (m.open ? 'open-weights' : 'alive'), events: m.release ? [{ date: m.release, type: 'released', label: '公開' }] : [] },
    traits: [], evidence: [{ url: 'https://models.dev' }, { url: 'https://openrouter.ai/models' }]
  }));
  return { models: data.models, closed, tools: data.catalog.tools, research: data.research,
    counts: data.counts, personas: data.personas, realLinks: data['real-links'], messages: [], inputHashes };
}

const normalized = value => String(value).normalize('NFKC').toLowerCase().replace(/(?<=\d),(?=\d)/g, '');
const unknown = text => /記録では確認できません|記録にありません|確認できない|未確認|覚えていません/.test(text);

export function score(question, response) {
  const { expected } = question;
  const text = normalized(response.text || '');
  const kind = expected.kinds.includes(response.kind);
  const value = (expected.values || []).every(v => text.includes(normalized(v))) &&
    !(expected.forbidden || []).some(v => text.includes(normalized(v)));
  const abstained = response.kind === 'unknown' && unknown(response.text || '');
  const sourced = !expected.sourcesRequired || response.facts?.some(f => f.sources?.length);
  return { answered: Boolean(response.text?.trim()) && response.kind !== 'unknown',
    correctValue: value && sourced && response.kind !== 'unknown',
    correct: kind && value && sourced && (!expected.unknown || abstained),
    correctUnknown: expected.unknown ? abstained && value && kind : null };
}

export function summarize(questions, responses) {
  const rows = questions.map((q, i) => score(q, responses[i]));
  const answerable = questions.filter(q => !q.expected.unknown).length;
  const unknowns = rows.filter(r => r.correctUnknown !== null);
  const values = rows.filter((r, i) => !questions[i].expected.unknown && questions[i].expected.values?.length);
  const rate = (n, d) => ({ correct: n, total: d, percent: d ? Number((100 * n / d).toFixed(2)) : null });
  return {
    total: questions.length,
    answer_rate: rate(rows.filter((r, i) => !questions[i].expected.unknown && r.answered).length, answerable),
    correct_value_rate: rate(values.filter(r => r.correctValue).length, values.length),
    correct_unknown_rate: rate(unknowns.filter(r => r.correctUnknown).length, unknowns.length),
    correct_all: rate(rows.filter(r => r.correct).length, rows.length)
  };
}

export async function run({ captureBefore = false, write = true } = {}) {
  const fixtureText = await readFile(new URL('questions.json', import.meta.url), 'utf8');
  const { questions, expectation_corrections = [] } = JSON.parse(fixtureText);
  const context = await loadContext();
  // Every test and import is offline, including optional browser assets.
  const previousFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('評価中の通信は禁止です。'); };
  let responses;
  try {
    const { answer } = await import('../../web/js/closure.js');
    responses = questions.map(q => {
      const model = [...context.models, ...context.closed].find(m => m.id === q.model_id);
      if (!model) throw new Error(`モデル記録がありません ${q.model_id}`);
      const result = answer(q.q, { ...context, model });
      return { text: result.text, kind: result.kind, facts: result.facts };
    });
  } finally { globalThis.fetch = previousFetch; }
  for (const [filename, hash] of Object.entries(context.inputHashes)) {
    if (digest(await readFile(new URL(filename, root))) !== hash) throw new Error(`評価中に記録が変わりました ${filename}`);
  }
  const snapshot = { schema: 'memento.persona-eval.v1', rubric_version: 1, fixture_sha256: digest(fixtureText),
    closure_sha256: digest(await readFile(new URL('web/js/closure.js', root))),
    input_sha256: context.inputHashes, responses, summary: summarize(questions, responses) };
  if (captureBefore) {
    await writeFile(new URL('before.json', import.meta.url), `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx' });
    return { before: snapshot.summary };
  }
  const before = await read('eval/persona/before.json');
  if (before.fixture_sha256 !== snapshot.fixture_sha256) throw new Error('前後で質問票が変わっています。');
  const report = { schema: snapshot.schema, rubric_version: snapshot.rubric_version, fixture_sha256: snapshot.fixture_sha256,
    original_fixture_sha256: before.original_fixture_sha256 || before.fixture_sha256, expectation_corrections,
    closure_sha256: snapshot.closure_sha256, before_input_sha256: before.input_sha256 || null, after_input_sha256: snapshot.input_sha256,
    before: summarize(questions, before.responses), after: snapshot.summary,
    failures: questions.filter((q, i) => !score(q, responses[i]).correct).map(q => q.id) };
  if (write) await writeFile(new URL('after.json', import.meta.url), `${JSON.stringify({ ...report, responses }, null, 2)}\n`);
  return report;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  console.log(JSON.stringify(await run({ captureBefore: process.argv.includes('--capture-before') }), null, 2));
}
