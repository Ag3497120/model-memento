// 中継（relay/）が読む事実のファイル: web/data/facts/<xx>.json
// 中継はブラウザから届いた事実を信じない。公開サイトのこのファイルだけを読み、モデルに渡す。
// 一つのモデルの事実 = modelFacts() の結果（キー・値の文・出典）。人格の記述は researched / official のものだけが入る。
import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { getArchiveIndex } from '../web/js/vera-index.js';
import { hydrateModel } from '../web/js/closure.js';
import { modelFacts } from '../web/js/persona/facts.js';
import { shardFor } from '../web/js/persona/cards.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async filename => JSON.parse(await readFile(filename, 'utf8'));
const text = value => typeof value === 'string' ? value : JSON.stringify(value);

export async function buildRelayFacts({ projectRoot = root, outDir = path.join(projectRoot, 'web/data/facts') } = {}) {
  const data = path.join(projectRoot, 'web/data');
  const [models, closed, research, realLinks] = await Promise.all(['models', 'closed', 'research', 'real-links'].map(name =>
    read(path.join(data, `${name}.json`)).catch(error => { if (name === 'real-links' && error.code === 'ENOENT') return {}; throw error; })));
  const personaDir = path.join(projectRoot, 'data/curated/personas');
  const personas = await Promise.all((await readdir(personaDir)).filter(f => f.endsWith('.json')).sort().map(f => read(path.join(personaDir, f))));
  const context = { models, closed, research, realLinks, personas };
  const index = getArchiveIndex(context);
  const shards = new Map();
  let count = 0, factCount = 0;
  for (const entry of index.models) {
    const model = hydrateModel(models.find(raw => raw.id === entry.id) || entry, index);
    const facts = [...modelFacts(model, context).values()]
      .filter(f => !f.key.startsWith('links.'))
      .map(f => ({ k: f.key, t: f.text ?? text(f.value), ...(f.value_en ? { e: text(f.value_en) } : {}), s: f.sources.slice(0, 3) }));
    if (!facts.length) continue;
    const shard = shardFor(model.id);
    if (!shards.has(shard)) shards.set(shard, {});
    shards.get(shard)[model.id] = { n: model.name || model.id, f: facts };
    count++; factCount += facts.length;
  }
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  let bytes = 0;
  for (const [shard, entries] of shards) {
    const body = JSON.stringify({ schema: 'memento.relay-facts.v1', models: entries });
    bytes += Buffer.byteLength(body);
    await writeFile(path.join(outDir, `${shard}.json`), body);
  }
  return { models: count, facts: factCount, shards: shards.size, bytes };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  console.log(JSON.stringify(await buildRelayFacts()));
}
