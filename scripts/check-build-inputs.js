import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));

export async function siteCounts(web) {
  const data = path.join(web, 'data');
  const [models, closed, catalog, era, guides] = await Promise.all(['models', 'closed', 'catalog', 'era', 'guides'].map(name => read(path.join(data, `${name}.json`))));
  return { models: models.length, closed: closed.length, tools: catalog.tools.length,
    versions: catalog.tools.reduce((sum, tool) => sum + tool.versions.length, 0),
    era: Object.keys(era).length, guides: guides.guides.length,
    facts: (await fs.readdir(path.join(data, 'facts'))).filter(name => /^[a-f0-9]{2}\.json$/.test(name)).length };
}

export async function checkBuildInputs({ web, reference }) {
  const counts = await siteCounts(web);
  const manifest = await read(path.join(web, 'data/manifest.json'));
  for (const [key, count] of Object.entries(counts)) {
    if (!Number.isSafeInteger(count) || count < 1) throw new Error(`Empty build output: ${key}`);
    if (Object.hasOwn(manifest, key) && manifest[key] !== count) throw new Error(`Build count mismatch: ${key}`);
  }
  const index = await read(path.join(web, 'data/tools/index.json'));
  if (index.count !== index.tools.length || manifest.sourceTools !== index.count) throw new Error('Incomplete committed R5 input');
  const relay = await read(path.join(web, 'data/relay.json'));
  if (!Object.hasOwn(relay, 'url') || relay.url !== null && !/^https:\/\//.test(relay.url)) throw new Error('Invalid relay output');
  for (const name of await fs.readdir(path.join(web, 'data/facts'))) {
    const shard = await read(path.join(web, 'data/facts', name));
    if (shard.schema !== 'memento.relay-facts.v1' || !shard.models || !Object.keys(shard.models).length) throw new Error('Invalid facts shard');
  }
  if (reference) {
    const previous = reference.endsWith('.json') ? await read(reference) : await siteCounts(reference);
    for (const key of ['models', 'tools', 'versions', 'era', 'guides']) {
      if (counts[key] < previous[key]) throw new Error(`Build lost committed ${key}: ${previous[key]} -> ${counts[key]}`);
    }
  }
  return counts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { web: { type: 'string', default: 'web' }, reference: { type: 'string' } } });
  try { console.log(JSON.stringify(await checkBuildInputs(values))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
