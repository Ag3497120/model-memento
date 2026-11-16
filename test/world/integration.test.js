import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { webcrypto } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { buildWorld } from '../../scripts/world-build.js';
import { packRecord, unpackRecord, URL_TEMPLATES } from '../../lib/world/codec.js';
import { PROGRESS_SCHEMA } from '../../lib/world/progress.js';
import { ENRICH_QUEUE_PATH, DEFAULT_WORLD_DIRECTORY } from '../../lib/world/queue.js';
import { toolArtifacts } from '../../lib/world/tools/index.js';
import { parseArgs as enrichmentArgs, main as enrichLocal } from '../../scripts/enrich-local.js';
import { createWorldIndexClient, decodeWorldRecord } from '../../web/js/world/index-client.js';
import * as hf from '../../lib/world/registries/hf.js';
import * as modelscope from '../../lib/world/registries/modelscope.js';
import * as civitai from '../../lib/world/registries/civitai.js';
import * as api from '../../lib/world/registries/api.js';

const when = '2026-11-15T01:00:00Z';
const offline = () => { throw new Error('offline test'); };
async function temporary(t) {
  await mkdir('.world-out', { recursive: true });
  const out = await mkdtemp(resolve('.world-out/w1-integration-'));
  t.after(() => rm(out, { recursive: true, force: true }));
  return out;
}
const facts = (id, changes = {}) => ({ r: 'hf', id, a: id.split('/')[0], n: id.split('/').at(-1), t: 'text-generation',
  c: null, u: null, d: 5, l: null, lic: null, gated: false, url: `https://huggingface.co/${id}`, ...changes });
function clientAt(out, requests = []) {
  return createWorldIndexClient({ baseUrl: 'https://example.invalid/world/', crypto: webcrypto, cacheStorage: null,
    fetch: async url => { requests.push(url); return new Response(await readFile(join(out, new URL(url).pathname))); } });
}
const source = records => ({ meta: { code: 'hf' }, async *list() { yield* records; yield { state: null }; } });
const registryOptions = { hf: { now: () => Date.parse(when), sleep: async () => {} }, modelscope: { now: () => Date.parse(when), sleep: async () => {} },
  civitai: { now: () => Date.parse(when), sleep: async () => {} } };

test('compact facts round-trip unknowns, Unicode, URL overrides and fixed enums', () => {
  for (const r of [...Object.keys(URL_TEMPLATES), 'constructor']) {
    const record = facts('作り手/model', { r, a: null, n: '表示名', t: 'unknown-task', gated: null, lic: 'license-name', url: 'https://example.invalid/custom' });
    assert.deepEqual(unpackRecord(packRecord(record, { registry: r }), r), record);
    assert.deepEqual(decodeWorldRecord(packRecord(record, { registry: r }), r), record);
  }
  const record = facts('maker/model');
  const packed = packRecord(record, { registry: 'hf' });
  assert.equal(packed.t, 0);
  for (const key of ['r', 'a', 'n', 'url', 'x', 'gated']) assert(!Object.hasOwn(packed, key));
  assert.deepEqual(unpackRecord(packed, 'hf'), record);
  const tool = { schema: 'memento.world-tool.v1', id: 'github:lab/agent' };
  assert.equal(packRecord(tool), tool);
  assert.deepEqual(unpackRecord({ id: 'queue:id', tool_id: tool.id }), { id: 'queue:id', tool_id: tool.id });
});

test('cold lookup is exactly two fetches; offset references stay correct after replacements and removals', async t => {
  const out = await temporary(t), records = Array.from({ length: 40 }, (_, i) => facts(`maker/model-${i}`));
  const first = await buildWorld({ out, now: when, registries: [source(records)], fetch: offline });
  const requests = [], client = clientAt(out, requests);
  assert.deepEqual(await client.lookup('hf', records[0].id), records[0]);
  assert.equal(requests.length, 2);
  const all = await client.browseAuthor('hf', 'maker');
  const page = await client.browseAuthor('hf', 'maker', { offset: 7, limit: 4 });
  assert.deepEqual(page, all.slice(7, 11));
  assert.deepEqual(all.slice().sort(), records.map(record => record.id).sort());
  const next = await buildWorld({ out, state: first.manifestPath, now: '2026-11-16T00:00:00Z', registries: [source([
    facts('maker/model-1', { nsfw: true }), facts('maker/model-2', { a: 'new-maker' }), facts('maker/new')
  ])], fetch: offline });
  const fresh = clientAt(out);
  assert.equal(await fresh.lookup('hf', 'maker/model-1'), null);
  assert.equal((await fresh.browseAuthor('hf', 'maker')).length, 39);
  assert.deepEqual(await fresh.browseAuthor('hf', 'new-maker'), ['maker/model-2']);
  assert.equal(next.manifest.registries.hf.indexedCount, 40);
});

test('weekly full crawl resumes its budget checkpoint and completed state resets for the next delta', async t => {
  const out = await temporary(t), urls = [];
  const fetch = async input => {
    const url = new URL(input); urls.push(url);
    const cursor = url.searchParams.get('cursor');
    const rows = [{ id: cursor ? 'maker/two' : 'maker/one', lastModified: '2026-11-23T00:00:00Z', tags: [] }];
    return Response.json(rows, { headers: cursor ? {} : { link: '<https://huggingface.co/api/models?cursor=second>; rel="next"' } });
  };
  const options = { out, mode: 'full', now: when, registries: [hf], budget: 1, fetch, registryOptions };
  const first = await buildWorld(options);
  assert.equal(first.manifest.registries.hf.complete, false);
  assert.equal(first.manifest.registries.hf.state.cursor, 'second');
  const second = await buildWorld({ ...options, state: first.manifestPath, now: '2026-11-22T01:00:00Z' });
  assert.equal(urls[1].searchParams.get('cursor'), 'second');
  assert.equal(second.manifest.registries.hf.complete, true);
  assert.equal(second.manifest.registries.hf.checkedAt, '2026-11-15T01:00:00.000Z');
  const third = await buildWorld({ ...options, mode: 'delta', state: second.manifestPath, now: '2026-11-23T01:00:00Z' });
  assert.equal(urls[2].searchParams.has('cursor'), false);
  assert.equal(third.manifest.registries.hf.since, '2026-11-14T01:00:00.000Z');
  assert.equal(third.manifest.registries.hf.state.schema, PROGRESS_SCHEMA);
  assert.equal(third.manifest.registries.hf.state.excludedNsfw, 0);
  assert(!Object.hasOwn(third.manifest.registries.hf.state, 'done'));
  assert(!Object.hasOwn(third.manifest.registries.hf.state, 'nsfw'));
});

test('author differences preserve negative shard changes, gaps and pagination through skipped groups', async t => {
  const out = await temporary(t);
  const records = Array.from({ length: 900 }, (_, i) => facts(`${i < 450 ? 'a' : 'z'}/model-${i}`, { a: i % 2 ? 'mixed' : 'other' }));
  const result = await buildWorld({ out, now: when, registries: [source(records)], fetch: offline });
  const groups = [];
  for (const entry of result.manifest.authors) {
    const values = JSON.parse(gunzipSync(await readFile(join(out, 'world', entry.path))));
    groups.push(...values.mixed ?? []);
  }
  assert(groups.some(([, first]) => first < 0));
  assert(groups.some(([, , ...gaps]) => gaps.some(gap => gap > 1)));
  const client = clientAt(out), all = await client.browseAuthor('hf', 'mixed', { limit: 1000 });
  assert.deepEqual(all.slice().sort(), records.filter(record => record.a === 'mixed').map(record => record.id).sort());
  assert.deepEqual(await client.browseAuthor('hf', 'mixed', { offset: 47, limit: 11 }), all.slice(47, 58));
  assert.deepEqual(await client.browseAuthor('hf', 'mixed', { limit: 1000 }), all);
});

for (const module of [hf, modelscope, civitai, api]) {
  test(`${module.meta.code}: a later NSFW flag removes the model from every published view without double-counting`, async t => {
    const out = await temporary(t), code = module.meta.code;
    let adult = false;
    const fetch = async (input, init) => {
      const url = new URL(input);
      if (code === 'hf') return Response.json([{ id: 'maker/model', lastModified: '2026-11-16T00:00:00Z', tags: adult ? ['not-for-all-audiences'] : [], downloads: 100000 }]);
      if (code === 'modelscope') return Response.json({ success: true, data: { total_count: 1, page_number: 1, page_size: 50,
        models: [{ id: 'maker/model', last_modified: '2026-11-16T00:00:00Z', nsfw: adult, downloads: 100000 }] } });
      if (code === 'civitai') {
        assert.equal(url.searchParams.get('nsfw'), 'true');
        assert.equal(init.headers.authorization, 'Bearer fixture-only');
        return Response.json({ items: [{ id: 123, name: '試験用', creator: { username: 'maker' }, nsfw: adult, nsfwLevel: adult ? 4 : 1,
          availability: 'Public', stats: { downloadCount: 100000 } }], metadata: {} });
      }
      return Response.json({ maker: { models: { model: { name: '試験用', nsfw: adult } } } });
    };
    const options = { out, now: when, registries: [module], fetch, env: { CIVITAI_TOKEN: 'fixture-only' }, registryOptions };
    const first = await buildWorld(options);
    assert.equal(first.manifest.stats.records, 1);
    assert.equal(first.manifest.notable.count, 1);
    adult = true;
    const next = await buildWorld({ ...options, state: first.manifestPath, now: '2026-11-16T01:00:00Z' });
    assert.equal(next.manifest.stats.records, 0);
    assert.equal(next.manifest.registries[code].indexedCount, 0);
    assert.equal(next.manifest.registries[code].nsfwThisRun, 1);
    assert.equal(next.manifest.registries[code].nsfw, null);
    assert.equal(next.manifest.notable.count, 0);
    assert.equal(next.manifest.authors.length, 0);
    assert(next.manifest.new.every(entry => entry.count === 0));
    for (const entry of next.manifest.new) assert.equal(gunzipSync(await readFile(join(out, 'world', entry.path))).toString(), '[]\n');
  });
}

test('legacy records migrate on the next delta; an oversized result cannot replace a publication', async t => {
  const out = await temporary(t);
  const first = await buildWorld({ out, now: when, registries: [source([facts('maker/one')])], fetch: offline,
    storage: { omitUrls: false, compact: false, authorOffsets: false, gzipArrivals: false } });
  const next = await buildWorld({ out, now: '2026-11-16T00:00:00Z', state: first.manifestPath, registries: [], fetch: offline });
  assert.equal((await clientAt(out).lookup('hf', 'maker/one')).url, facts('maker/one').url);
  assert(next.manifest.new.every(entry => entry.path.endsWith('.json.gz')));
  const original = await readFile(next.manifestPath, 'utf8');
  await assert.rejects(buildWorld({ out, registries: [], fetch: offline, maxPublishedBytes: 1 }), /容量/);
  assert.equal(await readFile(next.manifestPath, 'utf8'), original);
});

test('one queue location connects the builder, discovery and local enrichment without invoking a backend', async t => {
  const out = await temporary(t);
  const item = { schema: 'memento.enrich-tool.v1', id: 'new:github:lab/agent', tool_id: 'github:lab/agent', sources: ['https://example.invalid/tool'] };
  const result = await buildWorld({ out, registries: [], fetch: offline, toolDiscovery: async () => ({ records: [], queue: [item], state: {}, stats: {}, warnings: [], coverage: {} }) });
  assert.equal(result.manifest.enrichQueue.path, ENRICH_QUEUE_PATH);
  assert.deepEqual(toolArtifacts({ records: [], queue: [item] }, { date: '2026-11-15' })[ENRICH_QUEUE_PATH], [item]);
  assert.equal(enrichmentArgs([], {}).queueLocation, resolve(DEFAULT_WORLD_DIRECTORY, ENRICH_QUEUE_PATH));
  let report;
  const status = await enrichLocal(['--dry-run', '--queue', join(out, 'world', ENRICH_QUEUE_PATH)], {
    env: {}, loadBackend: () => assert.fail('backend must not start'), log: text => { report = JSON.parse(text); }, error: assert.fail
  });
  assert.equal(status, 0);
  assert.equal(report.対象, 1);
  const publication = JSON.parse(await readFile(join(out, 'world/tools-state.json'), 'utf8'));
  assert.equal(publication.state.schema, PROGRESS_SCHEMA);
  assert(!Object.hasOwn(publication, 'queue'));
});
