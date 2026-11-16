#!/usr/bin/env node
/**
 * Sync local verified curated inputs (.work/, ~/.model-memento/, site/data/) into
 * git-tracked data/curated/ so GitHub Actions CI runs reproducibly on fresh checkouts.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const home = process.env.MODEL_MEMENTO_HOME || path.join(os.homedir(), '.model-memento');
const out = path.join(root, 'data/curated');

const read = async (p, fallback = null) => {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return fallback; }
};

await fs.mkdir(path.join(out, 'r3'), { recursive: true });
await fs.mkdir(path.join(out, 'editions'), { recursive: true });

// 1. Harness baseline
const harness = await read(path.join(home, 'harness.json'), await read(path.join(root, 'site/data/harness.json'), { tools: [] }));
await fs.writeFile(path.join(out, 'harness.json'), JSON.stringify(harness));

// 2. Research slices used by build-web.js
for (const name of ['versions', 'fonts', 'harness-sources', 'registries', 'availability']) {
  const data = await read(path.join(root, `.work/r3/${name}.json`), null);
  if (data) await fs.writeFile(path.join(out, 'r3', `${name}.json`), JSON.stringify(data));
}

// 3. Merge design-out snapshots
const designs = [];
for (const f of await fs.readdir(path.join(root, '.work/design-out')).catch(() => [])) {
  if (!f.endsWith('.json')) continue;
  const d = await read(path.join(root, '.work/design-out', f));
  if (Array.isArray(d?.versions)) designs.push(...d.versions);
}
if (designs.length) await fs.writeFile(path.join(out, 'designs.json'), JSON.stringify({ versions: designs }));

// 4. Editions & 2026-11 model updates
let curatedEditions = 0;
for (const [src, dst] of [
  ['.work/editions-chat.json', 'editions/chat.json'],
  ['.work/editions-ide-cli.json', 'editions/ide-cli.json'],
  ['.work/tools-2026-11.json', 'editions/tools-2026-11.json'],
  ['.work/models-2026-11.json', 'models-updates.json'],
]) {
  const d = await read(path.join(root, src), null);
  if (d) {
    await fs.writeFile(path.join(out, dst), JSON.stringify(d));
    if (d.editions && typeof d.editions === 'object') {
      for (const list of Object.values(d.editions)) {
        if (Array.isArray(list)) curatedEditions += list.length;
      }
    }
  }
}

// 5. Merged base profiles + roster + archived models
const archived = await read(path.join(root, 'site/data/models.json'), []);
const merged = new Map(archived.map(m => [m.id, m]));
for (const f of await fs.readdir(path.join(home, 'profiles')).catch(() => [])) {
  if (!f.endsWith('.json')) continue;
  const p = await read(path.join(home, 'profiles', f));
  if (p?.id) merged.set(p.id, p);
}
const roster = await read(path.join(home, 'roster.json'), { models: [] });
await fs.writeFile(path.join(out, 'models-base.json'), JSON.stringify([...merged.values()]));
await fs.writeFile(path.join(out, 'roster.json'), JSON.stringify(roster));

// 6. Offline closed fallback, instructions, memories
const closedFallback = await read(path.join(root, 'site/data/closed.json'), null);
if (closedFallback) await fs.writeFile(path.join(out, 'closed-fallback.json'), JSON.stringify(closedFallback));
const harnessFiles = await read(path.join(home, 'harness-files.json'), await read(path.join(root, 'site/data/harness-files.json'), {}));
await fs.writeFile(path.join(out, 'instructions.json'), JSON.stringify(harnessFiles));
const memories = await read(path.join(home, 'memories.json'), []);
await fs.writeFile(path.join(out, 'memories.json'), JSON.stringify(memories));

console.log(JSON.stringify({
  exportedAt: new Date().toISOString(),
  harnessTools: harness.tools?.length || 0,
  curatedEditions,
  designs: designs.length,
  modelsBase: merged.size,
  rosterModels: roster.models?.length || 0,
}, null, 2));
