import { progress } from '../progress.js';
const ENDPOINT = 'https://models.dev/api.json?type=all';

export const meta = Object.freeze({
  code: 'api',
  name: 'APIで使えるモデル',
  homepage: 'https://models.dev/',
  api: ENDPOINT,
  terms: 'https://github.com/anomalyco/models.dev/blob/dev/LICENSE',
  rateLimit: 'unverified（公開一覧の数値上限は未確認。1回の取得につき1要求。429では再開を延期）',
  needsToken: false,
  sources: [
    'https://models.dev/',
    ENDPOINT,
    'https://github.com/anomalyco/models.dev/blob/dev/LICENSE',
    'https://openrouter.ai/docs/guides/overview/models',
    'https://openrouter.ai/terms',
  ],
  // OpenRouter §7(5) と公開一覧APIの案内に矛盾があるため、直接収集しない。
  directOpenRouter: {
    listingAllowed: false,
    count: null,
    source: 'https://openrouter.ai/terms',
  },
});

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

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

function record(providerId, modelId, model) {
  if (!object(model) || !nonempty(modelId) || !nonempty(model.name)) return null;
  // API の辞書キーが提供元内のモデルID。別の提供元の同名モデルは統合しない。
  return {
    r: 'api',
    id: `${providerId}/${modelId}`,
    a: providerId,
    n: model.name,
    t: nonempty(model.type) ? model.type : null,
    c: day(model.release_date),
    u: day(model.last_updated),
    d: null,
    l: null,
    lic: null,
    gated: null,
    url: ENDPOINT,
  };
}

function* records(payload, state) {
  if (!object(payload)) throw new TypeError('models.dev の一覧の形式を確認できません。');
  for (const [providerId, provider] of Object.entries(payload)) {
    if (!nonempty(providerId) || providerId.includes('/') || !object(provider) || !object(provider.models)) {
      throw new TypeError('models.dev の提供元の形式を確認できません。');
    }
    for (const [modelId, model] of Object.entries(provider.models)) {
      if (model?.nsfw === true) {
        state.excludedNsfw += 1;
        if (nonempty(modelId)) yield { remove: { r: 'api', id: `${providerId}/${modelId}`, reason: 'nsfw' } };
        continue;
      }
      const result = record(providerId, modelId, model);
      if (result === null) {
        state.skippedInvalid += 1;
        continue;
      }
      const latest = [result.c, result.u].filter(Boolean).sort().at(-1);
      // 日付が不明なモデルは差分取得でも残す。月だけの日付を1日に補わない。
      if (state.since && latest && latest < state.since) continue;
      yield result;
    }
  }
}

export async function* list({ fetch, since, state, budget = 1, now = Date.now } = {}) {
  if (state != null) state = progress(state, 'api');
  requestBudget(budget);
  const sinceDay = cutoff(since === undefined ? state?.since : since);
  const resume = state?.version === 1 && state.since === sinceDay;
  const next = {
    version: 1,
    registry: 'api',
    since: sinceDay,
    complete: resume && state.complete === true,
    requests: 0,
    excludedNsfw: resume && Number.isSafeInteger(state.excludedNsfw) && state.excludedNsfw >= 0 ? state.excludedNsfw : 0,
    skippedInvalid: resume && Number.isSafeInteger(state.skippedInvalid) && state.skippedInvalid >= 0 ? state.skippedInvalid : 0,
    retryAt: resume && Number.isFinite(Date.parse(state.retryAt)) ? state.retryAt : null,
    backoff: resume && Number.isSafeInteger(state.backoff) && state.backoff >= 0 ? state.backoff : 0,
  };
  if (next.complete || budget === 0 || (next.retryAt && Date.parse(next.retryAt) > now())) {
    yield { state: progress(next, 'api') };
    return;
  }
  if (typeof fetch !== 'function') throw new TypeError('fetch を指定してください。');
  let failure;
  try {
    next.requests += 1;
    const response = await fetch(ENDPOINT, { headers: { accept: 'application/json' }, redirect: 'error' });
    if (response.status === 429) {
      next.retryAt = retryTime(response, now(), next.backoff++);
    } else {
      if (!response.ok) throw new Error(`models.dev の取得に失敗しました（HTTP ${response.status}）。`);
      const payload = await response.json();
      next.excludedNsfw = 0;
      next.skippedInvalid = 0;
      // 途中まで公開してから形式エラーになることを避けるため、先に全件を検証する。
      const items = [...records(payload, next)];
      for (const item of items) yield item;
      next.complete = true;
      next.retryAt = null;
      next.backoff = 0;
    }
  } catch (error) {
    next.error = '一覧を取得できませんでした。続きの状態を保持しています。';
    failure = error;
  }
  yield { state: progress(next, 'api') };
  if (failure) throw failure;
}

export async function count({ fetch, now = Date.now } = {}) {
  let total = 0;
  let finalState;
  for await (const item of list({ fetch, now })) {
    if (item.state) finalState = item.state;
    else if (!item.remove) total += 1;
  }
  const result = {
    count: finalState.complete ? total : null,
    method: finalState.complete
      ? `models.dev の公開一覧の提供元別モデルIDを集計（OpenRouterへの直接取得なし）: ${ENDPOINT}`
      : `unverified（429による待機。総数は不明）: ${ENDPOINT}`,
    at: new Date(now()).toISOString(),
  };
  if (finalState.retryAt) result.retryAt = finalState.retryAt;
  return result;
}
