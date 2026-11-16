import { readFile, writeFile, readdir } from 'node:fs/promises';
import { digest } from './run.js';

const english = process.argv.includes('--english');
if (english) globalThis.__MEMENTO_LANG = 'en';
const root = new URL('../../', import.meta.url);
const fixtureText = await readFile(new URL('./era-voice.json', import.meta.url), 'utf8');
const fixture = JSON.parse(fixtureText);
const files = ['web/js/closure.js', 'web/js/cross/stereo.js', ...(await readdir(new URL('web/js/persona/', root))).filter(f => f.endsWith('.js')).map(f => `web/js/persona/${f}`)];
const codeHashes = Object.fromEntries(await Promise.all(files.map(async f => [f, digest(await readFile(new URL(f, root)))])));
const previousFetch = globalThis.fetch;
globalThis.fetch = () => { throw new Error('Offline evaluation'); };
const { answer } = await import('../../web/js/closure.js');
const { crossAnswer } = await import('../../web/js/cross/stereo.js');
const normalize = s => String(s || '').normalize('NFKC').toLowerCase().replace(/(?<=\d),(?=\d)/g, '');
const systems = process.argv.includes('--cross')
  ? { cross: crossAnswer, cross_then_template: answer }
  : { template: (q, c) => answer(q, { ...c, noCross: true }), normal: answer };
const results = {};
try {
  for (const [name, fn] of Object.entries(systems)) {
    const responses = fixture.questions.map(q => {
      const ctx = { ...fixture, model: fixture.models.find(m => m.id === q.model_id), messages: [] };
      if (q.previous) {
        const previous = english ? q.previous_en : q.previous;
        const result = fn(previous, ctx);
        ctx.messages = [{ role: 'user', content: previous }, { role: 'assistant', content: result?.text || '', kind: result?.kind }];
      }
      const r = fn(english ? q.q_en : q.q, ctx) || { text: '', facts: [], kind: 'unknown' };
      const speech = r.speech ?? r.text.split(/\n\n(?:出典|Sources)(?=\n|$)/)[0];
      const note = r.museumNote?.text || '';
      const checks = {
        speech: new RegExp(english ? q.speech_en : q.speech, 'is').test(speech),
        noFuture: !(q.forbiddenSpeech || []).some(v => normalize(speech).includes(normalize(v))),
        note: !q.noteValues || q.noteValues.every(v => normalize(note).includes(normalize(v))),
        sourced: !q.sources || r.facts.some(f => f.sources?.length),
        voice: !q.voice || r.voice?.mode === q.voice,
        completion: !q.completion || r.voice?.interface === 'completion',
        oneLine: !q.oneLine || !speech.includes('\n'),
        language: !english || !/[ぁ-んァ-ヶ一-龯]/u.test(speech + note)
      };
      return { id: q.id, correct: Object.values(checks).every(Boolean), checks, response: r };
    });
    results[name] = { correct: responses.filter(r => r.correct).length, total: responses.length, responses };
  }
} finally { globalThis.fetch = previousFetch; }
const mode = process.argv.includes('--cross') ? 'cross' : 'persona';
const destination = new URL(`../${mode}/d4-${english ? 'en' : 'ja'}-`, import.meta.url);
const beforeURL = new URL(destination.href + 'before.json');
const report = { schema: fixture.schema, fixture_sha256: digest(fixtureText), code_sha256: codeHashes, results };
if (process.argv.includes('--capture-before')) {
  await writeFile(beforeURL, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
} else {
  const before = JSON.parse(await readFile(beforeURL, 'utf8'));
  if (before.fixture_sha256 !== report.fixture_sha256) throw new Error('Fixture changed after baseline');
  report.before = Object.fromEntries(Object.entries(before.results).map(([k,v]) => [k, { correct:v.correct, total:v.total }]));
  await writeFile(new URL(destination.href + 'after.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ ...(report.before ? { before: report.before } : {}), after: Object.fromEntries(Object.entries(results).map(([k,v])=>[k,{correct:v.correct,total:v.total,failures:v.responses.filter(r=>!r.correct).map(r=>r.id)}])) }, null, 2));
