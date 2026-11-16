import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { lines, prefixOf } from '../world/shard.js';
import { unpackRecord } from '../world/codec.js';
import { parsePatchId } from './version.js';

export const KINDS = ['models', 'tools', 'versions', 'links', 'recipes', 'styles', 'vera'];
export const MANIFEST_SCHEMA = 'memento.patch-manifest.v1';
const HASH = /^[a-f0-9]{64}$/;
const pollingFields = new Set(['checkedAt', 'checked_at', 'fetchedAt', 'fetched_at', 'builtAt', 'generatedAt', 'latency_ms']);
const factKeys = new Set(['r', 'id', 'key', 'a', 'n', 'name', 'vendor', 'family', 'parent', 'weights', 'open', 'real_model',
  't', 'c', 'u', 'd', 'l', 'lic', 'license', 'gated', 'url', 'homepage', 'status', 'lifecycle', 'events', 'date', 'type',
  'specs', 'interface', 'context', 'context_tokens', 'max_output_tokens', 'output', 'input', 'knowledge', 'knowledge_cutoff',
  'params', 'release', 'last_updated', 'cost', 'cache_read', 'cache_write', 'reasoning', 'temperature', 'tools',
  'tier', 'surface', 'from', 'to', 'version', 'latest', 'repo', 'package', 'registry', 'score', 'state', 'finalUrl']);
export const sha256 = value => createHash('sha256').update(value).digest('hex');

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().filter(key => !pollingFields.has(key)).map(key => [key, canonical(value[key])]));
}

function sourceURLs(value, out = new Set()) {
  if (typeof value === 'string') {
    try {
      const url = new URL(value);
      if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) out.add(url.href);
    } catch { /* Non-URL evidence IDs are not sources. */ }
  } else if (Array.isArray(value)) {
    for (const item of value) sourceURLs(item, out);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) sourceURLs(item, out);
  }
  return [...out].sort();
}

function factValue(value, key) {
  if (!factKeys.has(key)) return undefined;
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const maximum = ['id', 'key', 'url', 'homepage', 'finalUrl', 'repo'].includes(key) ? 8192 : 160;
    return value.length <= maximum ? value : undefined;
  }
  if (Array.isArray(value)) {
    const projected = value.map(item => factValue(item, key));
    return projected.every(item => item !== undefined) ? projected : undefined;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, factValue(item, name)]).filter(([, item]) => item !== undefined));
  }
  return undefined;
}

export function readFact(encoded) {
  return typeof encoded === 'string' && encoded.startsWith('v:') ? JSON.parse(encoded.slice(2)) : undefined;
}

export function validField(encoded) {
  if (typeof encoded !== 'string') return false;
  if (/^h:[a-f0-9]{64}$/.test(encoded)) return true;
  try { return encoded.startsWith('v:') && JSON.stringify(readFact(encoded)) === encoded.slice(2); }
  catch { return false; }
}

export function snapshotRecord(kind, id, record) {
  if (!KINDS.includes(kind) || typeof id !== 'string' || !id || id.length > 8192 || /[\u0000-\u001f\u007f]/u.test(id) || !record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('比較する記録の識別名と形式を確認してください。');
  }
  const facts = { ...record };
  if (kind === 'tools') { delete facts.versions; delete facts.releases; }
  const fields = Object.create(null);
  const partialFacts = Object.create(null);
  for (const key of Object.keys(facts).sort().filter(key => !pollingFields.has(key) && facts[key] !== undefined)) {
    const value = canonical(facts[key]);
    const encoded = JSON.stringify(value);
    const factual = factValue(value, key);
    // Compact facts compress well across millions of world records. Long prose is hashed.
    if (factual !== undefined && JSON.stringify(factual) === encoded) fields[key] = `v:${encoded}`;
    else {
      fields[key] = `h:${sha256(encoded)}`;
      if (factual !== undefined) partialFacts[key] = factual;
    }
  }
  const sources = sourceURLs([record.sources, record.source, record.url, record.homepage, record.evidence]);
  const result = { id, name: String(record.name ?? record.n ?? record.title ?? record.label ?? id).replace(/[\r\n\t]/g, ' ').slice(0, 160),
    fields, facts: partialFacts, sources, verification: sources.length ? 'sourced' : 'unverified' };
  if (kind === 'links') result.value = { state: record.state ?? null, status: record.status ?? null, finalUrl: record.finalUrl ?? null };
  if (kind === 'vera') result.value = typeof record.score === 'number' && Number.isFinite(record.score) ? record.score : null;
  return result;
}

export async function readJSON(file, optional = false) {
  try {
    if ((await stat(file)).size > 128_000_000) throw new Error('比較するJSONが128 MBを超えています。');
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) { if (optional && error.code === 'ENOENT') return null; throw error; }
}

// Hash compressed bytes while decoding. Callers must exhaust the iterator to verify.
export async function* readRecords(input, entry) {
  const hash = createHash('sha256');
  let bytes = 0;
  const check = new Transform({ transform(chunk, encoding, done) { bytes += chunk.length; hash.update(chunk); done(null, chunk); } });
  const decoded = entry.path.endsWith('.gz') ? createGunzip() : new Transform({ transform(chunk, encoding, done) { done(null, chunk); } });
  let failure;
  const task = pipeline(input, check, decoded).catch(error => { failure = error; });
  try {
    for await (const line of lines(decoded, 512_000)) yield JSON.parse(line);
    await task;
    if (failure) throw failure;
    if (entry.sha256 && (hash.digest('hex') !== entry.sha256 || bytes !== entry.bytes)) throw new Error(`比較用のファイルの内容が一致しません。${entry.path}`);
  } finally { decoded.destroy(); input.destroy(); await task; }
}

export async function loadPrevious(location, fetcher = globalThis.fetch) {
  if (!location) return null;
  let base;
  const remote = /^https?:\/\//i.test(location);
  if (remote) {
    base = new URL(location);
    if (base.username || base.password || base.search || base.hash) throw new Error('前回の公開先URLを確認してください。');
    if (base.pathname.endsWith('/data/patch-manifest.json')) base = new URL('../', base);
    else if (!base.pathname.endsWith('/')) base.pathname += '/';
  } else base = resolve(location.endsWith('patch-manifest.json') ? join(location, '../..') : location);
  async function input(path) {
    if (!remote) return createReadStream(join(base, path));
    const response = await fetcher(new URL(path, base).href, { redirect: 'error', signal: AbortSignal.timeout(60_000), headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok || !response.body) throw new Error(`前回の公開データを読めません。HTTP ${response.status}`);
    return Readable.fromWeb(response.body);
  }
  const stream = await input('data/patch-manifest.json');
  const chunks = [];
  let bytes = 0;
  try {
    for await (const chunk of stream) {
      bytes += chunk.length;
      if (bytes > 10_000_000) throw new Error('前回の比較用一覧が大きすぎます。');
      chunks.push(chunk);
    }
  } finally { stream.destroy(); }
  const manifest = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (manifest.schema !== MANIFEST_SCHEMA || !manifest.patch || !Array.isArray(manifest.files) || !Array.isArray(manifest.inputs) || !manifest.counts) throw new Error('前回の比較用一覧の形式を確認できません。');
  parsePatchId(manifest.patch.id);
  if (!Number.isFinite(Date.parse(manifest.patch.at))) throw new Error('前回の更新日時を確認できません。');
  const seen = new Set();
  const totals = Object.fromEntries(KINDS.map(kind => [kind, 0]));
  for (const entry of manifest.files) {
    const key = `${entry.kind}/${entry.prefix}`;
    if (!KINDS.includes(entry.kind) || !/^[a-f0-9]{2}$/.test(entry.prefix) || seen.has(key)
      || entry.path !== `data/patch-state/${manifest.patch.id}/${key}.jsonl.gz` || !HASH.test(entry.sha256)
      || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || !Number.isSafeInteger(entry.count) || entry.count < 1) throw new Error('前回の比較用ファイルの記録を確認できません。');
    seen.add(key);
    totals[entry.kind] += entry.count;
  }
  for (const kind of KINDS) if (totals[kind] !== manifest.counts[kind]) throw new Error('前回の比較用一覧の件数が一致しません。');
  return { manifest, input };
}

export async function collectSnapshot(root, partitions) {
  const inputs = [];
  const add = async (kind, id, record) => {
    const snapshot = snapshotRecord(kind, id, record);
    await partitions.add(`${kind}/${prefixOf(id)}`, [id, 0, snapshot]);
  };
  async function model(record, origin) {
    const id = `${origin}:${record.id ?? record.key ?? ''}`;
    if (!(record.id ?? record.key)) throw new Error('モデルの識別名がありません。');
    await add('models', id, record);
    const score = record.vera?.score ?? record.veraScore ?? record.vera_score;
    if (score !== undefined) await add('vera', id, { name: record.name, score, sources: sourceURLs(record) });
  }
  async function tool(record, origin) {
    if (!record.id) throw new Error('道具の識別名がありません。');
    const id = `${origin}:${record.id}`;
    await add('tools', id, record);
    const versions = record.versions ?? [];
    for (const version of Array.isArray(versions) ? versions : Object.values(versions)) {
      const key = typeof version === 'string' ? version : version.id ?? version.version ?? version.tag;
      if (!key) throw new Error('版の識別名がありません。');
      await add('versions', `${id}:${key}`, typeof version === 'string' ? { version, sources: record.sources } : { ...version, sources: sourceURLs([record.sources, version.sources]) });
    }
  }
  for (const name of ['models', 'closed']) {
    const records = await readJSON(join(root, `data/${name}.json`));
    if (!Array.isArray(records)) throw new Error('モデルの一覧は配列にしてください。');
    inputs.push(name);
    for (const record of records) await model(record, name);
  }
  const catalog = await readJSON(join(root, 'data/catalog.json'));
  if (!Array.isArray(catalog.tools)) throw new Error('道具の一覧を確認してください。');
  inputs.push('catalog');
  for (const record of catalog.tools) await tool(record, 'catalog');
  const recipes = await readJSON(join(root, 'data/recipes.json'), true);
  if (recipes) {
    if (!Array.isArray(recipes.examples) || !Array.isArray(recipes.catalog?.styles)) throw new Error('組み合わせの一覧を確認してください。');
    inputs.push('recipes');
    for (const record of recipes.examples) await add('recipes', record.id, record);
    for (const record of recipes.catalog.styles) await add('styles', record.id, record);
  }
  const links = await readJSON(join(root, 'links-status.json'), true) ?? await readJSON(join(root, 'data/links-status.json'), true);
  if (links) {
    if (!links.links || typeof links.links !== 'object' || Array.isArray(links.links)) throw new Error('リンクの確認結果の形式を確認してください。');
    inputs.push('links');
    for (const [url, record] of Object.entries(links.links)) await add('links', url, { state: record.state ?? null, status: record.status ?? null, finalUrl: record.finalUrl ?? null, url });
  }
  const vera = await readJSON(join(root, 'data/vera.json'), true);
  if (vera) {
    inputs.push('vera');
    for (const record of Array.isArray(vera) ? vera : [vera]) await add('vera', `score:${record.id ?? 'overall'}`, { name: record.name ?? 'Vera', score: record.score ?? null, sources: sourceURLs(record) });
  }
  const world = await readJSON(join(root, 'world/manifest.json'), true);
  if (world) {
    if (world.schema !== 'memento.world-index.v1' || !Array.isArray(world.shards)) throw new Error('世界の一覧の形式を確認してください。');
    inputs.push('world');
    const seen = new Set();
    for (const entry of world.shards) {
      if (!/^[a-z][a-z0-9-]{0,31}$/.test(entry.r) || !/^[a-f0-9]{2}$/.test(entry.prefix)
        || entry.path !== `shards/${entry.r}/${entry.prefix}.jsonl.gz` || seen.has(entry.path) || !HASH.test(entry.sha256)) throw new Error('世界の分割ファイルの場所と内容を確認してください。');
      seen.add(entry.path);
      let count = 0;
      // Shard lines use the compact world format (memento.world-compact.v1): the registry is implied by the folder.
      for await (const raw of readRecords(createReadStream(join(root, 'world', entry.path)), entry)) {
        const record = unpackRecord(raw, entry.r);
        if (record.r !== entry.r || prefixOf(record.id) !== entry.prefix) throw new Error('世界の記録の登録先が一致しません。');
        await model(record, `world:${entry.r}`); count++;
      }
      if (count !== entry.count) throw new Error('世界の記録の件数が一致しません。');
    }
    if (world.tools?.path) {
      if (world.tools.path !== 'tools-state.json') throw new Error('世界の道具の状態の場所を確認してください。');
      const text = await readFile(join(root, 'world/tools-state.json'));
      if (text.length > 128_000_000 || sha256(text) !== world.tools.sha256 || text.length !== world.tools.bytes) throw new Error('世界の道具の状態の内容が一致しません。');
      const publication = JSON.parse(text);
      if (publication.schema !== 'memento.world-tools-publication.v1' || !publication.state?.tools) throw new Error('世界の道具の状態の形式を確認してください。');
      for (const entry of Object.values(publication.state.tools)) {
        if (entry.record) {
          const versions = Object.entries(entry.versions ?? {}).filter(([, latest]) => typeof latest?.version === 'string' && latest.version)
            .map(([registry, latest]) => ({ ...latest, id: `${registry}:${latest.version}`, sources: sourceURLs([entry.record.sources, latest.url]) }));
          await tool({ ...entry.record, versions }, 'world');
        }
      }
    }
  }
  return inputs.sort();
}
