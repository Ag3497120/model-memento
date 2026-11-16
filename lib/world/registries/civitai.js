import { progress } from '../progress.js';
import { setTimeout as sleepDefault } from 'node:timers/promises';

const ENDPOINT = 'https://civitai.com/api/v1/models';
const INTERVAL_MS = 1000; // 実装側の控えめな間隔。サービスの公称上限ではない。

export const meta = Object.freeze({
  code: 'civitai',
  name: 'Civitai',
  homepage: 'https://civitai.com/models',
  api: ENDPOINT,
  terms: 'https://civitai.com/content/tos',
  rateLimit: 'unverified（時間あたりの公称上限は未確認）。要求間隔は最低1秒。429では再開を延期。',
  needsToken: true,
  sources: [
    'https://civitai.com/content/tos',
    'https://developer.civitai.com/site/reference/models',
    'https://developer.civitai.com/site/guide/pagination',
    'https://github.com/civitai/civitai/blob/main/docs/features/nsfw-filtering.md',
  ],
});

function nonempty(value) {
  return typeof value === 'string' && value.trim() !== '' && !/[\u0000-\u001f\u007f]/u.test(value);
}

function day(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:$|T)/u.test(value)) return null;
  const prefix = value.slice(0, 10);
  const timestamp = Date.parse(value);
  const midnight = Date.parse(prefix);
  if (!Number.isFinite(timestamp) || !Number.isFinite(midnight)) return null;
  if (new Date(midnight).toISOString().slice(0, 10) !== prefix) return null;
  return new Date(timestamp).toISOString().slice(0, 10);
}

function cutoff(value) {
  if (value === null || value === undefined) return null;
  const result = day(value);
  if (result === null) throw new TypeError('since は日付を指定してください。');
  return result;
}

function requestBudget(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('budget は0以上の整数を指定してください。');
  return value;
}

function counter(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function bucket(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  if (value === 0) return 0;
  if (value < 100) return 1;
  if (value < 1000) return 2;
  if (value < 10_000) return 3;
  if (value < 100_000) return 4;
  if (value < 1_000_000) return 5;
  return 6;
}

// PG=1 と PG13=2 のみ許可。R=4, X=8, XXX=16, Blocked=32 は除外。
// https://github.com/civitai/civitai/blob/main/docs/features/nsfw-filtering.md
function rating(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return 'unknown';
  if (item.nsfw === true) return 'nsfw';
  const level = item.nsfwLevel;
  if (Number.isSafeInteger(level) && level > 0 && level <= 63 && (level & 60) !== 0) return 'nsfw';
  if (level !== undefined && level !== null && ![1, 2, 3].includes(level)) return 'unknown';
  if (item.nsfw !== undefined && item.nsfw !== null && typeof item.nsfw !== 'boolean') return 'unknown';
  if (item.nsfw === false || [1, 2, 3].includes(level)) return 'safe';
  return 'unspecified';
}

function modelRating(item) {
  const parent = rating(item);
  const children = Array.isArray(item?.modelVersions) ? item.modelVersions.map(rating) : [];
  if (parent === 'nsfw' || children.includes('nsfw')) return 'nsfw';
  if (parent !== 'safe' || children.includes('unknown')) return 'unknown';
  return 'safe';
}

function modelRecord(item) {
  if (!Number.isSafeInteger(item.id) || item.id <= 0 || !nonempty(item.name)) return null;
  const versions = Array.isArray(item.modelVersions) ? item.modelVersions : [];
  const updated = [item.updatedAt, ...versions.flatMap(v => [v?.updatedAt, v?.publishedAt])]
    .map(day).filter(Boolean).sort().at(-1) ?? null;
  const availability = item.availability;
  return {
    r: 'civitai',
    id: String(item.id),
    a: nonempty(item.creator?.username) ? item.creator.username : null,
    n: item.name,
    t: nonempty(item.type) ? item.type : null,
    c: day(item.createdAt),
    u: updated,
    d: bucket(item.stats?.downloadCount),
    l: bucket(item.stats?.thumbsUpCount),
    lic: null, // 利用条件の複数フラグからライセンス名を推測しない。
    gated: availability === 'Public' ? false : null,
    url: `https://civitai.com/models/${item.id}`,
  };
}

function nextPosition(metadata, current) {
  if (nonempty(metadata?.nextCursor)) return { cursor: metadata.nextCursor, page: null };
  if (metadata?.nextPage === undefined || metadata.nextPage === null || metadata.nextPage === '') return null;
  // サーバーから受け取ったURLをそのまま取得しない。認証情報・安全設定を引き継がない。
  const url = new URL(metadata.nextPage);
  if (url.origin !== 'https://civitai.com' || url.pathname !== '/api/v1/models' || url.username || url.password) {
    throw new Error('Civitai の続きの取得先が正しくありません。');
  }
  const cursor = url.searchParams.get('cursor');
  if (nonempty(cursor)) return { cursor, page: null };
  const page = Number(url.searchParams.get('page'));
  if (!Number.isSafeInteger(page) || page <= (current.page ?? 1) || page > 10) {
    throw new Error('Civitai の深いページには続き位置が必要です。');
  }
  return { cursor: null, page };
}

function urlFor(state, limit = 100, includeMature = false) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('limit', String(limit));
  // Include flags of previously safe models; mature names/content never leave this module.
  // https://github.com/civitai/civitai-developer-docs/blob/main/site/reference/models.md
  url.searchParams.set('nsfw', String(includeMature));
  url.searchParams.set('sort', 'Newest');
  url.searchParams.set('period', 'AllTime');
  if (state.cursor) url.searchParams.set('cursor', state.cursor);
  else if (state.page) url.searchParams.set('page', String(state.page));
  return url.href;
}

function retryTime(response, now, attempt) {
  const header = response.headers?.get?.('retry-after');
  if (typeof header === 'string' && /^\d+(?:\.\d+)?$/u.test(header.trim())) {
    const milliseconds = Number(header) * 1000;
    if (Number.isFinite(milliseconds) && now + milliseconds <= 8.64e15) return new Date(now + milliseconds).toISOString();
  }
  const parsed = typeof header === 'string' ? Date.parse(header) : NaN;
  if (Number.isFinite(parsed)) return new Date(Math.max(now, parsed)).toISOString();
  return new Date(now + Math.min(3_600_000, 60_000 * 2 ** Math.min(attempt, 6))).toISOString();
}

function requestOptions(token) {
  const headers = { accept: 'application/json' };
  if (nonempty(token)) headers.authorization = `Bearer ${token}`;
  return { headers, redirect: 'error' };
}

/** token または authenticated:true の認証済み fetch が必要（利用規約 §11.4）。 */
export async function* list({ fetch, since, state, budget = 20, token, authenticated = false,
  now = Date.now, sleep = sleepDefault } = {}) {
  if (state != null) state = progress(state, 'civitai');
  requestBudget(budget);
  const sinceDay = cutoff(since === undefined ? state?.since : since);
  const resume = state?.version === 1 && state.since === sinceDay;
  const next = {
    version: 1,
    registry: 'civitai',
    since: sinceDay,
    cursor: resume && nonempty(state.cursor) ? state.cursor : null,
    page: resume && Number.isSafeInteger(state.page) && state.page >= 1 && state.page <= 10 ? state.page : null,
    complete: resume && state.complete === true,
    requests: 0,
    excludedNsfw: resume ? counter(state.excludedNsfw) : 0,
    excludedNsfwTotal: null, // nsfw=false が返さないモデルの世界全体の総数は不明。
    skippedUnrated: resume ? counter(state.skippedUnrated) : 0,
    skippedInvalid: resume ? counter(state.skippedInvalid) : 0,
    lastRequestAt: resume && Number.isFinite(state.lastRequestAt) ? state.lastRequestAt : null,
    retryAt: resume && Number.isFinite(Date.parse(state.retryAt)) ? state.retryAt : null,
    backoff: resume ? counter(state.backoff) : 0,
  };
  if (!nonempty(token) && authenticated !== true) {
    next.requiresToken = true;
    next.reason = '利用規約に従うため、自分の認証情報を使った公式API接続が必要です。';
    next.source = meta.terms;
    yield { state: progress(next, 'civitai') };
    return;
  }
  if (next.complete || budget === 0 || (next.retryAt && Date.parse(next.retryAt) > now())) {
    yield { state: progress(next, 'civitai') };
    return;
  }
  if (typeof fetch !== 'function') throw new TypeError('fetch を指定してください。');
  const seen = new Set();
  const positions = new Set();
  let failure;
  try {
    while (next.requests < budget && !next.complete) {
      const position = JSON.stringify([next.cursor, next.page]);
      if (positions.has(position)) throw new Error('Civitai の続き位置が進んでいません。');
      positions.add(position);
      const wait = next.lastRequestAt === null ? 0 : Math.min(INTERVAL_MS, Math.max(0, next.lastRequestAt + INTERVAL_MS - now()));
      if (wait > 0) await sleep(wait);
      next.lastRequestAt = now();
      next.requests += 1;
      const response = await fetch(urlFor(next, 100, true), requestOptions(token));
      if (response.status === 429) {
        next.retryAt = retryTime(response, now(), next.backoff++);
        break;
      }
      if (!response.ok) throw new Error(`Civitai の取得に失敗しました（HTTP ${response.status}）。`);
      const payload = await response.json();
      if (!Array.isArray(payload?.items) || !payload.metadata || typeof payload.metadata !== 'object' || Array.isArray(payload.metadata)) {
        throw new TypeError('Civitai の一覧の形式を確認できません。');
      }
      const following = nextPosition(payload.metadata, next);
      if (following && JSON.stringify([following.cursor, following.page]) === position) {
        throw new Error('Civitai の続き位置が進んでいません。');
      }
      for (const item of payload.items) {
        if (item?.id !== undefined && seen.has(item.id)) continue;
        if (item?.id !== undefined) seen.add(item.id);
        const safety = modelRating(item);
        if (safety === 'nsfw') {
          next.excludedNsfw += 1;
          if (Number.isSafeInteger(item.id) && item.id > 0) yield { remove: { r: 'civitai', id: String(item.id), reason: 'nsfw' } };
          continue;
        }
        if (safety !== 'safe') {
          next.skippedUnrated += 1;
          continue;
        }
        const result = modelRecord(item);
        if (result === null) {
          next.skippedInvalid += 1;
          continue;
        }
        const latest = [result.c, result.u].filter(Boolean).sort().at(-1);
        // Newest が更新日の順だとは仮定せず、差分でも最後まで巡回する。
        if (next.since && latest && latest < next.since) continue;
        yield result;
      }
      next.cursor = following?.cursor ?? null;
      next.page = following?.page ?? null;
      next.complete = following === null;
      next.retryAt = null;
      next.backoff = 0;
    }
  } catch (error) {
    next.error = '一覧を取得できませんでした。続きの状態を保持しています。';
    failure = error;
  }
  yield { state: progress(next, 'civitai') };
  if (failure) throw failure;
}

export async function count({ fetch, token, authenticated = false, now = Date.now } = {}) {
  const at = new Date(now()).toISOString();
  if (!nonempty(token) && authenticated !== true) {
    return { count: null, method: `unverified（認証付き接続が必要）: ${meta.terms}`, at };
  }
  if (typeof fetch !== 'function') throw new TypeError('fetch を指定してください。');
  const response = await fetch(urlFor({}, 1), requestOptions(token));
  if (response.status === 429) {
    return {
      count: null,
      method: `unverified（429による待機。総数は不明）: ${ENDPOINT}`,
      at,
      retryAt: retryTime(response, now(), 0),
    };
  }
  if (!response.ok) throw new Error(`Civitai の件数取得に失敗しました（HTTP ${response.status}）。`);
  const payload = await response.json();
  if (!Array.isArray(payload?.items)) throw new TypeError('Civitai の一覧の形式を確認できません。');
  const total = payload.metadata?.totalItems;
  const known = Number.isSafeInteger(total) && total >= payload.items.length;
  return {
    count: known ? total : null,
    method: known
      ? `公式APIの nsfw=false 条件の totalItems（追加の安全確認より前の件数）: ${ENDPOINT}`
      : `unverified（APIが総数を返していないため不明）: ${ENDPOINT}`,
    at,
  };
}
