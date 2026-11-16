import { progress } from '../progress.js';
import { _support as s } from './hf.js';

const API = 'https://modelscope.cn/openapi/v1/models';
const PAGE_SIZE = 50;
const MAX_RESULTS = 3_000;

export const meta = Object.freeze({
  code: 'modelscope', name: 'ModelScope', homepage: 'https://modelscope.cn', api: API,
  terms: 'https://www.modelscope.cn/docs/agreements/terms', needsToken: false,
  rateLimit: 'unverified（公表値は確認できません。取得の間隔は1秒以上とし、429の待ち時間に従います）',
  sources: [
    'https://www.modelscope.cn/docs/agreements/terms',
    'https://www.modelscope.cn/llms.txt',
    'https://www.modelscope.cn/.well-known/openapi.json',
    'https://github.com/modelscope/modelscope_hub/blob/main/src/modelscope_hub/_openapi.py',
  ],
});

function requestURL(page, size = PAGE_SIZE) {
  const url = new URL(API);
  url.searchParams.set('page_number', String(page));
  url.searchParams.set('page_size', String(size));
  url.searchParams.set('sort', 'last_modified');
  return url.href;
}

function payload(body) {
  const data = body?.data;
  if (body?.success !== true || !data || !Array.isArray(data.models)
    || !Number.isSafeInteger(data.total_count) || data.total_count < 0) throw new Error('invalid listing');
  return data;
}

function record(row) {
  const slash = row.id.lastIndexOf('/');
  // The OpenAPI list schema exposes task ids, not a description or model card.
  const task = Array.isArray(row.tasks) ? row.tasks.find(value => typeof value === 'string') : null;
  return {
    r: 'modelscope', id: row.id, a: slash < 0 ? null : row.id.slice(0, slash), n: row.id.slice(slash + 1),
    t: task ?? null, c: s.isoDate(row.created_at), u: s.isoDate(row.last_modified),
    d: s.bucket(row.downloads), l: s.bucket(row.likes), lic: typeof row.license === 'string' && row.license ? row.license : null,
    gated: s.gated(row.gated), url: `https://modelscope.cn/models/${row.id.split('/').map(encodeURIComponent).join('/')}`,
  };
}

export async function* list(options = {}) {
  const state = s.initialState('modelscope', options.state, options.since);
  state.page ??= 1;
  if (!Number.isSafeInteger(state.page) || state.page < 1) throw new TypeError('再開位置が正しくありません。');
  const io = s.session(options, state, 1_000);
  while (!state.complete) {
    // Official OpenAPI restricts page_number * page_size <= 3000. Do not bypass it.
    if (state.page * PAGE_SIZE > MAX_RESULTS) {
      state.reason = 'source-limit';
      state.error = '公開の取得方法では3,000件までです。全件の取得は完了していません。';
      break;
    }
    const response = await io.request(requestURL(state.page));
    if (!response) break;
    let data;
    try {
      data = payload(await response.json());
      if (data.page_number !== state.page || data.page_size !== PAGE_SIZE || data.models.length > PAGE_SIZE) throw new Error('wrong page');
      if (!data.models.length && data.total_count > (state.page - 1) * PAGE_SIZE) throw new Error('empty continuing page');
    } catch { state.reason = 'invalid-response'; state.error = '一覧の形式を確認できません。同じ位置から再開できます。'; break; }
    state.total = data.total_count;
    for (const row of data.models) {
      if (!row || typeof row !== 'object') { state.invalid++; continue; }
      const updated = s.timestamp(row.last_modified);
      if (state.since && updated !== null && updated < Date.parse(state.since)) { state.complete = true; state.reason = 'since'; break; }
      state.seen++;
      if (s.unsafe(row)) { state.excludedNsfw++; if (s.modelId(row.id)) yield { remove: { r: 'modelscope', id: row.id, reason: 'nsfw' } }; continue; }
      if (row.private === true) { state.private++; continue; }
      if (!s.modelId(row.id)) { state.invalid++; continue; }
      state.emitted++;
      yield record(row);
    }
    if (state.complete) break;
    if (state.page * PAGE_SIZE >= data.total_count) { state.complete = true; state.reason = 'complete'; break; }
    state.page++;
    state.reason = 'budget';
  }
  yield { state: progress(state, 'modelscope') };
}

export async function count(options = {}) {
  const state = s.initialState('modelscope', null, null);
  const io = s.session({ ...options, budget: 3 }, state, 1_000);
  const response = await io.request(requestURL(1, 1));
  let total = null;
  if (response) {
    try { total = payload(await response.json()).total_count; } catch { /* Unknown is not zero. */ }
  }
  return { count: total, method: total === null ? 'unverified' : '公開APIのtotal_count（除外対象も含みます）', at: new Date(io.now()).toISOString(), source: API };
}
