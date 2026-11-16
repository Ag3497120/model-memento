import { setTimeout as sleep } from 'node:timers/promises';
import { githubRepo, osiLicense, packageName } from './classifier.js';

export const registryPolicies = {
  github: {
    terms: 'https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#h-api-terms',
    api: 'https://docs.github.com/en/rest/search/search#search-repositories',
    rateLimit: 'https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api',
  },
  npm: {
    terms: 'https://docs.npmjs.com/policies/open-source-terms/',
    api: 'https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md',
    rateLimit: 'unverified',
  },
  pypi: {
    terms: 'https://policies.python.org/pypi.org/Acceptable-Use-Policy/',
    api: 'https://docs.pypi.org/api/feeds/',
    rateLimit: 'https://docs.pypi.org/api/#rate-limiting',
  },
};

export function requester(fetch, budget, state, now, warnings) {
  const options = typeof budget === 'number' ? { maxRequests: budget } : budget ?? {};
  const limit = Number.isFinite(options.maxRequests) ? Math.max(0, Math.floor(options.maxRequests)) : 20;
  const stats = { total: 0, github: 0, npm: 0, pypi: 0 };
  state.lastRequestAt ??= {};
  const last = state.lastRequestAt;
  state.backoff ??= {};
  const available = registry => stats.total < limit
    && stats[registry] < (options.perRegistry?.[registry] ?? limit)
    && !(Date.parse(state.backoff[registry]) > now.getTime());
  async function get(registry, url, { xml = false } = {}) {
    if (!available(registry)) return { deferred: true };
    // Below the unauthenticated GitHub search limit (10/minute), serial everywhere.
    const interval = registry === 'github' ? 6100 : 1000;
    const clock = () => options.now ? now.getTime() : Date.now();
    if (last[registry]) await (options.sleep ?? sleep)(Math.max(0, interval - (clock() - last[registry])));
    last[registry] = clock();
    stats.total++; stats[registry]++;
    try {
      const response = await fetch(url, {
        redirect: 'error', signal: AbortSignal.timeout(20000),
        headers: { 'user-agent': 'model-memento-world-tools/1.0',
          accept: xml ? 'application/rss+xml, application/xml' : 'application/json',
          ...(registry === 'github' ? { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' } : {}),
        },
      });
      const remaining = response.headers?.get('x-ratelimit-remaining');
      const limited = response.status === 429 || (response.status === 403 && registry === 'github');
      if (limited || remaining === '0') {
        const retry = response.headers?.get('retry-after');
        const reset = Number(response.headers?.get('x-ratelimit-reset')) * 1000;
        const waitUntil = /^\d+$/.test(retry ?? '') ? clock() + Number(retry) * 1000 : Date.parse(retry);
        state.backoff[registry] = new Date(Math.max(clock() + 60000, waitUntil || 0, reset || 0)).toISOString();
      }
      if (!response.ok) {
        warnings.push({ registry, url, status: response.status, message: '取得できませんでした。後で再確認します。' });
        return { error: true, retry: response.status !== 404 && response.status !== 410 };
      }
      const body = await response.text();
      if (body.length > 16 * 1024 * 1024) throw new Error('size');
      return { data: xml ? body : JSON.parse(body) };
    } catch {
      warnings.push({ registry, url, status: null, message: '通信または応答の形式を確認できませんでした。' });
      return { error: true, retry: true };
    }
  }
  return { get, available, stats, options };
}

export const isoDate = value => {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
};
export const majorVersion = value => {
  // Accept namespaced release tags; do not infer majors from calendar dates or hashes.
  const match = /^(?:[a-z@][a-z0-9_./@-]*[-/@])?v?(\d{1,3})\.\d+(?:\.\d+)?(?:\+[^\s]+)?$/i.exec(value ?? '');
  return match ? Number(match[1]) : null;
};
// Stable subset of https://packaging.python.org/en/latest/specifications/version-specifiers/
function stableKey(value) {
  const match = /^(?:(\d+)!)?v?(\d+(?:\.\d+)*)(?:(?:[-_.]?(?:post|rev|r)|-)(\d+))?(?:\+([a-z0-9]+(?:[-_.][a-z0-9]+)*))?$/i.exec(value ?? '');
  return match ? { epoch: Number(match[1] ?? 0), release: match[2].split('.').map(Number),
    post: Number(match[3] ?? -1), local: match[4]?.toLowerCase().split(/[-_.]/) ?? [] } : null;
}
export const stableVersion = value => stableKey(value) !== null;

function compareVersions(a, b) {
  const x = stableKey(a); const y = stableKey(b);
  if (x.epoch !== y.epoch) return x.epoch - y.epoch;
  for (let i = 0; i < Math.max(x.release.length, y.release.length); i++) {
    if ((x.release[i] ?? 0) !== (y.release[i] ?? 0)) return (x.release[i] ?? 0) - (y.release[i] ?? 0);
  }
  if (x.post !== y.post) return x.post - y.post;
  for (let i = 0; i < Math.max(x.local.length, y.local.length); i++) {
    const left = x.local[i]; const right = y.local[i];
    if (left === right) continue;
    if (left === undefined || right === undefined) return left === undefined ? -1 : 1;
    const ln = /^\d+$/.test(left); const rn = /^\d+$/.test(right);
    if (ln && rn) {
      if (Number(left) !== Number(right)) return Number(left) - Number(right);
      continue;
    }
    if (ln !== rn) return ln ? 1 : -1;
    return left < right ? -1 : 1;
  }
  return 0;
}

export function githubRelease(releases, repo) {
  if (!Array.isArray(releases)) throw new TypeError('releases');
  const latest = releases.filter(r => !r.draft && !r.prerelease && typeof r.tag_name === 'string' && isoDate(r.published_at))
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))[0];
  return latest ? { version: latest.tag_name, date: isoDate(latest.published_at),
    url: `https://github.com/${repo}/releases/tag/${encodeURIComponent(latest.tag_name)}` } : null;
}

export function npmRecord(data, requestedName) {
  const name = packageName('npm', data?.name);
  if (!name || name !== requestedName || typeof data['dist-tags']?.latest !== 'string') throw new TypeError('npm');
  const version = data['dist-tags'].latest;
  const meta = data.versions?.[version];
  if (!meta) throw new TypeError('npm-version');
  const repo = githubRepo(typeof meta.repository === 'string' ? meta.repository : meta.repository?.url);
  return { name, repo, license: osiLicense(meta.license), stars: null,
    evidence: { name, description: meta.description ?? data.description, keywords: meta.keywords ?? data.keywords },
    latest: { version, date: isoDate(data.time?.[version]), url: `https://www.npmjs.com/package/${name}/v/${encodeURIComponent(version)}` } };
}

export function pypiRecord(data, requestedName) {
  const info = data?.info;
  const name = packageName('pypi', info?.name);
  if (!name || name !== requestedName || !data.releases || typeof data.releases !== 'object') throw new TypeError('pypi');
  const versions = Object.keys(data.releases).filter(stableVersion).filter(v => Array.isArray(data.releases[v]) && data.releases[v].some(f => f.yanked === false));
  const version = versions.sort(compareVersions).at(-1);
  if (!version) return null;
  const date = data.releases[version].filter(f => !f.yanked).map(f => isoDate(f.upload_time_iso_8601 ?? f.upload_time)).filter(Boolean).sort()[0] ?? null;
  const repo = Object.values(info.project_urls ?? {}).map(githubRepo).find(Boolean) ?? null;
  return { name: info.name, repo, license: osiLicense(info.license_expression) ?? osiLicense(info.license), stars: null,
    evidence: { name: info.name, summary: info.summary, keywords: info.keywords },
    latest: { version, date, url: `https://pypi.org/project/${name}/${encodeURIComponent(version)}/` } };
}

// Only read item links/date from the official RSS structure, never HTML or DTDs.
export function pypiCandidates(xml, since = null) {
  if (typeof xml !== 'string' || /<!DOCTYPE|<!ENTITY/i.test(xml) || !/<rss\b/i.test(xml)) throw new TypeError('rss');
  const result = [];
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)) {
    const link = /<link>\s*(https:\/\/pypi\.org\/project\/([a-z0-9._-]+)\/)\s*<\/link>/i.exec(match[1]);
    const date = isoDate(/<pubDate>([^<]+)<\/pubDate>/.exec(match[1])?.[1]);
    if (!link || (since && date && date < since)) continue;
    const name = packageName('pypi', link[2]);
    if (/(?:^|[-_.])(ai|agent|agents|llm|mcp|harness|chatbot|chat|copilot)(?:[-_.]|$)/i.test(name)) result.push({ name, date });
  }
  return result.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}
