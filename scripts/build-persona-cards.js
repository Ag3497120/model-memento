import { readFile, readdir, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { getArchiveIndex } from '../web/js/vera-index.js';
import { hydrateModel } from '../web/js/closure.js';
import { modelFacts, selfAnswer } from '../web/js/persona/facts.js';
import { personaFor } from '../web/js/persona/records.js';
import { COMMON_QUESTIONS, selfIntent } from '../web/js/persona/intents.js';
import { shardFor, validateDraft } from '../web/js/persona/cards.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async filename => JSON.parse(await readFile(filename, 'utf8'));

export async function buildPersonaCards({ projectRoot = root, outDir = path.join(projectRoot, 'web/data/persona-cards'), check = false } = {}) {
  const data = path.join(projectRoot, 'web/data');
  const [models, closed, research, realLinks] = await Promise.all(['models', 'closed', 'research', 'real-links'].map(name =>
    read(path.join(data, `${name}.json`)).catch(error => { if (name === 'real-links' && error.code === 'ENOENT') return {}; throw error; })));
  const personaDir = path.join(projectRoot, 'data/curated/personas');
  const personas = await Promise.all((await readdir(personaDir)).filter(f => f.endsWith('.json')).sort().map(f => read(path.join(personaDir, f))));
  const context = { models, closed, research, realLinks, personas };
  const index = getArchiveIndex(context);
  const notable = index.models.filter(m => m.isCurated || personaFor(m, context)?.resolution?.kind === 'researched')
    .map(m => hydrateModel(models.find(raw => raw.id === m.id) || m, index));
  const byId = new Map(notable.map(m => [m.id, m]));
  const byPersonaId = new Map(notable.map(m => [personaFor(m, context)?.model_id, m]).filter(([id]) => id));
  const shards = new Map();
  for (const model of notable) {
    const cards = COMMON_QUESTIONS.map(q => {
      const a = selfAnswer(selfIntent(q), model, context);
      return { schema: 'memento.persona-card.v1', model_id: model.id, q, a_ja: a.text.split('\n\n出典')[0],
        kind: a.kind, fact_keys: a.fact_keys, fact_values: Object.fromEntries(a.facts.map(f => [f.key, f.value])),
        sources: a.sources, written_by: 'record-template', reviewed: true };
    });
    const shard = shardFor(model.id);
    if (!shards.has(shard)) shards.set(shard, { schema: 'memento.persona-cards.v1', models: {} });
    shards.get(shard).models[model.id] = cards;
  }
  let accepted = 0;
  const dropped = [];
  const draftsDir = path.join(projectRoot, 'data/curated/persona-cards');
  const draftFiles = await readdir(draftsDir).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
  for (const filename of draftFiles.filter(f => f.endsWith('.json')).sort()) {
    let parsed;
    try { parsed = await read(path.join(draftsDir, filename)); }
    catch { dropped.push({ file: filename, reason: 'JSONを読めません。' }); continue; }
    for (const draft of Array.isArray(parsed) ? parsed : [parsed]) {
      const model = byId.get(draft?.model_id) || byPersonaId.get(draft?.model_id);
      const result = model ? validateDraft(draft, modelFacts(model, context)) : { ok: false, reason: 'モデル記録がありません。' };
      if (!result.ok || !selfIntent(draft.q)) {
        dropped.push({ file: filename, q: draft?.q, reason: result.reason || '対応する自己質問がありません。' });
        continue;
      }
      const cards = shards.get(shardFor(model.id)).models[model.id];
      const facts = modelFacts(model, context);
      const card = { ...draft, model_id: model.id, kind: selfAnswer(selfIntent(draft.q), model, context).kind,
        fact_values: Object.fromEntries(draft.fact_keys.map(key => [key, facts.get(key).value])) };
      const at = cards.findIndex(c => c.q === draft.q);
      if (at >= 0) cards[at] = card;
      else cards.push(card);
      accepted++;
    }
  }
  if (!check) {
    // Every shard is replaced atomically. A reader always sees one complete model's cards.
    const staging = `${outDir}.staging-${process.pid}`;
    await mkdir(staging, { recursive: true });
    try {
      for (const [shard, contents] of [...shards.entries()].sort()) {
        await writeFile(path.join(staging, `${shard}.json`), `${JSON.stringify(contents, null, 2)}\n`);
      }
      await mkdir(outDir, { recursive: true });
      for (const filename of await readdir(staging)) await rename(path.join(staging, filename), path.join(outDir, filename));
      const names = new Set([...shards.keys()].map(s => `${s}.json`));
      for (const filename of await readdir(outDir)) if (/^[a-f0-9]{2}\.json$/.test(filename) && !names.has(filename)) await rm(path.join(outDir, filename));
    } finally { await rm(staging, { recursive: true, force: true }); }
  }
  const allCards = [...shards.values()].flatMap(shard => Object.values(shard.models).flat());
  return { models: notable.length, cards: allCards.length,
    sourced_cards: allCards.filter(card => card.fact_keys.length && card.sources.length).length,
    shards: shards.size, accepted_drafts: accepted, dropped, check };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const outIndex = process.argv.indexOf('--out');
  console.log(JSON.stringify(await buildPersonaCards({ check: process.argv.includes('--check'),
    ...(outIndex >= 0 ? { outDir: path.resolve(process.argv[outIndex + 1]) } : {}) }), null, 2));
}
