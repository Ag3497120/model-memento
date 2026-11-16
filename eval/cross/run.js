// 立体十字の評価: 今のひな形（正規表現の意図判定＋ひな形）、立体十字、経路なしの十字、十字→ひな形の順の組合せを比べる。
// 通信なし。node eval/cross/run.js
import { readFile, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { loadContext, summarize } from '../persona/run.js';

const read = async url => JSON.parse(await readFile(new URL(url, import.meta.url), 'utf8'));
const SCOPE = /^(identity|self_|unknown$|model_lookup$)/;
const english = process.argv.includes('--english');
if (english) globalThis.__MEMENTO_LANG = 'en';
const UNKNOWN_TEXT = english ? 'I answer from the records. That information is not in the records.'
  : '私は記録をもとに答えています。その内容は記録では確認できません。';

function summarizeEnglish(questions, responses) {
  const normalized = value => String(value).normalize('NFKC').toLowerCase().replace(/(?<=\d),(?=\d)/g, '');
  const rate = (n, d) => ({ correct: n, total: d, percent: d ? Number((100 * n / d).toFixed(2)) : null });
  const rows = questions.map((q, i) => {
    const response = responses[i];
    const expected = q.expected;
    const text = normalized(response.text);
    const language = Boolean(text.trim()) && !/[ぁ-んァ-ヶ一-龯]/u.test(text);
    const firstPerson = !expected.firstPerson || /\b(?:i|my)\b/i.test(text);
    const value = (expected.values || []).every(v => text.includes(normalized(v))) &&
      !(expected.forbidden || []).some(v => text.includes(normalized(v)));
    const sourced = !expected.sourcesRequired || response.facts?.some(f => f.sources?.length);
    const abstained = response.kind === 'unknown' && /not in the records|only.*recorded in japanese/i.test(text);
    const kind = expected.kinds.includes(response.kind);
    return { language, firstPerson, answered: Boolean(text.trim()) && response.kind !== 'unknown',
      correctValue: value && sourced && response.kind !== 'unknown',
      correctUnknown: expected.unknown ? abstained && value && kind : null,
      correct: kind && value && sourced && (!expected.unknown || abstained) && language && firstPerson };
  });
  const answerable = questions.filter(q => !q.expected.unknown).length;
  const unknowns = rows.filter(r => r.correctUnknown !== null);
  const values = rows.filter((r, i) => !questions[i].expected.unknown && questions[i].expected.values?.length);
  return { total: questions.length,
    answer_rate: rate(rows.filter((r, i) => !questions[i].expected.unknown && r.answered).length, answerable),
    correct_value_rate: rate(values.filter(r => r.correctValue).length, values.length),
    correct_unknown_rate: rate(unknowns.filter(r => r.correctUnknown).length, unknowns.length),
    english_rate: rate(rows.filter(r => r.language).length, rows.length),
    first_person_rate: rate(rows.filter(r => r.firstPerson).length, rows.length),
    correct_all: rate(rows.filter(r => r.correct).length, rows.length) };
}

const globalFetch = globalThis.fetch;
globalThis.fetch = () => { throw new Error('評価中の通信は禁止です。'); };
const context = await loadContext();
const { answer } = await import('../../web/js/closure.js');
const { crossAnswer } = await import('../../web/js/cross/stereo.js');
const all = [...context.models, ...context.closed];

const systems = {
  template: (q, ctx) => answer(q, { ...ctx, noCross: true }),
  cross: (q, ctx) => crossAnswer(q, ctx) || { text: UNKNOWN_TEXT, kind: 'unknown', facts: [] },
  cross_flat: (q, ctx) => crossAnswer(q, ctx, { useEnergy: false, layers: 1 }) || { text: UNKNOWN_TEXT, kind: 'unknown', facts: [] },
  cross_then_template: (q, ctx) => answer(q, ctx)
};

async function evaluate(name, file, filter = () => true) {
  const { questions: raw } = await read(file);
  const questions = raw.filter(filter);
  const out = { set: name, questions: questions.length, systems: {} };
  for (const [system, fn] of Object.entries(systems)) {
    const responses = [];
    const started = performance.now();
    for (const q of questions) {
      const model = all.find(m => m.id === q.model_id);
      const r = fn(q.q, { ...context, model, messages: [] });
      responses.push({ id: q.id, q: q.q, text: r.text, kind: r.kind, facts: r.facts });
    }
    const ms = (performance.now() - started) / Math.max(1, questions.length);
    out.systems[system] = { summary: (english ? summarizeEnglish : summarize)(questions, responses), ms_per_question: Math.round(ms * 100) / 100, responses };
  }
  return out;
}

const base = english ? null : await evaluate('既存の質問（範囲内）', '../persona/questions.json', q => q.expected.kinds.some(k => SCOPE.test(k)));
const para = english ? null : await evaluate('言い換え（事前に作成）', './paraphrases.json');
const englishSet = english ? await evaluate('English questions written before evaluation', './english.json') : null;

// マトリョーシカ: 2段の問い。第2層に最初の問いを付けるかで比べる。
const twoHop = (english ? [] : [
  ['claude-opus-5-5', '前のモデルはいつ公開された？'],
  ['gpt-3.5-turbo-0301', '後継はいつ公開された？'],
  ['gemini-1.0-pro', '後継の文脈長は？'],
  ['gpt-4-0314', '後継モデルはいつ出た？']
]).map(([id, q]) => {
  const model = all.find(m => m.id === id);
  const ctx = { ...context, model, messages: [] };
  const withInitial = crossAnswer(q, ctx, { includeInitial: true });
  const without = crossAnswer(q, ctx, { includeInitial: false });
  return { model: id, q, with_initial: withInitial?.text ?? null, without_initial: without?.text ?? null,
    layer2: withInitial?.layers?.[1] ?? null };
});
globalThis.fetch = globalFetch;

const table = set => Object.fromEntries(Object.entries(set.systems).map(([k, v]) => [k, {
  answer_rate: v.summary.answer_rate.percent, correct_value: v.summary.correct_value_rate.percent,
  correct_unknown: v.summary.correct_unknown_rate.percent, correct_all: v.summary.correct_all.percent,
  ...(english ? { english: v.summary.english_rate.percent, first_person: v.summary.first_person_rate.percent } : {}), ms: v.ms_per_question }]));
const report = { schema: 'memento.cross-eval.v1', at: new Date().toISOString().slice(0, 10),
  ...(english ? { english: { questions: englishSet.questions, ...table(englishSet) } }
    : { base: { questions: base.questions, ...table(base) }, paraphrase: { questions: para.questions, ...table(para) }, twoHop }) };
if (process.argv.includes('--write-report')) await writeFile(new URL('./report.json', import.meta.url), JSON.stringify({ ...report, detail: { base, para, english: englishSet } }, null, 1) + '\n');
console.log(JSON.stringify(process.argv.includes('--detail') ? { ...report, detail: englishSet } : report, null, 2));
