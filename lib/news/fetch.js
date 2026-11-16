import { feedSourceSchema, projectItem, canonicalUrl, hash, newsId, publicUrl } from './schema.js';
import { parseFeed, pageFingerprint } from './parse.js';
export { parseFeed } from './parse.js';
export { newsItemSchema, canonicalUrl } from './schema.js';

function collection(value) {
  return value instanceof Map ? [...value.values()] : Array.isArray(value) ? value : Object.values(value || {});
}
function exactMention(title, name) {
  if (typeof name !== 'string' || !name.trim()) return false;
  let position = title.indexOf(name);
  while (position >= 0) {
    const before = title[position - 1] || '';
    const after = title[position + name.length] || '';
    if ((!/[\p{L}\p{N}_]/u.test(name[0]) || !/[\p{L}\p{N}_]/u.test(before))
      && (!/[\p{L}\p{N}_]/u.test(name.at(-1)) || !/[\p{L}\p{N}_]/u.test(after))) return true;
    position = title.indexOf(name, position + 1);
  }
  return title === name;
}
export function linkEntities(item, { world = [], recipes = [] } = {}) {
  const worldMatches = collection(world).filter(e => typeof e?.id === 'string' && exactMention(item.title, e.n || e.name || e.title));
  const recipeMatches = collection(recipes).filter(e => typeof e?.id === 'string' && exactMention(item.title, e.name || e.title));
  return projectItem({ ...item, entities: {
    world: worldMatches.slice(0, 40).map(e => ({ id: e.id, ...(e.r || e.registry ? { registry: e.r || e.registry } : {}) })),
    recipes: recipeMatches.slice(0, 40).map(e => e.id),
  } });
}

/** URL equality, or the same complete title on the same dated day. No fuzzy entity/name matching. */
export function deduplicate(items) {
  const clean = items.flatMap(value => { try { return [projectItem(value)]; } catch { return []; } });
  const parents = clean.map((_, i) => i);
  function find(i) { while (parents[i] !== i) { parents[i] = parents[parents[i]]; i = parents[i]; } return i; }
  const seen = new Map();
  clean.forEach((item, i) => {
    const keys = [`url:${canonicalUrl(item.url)}`];
    if (item.date && item.dateBasis !== 'observed') keys.push(`title:${item.title.normalize('NFKC').trim()}|${item.date.slice(0, 10)}`);
    for (const key of keys) { if (seen.has(key)) parents[find(i)] = find(seen.get(key)); else seen.set(key, i); }
  });
  const groups = new Map();
  clean.forEach((item, i) => { const key = find(i); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); });
  return [...groups.values()].map(group => {
    // Newer observations replace old page-change notices; first input otherwise takes editorial priority.
    const first = group.find(i => i.dateBasis === 'observed')
      ? [...group].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] : group[0];
    const provenance = new Map();
    group.forEach(i => [i.source, ...(i.sources || [])].forEach(s => provenance.set(s.id, s)));
    const result = { ...first, url: canonicalUrl(first.url), id: newsId(canonicalUrl(first.url)), sources: [...provenance.values()].slice(0, 80) };
    const summary = group.find(i => i.title === first.title && i.summary && i.date === first.date);
    if (!result.summary && summary) Object.assign(result, { summary: summary.summary, summaryLabel: summary.summaryLabel, summaryBasis: summary.summaryBasis });
    return projectItem(result);
  }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.id.localeCompare(b.id));
}

class LimitError extends Error {}
function positive(value, fallback, max) {
  const result = value ?? fallback;
  if (!Number.isSafeInteger(result) || result < 0 || result > max) throw new TypeError('取得の上限は範囲内の整数で指定してください。');
  return result;
}
function retryDate(value, now, fallbackMs = 60_000) {
  const seconds = value && /^\d+$/.test(value) ? Number(value) * 1000 : NaN;
  const absolute = value && !Number.isFinite(seconds) ? Date.parse(value) - now : NaN;
  return new Date(now + Math.min(86_400_000, Math.max(1000, Number.isFinite(seconds) ? seconds : Number.isFinite(absolute) ? absolute : fallbackMs))).toISOString();
}
async function boundedText(response, limits, stats, signal) {
  const advertised = Number(response.headers.get('content-length'));
  const remaining = Math.min(limits.maxResponseBytes, limits.maxBytes - stats.bytes);
  if (advertised > remaining) { await response.body?.cancel(); throw new LimitError('本文の大きさが取得上限を超えています。'); }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength; stats.bytes += value.byteLength;
      if (size > remaining) throw new LimitError('取得する情報量の上限に達しました。');
      chunks.push(value);
    }
  } catch (error) { cancel(); throw error; }
  finally { signal.removeEventListener('abort', cancel); }
  return Buffer.concat(chunks).toString('utf8');
}

/** No AI or filesystem access. Resume using the returned state AND previous items. */
export async function fetchNews({ sources, fetch: fetcher = globalThis.fetch, previous = {}, budget = {},
  now = new Date().toISOString(), entities = {}, maxItems = 2000, maxItemsPerSource = 100 } = {}) {
  if (!Array.isArray(sources) || typeof fetcher !== 'function') throw new TypeError('情報源の一覧と取得する関数が必要です。');
  const date = new Date(now);
  if (!Number.isFinite(date.getTime())) throw new TypeError('確認日が正しくありません。');
  now = date.toISOString();
  const limits = {
    maxRequests: positive(budget.maxRequests, 60, 1000), maxBytes: positive(budget.maxBytes, 32_000_000, 100_000_000),
    maxResponseBytes: positive(budget.maxResponseBytes, 2_000_000, 10_000_000),
    timeoutMs: positive(budget.timeoutMs, 10_000, 60_000), totalMs: positive(budget.totalMs, 120_000, 600_000),
  };
  maxItems = positive(maxItems, 2000, 20_000); maxItemsPerSource = positive(maxItemsPerSource, 100, 500);
  const checked = sources.map(source => feedSourceSchema.parse(source));
  if (new Set(checked.map(s => s.id)).size !== checked.length) throw new Error('情報源の識別名が重複しています。');
  const oldItems = (previous.items || []).flatMap(i => { try { return [projectItem(i)]; } catch { return []; } });
  const stats = { requests: 0, bytes: 0 };
  const started = Date.now();
  const fresh = [];
  const statuses = [];
  const prior = previous.state?.sources || {};
  const state = { schema: 'memento.news-state.v1', cursor: 0, sources: {}, hosts: {} };
  for (const [host, retryAt] of Object.entries(previous.state?.hosts || {})) if (Date.parse(retryAt) > date.getTime()) state.hosts[host] = retryAt;
  const exhausted = () => stats.requests >= limits.maxRequests || stats.bytes >= limits.maxBytes || Date.now() - started >= limits.totalMs;
  const start = Number.isSafeInteger(previous.state?.cursor) ? Math.abs(previous.state.cursor) % Math.max(1, checked.length) : 0;
  state.cursor = start;
  for (let offset = 0; offset < checked.length; offset++) {
    const index = (start + offset) % checked.length;
    const source = checked[index];
    const endpoint = source.feedUrl || source.url;
    const cached = prior[source.id]?.url === endpoint ? prior[source.id] : {};
    // Re-project state too: never retain a response body accidentally added by a caller.
    const entry = { url: endpoint };
    for (const key of ['etag', 'lastModified', 'hash', 'checkedAt', 'retryAt']) if (typeof cached[key] === 'string') entry[key] = cached[key].slice(0, 512);
    state.sources[source.id] = entry;
    const status = { id: source.id, status: 'skipped', reason: '' };
    statuses.push(status);
    if (!source.enabled) { status.reason = 'この情報源の取得は停止中です。'; continue; }
    if (exhausted()) { status.status = 'budget'; status.reason = '今回の取得上限に達しました。'; continue; }
    if (Date.parse(entry.retryAt) > date.getTime() || state.hosts[new URL(endpoint).origin]) { status.reason = '発行元の待ち時間を守って次回に回します。'; continue; }
    state.cursor = (index + 1) % checked.length;
    const timeoutMs = Math.min(limits.timeoutMs, limits.totalMs - (Date.now() - started));
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('取得の待ち時間を超えました。')); }, timeoutMs); });
    try {
      await Promise.race([timeout, (async () => {
        let target = endpoint;
        let response;
        for (let redirects = 0; redirects <= 3; redirects++) {
          if (exhausted()) throw new LimitError('今回の取得上限に達しました。');
          if (!publicUrl(target) || new URL(target).protocol !== 'https:') throw new Error('公開された HTTPS の情報源を指定してください。');
          const headers = { Accept: 'application/atom+xml, application/rss+xml, application/feed+json, application/json, text/html;q=0.5', 'User-Agent': 'ModelMemento-News/1.0' };
          if (target === endpoint) {
            if (entry.etag) headers['If-None-Match'] = entry.etag;
            if (entry.lastModified) headers['If-Modified-Since'] = entry.lastModified;
          }
          stats.requests++;
          response = await fetcher(target, { headers, signal: controller.signal, redirect: 'manual' });
          controller.signal.throwIfAborted();
          if (![301, 302, 303, 307, 308].includes(response.status)) break;
          const location = response.headers.get('location');
          await response.body?.cancel();
          if (!location || redirects === 3) throw new Error('移動先を確認できません。');
          target = publicUrl(location, target);
        }
        entry.checkedAt = now;
        if (response.status === 304) { status.status = 'unchanged'; status.reason = '変更はありません。'; delete entry.retryAt; return; }
        if (!response.ok) {
          await response.body?.cancel();
          status.httpStatus = response.status;
          if ([429, 503].includes(response.status)) {
            entry.retryAt = retryDate(response.headers.get('retry-after'), date.getTime());
            state.hosts[new URL(target).origin] = entry.retryAt;
          } else entry.retryAt = retryDate(null, date.getTime(), 300_000);
          throw new Error(`発行元から取得できませんでした（${response.status}）。`);
        }
        const body = await boundedText(response, limits, stats, controller.signal);
        controller.signal.throwIfAborted();
        let items = [];
        let digest;
        if (source.format === 'page') {
          digest = hash(pageFingerprint(body));
          if (entry.hash && entry.hash !== digest) {
            const url = canonicalUrl(source.url);
            items = [{ schema: 'memento.news.v1', id: newsId(url), title: `${source.name}の更新を確認`, url,
              source: { id: source.id, name: source.name, url: source.url }, date: now, dateBasis: 'observed',
              kind: source.kind, tags: [...new Set([...source.tags, 'page-change'])].slice(0, 16), lang: source.language }];
          }
        } else items = parseFeed(body, source, { limit: maxItemsPerSource });
        // Validators are committed only AFTER a successful parse. Malformed feeds must be retried.
        delete entry.etag; delete entry.lastModified; delete entry.retryAt;
        for (const [header, key] of [['etag', 'etag'], ['last-modified', 'lastModified']]) {
          const value = response.headers.get(header);
          if (value) entry[key] = value.slice(0, 512);
        }
        if (digest) entry.hash = digest;
        fresh.push(...items);
        status.status = 'ok'; status.items = items.length;
        status.reason = source.format === 'page' && !cached.hash ? '変更を比べるための初回記録です。' : '取得しました。';
      })()]);
    } catch (error) {
      status.status = error instanceof LimitError ? 'budget' : 'error';
      // Native JSON/fetch errors may quote response text. Never persist those messages.
      status.reason = controller.signal.aborted ? '取得の待ち時間を超えました。' : error instanceof LimitError ? error.message
        : status.httpStatus ? `発行元から取得できませんでした（${status.httpStatus}）。`
          : '情報源を取得または読み取りできませんでした。次回の取得で確かめます。';
    } finally { clearTimeout(timer); controller.abort(); }
  }
  // A title edit must not reuse an older summary for that URL.
  const newTitles = new Map(fresh.map(i => [i.url, i.title]));
  const retained = oldItems.map(i => {
    if (newTitles.has(i.url) && newTitles.get(i.url) !== i.title) {
      const { summary, summaryLabel, summaryBasis, ...rest } = i; return rest;
    }
    return i;
  });
  const items = deduplicate([...fresh, ...retained]).slice(0, maxItems).map(i => linkEntities(i, entities));
  return { schema: 'memento.news-feed.v1', fetchedAt: now, items, statuses, stats, state };
}
