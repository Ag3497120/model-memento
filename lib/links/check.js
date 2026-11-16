import { lookup as dnsLookup } from 'node:dns/promises';
import { publicAddress, publicUrl, spaceId } from './urls.js';
import { parseRobots } from './robots.js';

export const USER_AGENT = 'ModelMementoLinks/1.0';
export const STATUS_SCHEMA = 'memento.links-status.v1';
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

class Deferred extends Error {}
class Denied extends Error {
  constructor(reason) { super(reason); this.reason = reason; }
}

function integer(value, fallback, min, max, label) {
  value ??= fallback;
  if (!Number.isInteger(value) || value < min || value > max) throw new TypeError(`${label}の指定を確認してください。`);
  return value;
}

async function readBounded(response, maximum) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) throw new Error('応答の大きさが上限を超えました。');
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks).toString('utf8');
  } finally { await reader.cancel().catch(() => {}); }
}

/** Shared request scheduler: every hop, robots lookup, fallback and API call spends budget. */
export function createLinkChecker(options = {}) {
  const fetcher = options.fetch ?? globalThis.fetch;
  const lookup = options.lookup ?? dnsLookup;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const concurrency = integer(options.concurrency, 4, 1, 16, '同時に確認する件数');
  const hostDelayMs = integer(options.hostDelayMs, 1000, 0, 60000, '同じサイトへの待ち時間');
  const timeoutMs = integer(options.timeoutMs, 15000, 1, 60000, '応答の待ち時間');
  const requestBudget = integer(options.requestBudget, 5000, 0, 1000000, '通信回数の上限');
  const maxRunMs = integer(options.maxRunMs, 15 * 60000, 1, 24 * 60 * 60000, '全体の待ち時間');
  const deadline = now() + maxRunMs;
  const hosts = new Map();
  const robots = new Map();
  const addresses = new Map();
  const waiters = [];
  let active = 0;
  let used = 0;

  function hostFor(url) {
    const hostname = new URL(url).hostname;
    if (!hosts.has(hostname)) hosts.set(hostname, { tail: Promise.resolve(), nextAt: 0, delayMs: hostDelayMs });
    return hosts.get(hostname);
  }

  async function addressAllowed(url) {
    const hostname = new URL(url).hostname.replace(/^\[|\]$/g, '');
    if (!addresses.has(hostname)) addresses.set(hostname, (async () => {
      const result = await lookup(hostname, { all: true, verbatim: true });
      const rows = Array.isArray(result) ? result : [result];
      return rows.length > 0 && rows.every(row => publicAddress(row.address));
    })());
    if (!await addresses.get(hostname)) throw new Denied('private-address');
  }

  async function network(url, method = 'GET', body = null) {
    if (!publicUrl(url)) throw new Denied('unsafe-url');
    const host = hostFor(url);
    const previous = host.tail;
    let releaseHost;
    host.tail = new Promise(resolve => { releaseHost = resolve; });
    await previous;
    let acquired = false;
    let timer;
    const controller = new AbortController();
    try {
      if (used >= requestBudget || now() >= deadline) throw new Deferred('budget');
      const wait = Math.max(0, host.nextAt - now());
      if (now() + wait >= deadline) throw new Deferred('time-budget');
      if (wait) await sleep(wait);
      // Reserve the global slot before waking the next waiter.
      if (active >= concurrency) await new Promise(resolve => waiters.push(resolve));
      else active++;
      acquired = true;
      if (used >= requestBudget || now() >= deadline) throw new Deferred('budget');
      const operation = (async () => {
        await addressAllowed(url);
        if (controller.signal.aborted) throw new Error('timeout');
        if (used >= requestBudget || now() >= deadline) throw new Deferred('budget');
        used++;
        host.nextAt = now() + host.delayMs;
        const response = await fetcher(url, { method, redirect: 'manual', signal: controller.signal,
          headers: { 'User-Agent': USER_AGENT, Accept: body === 'json' ? 'application/json' : '*/*',
            ...(method === 'GET' && body === null ? { Range: 'bytes=0-1023' } : {}) } });
        const status = response.status;
        const headers = response.headers;
        const retry = headers.get('retry-after');
        if (status === 429 || status === 503 && retry) {
          const delay = /^\d+$/.test(retry ?? '') ? Number(retry) * 1000 : Date.parse(retry) - now();
          host.nextAt = Math.max(host.nextAt, now() + (Number.isFinite(delay) ? Math.max(0, delay) : 60000));
        }
        let text = null;
        if (body && status >= 200 && status < 300) text = await readBounded(response, body === 'robots' ? 512000 : 2 * 1024 * 1024);
        else await response.body?.cancel(); // Do not consume GET bodies (including weight/binary URLs).
        return { status, headers, text };
      })();
      return await Promise.race([operation, new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, Math.min(timeoutMs, Math.max(1, deadline - now())));
      })]);
    } finally {
      clearTimeout(timer);
      if (acquired) {
        const next = waiters.shift();
        if (next) next();
        else active--;
      }
      releaseHost();
    }
  }

  async function robotsPolicy(url) {
    const origin = new URL(url).origin;
    if (!robots.has(origin)) robots.set(origin, (async () => {
      try {
        const result = await follow(`${origin}/robots.txt`, 'GET', 'robots', false);
        // Conservative on 401/403/429 and unavailable robots; never treat those as permission.
        if (result.status >= 200 && result.status < 300) {
          const policy = parseRobots(result.text ?? '');
          hostFor(url).delayMs = Math.max(hostFor(url).delayMs, policy.delayMs);
          hostFor(url).nextAt = Math.max(hostFor(url).nextAt, now() + policy.delayMs);
          return { ...policy, source: `${origin}/robots.txt` };
        }
        if (result.status >= 400 && result.status < 500 && ![401, 403, 429].includes(result.status)) {
          return { allowed: () => true, source: `${origin}/robots.txt` };
        }
        return { allowed: () => false, reason: 'robots-unavailable', source: `${origin}/robots.txt` };
      } catch (error) {
        if (error instanceof Deferred) { robots.delete(origin); throw error; }
        return { allowed: () => false, reason: error.reason ?? 'robots-unavailable', source: `${origin}/robots.txt` };
      }
    })());
    return robots.get(origin);
  }

  async function follow(start, method, body, respectRobots = true, redirects = []) {
    let url = start;
    const seen = new Set();
    for (let hop = 0; hop <= 8; hop++) {
      if (!publicUrl(url)) throw new Denied('unsafe-url');
      if (seen.has(url)) throw new Error('redirect-loop');
      seen.add(url);
      if (respectRobots) {
        const policy = await robotsPolicy(url);
        if (!policy.allowed(url)) throw new Denied(policy.reason ?? 'robots-disallowed');
      }
      const result = await network(url, method, body);
      if (!REDIRECTS.has(result.status)) return { ...result, finalUrl: url, redirects };
      const location = result.headers.get('location');
      if (!location) throw new Error('redirect-without-location');
      const next = new URL(location, url).href;
      redirects.push({ from: url, to: next, status: result.status, method });
      url = publicUrl(next);
      if (!url) throw new Denied('unsafe-redirect');
      // All requests are HEAD/GET; 303 keeps HEAD as HEAD per HTTP semantics.
    }
    throw new Error('too-many-redirects');
  }

  function stateFor(status, redirects) {
    if (status >= 200 && status < 300) return redirects.length ? 'redirected' : 'ok';
    if ([404, 410].includes(status)) return 'gone';
    if ([401, 403, 429].includes(status)) return 'blocked';
    return 'failing';
  }

  async function requestJson(url) {
    const result = await follow(url, 'GET', 'json');
    if (result.status < 200 || result.status >= 300) {
      const error = new Error('api-unavailable');
      error.status = result.status;
      throw error;
    }
    return { data: JSON.parse(result.text), next: /<([^>]+)>;\s*rel="next"/.exec(result.headers.get('link') ?? '')?.[1] ?? null };
  }

  async function checkLink(value, previous = {}) {
    const url = publicUrl(typeof value === 'string' ? value : value?.url);
    if (!url) return null;
    const redirects = [];
    const attempts = [];
    let result;
    try {
      try {
        result = await follow(url, 'HEAD', null, true, redirects);
        attempts.push({ method: 'HEAD', status: result.status });
      } catch (error) {
        if (error instanceof Denied || error instanceof Deferred) throw error;
        attempts.push({ method: 'HEAD', error: 'network-or-timeout' });
      }
      // Some hosts reject HEAD or report a false 404; verify failures using a bounded GET.
      if (!result || result.status >= 400 && result.status !== 429) {
        result = await follow(url, 'GET', null, true, redirects);
        attempts.push({ method: 'GET', status: result.status });
      }
      result = { state: stateFor(result.status, redirects), status: result.status,
        finalUrl: result.finalUrl, reason: null };
    } catch (error) {
      if (error instanceof Deferred) return null; // Do not advance/check-date an uncompleted request.
      result = { state: error instanceof Denied ? 'blocked' : 'failing', status: null,
        finalUrl: redirects.at(-1)?.to ?? url, reason: error.reason ?? (error.message === 'timeout' ? 'timeout' : 'network-or-response') };
    }
    const checkedAt = new Date(now()).toISOString();
    const healthy = ['ok', 'redirected'].includes(result.state);
    const output = { url, ...result, checkedAt, lastOkAt: healthy ? checkedAt : previous.lastOkAt ?? null,
      failureCount: (previous.failureCount ?? 0) + Number(result.state === 'failing'),
      consecutiveFailures: healthy ? 0 : (previous.consecutiveFailures ?? 0) + Number(result.state === 'failing'),
      redirects, attempts };
    const id = spaceId(url);
    if (id) {
      const api = `https://huggingface.co/api/spaces/${id}/runtime`;
      try {
        const { data } = await requestJson(api);
        if (typeof data.stage !== 'string' || !/^[A-Z_]+$/.test(data.stage)) throw new Error('runtime-invalid');
        output.runtime = { stage: data.stage, hardware: data.hardware?.current ?? null,
          requestedHardware: data.hardware?.requested ?? null, checkedAt: new Date(now()).toISOString(),
          state: 'ok', sources: [api] };
      } catch (error) {
        output.runtime = { stage: previous.runtime?.stage ?? null, hardware: previous.runtime?.hardware ?? null,
          requestedHardware: previous.runtime?.requestedHardware ?? null, checkedAt: previous.runtime?.checkedAt ?? null,
          attemptedAt: new Date(now()).toISOString(), state: error instanceof Deferred ? 'not-checked' : error instanceof Denied ? 'blocked'
            : error.status ? stateFor(error.status, []) : 'failing', sources: [api], stale: true };
      }
    }
    return output;
  }

  return { checkLink, requestJson, get requestsUsed() { return used; }, concurrency };
}

export async function checkLinks(links, options = {}) {
  const budget = integer(options.budget, 500, 0, 1000000, 'リンク件数の上限');
  const previous = options.previous?.schema === STATUS_SCHEMA ? options.previous : { links: {} };
  const urls = [...new Set(Array.from(links, value => publicUrl(typeof value === 'string' ? value : value?.url)).filter(Boolean))];
  const entries = Object.create(null);
  for (const url of urls) if (Object.hasOwn(previous.links ?? {}, url)) entries[url] = previous.links[url];
  urls.sort((a, b) => (entries[a]?.checkedAt ?? '').localeCompare(entries[b]?.checkedAt ?? '') || a.localeCompare(b));
  const selected = urls.slice(0, budget);
  const checker = options.checker ?? createLinkChecker(options);
  let index = 0;
  let checked = 0;
  await Promise.all(Array.from({ length: Math.min(checker.concurrency, selected.length) }, async () => {
    while (index < selected.length) {
      const url = selected[index++];
      const result = await checker.checkLink(url, entries[url]);
      if (result) { entries[url] = result; checked++; }
    }
  }));
  return { schema: STATUS_SCHEMA, generatedAt: new Date((options.now ?? Date.now)()).toISOString(),
    total: urls.length, checked, requests: checker.requestsUsed,
    rotation: { strategy: 'oldest-first', linkBudget: budget, selected: selected.length,
      deferred: selected.length - checked, daysAtLinkBudget: budget ? Math.ceil(urls.length / budget) : null },
    links: entries };
}
