import { progress } from '../progress.js';
// API fields and pagination: https://huggingface.co/docs/huggingface_hub/package_reference/hf_api#huggingface_hub.HfApi.list_models
// These helpers live here because this worker may not add a shared registry file.
const API = 'https://huggingface.co/api/models';
const HOMEPAGE = 'https://huggingface.co';
const FIELDS = ['author', 'createdAt', 'lastModified', 'downloads', 'likes', 'pipeline_tag', 'tags', 'gated', 'private'];

export const meta = Object.freeze({
  code: 'hf', name: 'Hugging Face', homepage: HOMEPAGE, api: API,
  terms: `${HOMEPAGE}/terms-of-service`, needsToken: false,
  rateLimit: '未ログインでは5分間に500回。初期の間隔は650ミリ秒で、応答の残り回数と待ち時間も守ります。',
  sources: [
    `${HOMEPAGE}/terms-of-service`, `${HOMEPAGE}/docs/hub/api`,
    `${HOMEPAGE}/docs/hub/rate-limits`,
    `${HOMEPAGE}/docs/huggingface_hub/package_reference/hf_api#huggingface_hub.HfApi.list_models`,
    'https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/utils/_pagination.py',
    `${HOMEPAGE}/content-policy`,
  ],
});

function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:$|T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$)/.test(value)) return null;
  const day = value.slice(0, 10);
  const dayMs = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(dayMs) || new Date(dayMs).toISOString().slice(0, 10) !== day) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function isoDate(value) {
  const ms = timestamp(value);
  return ms === null ? null : new Date(ms).toISOString().slice(0, 10);
}

function normalizeSince(value) {
  if (value == null) return null;
  const ms = timestamp(value);
  if (ms === null) throw new TypeError('開始日は正しい日付で指定してください。');
  return new Date(ms).toISOString();
}

function bucket(value) {
  // Missing statistics are unknown, not a claim of zero downloads/likes.
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  if (value === 0) return 0;
  return value < 100 ? 1 : value < 1_000 ? 2 : value < 10_000 ? 3 : value < 100_000 ? 4 : value < 1_000_000 ? 5 : 6;
}

function unsafe(row) {
  if (row.nsfw === true || row.not_for_all_audiences === true) return true;
  return Array.isArray(row.tags) && row.tags.some(tag => {
    if (typeof tag !== 'string') return false;
    const name = tag.toLowerCase().trim().replace(/^(?:custom_tag|tag):/, '').replace(/[ _]+/g, '-');
    return name === 'nsfw' || name === 'not-for-all-audiences';
  });
}

function gated(value) {
  if (value === true || value === 'auto' || value === 'manual') return true;
  return value === false ? false : null;
}

function modelId(value) {
  if (typeof value !== 'string' || !value || value.length > 2_048 || /[\s?#\\\u0000-\u001f]/u.test(value)
    || value.split('/').some(part => !part || part === '.' || part === '..')) return false;
  try { encodeURIComponent(value); return true; } catch { return false; }
}

function initialState(registry, previous, since) {
  if (previous != null) previous = progress(previous, registry);
  if (previous != null && (typeof previous !== 'object' || Array.isArray(previous))) throw new TypeError('再開情報が正しくありません。');
  if (previous?.registry !== undefined && previous.registry !== registry) throw new TypeError('別の一覧の再開情報です。');
  if (previous?.v != null && previous.v !== 1) throw new TypeError('対応していない再開情報です。');
  const normalized = normalizeSince(since === undefined ? previous?.since : since);
  if (previous?.since !== undefined && normalizeSince(previous.since) !== normalized) throw new TypeError('再開時に開始日を変更できません。');
  const result = { complete: false, seen: 0, emitted: 0, excludedNsfw: 0, private: 0, invalid: 0, notBefore: 0, backoff: 0, ...previous, v: 1, registry, since: normalized, requests: 0 };
  if (typeof result.complete !== 'boolean') throw new TypeError('再開情報の完了状態が正しくありません。');
  for (const key of ['seen', 'emitted', 'excludedNsfw', 'private', 'invalid', 'notBefore', 'backoff']) {
    if (!Number.isSafeInteger(result[key]) || result[key] < 0) throw new TypeError('再開情報の数値が正しくありません。');
  }
  delete result.error;
  delete result.httpStatus;
  return progress(result, registry);
}

function waitFromHeaders(response, now) {
  const get = name => response.headers?.get?.(name);
  const retry = get('retry-after');
  let delay = 0;
  if (retry != null && retry.trim() !== '') {
    delay = /^\d+(?:\.\d+)?$/.test(retry.trim()) ? Number(retry) * 1_000 : Math.max(0, Date.parse(retry) - now);
    if (!Number.isFinite(delay)) delay = 0;
  }
  const rate = get('ratelimit') ?? '';
  const remaining = rate.match(/(?:^|;)\s*r=(\d+)/);
  const reset = rate.match(/(?:^|;)\s*t=(\d+(?:\.\d+)?)/);
  if (reset && (response.status === 429 || (remaining && Number(remaining[1]) === 0))) delay = Math.max(delay, Number(reset[1]) * 1_000);
  return Math.ceil(delay);
}

function session({ fetch, budget = 100, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now }, state, interval) {
  if (typeof fetch !== 'function') throw new TypeError('一覧を取得する関数が必要です。');
  if (!(budget === Infinity || (Number.isSafeInteger(budget) && budget >= 0))) throw new TypeError('取得回数は0以上の整数で指定してください。');
  return {
    now,
    async request(url) {
      while (state.requests < budget) {
        const delay = Math.max(0, state.notBefore - now());
        if (delay) await sleep(delay);
        const started = now();
        state.notBefore = started + interval;
        state.requests++;
        let response;
        try { response = await fetch(url, { headers: { accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(30_000) }); }
        catch { state.reason = 'network-error'; state.error = '取得できませんでした。同じ位置から再開できます。'; return null; }
        let spacing = interval;
        const policy = response.headers?.get?.('ratelimit-policy') ?? '';
        const quota = policy.match(/(?:^|;)\s*q=(\d+)/);
        const window = policy.match(/(?:^|;)\s*w=(\d+)/);
        if (quota && window && Number(quota[1]) > 0) spacing = Math.max(spacing, Math.ceil(Number(window[1]) * 1_000 / Number(quota[1])));
        const wait = waitFromHeaders(response, now());
        const remaining = response.headers?.get?.('ratelimit')?.match(/(?:^|;)\s*r=(\d+)/);
        const reset = response.headers?.get?.('ratelimit')?.match(/(?:^|;)\s*t=(\d+(?:\.\d+)?)/);
        if (remaining && reset && Number(remaining[1]) > 0) spacing = Math.max(spacing, Math.ceil(Number(reset[1]) * 1_000 / Number(remaining[1])));
        state.notBefore = Math.max(started + spacing, now() + wait);
        if (response.status === 429) {
          const fallback = Math.min(60_000, 1_000 * 2 ** Math.min(state.backoff, 6));
          state.backoff = Math.min(state.backoff + 1, 6);
          state.notBefore = Math.max(state.notBefore, now() + (wait || fallback));
          state.reason = 'rate-limit';
          continue;
        }
        if (!response.ok) {
          state.reason = 'http-error'; state.httpStatus = response.status;
          state.error = '取得先がエラーを返しました。同じ位置から再開できます。'; return null;
        }
        state.backoff = 0;
        return response;
      }
      if (state.reason !== 'rate-limit') state.reason = 'budget';
      return null;
    },
  };
}

// Internal shared utilities for the three assigned modules; no network at import time.
export const _support = Object.freeze({ timestamp, isoDate, normalizeSince, bucket, unsafe, gated, modelId, initialState, session });

function nextCursor(header) {
  for (const match of (header ?? '').matchAll(/<([^>]+)>([^<]*)/g)) {
    const relation = match[2].match(/;\s*rel\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i);
    if (!(relation?.[1] ?? relation?.[2] ?? '').split(/\s+/).includes('next')) continue;
    const url = new URL(match[1], API);
    if (url.origin !== HOMEPAGE || url.pathname !== '/api/models' || url.username || url.password || url.hash) throw new Error('invalid next link');
    const cursor = url.searchParams.get('cursor');
    if (!cursor) throw new Error('missing cursor');
    return cursor;
  }
  if (/\bnext\b/i.test(header ?? '')) throw new Error('invalid next link');
  return null;
}

function requestURL(cursor) {
  const url = new URL(API);
  url.searchParams.set('limit', '1000');
  url.searchParams.set('sort', 'lastModified');
  url.searchParams.set('direction', '-1');
  for (const field of FIELDS) url.searchParams.append('expand', field);
  if (cursor) url.searchParams.set('cursor', cursor);
  return url.href;
}

function record(row) {
  const slash = row.id.lastIndexOf('/');
  const tags = Array.isArray(row.tags) ? row.tags : [];
  return {
    r: 'hf', id: row.id, a: typeof row.author === 'string' ? row.author : slash >= 0 ? row.id.slice(0, slash) : null,
    n: row.id.slice(slash + 1), t: typeof row.pipeline_tag === 'string' ? row.pipeline_tag : null,
    c: isoDate(row.createdAt), u: isoDate(row.lastModified), d: bucket(row.downloads), l: bucket(row.likes),
    lic: tags.find(tag => typeof tag === 'string' && tag.startsWith('license:') && tag.length > 8)?.slice(8) ?? null,
    gated: gated(row.gated), url: `${HOMEPAGE}/${row.id.split('/').map(encodeURIComponent).join('/')}`,
  };
}

export async function* list(options = {}) {
  const state = initialState('hf', options.state, options.since);
  state.cursor ??= null;
  if (state.cursor !== null && (typeof state.cursor !== 'string' || !state.cursor)) throw new TypeError('再開位置が正しくありません。');
  const io = session(options, state, 650);
  const cursors = new Set([state.cursor]);
  while (!state.complete) {
    const response = await io.request(requestURL(state.cursor));
    if (!response) break;
    let rows, cursor;
    try {
      rows = await response.json();
      if (!Array.isArray(rows)) throw new Error('not an array');
      cursor = nextCursor(response.headers?.get?.('link'));
      if (cursor && cursors.has(cursor)) throw new Error('repeated cursor');
      if (!rows.length && cursor) throw new Error('empty continuing page');
    } catch { state.reason = 'invalid-response'; state.error = '一覧の形式を確認できません。同じ位置から再開できます。'; break; }
    for (const row of rows) {
      if (!row || typeof row !== 'object') { state.invalid++; continue; }
      const updated = timestamp(row.lastModified);
      if (state.since && updated !== null && updated < Date.parse(state.since)) { state.complete = true; state.reason = 'since'; break; }
      state.seen++;
      if (unsafe(row)) { state.excludedNsfw++; if (modelId(row.id)) yield { remove: { r: 'hf', id: row.id, reason: 'nsfw' } }; continue; }
      if (row.private === true) { state.private++; continue; }
      if (!modelId(row.id)) { state.invalid++; continue; }
      state.emitted++;
      yield record(row);
    }
    if (state.complete) { state.cursor = null; break; }
    state.cursor = cursor;
    if (!cursor) { state.complete = true; state.reason = 'complete'; break; }
    cursors.add(cursor);
    state.reason = 'budget';
  }
  yield { state: progress(state, 'hf') };
}

export async function count(options = {}) {
  const state = initialState('hf', null, null);
  // The aggregate is a web page, whose anonymous allowance is 100 / 5 minutes.
  const io = session({ ...options, budget: 3 }, state, 3_100);
  const source = `${HOMEPAGE}/models`;
  const response = await io.request(source);
  let total = null;
  if (response) {
    try {
      const html = await response.text();
      const match = html.match(/(?:&quot;|&#34;|")numTotalItems(?:&quot;|&#34;|")\s*:\s*(\d+)/);
      if (match && Number.isSafeInteger(Number(match[1]))) total = Number(match[1]);
    } catch { /* An unreadable aggregate is unknown, never zero. */ }
  }
  return { count: total, method: total === null ? 'unverified' : '公開モデル一覧の総数（除外対象も含みます）', at: new Date(io.now()).toISOString(), source };
}
