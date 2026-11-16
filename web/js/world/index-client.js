import { tr } from '../i18n.js';
import { searchRegistry as registrySearch } from '../registries.js';

// Storage decoder mirrors lib/world/codec.js; browser artifacts contain only web/.
const TASKS = ['text-generation', 'text2text-generation', 'text-to-image', 'image-to-text', 'feature-extraction', 'automatic-speech-recognition', 'text-to-speech', 'sentence-similarity', 'image-classification'];
const URL_TEMPLATES = Object.freeze({
  hf: 'https://huggingface.co/{id}', civitai: 'https://civitai.com/models/{id}',
  modelscope: 'https://modelscope.cn/models/{id}', kaggle: 'https://www.kaggle.com/models/{id}',
  ollama: 'https://ollama.com/library/{id}', api: 'https://models.dev/api.json?type=all'
});
function modelURL(registry, id, templates = URL_TEMPLATES) {
  const template = Object.hasOwn(templates, registry) ? templates[registry] : null;
  return template ? template.replace('{id}', id.split('/').map(encodeURIComponent).join('/')) : null;
}
function unpackRecord(raw, registry, templates = URL_TEMPLATES) {
  if (typeof raw?.i !== 'string') return raw?.id && (raw.r || registry) && !raw.url && raw.schema !== 'memento.world-tool.v1'
    ? { ...raw, url: modelURL(raw.r ?? registry, raw.id, templates) } : raw;
  const id = raw.i, r = registry ?? raw.r, slash = id.lastIndexOf('/');
  const record = { r, id, a: Object.hasOwn(raw, 'a') ? raw.a : slash < 0 ? null : id.slice(0, slash),
    n: raw.n ?? id.slice(slash + 1), t: typeof raw.t === 'number' ? TASKS[raw.t] ?? null : raw.t ?? null,
    c: raw.c ?? null, u: raw.u ?? null, d: raw.d ?? null, l: raw.l ?? null,
    lic: raw.s ?? null, gated: raw.g === undefined ? null : raw.g === 1, url: raw.x ?? modelURL(r, id, templates) };
  if (raw.label !== undefined) record.label = raw.label;
  return record;
}

const SCHEMA = 'memento.world-index.v1';
const safeCode = code => typeof code === 'string' && /^[a-z][a-z0-9-]{0,31}$/.test(code);
const day = date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
const safe = record => record && typeof record.id === 'string' && ![record.nsfw, record.isNsfw, record.isNSFW, record.is_nsfw, record.not_for_all_audiences].some(value => value === true || value === 'true' || typeof value === 'number' && value > 0)
  && !(Array.isArray(record.tags) && record.tags.some(tag => typeof tag === 'string' && /^(?:nsfw|not-for-all-audiences)$/.test(tag.toLowerCase().trim().replace(/^(?:custom_tag|tag):/, '').replace(/[ _]+/g, '-'))));

async function decoded(response) {
  if (!response.body) throw new Error(tr('記録の内容を読み込めません', "Could not read the record"));
  const reader = response.body.getReader(), chunks = [];
  let bytes = 0;
  while (bytes < 2) {
    const next = await reader.read();
    if (next.done) break;
    chunks.push(next.value); bytes += next.value.length;
  }
  let first = new Uint8Array(bytes), offset = 0;
  for (const chunk of chunks) { first.set(chunk, offset); offset += chunk.length; }
  const compressed = first[0] === 0x1f && first[1] === 0x8b;
  const stream = new ReadableStream({
    start(controller) { if (first.length) controller.enqueue(first); first = null; },
    async pull(controller) {
      try { const next = await reader.read(); if (next.done) controller.close(); else controller.enqueue(next.value); }
      catch (error) { controller.error(error); }
    },
    cancel(reason) { return reader.cancel(reason); }
  });
  if (!compressed) return new Response(stream);
  if (typeof DecompressionStream === 'undefined') { await stream.cancel(); throw new Error(tr('このブラウザーでは圧縮された記録を開けません', "This browser cannot open compressed records")); }
  // Some hosts set Content-Encoding:gzip, in which case fetch already decoded it.
  return new Response(stream.pipeThrough(new DecompressionStream('gzip')));
}

async function* objects(response, decode = value => value) {
  const stream = (await decoded(response)).body.pipeThrough(new TextDecoderStream());
  const reader = stream.getReader();
  let started = false, ended = false, depth = 0, quoted = false, escaped = false, value = '', expect = 'value-or-end';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      for (const ch of chunk.value) {
        if (!started) {
          if (/\s/.test(ch)) continue;
          if (ch !== '[') throw new Error(tr('記録の形式を確認できません', "Could not verify the record format"));
          started = true; continue;
        }
        if (!depth) {
          if (/\s/.test(ch)) continue;
          if (ended) throw new Error(tr('記録の形式を確認できません', "Could not verify the record format"));
          if (ch === ']' && expect !== 'value') { ended = true; continue; }
          if (ch === ',' && expect === 'comma-or-end') { expect = 'value'; continue; }
          if (ch !== '{' || expect === 'comma-or-end') throw new Error(tr('記録の形式を確認できません', "Could not verify the record format"));
          value = ch; depth = 1; quoted = false; escaped = false; continue;
        }
        value += ch;
        if (value.length > 65536) throw new Error(tr('一件の記録が長すぎます', "A record is too long"));
        if (quoted) {
          if (escaped) escaped = false;
          else if (ch === '\\') escaped = true;
          else if (ch === '"') quoted = false;
        } else if (ch === '"') quoted = true;
        else if (ch === '{' || ch === '[') depth++;
        else if (ch === '}' || ch === ']') depth--;
        if (!depth) { const record = decode(JSON.parse(value)); if (safe(record)) yield record; value = ''; expect = 'comma-or-end'; }
      }
    }
    if (!ended || depth) throw new Error(tr('記録の読み込みが途中で終わりました', "Record loading ended before completion"));
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

/** Offline uses the browser's Cache API when available, or this instance's memory.
 * No application server, external library, or registry call is needed for lookup.
 */
export function createWorldIndexClient({
  baseUrl = new URL('../../../world/', import.meta.url).href,
  fetch: fetcher = globalThis.fetch, crypto = globalThis.crypto,
  cacheStorage = globalThis.caches, cacheName = 'memento-world-v1',
  online = () => globalThis.navigator?.onLine !== false,
  searchRegistry = registrySearch, maxCachedFiles = 8, now = () => new Date()
} = {}) {
  const base = new URL(baseUrl, globalThis.location?.href || import.meta.url);
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  if (!Number.isSafeInteger(maxCachedFiles) || maxCachedFiles < 1) throw new Error(tr('保存件数を確認してください', "Check the cache limit"));
  const memory = new Map();
  let manifestPromise, notablePromise, diskPromise;
  const disk = () => diskPromise ||= Promise.resolve().then(() => cacheStorage?.open(cacheName)).catch(() => null);
  const checkAbort = signal => signal?.throwIfAborted();

  async function get(path, { signal, version, persist = true } = {}) {
    checkAbort(signal);
    const url = new URL(path, base);
    if (version) url.searchParams.set('v', version);
    const cache = await disk();
    try {
      const response = await fetcher(url.href, { signal, credentials: 'omit', cache: version ? 'force-cache' : 'no-cache' });
      if (!response.ok) throw new Error(tr(`記録を読み込めません（HTTP ${response.status}）`, `Could not load records (HTTP ${response.status})`));
      // Cache failures (private mode / quota) do not make a usable response fail.
      if (cache && persist) await cache.put(url.href, response.clone()).catch(() => {});
      return response;
    } catch (error) {
      checkAbort(signal);
      const saved = cache && await cache.match(url.href).catch(() => null);
      if (saved) return saved;
      throw error;
    }
  }

  async function loadManifest({ signal, refresh = false } = {}) {
    checkAbort(signal);
    if (refresh) { manifestPromise = undefined; notablePromise = undefined; memory.clear(); }
    if (!manifestPromise) {
      manifestPromise = (async () => {
        const data = await (await get('manifest.json', { signal })).json();
        if (data.schema !== SCHEMA || !Array.isArray(data.shards) || !Array.isArray(data.authors) || !Array.isArray(data.new) || !data.registries) throw new Error(tr('一覧の形式を確認できません', "Could not verify the catalog format"));
        for (const entry of [...data.shards, ...data.authors]) {
          const kind = data.shards.includes(entry) ? 'shards' : 'authors';
          const suffix = kind === 'shards' ? 'jsonl.gz' : 'json.gz';
          if (!safeCode(entry.r) || !/^[a-f0-9]{2}$/.test(entry.prefix) || entry.path !== `${kind}/${entry.r}/${entry.prefix}.${suffix}`) throw new Error(tr('分割された記録の場所を確認できません', "Could not verify the record shard location"));
        }
        for (const entry of data.new) if (!day(entry.date) || ![`new/${entry.date}.json`, `new/${entry.date}.json.gz`].includes(entry.path)) throw new Error(tr('新着の記録の場所を確認できません', "Could not verify the new-record location"));
        if (data.notable?.path !== 'notable.json.gz') throw new Error(tr('主な記録の場所を確認できません', "Could not verify the notable-record location"));
        return data;
      })().catch(error => { manifestPromise = undefined; throw error; });
    }
    return manifestPromise;
  }

  async function prefixOf(id) {
    if (typeof id !== 'string' || !id || id.length > 2048) throw new Error(tr('登録IDを確認してください', "Check the registry ID"));
    if (!crypto?.subtle) throw new Error(tr('このブラウザーではIDを探すための機能を使えません', "ID lookup is unavailable in this browser"));
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(id.toLowerCase())));
    return digest[0].toString(16).padStart(2, '0');
  }

  async function readFile(entry, jsonl, signal) {
    const manifest = await loadManifest({ signal });
    const key = `${entry.path}:${entry.sha256}`;
    if (memory.has(key)) { const value = memory.get(key); memory.delete(key); memory.set(key, value); return value; }
    const promise = (async () => {
      const response = await decoded(await get(entry.path, { signal, version: entry.sha256 }));
      const text = await response.text();
      return jsonl ? text.split('\n').filter(line => line.trim()).map(line => unpackRecord(JSON.parse(line), entry.r, manifest.encoding?.urls)).map(record => safe(record) ? record : null) : JSON.parse(text);
    })().catch(error => { memory.delete(key); throw error; });
    memory.set(key, promise);
    while (memory.size > maxCachedFiles) memory.delete(memory.keys().next().value);
    return promise;
  }

  async function lookup(registry, id, { signal } = {}) {
    if (!safeCode(registry)) throw new Error(tr('登録先を確認してください', "Check the registry"));
    const [manifest, prefix] = await Promise.all([loadManifest({ signal }), prefixOf(id)]);
    const entry = manifest.shards.find(entry => entry.r === registry && entry.prefix === prefix);
    if (!entry) return null;
    return (await readFile(entry, true, signal)).find(record => record?.r === registry && record.id === id) || null;
  }

  async function browseAuthor(registry, author, { signal, offset = 0, limit = 120 } = {}) {
    if (!safeCode(registry) || !Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 0) throw new Error(tr('作り手の探し方を確認してください', "Check the maker search options"));
    const [manifest, prefix] = await Promise.all([loadManifest({ signal }), prefixOf(author)]);
    const entry = manifest.authors.find(entry => entry.r === registry && entry.prefix === prefix);
    if (!entry) return [];
    const authors = await readFile(entry, false, signal);
    if (!Object.hasOwn(authors, author) || !Array.isArray(authors[author])) return [];
    if (!['shard-offsets.v1', 'shard-deltas.v1'].includes(manifest.encoding?.authors)) return authors[author].slice(offset, offset + limit);
    const ids = [];
    let position = 0, firstOrdinal = 0;
    for (const [prefix, ...ordinals] of authors[author]) {
      if (manifest.encoding.authors === 'shard-deltas.v1') {
        firstOrdinal += ordinals[0];
        let current = firstOrdinal;
        ordinals[0] = current;
        for (let i = 1; i < ordinals.length; i++) { current += ordinals[i]; ordinals[i] = current; }
      }
      if (position + ordinals.length <= offset) { position += ordinals.length; continue; }
      if (ids.length >= limit) break;
      const shard = manifest.shards.find(entry => entry.r === registry && entry.prefix === prefix);
      if (!shard) throw new Error(tr('作り手の記録の場所を確認できません', "Could not verify the maker record location"));
      const records = await readFile(shard, true, signal);
      for (const ordinal of ordinals) {
        if (position++ < offset) continue;
        if (ids.length >= limit) break;
        const record = records[ordinal];
        if (!Number.isSafeInteger(ordinal) || ordinal < 0 || !record || record.a !== author) throw new Error(tr('作り手の記録を確認できません', "Could not verify the maker record"));
        ids.push(record.id);
      }
    }
    return ids;
  }

  async function* iterateArrivals(date = now().toISOString().slice(0, 10), { signal } = {}) {
    if (!day(date)) throw new Error(tr('日付を確認してください', "Check the date"));
    const manifest = await loadManifest({ signal });
    const entry = manifest.new.find(entry => entry.date === date);
    if (entry) yield* objects(await get(entry.path, { signal, version: entry.sha256, persist: false }), raw => unpackRecord(raw, undefined, manifest.encoding?.urls));
  }

  async function newArrivals(date, { signal, offset = 0, limit = 120 } = {}) {
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 0) throw new Error(tr('表示件数を確認してください', "Check the display limit"));
    const records = [];
    if (!limit) return records;
    let skipped = 0;
    for await (const record of iterateArrivals(date, { signal })) {
      if (skipped++ < offset) continue;
      records.push(record);
      if (records.length >= limit) break;
    }
    return records;
  }

  async function recentArrivals({ days = 7, limit = 120, signal } = {}) {
    if (!Number.isSafeInteger(days) || days < 1 || !Number.isSafeInteger(limit) || limit < 0) throw new Error(tr('日数か表示件数を確認してください', "Check the day count or display limit"));
    const manifest = await loadManifest({ signal }), records = [];
    const end = now().toISOString().slice(0, 10);
    const start = new Date(`${end}T00:00:00Z`); start.setUTCDate(start.getUTCDate() - days + 1);
    const from = start.toISOString().slice(0, 10);
    for (const entry of [...manifest.new].filter(entry => entry.date >= from && entry.date <= end).sort((a, b) => a.date > b.date ? -1 : 1)) {
      if (records.length >= limit) break;
      for (const record of await newArrivals(entry.date, { signal, limit: limit - records.length })) records.push({ ...record, firstSeen: entry.date });
    }
    return records;
  }

  async function loadNotable({ signal } = {}) {
    if (!notablePromise) notablePromise = (async () => {
      const manifest = await loadManifest({ signal });
      const records = [];
      for await (const record of objects(await get(manifest.notable.path, { signal, version: manifest.notable.sha256 }), raw => unpackRecord(raw, undefined, manifest.encoding?.urls))) records.push(record);
      return records;
    })().catch(error => { notablePromise = undefined; throw error; });
    checkAbort(signal);
    return notablePromise;
  }

  async function searchNotable(query, { registry = 'all', kind = 'text', limit = 120, signal } = {}) {
    if (!Number.isSafeInteger(limit) || limit < 0) throw new Error(tr('表示件数を確認してください', "Check the display limit"));
    const needle = String(query ?? '').normalize('NFKC').toLowerCase().trim();
    const words = needle.split(/\s+/).filter(Boolean);
    return (await loadNotable({ signal })).filter(record => {
      if (registry !== 'all' && record.r !== registry) return false;
      const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase();
      if (kind === 'id') return normalize(record.id) === needle;
      if (kind === 'maker') return normalize(record.a) === needle;
      const haystack = [record.id, record.n, record.a, record.t, record.lic, record.label].map(normalize).join(' ');
      return words.every(word => haystack.includes(word));
    }).slice(0, limit);
  }

  async function searchLive(query, { registry = 'hf', sort = 'trendingScore', next = null, signal, filter = '' } = {}) {
    checkAbort(signal);
    if (!online()) throw new Error(tr('登録先につないで探すにはインターネット接続が必要です', "Online registry search requires an internet connection"));
    // Civitai §11.4 requires credentials, which registries.js cannot supply here:
    // https://civitai.com/content/tos . Kaggle's adapter is count-only:
    // https://www.kaggle.com/terms . Do not bypass those policies in the browser.
    const supported = ['hf'];
    if (registry === 'all') {
      const results = await Promise.allSettled(supported.map(code => searchRegistry(code, query, sort, null, signal, filter)));
      checkAbort(signal);
      if (results.every(result => result.status === 'rejected')) throw new Error(tr('登録先を検索できませんでした', "Could not search the registries"));
      return { items: results.flatMap(result => result.status === 'fulfilled' ? result.value.items.filter(safe) : []), next: null,
        errors: results.flatMap((result, i) => result.status === 'rejected' ? [supported[i]] : []) };
    }
    if (!supported.includes(registry)) throw new Error(tr('この登録先の通信による検索にはまだ対応していません', "Online search is not available for this registry yet"));
    const result = await searchRegistry(registry, query, sort, next, signal, filter);
    return { ...result, items: result.items.filter(safe) };
  }

  return { loadManifest, lookup, getById: lookup, browseAuthor, iterateArrivals, newArrivals, recentArrivals,
    loadNotable, searchNotable, searchLive, clearMemory() { memory.clear(); notablePromise = undefined; } };
}

export const createIndexClient = createWorldIndexClient;

export { unpackRecord as decodeWorldRecord };
