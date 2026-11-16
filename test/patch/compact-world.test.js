// Regression (2026-11-16, first GitHub run): world shards store compact records without `r`;
// the patch snapshot must read them with the registry implied by the shard folder.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { collectSnapshot } from '../../lib/patch/snapshot.js';
import { prefixOf } from '../../lib/world/shard.js';

test('patch snapshot reads compact world shards (registry from the folder)', async () => {
  const root = await mkdtemp(join(tmpdir(), 'memento-world-'));
  try {
    const id = 'maker/model';
    const prefix = prefixOf(id);
    const body = gzipSync(Buffer.from(JSON.stringify({ i: id, t: 0, c: '2026-01-01', d: 3 }) + '\n'));
    await mkdir(join(root, 'data'), { recursive: true });
    for (const name of ['models', 'closed']) await writeFile(join(root, `data/${name}.json`), '[]');
    await writeFile(join(root, 'data/catalog.json'), JSON.stringify({ tools: [] }));
    await mkdir(join(root, 'world/shards/hf'), { recursive: true });
    await writeFile(join(root, `world/shards/hf/${prefix}.jsonl.gz`), body);
    await writeFile(join(root, 'world/manifest.json'), JSON.stringify({ schema: 'memento.world-index.v1',
      shards: [{ r: 'hf', prefix, path: `shards/hf/${prefix}.jsonl.gz`, count: 1, bytes: body.length,
        sha256: createHash('sha256').update(body).digest('hex') }] }));
    const added = [];
    await collectSnapshot(root, { add: async (key, value) => { added.push([key, value[0]]); } });
    assert.ok(added.some(([, value]) => value === `world:hf:${id}`), JSON.stringify(added));
  } finally { await rm(root, { recursive: true, force: true }); }
});
