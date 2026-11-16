import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { numericClaims, validateDraft, cachedCard, loadPersonaCards, shardFor } from '../../web/js/persona/cards.js';
import { buildPersonaCards } from '../../scripts/build-persona-cards.js';
import { answer, hydrateModel } from '../../web/js/closure.js';
import { loadContext } from '../../eval/persona/run.js';
import { getArchiveIndex } from '../../web/js/vera-index.js';
import { modelFacts } from '../../web/js/persona/facts.js';

const source = 'https://example.org/model';
const model = { id: 'test', name: '試験モデル', vendor: '試験社', family: '試験系列',
  specs: { context_tokens: 1000000 }, evidence: [{ url: source }], research: { status: 'researched' } };
const fact = { key: 'specs.context_tokens', id: 'model:test:specs.context_tokens', value: 1000000, text: '1000000', sources: [source] };
const facts = new Map([[fact.key, fact], ['release', { key: 'release', value: '2026-09-22', text: '2026-09-22', sources: [source] }]]);
const draft = { schema: 'memento.persona-card.v1', model_id: model.id, q: 'コンテキスト長は？',
  a_ja: '私の上限は100万トークンです。', fact_keys: [fact.key], sources: [source], written_by: 'test-author', reviewed: true };

test('numeric claims normalise commas, units and dates', () => {
  assert.deepEqual([...numericClaims('1,000,000 1M 100万')], ['1000000']);
  assert.deepEqual([...numericClaims('2026年9月22日 2026/09/22 2026-09-22')], ['2026-09-22']);
  assert.deepEqual([...numericClaims('1千 1k 1 million 1億 1b')], ['1000', '1000000', '100000000', '1000000000']);
  assert.deepEqual([...numericClaims('one millionトークン 百万トークン')], ['1000000']);
});

test('reviewed drafts need supported numeric claims and sources', () => {
  assert.equal(validateDraft(draft, facts).ok, true);
  for (const a_ja of ['上限は200万トークンです。', '上限はtwo millionトークンです。', '公開日は2030-09-22です。', '料金は-1000000ドルです。', '二〇三〇年に公開しました。']) {
    assert.equal(validateDraft({ ...draft, a_ja }, facts).ok, false, a_ja);
  }
  assert.equal(validateDraft({ ...draft, reviewed: false }, facts).ok, false);
  assert.equal(validateDraft({ ...draft, written_by: '' }, facts).ok, false);
  assert.equal(validateDraft({ ...draft, fact_keys: ['missing'] }, facts).ok, false);
  assert.equal(validateDraft({ ...draft, sources: ['https://example.org/other'] }, facts).ok, false);
  assert.equal(validateDraft({ ...draft, sources: ['javascript:alert(1)'] }, facts).ok, false);
  assert.equal(validateDraft({ ...draft, fact_keys: ['release'], a_ja: '私は2026年9月22日公開です。' }, facts).ok, true);
});

test('cards are accepted only while their cited values still match', () => {
  const card = { ...draft, kind: 'self_context', fact_values: { [fact.key]: fact.value } };
  assert.equal(cachedCard(draft.q, model.id, facts, [card]), card);
  const changed = new Map(facts);
  changed.set(fact.key, { ...fact, value: 2000000 });
  assert.equal(cachedCard(draft.q, model.id, changed, [card]), null);
  const result = answer(draft.q, { model, models: [model], personaCards: [card] });
  assert.match(result.text, /100万トークン/);
  assert.equal(result.facts[0].key, fact.key);
  assert.equal(result.kind, 'self_context');
});

test('missing and malformed optional shards return no cards', async () => {
  assert.deepEqual(await loadPersonaCards('test', { fetcher: async () => ({ ok: false }) }), []);
  assert.deepEqual(await loadPersonaCards('test', { fetcher: async () => { throw new Error('offline'); } }), []);
  assert.deepEqual(await loadPersonaCards('test', { fetcher: async () => ({ ok: true, json: async () => ({ schema: 'other' }) }) }), []);
  assert.deepEqual(await loadPersonaCards('test', { fetcher: async () => ({ ok: true, json: async () => ({ schema: 'memento.persona-cards.v1', models: { test: {} } }) }) }), []);
});

test('a supported price draft includes the recorded unit', async () => {
  const prices = modelFacts({ ...model, cost: { input: 4, output: 20 } });
  assert.equal(validateDraft({ ...draft, q: '料金は？', a_ja: '私は100万トークンあたり入力4米ドルです。', fact_keys: ['cost.input'] }, prices).ok, true);
});

test('the builder writes shards, accepts reviewed drafts and drops invented dates', async () => {
  const dir = await mkdtemp(fileURLToPath(new URL('./cards-fixture-', import.meta.url)));
  try {
    const data = path.join(dir, 'web/data');
    const curated = path.join(dir, 'data/curated/persona-cards');
    await mkdir(data, { recursive: true });
    await mkdir(curated, { recursive: true });
    await mkdir(path.join(dir, 'data/curated/personas'), { recursive: true });
    await writeFile(path.join(dir, 'data/curated/personas/test.json'), JSON.stringify({ schema: 'memento.persona.v1',
      model_id: 'test:canonical', name: model.name, aliases: [model.id], resolution: { kind: 'researched' }, traits: {} }));
    for (const [key, value] of Object.entries({ models: [model], closed: [], research: {}, 'real-links': {} })) {
      await writeFile(path.join(data, `${key}.json`), JSON.stringify(value));
    }
    await writeFile(path.join(curated, 'reviewed.json'), JSON.stringify([draft,
      { ...draft, model_id: 'test:canonical', q: 'What is your context window?', written_by: 'test-canonical' },
      { ...draft, q: 'いつ公開されたの？', a_ja: '2030年9月22日公開です。' }]));
    const out = path.join(dir, 'cards');
    const summary = await buildPersonaCards({ projectRoot: dir, outDir: out });
    assert.equal(summary.models, 1);
    assert.equal(summary.cards, 20);
    assert.equal(summary.accepted_drafts, 2);
    assert.equal(summary.dropped.length, 1);
    const files = await readdir(out);
    assert.deepEqual(files, [`${shardFor(model.id)}.json`]);
    const shard = JSON.parse(await readFile(path.join(out, files[0]), 'utf8'));
    assert.equal(shard.models[model.id].find(c => c.q === draft.q).written_by, 'test-author');
    assert.equal(shard.models[model.id].find(c => c.written_by === 'test-canonical').model_id, model.id);
    assert.equal(shard.models[model.id].find(c => c.q === draft.q).fact_values[fact.key], 1000000);
    await buildPersonaCards({ projectRoot: dir, outDir: out });
    assert.equal((await readdir(out)).length, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('a production check builds all notable cards without any output writes', async () => {
  const summary = await buildPersonaCards({ check: true });
  assert.ok(summary.models >= 6);
  assert.ok(summary.cards >= summary.models * 20);
  assert.ok(summary.shards > 1);
});

test('generated sourced cards survive the browser catalog enrichment', async () => {
  const dir = await mkdtemp(fileURLToPath(new URL('./production-cards-', import.meta.url)));
  try {
    await buildPersonaCards({ outDir: dir });
    const ctx = await loadContext();
    const index = getArchiveIndex(ctx);
    let checked = 0;
    for (const filename of await readdir(dir)) {
      const shard = JSON.parse(await readFile(path.join(dir, filename), 'utf8'));
      for (const [id, cards] of Object.entries(shard.models)) {
        const active = ctx.models.find(m => m.id === id) || index.modelById.get(id);
        const facts = modelFacts(hydrateModel(active, index), ctx);
        for (const card of cards.filter(c => c.fact_keys.length && c.sources.length)) {
          assert.ok(cachedCard(card.q, id, facts, cards), `${id} ${card.q}`);
          checked++;
        }
      }
    }
    assert.ok(checked > 1000);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
