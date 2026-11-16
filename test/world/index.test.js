import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { gunzipSync } from 'node:zlib';
import { buildWorld, discoverRegistries, parseArgs, syntheticRegistry, ListingPolicyError } from '../../scripts/world-build.js';
import { externalSort, jsonArray, lines, prefixOf } from '../../lib/world/shard.js';
import { progress } from '../../lib/world/progress.js';
import { unpackRecord } from '../../lib/world/codec.js';
import { promotion, toNotable } from '../../lib/world/promote.js';
import { createWorldIndexClient } from '../../web/js/world/index-client.js';

const ROOT = resolve('.world-out');
const offline = async () => { throw new Error('test forbids network'); };
const when = '2026-11-15T01:00:00Z';
const model = (id, fields = {}) => ({ r: 'fake', id, a: id.split('/')[0], n: id.split('/').at(-1), t: null, c: null, u: null, d: 1, l: 1, lic: null, gated: false, url: `https://example.invalid/${id}`, ...fields });
const registry = (records, fields = {}) => ({ meta: { code: 'fake', name: '試験用', terms: 'unverified', rateLimit: 'unverified', sources: [] }, async *list() { yield* records; yield { state: null }; }, ...fields });

async function temporary(t) {
  await mkdir(ROOT, { recursive: true });
  const path = await mkdtemp(join(ROOT, 'index-test-'));
  t.after(() => rm(path, { recursive: true, force: true }));
  return path;
}
async function allModels(result) {
  const base = result.manifestPath.replace(/manifest.json$/, '');
  const records = [];
  for (const shard of result.manifest.shards) {
    const bytes = await readFile(join(base, shard.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), shard.sha256);
    records.push(...gunzipSync(bytes).toString().trim().split('\n').filter(Boolean).map(line => unpackRecord(JSON.parse(line), shard.r, result.manifest.encoding?.urls)));
  }
  return records.sort((a, b) => a.id < b.id ? -1 : 1);
}
async function jsonAt(result, path) {
  if (path.startsWith('new/')) path = result.manifest.new.find(entry => entry.path === path || entry.path === path + '.gz')?.path ?? path;
  let bytes = await readFile(join(result.manifestPath.replace(/manifest.json$/, ''), path));
  if (path.endsWith('.gz')) bytes = gunzipSync(bytes);
  const value = JSON.parse(bytes.toString());
  return Array.isArray(value) ? value.map(raw => unpackRecord(raw, undefined, result.manifest.encoding?.urls)) : value;
}
function artifactFetch(directory, requests = [], { unpack = false } = {}) {
  return async url => {
    const parsed = new URL(url); requests.push(parsed.pathname);
    const path = parsed.pathname.replace(/^\/world\//, '');
    try {
      let data = await readFile(join(directory, 'world', path));
      if (unpack && path.endsWith('.gz')) data = gunzipSync(data);
      return new Response(data);
    } catch (error) { if (error.code === 'ENOENT') return new Response('', { status: 404 }); throw error; }
  };
}

test('CLI has strict modes, budget and paths', () => {
  assert.deepEqual(parseArgs([]), {});
  assert.deepEqual(parseArgs(['--full', '--budget', '0', '--out', 'somewhere', '--state', 'https://example.invalid/world/manifest.json']), { mode: 'full', budget: 0, out: 'somewhere', state: 'https://example.invalid/world/manifest.json' });
  for (const args of [['--full', '--delta'], ['--budget', '-1'], ['--budget', '1.1'], ['--budget'], ['--out'], ['--oops']]) assert.throws(() => parseArgs(args));
});

test('promotion boundaries, explicit maker/tracked choices and NSFW', () => {
  assert.equal(promotion(model('a/one', { d: 4, l: 2 })), null);
  assert.equal(promotion(model('a/one', { d: 5 })), 'ダウンロード10万以上');
  assert.equal(promotion(model('a/one', { l: 3 })), 'いいね1000以上');
  assert.equal(promotion(model('a/one', { r: 'api' })), '提供元の一覧に掲載');
  assert.equal(promotion(model('a/one'), { knownAuthors: ['fake:a'] }), '注目する作り手');
  assert.equal(promotion(model('a/one'), { trackedModels: ['fake:a/one'] }), '掲載中の道具で利用');
  assert.equal(toNotable(model('a/one', { d: 5, nsfw: true })), null);
  assert.equal(promotion(model('a/one', { d: 7, l: '3' })), null);
});

test('external sorting uses multiple passes, streaming arrays handle split UTF-8 and quoting', async t => {
  const out = await temporary(t);
  const input = Array.from({ length: 101 }, (_, i) => [String(100 - i).padStart(3, '0'), i, { i }]);
  const sorted = [];
  for await (const item of externalSort(input, join(out, 'sort'), { chunkSize: 3, fanIn: 2 })) sorted.push(item);
  assert.deepEqual(sorted.map(item => item[2].i), input.map(item => item[2].i).reverse());
  const records = [{ id: '日本語', text: 'a"}\\[', nested: [1, { x: 2 }] }, { id: 'next' }];
  const bytes = Buffer.from(JSON.stringify(records));
  async function* singleBytes() { for (const byte of bytes) yield Buffer.from([byte]); }
  const parsed = [];
  for await (const item of jsonArray(singleBytes())) parsed.push(item);
  assert.deepEqual(parsed, records);
  for (const text of ['[{},]', '[{}{}]', '[{}', '[{}]oops']) {
    await assert.rejects(async () => { for await (const ignored of jsonArray(Readable.from([text]))) void ignored; });
  }
  await assert.rejects(async () => { for await (const ignored of lines(Readable.from(['123456']), 3)) void ignored; });
});

test('dynamic discovery imports every registry and ignores helpers, no registry directory is safe', async t => {
  const out = await temporary(t);
  assert.deepEqual(await discoverRegistries(join(out, 'absent')), []);
  await writeFile(join(out, 'a.js'), 'export const meta = {code:"fake"}; export async function* list() {yield {state:null}}');
  await writeFile(join(out, 'b.js'), 'export const helper = true');
  assert.equal((await discoverRegistries(out)).length, 1);
  await writeFile(join(out, 'c.js'), 'export const meta = {code:"fake"}; export async function* list() {}');
  await assert.rejects(discoverRegistries(out), /重複/);
});

test('full build publishes hashes, author arrays, deduplicated new arrivals, notable and compact facts only', async t => {
  const out = await temporary(t);
  const result = await buildWorld({ out, mode: 'full', now: when, fetch: offline, registries: [registry([
    model('Maker/One', { d: 5, description: 'must not be stored', image: 'must not be stored' }),
    model('Maker/Two'), model('Maker/One', { d: 6 }),
    model('__proto__/Safe', { a: '__proto__' }),
    model('Secret/Hidden', { nsfw: true }), { bad: true }
  ])], sortOptions: { chunkSize: 1, fanIn: 2 } });
  const records = await allModels(result);
  assert.equal(records.length, 3);
  assert.equal(records.find(record => record.id === 'Maker/One').d, 6);
  assert(records.every(record => !Object.hasOwn(record, 'image') && !Object.hasOwn(record, 'description')));
  assert.equal(result.manifest.registries.fake.nsfw, null);
  assert.equal(result.manifest.registries.fake.nsfwThisRun, 1);
  assert.equal(result.manifest.registries.fake.invalid, 1);
  assert.equal(result.manifest.stats.records, 3);
  assert.equal((await jsonAt(result, 'new/2026-11-15.json')).length, 3);
  assert.equal(result.manifest.notable.count, 1);
  const author = result.manifest.authors.find(entry => entry.prefix === prefixOf('Maker'));
  const data = JSON.parse(gunzipSync(await readFile(join(out, 'world', author.path))));
  assert.equal(data.Maker.flatMap(([, ...ordinals]) => ordinals).length, 2);
  assert(!JSON.stringify(data).includes('Maker/One'));
  assert.equal(prefixOf('MAKER/ONE'), prefixOf('maker/one'));
  assert.equal(result.publishedBytes, Object.values(result.manifest.sizes).reduce((a, b) => a + b, result.manifestBytes));
  assert.deepEqual((await readdir(out)), ['world']);
});

test('remote delta needs no old local shards: keeps absent models, updates facts, detects exact new IDs, removes NSFW', async t => {
  const root = await temporary(t), oldDir = join(root, 'old'), nextDir = join(root, 'next');
  const first = await buildWorld({ out: oldDir, mode: 'full', now: when, fetch: offline, registries: [registry([model('a/one'), model('a/two'), model('a/hide')])] });
  const requests = [];
  const next = await buildWorld({ out: nextDir, now: '2026-11-16T00:00:00Z', state: 'https://example.invalid/world/manifest.json', fetch: artifactFetch(oldDir, requests), registries: [registry([
    model('a/one', { d: 5 }), model('a/ONE'), model('a/three'), model('a/hide', { nsfw: true })
  ])] });
  assert.deepEqual((await allModels(next)).map(record => record.id), ['a/ONE', 'a/one', 'a/three', 'a/two']);
  assert.deepEqual((await jsonAt(next, 'new/2026-11-16.json')).map(record => record.id), ['a/ONE', 'a/three']);
  assert.equal((await jsonAt(next, 'new/2026-11-15.json')).length, 2); // NSFW identity also removed from history
  assert.equal(next.manifest.registries.fake.nsfw, null);
  assert.equal(next.manifest.registries.fake.nsfwThisRun, 1);
  assert.equal(next.manifest.notable.count, 1);
  assert.equal(requests.filter(path => path.includes('/shards/')).length, first.manifest.shards.length);
  assert.equal(next.manifest.stats.artifactRequests, requests.length - 1);
  // Re-running the same day with no module must preserve history and old records.
  const repeated = await buildWorld({ out: nextDir, now: '2026-11-16T02:00:00Z', state: next.manifestPath, fetch: offline, registries: [] });
  assert.equal((await jsonAt(repeated, 'new/2026-11-16.json')).length, 2);
  assert.equal(repeated.manifest.registries.fake.listingStatus, 'module-missing');
  assert.equal(repeated.manifest.stats.records, 4);
});

test('request budget is independently enforced; cursor and scan watermark resume', async t => {
  const root = await temporary(t);
  let fetched = 0, observed;
  const paging = registry([], { async *list(options) {
    observed = { since: options.since, state: options.state, budget: options.budget };
    await options.fetch('https://example.invalid/page');
    yield model('a/one'); yield { state: { cursor: 'next' } };
    await options.fetch('https://example.invalid/page2'); // wrapper enforces budget
  } });
  const first = await buildWorld({ out: root, now: when, budget: 1, fetch: async () => { fetched++; return new Response('{}'); }, registries: [paging] });
  assert.equal(fetched, 1);
  assert.equal(first.manifest.registries.fake.requests, 1);
  assert.equal(first.manifest.registries.fake.complete, false);
  assert.deepEqual(first.manifest.registries.fake.state, progress({ cursor: 'next' }, 'fake'));
  assert.equal(observed.since, null);
  const second = await buildWorld({ out: root, state: first.manifestPath, now: '2026-11-16T00:00:00Z', fetch: offline, registries: [registry([], { async *list(options) { observed = options; yield { state: null }; } })] });
  assert.equal(observed.since, null); // finish initial full scan before advancing since
  assert.deepEqual(observed.state, progress({ cursor: 'next' }, 'fake'));
  assert.equal(second.manifest.registries.fake.complete, true);
  await buildWorld({ out: root, state: second.manifestPath, now: '2026-11-17T00:00:00Z', fetch: offline, registries: [registry([], { async *list(options) { observed = options; yield { state: null }; } })] });
  assert.equal(observed.since, '2026-11-14T01:00:00.000Z'); // watermark is start of scan, including all resumed pages
});

test('count-only policy prevents listing, and Ollama makes zero requests', async t => {
  const out = await temporary(t);
  let listed = false, counted = 0;
  const disabled = { meta: { code: 'fake', listingAllowed: false }, async *list() { listed = true; }, async count({ fetch }) { await fetch('https://example.invalid/count'); counted++; return { count: 10, method: 'fake fixture', at: when }; } };
  const ollama = { ...disabled, meta: { code: 'ollama' }, async count() { return { count: null, method: 'unverified', at: when }; } };
  const result = await buildWorld({ out, fetch: async () => new Response('{}'), registries: [disabled, ollama] });
  assert.equal(listed, false); assert.equal(counted, 1);
  assert.equal(result.manifest.registries.fake.estimate.count, 10);
  assert.equal(result.manifest.registries.ollama.requests, 0);
  assert.equal(result.manifest.registries.ollama.count, null);
});

test('registry object cursors with done/complete reset for a fresh scan and cumulative exclusions are not double counted', async t => {
  const out = await temporary(t);
  let options;
  const make = (state, records = []) => registry([], { async *list(input) { options = input; yield* records; yield { state }; } });
  const first = await buildWorld({ out, now: when, fetch: offline, registries: [make({ cursor: 'next', nsfw: 5, done: false })] });
  assert.equal(first.manifest.registries.fake.nsfwThisRun, 5);
  const second = await buildWorld({ out, now: '2026-11-16T01:00:00Z', state: first.manifestPath, fetch: offline, registries: [make({ cursor: null, nsfw: 7, done: true })] });
  assert.equal(second.manifest.registries.fake.nsfwThisRun, 2);
  assert.equal(second.manifest.registries.fake.complete, true);
  assert.equal(second.manifest.registries.fake.checkedAt, '2026-11-15T01:00:00.000Z');
  await buildWorld({ out, now: '2026-11-17T01:00:00Z', state: second.manifestPath, fetch: offline, registries: [make({ complete: true, excludedNsfw: 1 })] });
  assert.equal(options.state, null);
  assert.equal(options.since, '2026-11-14T01:00:00.000Z');
});

test('a mixed API registry cannot contact the listing service whose terms forbid copying', async t => {
  const out = await temporary(t);
  let contacted = false;
  const source = registry([], { async *list({ fetch }) { await fetch('https://openrouter.ai/api/v1/models'); } });
  await assert.rejects(buildWorld({ out, registries: [source], fetch: async () => { contacted = true; } }), ListingPolicyError);
  assert.equal(contacted, false);
});

test('tool arrivals, versions, enrichment queue and source cursors join the same publication', async t => {
  const out = await temporary(t);
  const tool = { schema: 'memento.world-tool.v1', id: 'github:maker/example', name: '試験用の道具', kind: 'harness', latest: { version: '1.0', date: '2026-11-15' }, sources: ['https://example.invalid/tool'] };
  const queued = { id: 'queue:one', tool_id: tool.id, sources: tool.sources };
  let options;
  const first = await buildWorld({ out, now: when, registries: [], fetch: async () => new Response('{}'), toolDiscovery: async input => {
    options = input; await input.fetch('https://api.github.com/repos/maker/example');
    await assert.rejects(async () => input.fetch('https://api.github.com/repos/maker/second'), /上限/);
    return { records: [tool], queue: [queued], state: { cursor: 'next' }, stats: { total: 1 }, coverage: {}, warnings: [] };
  }, budget: 1 });
  assert.equal(first.manifest.tools.requests.github, 1);
  assert.deepEqual(options.budget.perRegistry, { github: 1, npm: 1, pypi: 1 });
  assert.equal((await jsonAt(first, 'new/2026-11-15.json'))[0].id, tool.id);
  assert.deepEqual(await jsonAt(first, 'data/enrich-queue.json'), [queued]);
  const second = await buildWorld({ out, now: when, registries: [], state: first.manifestPath, fetch: offline, toolDiscovery: async input => {
    assert.deepEqual(input.state, progress({ cursor: 'next' }, 'tools'));
    return { records: [{ ...tool, latest: { version: '2.0', date: '2026-11-15' } }], queue: [queued], state: {}, stats: {}, coverage: {}, warnings: [] };
  } });
  const arrivals = await jsonAt(second, 'new/2026-11-15.json');
  assert.equal(arrivals.length, 1); assert.equal(arrivals[0].latest.version, '2.0');
  assert.equal((await jsonAt(second, 'data/enrich-queue.json')).length, 1);
});

test('failed registry and corrupt old shard cannot replace a published artifact', async t => {
  const root = await temporary(t);
  const first = await buildWorld({ out: root, now: when, fetch: offline, registries: [registry([model('a/one')])] });
  const original = await readFile(first.manifestPath, 'utf8');
  await assert.rejects(buildWorld({ out: root, fetch: offline, registries: [registry([], { async *list() { yield model('a/second'); throw new Error('fixture failure'); } })] }), /fixture failure/);
  assert.equal(await readFile(first.manifestPath, 'utf8'), original);
  const shard = first.manifest.shards[0];
  const corrupt = { ...first.manifest, shards: [{ ...shard, sha256: '0'.repeat(64) }] };
  await writeFile(first.manifestPath, JSON.stringify(corrupt));
  const corruptManifest = await readFile(first.manifestPath, 'utf8');
  await assert.rejects(buildWorld({ out: root, state: first.manifestPath, fetch: offline, registries: [] }), /一致/);
  assert.equal(await readFile(first.manifestPath, 'utf8'), corruptManifest);
  assert.deepEqual(await readdir(root), ['world']);
});

test('client fetches one hash shard, exact case and registry, authors including prototype keys, dates and offline notable', async t => {
  const out = await temporary(t);
  await buildWorld({ out, now: when, fetch: offline, registries: [registry([model('Maker/One', { d: 5, n: '日本語の名前' }), model('Maker/Two'), model('__proto__/Safe')])] });
  const requests = [];
  let available = true;
  const client = createWorldIndexClient({ baseUrl: 'https://example.invalid/world/', crypto: webcrypto, cacheStorage: null,
    now: () => new Date(when), fetch: (...args) => available ? artifactFetch(out, requests)(...args) : offline() });
  assert.equal((await client.lookup('fake', 'Maker/One')).n, '日本語の名前');
  assert.equal(requests.filter(path => path.includes('/shards/')).length, 1);
  assert.equal(await client.lookup('fake', 'maker/one'), null);
  assert.equal(requests.filter(path => path.includes('/shards/')).length, 1);
  assert.equal(await client.lookup('hf', 'Maker/One'), null);
  assert.deepEqual((await client.browseAuthor('fake', 'Maker')).sort(), ['Maker/One', 'Maker/Two']);
  assert.equal(requests.filter(path => path === '/world/manifest.json').length, 1);
  assert.deepEqual(await client.browseAuthor('fake', '__proto__'), ['__proto__/Safe']);
  assert.equal((await client.newArrivals(undefined, { limit: 1 })).length, 1);
  assert.equal((await client.newArrivals('2026-11-14')).length, 0);
  assert.equal((await client.recentArrivals()).length, 3);
  assert.equal((await client.loadNotable()).length, 1);
  available = false;
  assert.equal((await client.searchNotable('日本語 maker')).length, 1);
  assert.equal((await client.searchNotable('Maker', { kind: 'maker' })).length, 1);
  assert.equal((await client.searchNotable('', { registry: 'hf' })).length, 0);
  assert.equal((await client.searchNotable('', { limit: 0 })).length, 0);
});

test('client persists cached publications across instances, accepts HTTP-decoded gzip and retries after failures', async t => {
  const out = await temporary(t);
  await buildWorld({ out, now: when, fetch: offline, registries: [registry([model('a/one', { d: 5 })])] });
  const saved = new Map();
  const cacheStorage = { async open() { return {
    async put(key, response) { saved.set(key, new Response(await response.arrayBuffer())); },
    async match(key) { return saved.get(key)?.clone(); }
  }; } };
  const options = { baseUrl: 'https://example.invalid/world/', crypto: webcrypto, cacheStorage, now: () => new Date(when) };
  const first = createWorldIndexClient({ ...options, fetch: artifactFetch(out, [], { unpack: true }) });
  await first.lookup('fake', 'a/one'); await first.loadNotable();
  const second = createWorldIndexClient({ ...options, fetch: offline });
  assert.equal((await second.lookup('fake', 'a/one')).id, 'a/one');
  assert.equal((await second.searchNotable('one')).length, 1);
  let available = false;
  const retry = createWorldIndexClient({ ...options, cacheStorage: null, fetch: (...args) => available ? artifactFetch(out)(...args) : offline() });
  await assert.rejects(retry.loadManifest());
  available = true;
  assert.equal((await retry.loadManifest()).schema, 'memento.world-index.v1');
});

test('live search delegates existing registry arguments only online and respects disabled services', async () => {
  const calls = []; let online = false;
  const client = createWorldIndexClient({ cacheStorage: null, fetch: offline, online: () => online,
    async searchRegistry(...args) {
      calls.push(args);
      return { items: [model(`${args[0]}/one`), model('hide', { nsfw: true })], next: 'cursor' };
    }
  });
  await assert.rejects(client.searchLive('hello'), /接続/);
  assert.equal(calls.length, 0);
  online = true;
  const result = await client.searchLive('hello', { registry: 'hf', sort: 'downloads', next: 'cursor', filter: 'text-generation' });
  assert.equal(result.items.length, 1);
  assert.deepEqual(calls[0].slice(0, 4), ['hf', 'hello', 'downloads', 'cursor']);
  assert.equal(calls[0][5], 'text-generation');
  const all = await client.searchLive('hello', { registry: 'all' });
  assert.equal(all.items.length, 1); assert.deepEqual(all.errors, []);
  await assert.rejects(client.searchLive('hello', { registry: 'ollama' }), /対応/);
  await assert.rejects(client.searchLive('hello', { registry: 'civitai' }), /対応/);
  await assert.rejects(client.searchLive('hello', { registry: 'kaggle' }), /対応/);
});

test('current real registry modules build from fake API responses and start a second delta scan', async t => {
  const out = await temporary(t);
  const modules = await discoverRegistries();
  // Other workers may not have created the registry files yet in a clean checkout.
  if (!['api', 'hf', 'modelscope', 'civitai'].every(code => modules.some(module => module.meta.code === code))) return t.skip('registry workers have not produced all modules');
  const requests = [];
  const fetcher = async input => {
    const url = new URL(input); requests.push(url.hostname);
    if (url.hostname === 'models.dev') return Response.json({ maker: { models: { fake: { name: '試験用', release_date: '2026-11-15' } } } });
    if (url.hostname === 'huggingface.co') return Response.json([{ id: 'maker/fake', author: 'maker', createdAt: when, lastModified: when, tags: [], likes: 1, downloads: 1, private: false }]);
    if (url.hostname === 'modelscope.cn') return Response.json({ success: true, data: { total_count: 1, page_number: 1, page_size: 50, models: [{ id: 'maker/fake', created_at: when, last_modified: when, tasks: [], downloads: 1, likes: 1 }] } });
    throw new Error('unexpected fixture URL: ' + input);
  };
  const first = await buildWorld({ out, now: when, registries: modules, budget: 1, env: {}, fetch: fetcher });
  assert.equal(first.manifest.stats.records, 3);
  assert.equal(first.manifest.registries.civitai.listingStatus, 'token-required');
  for (const code of ['kaggle', 'ngc', 'ollama']) assert.equal(first.manifest.registries[code].count, null);
  assert.deepEqual(requests.sort(), ['huggingface.co', 'models.dev', 'modelscope.cn']);
  requests.length = 0;
  const second = await buildWorld({ out, now: '2026-11-16T01:00:00Z', state: first.manifestPath, registries: modules, budget: 1, fetch: fetcher });
  assert.equal(second.manifest.stats.records, 3);
  assert.deepEqual(requests.sort(), ['huggingface.co', 'models.dev', 'modelscope.cn']);
  assert.equal((await jsonAt(second, 'new/2026-11-16.json')).length, 0);
});

test('registry credentials are supplied only to the module and never published', async t => {
  const out = await temporary(t), token = 'fake-test-credential';
  const source = registry([], { async *list(options) {
    assert.equal(options.token, token); yield model('a/one'); yield { state: null };
  } });
  const result = await buildWorld({ out, registries: [source], registryOptions: { fake: { token } }, fetch: offline });
  assert.equal((await readFile(result.manifestPath, 'utf8')).includes(token), false);
});

test('4400000 synthetic records stay below 2 GiB RSS (opt-in offline benchmark)', { skip: process.env.WORLD_BENCHMARK !== '1', timeout: 30 * 60 * 1000 }, async () => {
  const stage = process.env.WORLD_BENCHMARK_STAGE ?? 'gzip';
  const stages = ['baseline', 'urls', 'compact', 'offsets', 'deltas', 'gzip'];
  const step = stages.indexOf(stage);
  assert(step >= 0, 'unknown benchmark stage');
  const storage = { omitUrls: step >= 1, compact: step >= 2, authorOffsets: step >= 3, authorDeltas: step >= 4, gzipArrivals: step >= 5 };
  const result = await buildWorld({ storage, maxPublishedBytes: 2000000000, out: join(ROOT, 'benchmark-' + stage), mode: 'full', now: when, fetch: offline, registries: [syntheticRegistry()], report(event) {
    if (event.phase === 'registry' || event.phase === 'shard' && parseInt(event.prefix, 16) % 64 === 0) process.stdout.write(JSON.stringify({ phase: event.phase, registry: event.registry, prefix: event.prefix, count: event.count, received: event.received }) + '\n');
  } });
  assert.equal(result.manifest.stats.records, 4400000);
  assert.equal(result.manifest.notable.count, 68750);
  assert.equal(result.manifest.new[0].count, 4400000);
  assert.equal(result.manifest.shards.length, 256);
  assert(result.manifest.stats.peakRssBytes < 2 * 1024 ** 3);
  if (stage === 'gzip') {
    assert(result.publishedBytes <= 650000000);
    const requests = [], bytesRead = new Map();
    const client = createWorldIndexClient({ baseUrl: 'https://example.invalid/world/', crypto: webcrypto, cacheStorage: null,
      now: () => new Date(when), fetch: async url => {
        const path = new URL(url).pathname.replace(/^\/world\//, '');
        requests.push(path);
        const input = createReadStream(join(result.manifestPath.replace(/manifest.json$/, ''), path));
        input.on('data', chunk => bytesRead.set(path, (bytesRead.get(path) ?? 0) + chunk.length));
        return new Response(Readable.toWeb(input));
      }
    });
    assert.equal((await client.lookup('fake', 'maker-0/model-00000000')).url, 'https://example.invalid/maker-0/model-00000000');
    assert.equal(requests.length, 2);
    assert.equal((await client.lookup('fake', 'maker-9999/model-04399999')).a, 'maker-9999');
    assert.equal((await client.browseAuthor('fake', 'maker-0', { limit: 3 })).length, 3);
    assert.equal((await client.newArrivals(undefined, { limit: 3 })).length, 3);
    assert.equal((await client.searchNotable('maker-0', { limit: 3 })).length, 3);
    const arrivalReadBytes = bytesRead.get(result.manifest.new[0].path);
    assert(arrivalReadBytes < result.manifest.new[0].bytes);
    process.stdout.write('WORLD_BENCHMARK_CLIENT ' + JSON.stringify({ coldLookupFetches: 2, arrivalReadBytes,
      arrivalFileBytes: result.manifest.new[0].bytes, checks: 5, peakRssBytes: process.resourceUsage().maxRSS * 1024 }) + '\n');
  }
  process.stdout.write('WORLD_BENCHMARK ' + JSON.stringify({ stage, ...result.manifest.stats, sizes: result.manifest.sizes, manifestBytes: result.manifestBytes, publishedBytes: result.publishedBytes, node: process.version, platform: process.platform, arch: process.arch }) + '\n');
});
