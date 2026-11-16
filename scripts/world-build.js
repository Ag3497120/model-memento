#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { arrayWriter, entriesAt, externalSort, jsonArray, lines, Partitions, prefixOf, writer } from '../lib/world/shard.js';
import { PROMOTION_RULE, toNotable } from '../lib/world/promote.js';
import { progress, isComplete } from '../lib/world/progress.js';
import { RECORD_FORMAT, URL_TEMPLATES, packRecord, unpackRecord } from '../lib/world/codec.js';
import { ENRICH_QUEUE_PATH } from '../lib/world/queue.js';

const PROJECT = fileURLToPath(new URL('../', import.meta.url));
const SCHEMA = 'memento.world-index.v1';
const safeCode = code => typeof code === 'string' && /^[a-z][a-z0-9-]{0,31}$/.test(code);
const day = text => typeof text === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(text);
const isURL = value => /^https?:\/\//i.test(String(value));
const arrivalKey = record => `${record.schema === 'memento.world-tool.v1' ? 'tool' : record.r}\0${record.id}`;

export class RequestBudgetError extends Error {
  constructor() { super('この登録先への確認回数の上限に達しました'); this.name = 'RequestBudgetError'; }
}

export class ListingPolicyError extends Error {
  constructor() { super('この登録先は規約により自動取得を停止しています'); this.name = 'ListingPolicyError'; }
}

export async function discoverRegistries(directory = join(PROJECT, 'lib/world/registries')) {
  let files;
  try { files = await readdir(directory); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const modules = [];
  for (const file of files.filter(file => file.endsWith('.js')).sort()) {
    const module = await import(pathToFileURL(join(directory, file)).href);
    if (!module.meta || typeof module.list !== 'function') continue; // shared helpers are not registries
    if (!safeCode(module.meta.code)) throw new Error(`登録先の名前を確認できません: ${file}`);
    if (modules.some(item => item.meta.code === module.meta.code)) throw new Error(`登録先が重複しています: ${module.meta.code}`);
    modules.push(module);
  }
  return modules;
}

function cleanRecord(raw, code) {
  if (!raw || raw.r !== code || typeof raw.id !== 'string' || !raw.id || raw.id.length > 2048 || raw.id.includes('\0')) return null;
  if (typeof raw.url !== 'string' || raw.url.length > 8192 || !/^https?:\/\//i.test(raw.url)) return null;
  const text = (value, max = 2048) => typeof value === 'string' && value.length <= max && !value.includes('\0') ? value : null;
  const date = value => typeof value === 'string' && day(value.slice(0, 10)) ? value.slice(0, 10) : null;
  const bucket = value => Number.isInteger(value) && value >= 0 && value <= 6 ? value : null;
  const record = {
    r: code, id: raw.id, a: text(raw.a), n: text(raw.n) || raw.id,
    t: text(raw.t, 256), c: date(raw.c), u: date(raw.u), d: bucket(raw.d), l: bucket(raw.l),
    lic: text(raw.lic, 256), gated: typeof raw.gated === 'boolean' ? raw.gated : null, url: raw.url
  };
  return Buffer.byteLength(JSON.stringify(record)) <= 32768 ? record : null;
}

function nsfw(record) {
  return [record?.nsfw, record?.isNsfw, record?.isNSFW, record?.is_nsfw, record?.not_for_all_audiences]
    .some(value => value === true || value === 'true' || typeof value === 'number' && value > 0)
    || Array.isArray(record?.tags) && record.tags.some(tag => typeof tag === 'string'
      && /^(?:nsfw|not-for-all-audiences)$/.test(tag.toLowerCase().trim().replace(/^(?:custom_tag|tag):/, '').replace(/[ _]+/g, '-')));
}

async function loadPrevious(state, fetcher) {
  if (!state) return null;
  let manifest, base;
  if (isURL(state)) {
    const response = await fetcher(state, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`前回の一覧を読めません: HTTP ${response.status}`);
    manifest = await response.json();
    base = new URL('.', response.url || state).href;
  } else {
    const path = resolve(state);
    manifest = JSON.parse(await readFile(path, 'utf8'));
    base = dirname(path);
  }
  if (manifest.schema !== SCHEMA || !Array.isArray(manifest.shards) || !manifest.registries || !Number.isFinite(Date.parse(manifest.builtAt))) throw new Error('前回の一覧の形式を確認できません');
  const keys = new Set();
  for (const shard of manifest.shards) {
    if (!safeCode(shard.r) || !/^[a-f0-9]{2}$/.test(shard.prefix) || shard.path !== `shards/${shard.r}/${shard.prefix}.jsonl.gz` || !/^[a-f0-9]{64}$/.test(shard.sha256) || !Number.isSafeInteger(shard.count) || shard.count < 0 || keys.has(`${shard.r}/${shard.prefix}`)) throw new Error('前回の分割ファイルの記録を確認できません');
    keys.add(`${shard.r}/${shard.prefix}`);
  }
  const previous = { manifest, base, fetcher, requests: 0, bytes: 0 };
  if (manifest.tools?.path) {
    if (manifest.tools.path !== 'tools-state.json') throw new Error('道具の状態の場所を確認できません');
    const entry = manifest.tools, input = await previousInput(previous, entry);
    const chunks = [], hash = createHash('sha256');
    let bytes = 0;
    try {
      for await (const chunk of input) {
        bytes += chunk.length; previous.bytes += chunk.length;
        if (bytes > 128000000) throw new Error('道具の状態が大きすぎます');
        chunks.push(chunk); hash.update(chunk);
      }
    } finally { input.destroy(); }
    if (bytes !== entry.bytes || hash.digest('hex') !== entry.sha256) throw new Error('道具の状態の内容が一致しません');
    const publication = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (publication.schema !== 'memento.world-tools-publication.v1' || !publication.state || publication.queue !== undefined && !Array.isArray(publication.queue)) throw new Error('道具の状態の形式を確認できません');
    previous.toolsPublication = publication;
  }
  return previous;
}

async function previousInput(previous, entry) {
  if (isURL(previous.base)) {
    previous.requests++;
    const response = await previous.fetcher(new URL(entry.path, previous.base).href, { signal: AbortSignal.timeout(120000) });
    if (!response.ok || !response.body) throw new Error(`前回の記録を読めません: HTTP ${response.status}`);
    return Readable.fromWeb(response.body);
  }
  return createReadStream(join(previous.base, entry.path));
}

// All old gzip data is streamed; the compressed hash is checked before publication.
async function* previousRecords(previous, entry, array = false) {
  const input = await previousInput(previous, entry);
  const hash = createHash('sha256');
  const check = new Transform({ transform(chunk, encoding, done) { hash.update(chunk); previous.bytes += chunk.length; done(null, chunk); } });
  const decoded = entry.path.endsWith('.gz') ? createGunzip() : new Transform({ transform(chunk, encoding, done) { done(null, chunk); } });
  let failure;
  const task = pipeline(input, check, decoded).catch(error => { failure = error; });
  try {
    const templates = previous.manifest.encoding?.urls ?? URL_TEMPLATES;
    if (array) {
      for await (const raw of jsonArray(decoded)) yield unpackRecord(raw, entry.r, templates);
    } else for await (const line of lines(decoded)) yield unpackRecord(JSON.parse(line), entry.r, templates);
    await task;
    if (failure) throw failure;
    if (!entry.sha256 || hash.digest('hex') !== entry.sha256) throw new Error(`前回の記録の内容が一致しません: ${entry.path}`);
  } finally { decoded.destroy(); input.destroy(); await task; }
}

function countOnly(meta) {
  // https://ollama.com/terms §4 forbids automated access without permission.
  if (meta.code === 'ollama') return '規約により許可のない自動取得を停止';
  if (meta.listingAllowed === false || meta.automatedListing === false || meta.listing === 'count-only' || meta.policy?.automatedListing === false) return '一覧の自動取得を停止';
  return null;
}

function publicMeta(meta) {
  // Do not publish unknown fields (which might contain tokens or copied content).
  const out = {};
  for (const key of ['code', 'name', 'homepage', 'api', 'terms', 'rateLimit', 'needsToken', 'sources']) {
    if (key === 'sources') out.sources = (Array.isArray(meta.sources) ? meta.sources : []).map(source => typeof source === 'string' ? source : source?.url).filter(url => typeof url === 'string' && /^https?:\/\//i.test(url));
    else if (meta[key] !== undefined) out[key] = meta[key];
  }
  return out;
}

async function collect(module, prior, mode, budget, fetcher, partitions, hiddenIds, startedAt, options) {
  const code = module.meta.code;
  const resumed = prior?.state != null && !isComplete(prior.state)
    && (mode === 'delta' || prior.scanMode === 'full' || prior.since == null);
  const since = resumed ? prior.since ?? null : mode === 'full' ? null : prior?.checkedAt ? new Date(Date.parse(prior.checkedAt) - 86400000).toISOString() : null;
  const info = {
    meta: publicMeta(module.meta), state: resumed ? progress(prior.state, code) : null, since,
    checkedAt: prior?.checkedAt ?? null, requests: 0, received: 0, invalid: 0, nsfwThisRun: 0,
    scanStartedAt: resumed ? prior.scanStartedAt ?? startedAt : startedAt,
    scanMode: resumed ? prior.scanMode ?? (prior.since == null ? 'full' : 'delta') : mode,
    nsfw: prior?.nsfw ?? null, listingStatus: 'listed', complete: false
  };
  const allowedFetch = async (...args) => {
    const host = new URL(typeof args[0] === 'string' || args[0] instanceof URL ? args[0] : args[0].url).hostname;
    // https://openrouter.ai/terms §7(5); https://ollama.com/terms §4.
    if (['ollama.com', 'openrouter.ai'].some(domain => host === domain || host.endsWith(`.${domain}`))) throw new ListingPolicyError();
    if (info.requests >= budget) throw new RequestBudgetError();
    info.requests++;
    return fetcher(args[0], { ...args[1], redirect: 'error' });
  };
  const stopped = countOnly(module.meta);
  if (stopped) {
    info.listingStatus = 'count-only'; info.note = stopped;
    info.state = progress({ complete: false, disabled: true, reason: 'terms' }, code);
    // A forbidden service must not be contacted even for count(). Modules may use
    // an approved public source or a manually recorded count through count-only.
    if (typeof module.count === 'function') {
      try { info.estimate = await module.count({ fetch: allowedFetch }); }
      catch (error) { if (!(error instanceof RequestBudgetError || error instanceof ListingPolicyError)) throw error; }
    }
    return info;
  }
  let sequence = 0, ended = false;
  let reportedExcluded = resumed ? progress(prior.state, code).excludedNsfw : 0;
  let reportedThisRun = 0, observedHidden = 0;
  try {
    for await (const raw of module.list({ ...options, fetch: allowedFetch, since, state: info.state, budget })) {
      if (raw && Object.hasOwn(raw, 'state') && !raw.id) {
        info.state = progress(raw.state ?? null, code); ended = true;
        const excluded = raw.nsfwCount ?? raw.nsfw ?? raw.stats?.nsfw;
        if (Number.isSafeInteger(excluded) && excluded >= 0) reportedThisRun += excluded;
        else {
          const total = info.state.excludedNsfw;
          if (Number.isSafeInteger(total) && total >= 0) {
            reportedThisRun += total >= reportedExcluded ? total - reportedExcluded : total;
            reportedExcluded = total;
          }
        }
        continue;
      }
      if (raw && !raw.id && (raw.nsfwCount !== undefined || raw.nsfw !== undefined)) {
        const excluded = raw.nsfwCount ?? raw.nsfw;
        if (Number.isSafeInteger(excluded) && excluded >= 0) info.nsfwThisRun += excluded;
        continue;
      }
      const removal = raw?.remove;
      const hidden = nsfw(raw) || removal?.r === code && removal.reason === 'nsfw';
      const id = removal?.id ?? raw?.id;
      if (hidden) observedHidden++;
      if (hidden && typeof id === 'string' && id && id.length <= 2048 && !id.includes('\0')) {
        await hiddenIds.add('hidden', [`${code}\0${id}`, 1, null]);
        await partitions.add(`${code}/${prefixOf(id)}`, [id, Number.MAX_SAFE_INTEGER, null]);
        info.received++; continue;
      }
      const record = cleanRecord(raw, code);
      if (!record) { info.invalid++; continue; }
      info.received++;
      // A temporary deletion marker removes an old public entry newly flagged NSFW.
      await partitions.add(`${code}/${prefixOf(record.id)}`, [record.id, ++sequence, record]);
    }
  } catch (error) {
    if (!(error instanceof RequestBudgetError)) throw error;
    info.note = '確認回数の上限に達したため次回も同じ範囲を確認します';
  }
  info.nsfwThisRun += Math.max(observedHidden, reportedThisRun);
  info.complete = ended && isComplete(info.state);
  // Advancing the watermark without a final cursor would silently lose pages.
  if (info.complete) info.checkedAt = info.scanStartedAt;
  else {
    if (!ended) info.state = resumed ? progress(prior.state, code) : progress({ complete: false }, code);
    info.listingStatus = 'incomplete';
  }
  if (info.state?.disabled || info.state?.requiresToken) {
    info.listingStatus = info.state.requiresToken ? 'token-required' : 'count-only';
    info.note = info.state.reason || info.state.error || '一覧の自動取得を停止しています';
  }
  // This is observations, not a fabricated all-time unique excluded count.
  const excludedTotal = info.state?.excludedNsfwTotal;
  info.nsfw = Number.isSafeInteger(excludedTotal) && excludedTotal >= 0 ? excludedTotal : null;
  return info;
}

async function* combinedEntries(previous, old, incoming) {
  if (old) {
    for await (const raw of previousRecords(previous, old)) {
      const record = cleanRecord(raw, old.r);
      if (!record || nsfw(raw) || prefixOf(record.id) !== old.prefix) throw new Error(`前回の記録の形式を確認できません: ${old.path}`);
      yield [record.id, 0, record];
    }
  }
  yield* entriesAt(incoming);
}

async function* uniqueRecords(sorted) {
  let last, seen = false;
  for await (const entry of sorted) {
    if (last && last[0] !== entry[0]) { yield { record: last[2], isNew: !seen }; seen = false; }
    if (entry[1] === 0) seen = true;
    last = entry;
  }
  if (last) yield { record: last[2], isNew: !seen };
}

async function makeAuthors(partitions, world, work, sortOptions, offsets, deltas) {
  const entries = await partitions.close(), result = [];
  for (const [key, path] of [...entries].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    const [r, prefix] = key.split('/');
    const relative = `authors/${r}/${prefix}.json.gz`;
    const out = await writer(join(world, relative), true);
    let author = null, count = 0, authors = 0, previousShard, previousFirst = 0, previousOrdinal = 0;
    await out.write('{');
    for await (const [, , [a, reference, ordinal]] of externalSort(entriesAt(path), join(work, 'sort'), sortOptions)) {
      if (a !== author) {
        if (author !== null) { if (offsets && previousShard !== null) await out.write(']'); await out.write(']'); }
        await out.write(`${authors++ ? ',' : ''}${JSON.stringify(a)}:[`);
        author = a; count = 0; previousShard = null; previousFirst = 0; previousOrdinal = 0;
      }
      if (offsets) {
        const first = previousShard !== reference;
        if (previousShard !== reference) {
          if (previousShard !== null) await out.write(']');
          await out.write(`${count++ ? ',' : ''}[${JSON.stringify(reference)}`);
          previousShard = reference;
        }
        await out.write(`,${deltas ? ordinal - (first ? previousFirst : previousOrdinal) : ordinal}`);
        if (first) previousFirst = ordinal;
        previousOrdinal = ordinal;
      } else await out.write(`${count++ ? ',' : ''}${JSON.stringify(reference)}`);
    }
    if (author !== null) { if (offsets && previousShard !== null) await out.write(']'); await out.write(']'); }
    await out.write('}\n');
    result.push({ r, prefix, path: relative, authors, ...await out.close() });
    await rm(path);
  }
  return result;
}

async function makeNew(previous, freshPath, hiddenPath, date, world, work, sortOptions, encode, gzip) {
  const history = new Map();
  for (const entry of previous?.manifest.new ?? []) {
    if (!day(entry.date) || ![`new/${entry.date}.json`, `new/${entry.date}.json.gz`].includes(entry.path) || history.has(entry.date)) throw new Error('新着の日付を確認できません');
    history.set(entry.date, entry);
  }
  const result = [];
  for (const [oldDate, entry] of [...history].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    if (oldDate === date) continue;
    const path = `new/${oldDate}.json${gzip ? '.gz' : ''}`;
    const out = await arrayWriter(join(world, path), gzip);
    if (!hiddenPath) {
      for await (const record of previousRecords(previous, entry, true)) await out.add(encode(record));
    } else {
      async function* historyWithRemovals() {
        for await (const record of previousRecords(previous, entry, true)) yield [arrivalKey(record), 0, record];
        yield* entriesAt(hiddenPath);
      }
      for await (const { record } of uniqueRecords(externalSort(historyWithRemovals(), join(work, 'sort'), sortOptions))) if (record) await out.add(encode(record));
    }
    result.push({ date: oldDate, path, ...await out.close() });
  }
  async function* today() {
    const old = history.get(date);
    if (old) for await (const record of previousRecords(previous, old, true)) yield [arrivalKey(record), 0, record];
    yield* entriesAt(freshPath);
    yield* entriesAt(hiddenPath);
  }
  const path = `new/${date}.json${gzip ? '.gz' : ''}`, out = await arrayWriter(join(world, path), gzip);
  for await (const { record } of uniqueRecords(externalSort(today(), join(work, 'sort'), sortOptions))) if (record) await out.add(encode(record));
  result.push({ date, path, ...await out.close() });
  return result.sort((a, b) => a.date > b.date ? -1 : a.date < b.date ? 1 : 0);
}

async function collectTools(discovery, previous, mode, budget, fetcher) {
  if (discovery === true) {
    const path = join(PROJECT, 'lib/world/tools/index.js');
    try { await stat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    discovery = (await import(pathToFileURL(path).href)).discoverTools;
  }
  if (typeof discovery !== 'function') return null;
  const requests = { github: 0, npm: 0, pypi: 0 };
  const limitedFetch = (input, init) => {
    const host = new URL(typeof input === 'string' || input instanceof URL ? input : input.url).hostname;
    const code = host === 'api.github.com' ? 'github' : host === 'registry.npmjs.org' ? 'npm' : host === 'pypi.org' ? 'pypi' : null;
    if (!code) throw new Error('道具の登録先を確認できません');
    if (requests[code] >= budget) throw new RequestBudgetError();
    requests[code]++;
    return fetcher(input, { ...init, redirect: 'error' });
  };
  const result = await discovery({ fetch: limitedFetch,
    since: mode === 'delta' ? previous?.manifest.builtAt ?? null : null,
    state: previous?.toolsPublication?.state ?? previous?.manifest.tools?.state ?? {},
    budget: { maxRequests: Math.min(Number.MAX_SAFE_INTEGER, budget * 3), perRegistry: { github: budget, npm: budget, pypi: budget } }
  });
  if (!Array.isArray(result.records) || !Array.isArray(result.queue)) throw new Error('道具の記録の形式を確認できません');
  return { ...result, state: progress(result.state, 'tools'), requests };
}

async function makeQueue(previous, additions, world, work, sortOptions) {
  const old = previous?.manifest.enrichQueue;
  if (old && old.path !== ENRICH_QUEUE_PATH) throw new Error('調査待ち一覧の場所を確認できません');
  async function* entries() {
    if (old) for await (const record of previousRecords(previous, old, true)) yield [record.id, 0, record];
    else for (const record of previous?.toolsPublication?.queue ?? []) yield [record.id, 0, record];
    for (const record of additions) yield [record.id, 1, record];
  }
  const path = ENRICH_QUEUE_PATH, out = await arrayWriter(join(world, path));
  for await (const { record } of uniqueRecords(externalSort(entries(), join(work, 'sort'), sortOptions))) await out.add(record);
  return { path, ...await out.close() };
}

export async function buildWorld({
  mode = 'delta', budget = 20, out = join(PROJECT, '.world-out'), state = null,
  registries, registryDir, fetch: fetcher = globalThis.fetch,
  now = new Date(), sortOptions, promotionOptions, registryOptions = {}, env = process.env,
  toolDiscovery = registries ? false : true, report = () => {}, maxPublishedBytes = 650000000,
  storage = { omitUrls: true, compact: true, authorOffsets: true, authorDeltas: true, gzipArrivals: true }
} = {}) {
  if (!['full', 'delta'].includes(mode) || !Number.isSafeInteger(budget) || budget < 0) throw new Error('実行方法か確認回数を確認してください');
  if (!Number.isSafeInteger(maxPublishedBytes) || maxPublishedBytes < 1) throw new Error('公開する容量の上限を確認してください');
  const started = performance.now(), builtAt = new Date(now).toISOString(), date = builtAt.slice(0, 10);
  const previous = await loadPrevious(state, fetcher);
  const modules = registries ?? await discoverRegistries(registryDir);
  const codes = new Set();
  for (const module of modules) {
    if (!safeCode(module.meta?.code) || codes.has(module.meta.code) || typeof module.list !== 'function') throw new Error('登録先の形式か重複を確認してください');
    codes.add(module.meta.code);
  }
  out = resolve(out);
  await mkdir(out, { recursive: true });
  const staging = join(out, `.build-${randomUUID()}`), world = join(staging, 'world'), work = join(staging, 'work');
  await mkdir(world, { recursive: true });
  const incoming = new Partitions(join(work, 'incoming'));
  const authors = new Partitions(join(work, 'authors'));
  const fresh = new Partitions(join(work, 'new'));
  const hiddenIds = new Partitions(join(work, 'hidden'));
  const manifest = {
    schema: SCHEMA, builtAt, mode,
    hashing: { algorithm: 'sha1', input: 'lower(id)', prefixLength: 2 },
    registries: {}, shards: [], authors: [], new: [], notable: null
  };
  const templates = { ...URL_TEMPLATES, ...previous?.manifest.encoding?.urls };
  for (const module of modules) if (module.meta.modelUrlTemplate) templates[module.meta.code] = module.meta.modelUrlTemplate;
  manifest.encoding = { records: storage.compact ? RECORD_FORMAT : 'memento.world-model.v1', urls: templates,
    authors: storage.authorOffsets ? storage.authorDeltas ? 'shard-deltas.v1' : 'shard-offsets.v1' : 'ids.v1' };
  const encode = (record, registry) => storage.compact || storage.omitUrls ? packRecord(record, { registry, templates, compact: storage.compact }) : record;
  try {
    for (const module of modules) {
      const code = module.meta.code;
      const options = { ...(code === 'civitai' ? { token: env.CIVITAI_TOKEN } : {}), ...registryOptions[code] };
      manifest.registries[code] = await collect(module, previous?.manifest.registries[code], mode, budget, fetcher, incoming, hiddenIds, builtAt, options);
      report({ phase: 'registry', registry: code, ...manifest.registries[code] });
    }
    // Preserve registries whose modules are temporarily absent during parallel work.
    for (const [code, info] of Object.entries(previous?.manifest.registries ?? {})) {
      if (!manifest.registries[code]) manifest.registries[code] = { ...info, requests: 0, received: 0, invalid: 0, nsfwThisRun: 0, listingStatus: 'module-missing' };
    }
    const toolResult = await collectTools(toolDiscovery, previous, mode, budget, fetcher);
    if (toolResult) {
      for (const record of toolResult.records) {
        if (record.schema !== 'memento.world-tool.v1' || typeof record.id !== 'string' || !record.id || !Array.isArray(record.sources)) throw new Error('道具の記録の形式を確認できません');
        await fresh.add('today', [arrivalKey(record), 1, record]);
      }
      manifest.tools = { requests: toolResult.requests, stats: toolResult.stats, coverage: toolResult.coverage, warnings: toolResult.warnings };
    } else if (previous?.manifest.tools) manifest.tools = previous.manifest.tools;
    const partitions = await incoming.close();
    const oldShards = new Map((previous?.manifest.shards ?? []).map(entry => [`${entry.r}/${entry.prefix}`, entry]));
    const keys = [...new Set([...oldShards.keys(), ...partitions.keys()])].sort();
    const notable = await arrayWriter(join(world, 'notable.json.gz'), true);
    for (const key of keys) {
      const [r, prefix] = key.split('/'), path = `shards/${r}/${prefix}.jsonl.gz`;
      const old = oldShards.get(key), input = partitions.get(key);
      const shard = await writer(join(world, path), true);
      const ids = createHash('sha256');
      let count = 0;
      for await (const { record, isNew } of uniqueRecords(externalSort(combinedEntries(previous, old, input), join(work, 'sort'), sortOptions))) {
        if (!record) continue;
        await shard.write(JSON.stringify(encode(record, r)) + '\n');
        ids.update(JSON.stringify(record.id) + '\n'); count++;
        if (record.a) await authors.add(`${r}/${prefixOf(record.a)}`, storage.authorOffsets
          ? [`${record.a}\0${prefix}\0${String(count - 1).padStart(12, '0')}`, 0, [record.a, prefix, count - 1]]
          : [`${record.a}\0${record.id}`, 0, [record.a, record.id]]);
        if (isNew) await fresh.add('today', [arrivalKey(record), 1, record]);
        const promoted = toNotable(record, promotionOptions);
        if (promoted) await notable.add(encode(promoted));
      }
      manifest.shards.push({ r, prefix, path, count, idsSha256: ids.digest('hex'), sorted: true, ...await shard.close() });
      if (input) await rm(input);
      report({ phase: 'shard', registry: r, prefix, count });
    }
    manifest.notable = { path: 'notable.json.gz', rule: PROMOTION_RULE, ...await notable.close() };
    manifest.authors = await makeAuthors(authors, world, work, sortOptions, storage.authorOffsets, storage.authorDeltas);
    const freshPaths = await fresh.close();
    const hiddenPaths = await hiddenIds.close();
    manifest.new = await makeNew(previous, freshPaths.get('today'), hiddenPaths.get('hidden'), date, world, work, sortOptions, encode, storage.gzipArrivals);
    if (toolResult || previous?.manifest.enrichQueue || previous?.toolsPublication) manifest.enrichQueue = await makeQueue(previous, toolResult?.queue ?? [], world, work, sortOptions);
    if (toolResult || previous?.toolsPublication) {
      const publication = { schema: 'memento.world-tools-publication.v1', state: toolResult?.state ?? previous.toolsPublication.state };
      const text = JSON.stringify(publication) + '\n';
      if (Buffer.byteLength(text) > 128000000) throw new Error('道具の状態が大きすぎます');
      const toolsFile = await writer(join(world, 'tools-state.json'));
      await toolsFile.write(text);
      manifest.tools = { ...manifest.tools, path: 'tools-state.json', ...await toolsFile.close(), checkedAt: builtAt };
    }
    for (const [code, info] of Object.entries(manifest.registries)) {
      info.indexedCount = manifest.shards.filter(entry => entry.r === code).reduce((sum, entry) => sum + entry.count, 0);
      const disabled = ['count-only', 'token-required'].includes(info.listingStatus);
      info.count = disabled ? info.estimate?.count ?? null : info.indexedCount;
      info.method = disabled ? info.estimate?.method ?? 'unverified' : '公開する記録の件数（登録先の総数とは異なります）';
      info.name = info.meta?.name ?? code;
      info.sources = info.meta?.sources ?? [];
      info.excludedNsfw = info.nsfwThisRun;
    }
    const sumBytes = entries => entries.reduce((sum, entry) => sum + entry.bytes, 0);
    manifest.sizes = { shards: sumBytes(manifest.shards), authors: sumBytes(manifest.authors), new: sumBytes(manifest.new), notable: manifest.notable.bytes };
    if (manifest.enrichQueue) manifest.sizes.enrichQueue = manifest.enrichQueue.bytes;
    if (manifest.tools?.path) manifest.sizes.tools = manifest.tools.bytes;
    manifest.stats = {
      records: manifest.shards.reduce((sum, entry) => sum + entry.count, 0),
      elapsedSeconds: (performance.now() - started) / 1000,
      peakRssBytes: process.resourceUsage().maxRSS * 1024,
      artifactRequests: previous?.requests ?? 0, artifactReadBytes: previous?.bytes ?? 0
    };
    const manifestPath = join(world, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    const manifestBytes = (await stat(manifestPath)).size;
    const publishedBytes = Object.values(manifest.sizes).reduce((a, b) => a + b, manifestBytes);
    if (publishedBytes > maxPublishedBytes) throw new Error('世界の一覧が公開容量の上限を超えました');
    // A failed registry or corrupt previous shard leaves the old world untouched.
    const published = join(out, 'world'), backup = join(out, `.previous-${randomUUID()}`);
    let exists = false;
    try { await stat(published); exists = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (exists) await rename(published, backup);
    try { await rename(world, published); }
    catch (error) { if (exists) await rename(backup, published); throw error; }
    if (exists) await rm(backup, { recursive: true, force: true });
    const result = { manifest, manifestPath: join(published, 'manifest.json'), manifestBytes, publishedBytes };
    report({ phase: 'done', ...result });
    return result;
  } finally { await rm(staging, { recursive: true, force: true }); }
}

export function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--full' || arg === '--delta') {
      const mode = arg.slice(2);
      if (options.mode && options.mode !== mode) throw new Error('--full と --delta はどちらか一つを指定してください');
      options.mode = mode;
    } else if (['--budget', '--out', '--state'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} の値が必要です`);
      if (arg === '--budget') {
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error('確認回数は0以上の整数で指定してください');
        options.budget = Number(value);
      } else options[arg.slice(2)] = value;
    } else if (arg === '--help') options.help = true;
    else throw new Error(`指定を確認できません: ${arg}`);
  }
  return options;
}

// A reproducible, entirely offline generator; used by the optional benchmark test.
export function syntheticRegistry(count = 4400000) {
  return {
    meta: { code: 'fake', name: '試験用', homepage: null, api: null, terms: 'unverified', rateLimit: 'unverified', sources: [], modelUrlTemplate: 'https://example.invalid/{id}' },
    async *list() {
      for (let i = 0; i < count; i++) {
        const author = `maker-${i % 10000}`, name = `model-${String(i).padStart(8, '0')}`;
        yield { r: 'fake', id: `${author}/${name}`, a: author, n: name, t: 'text-generation', c: '2026-01-01', u: '2026-11-15', d: i % 64 === 0 ? 5 : 2, l: 1, lic: 'test-only', gated: false, url: `https://example.invalid/${author}/${name}` };
      }
      yield { state: null };
    }
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) process.stdout.write('node scripts/world-build.js [--full|--delta] [--budget 20] [--out .world-out] [--state 一覧のパスかURL]\n');
    else {
      const result = await buildWorld({ ...options, report(event) {
        if (event.phase === 'registry') process.stdout.write(`${event.registry}: 受信 ${event.received}, 確認 ${event.requests}, ${event.listingStatus}\n`);
      } });
      process.stdout.write(JSON.stringify({ manifest: result.manifestPath, ...result.manifest.stats, sizes: result.manifest.sizes, manifestBytes: result.manifestBytes, publishedBytes: result.publishedBytes }) + '\n');
    }
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
