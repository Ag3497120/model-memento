import test from 'node:test';
import assert from 'node:assert/strict';
import { checkLinks, createLinkChecker, STATUS_SCHEMA } from '../../lib/links/check.js';
import { parseRobots } from '../../lib/links/robots.js';
import { publicAddress, publicUrl } from '../../lib/links/urls.js';

const at = Date.parse('2026-11-15T00:00:00Z');
const origin = 'https://example.org';
const lookup = async () => [{ address: '93.184.216.34' }];
function fixture(routes, extra = {}) {
  const calls = [];
  const checker = createLinkChecker({ lookup, now: () => at, hostDelayMs: 0, ...extra,
    fetch: async (url, init) => {
      calls.push({ url, method: init.method, redirect: init.redirect });
      const value = routes[`${init.method} ${url}`] ?? (url.endsWith('/robots.txt') ? [200, 'User-agent: *\nAllow: /'] : null);
      if (!value) throw new Error(`Unexpected request ${init.method} ${url}`);
      if (typeof value === 'function') return value(url, init);
      return new Response(value[1] ?? null, { status: value[0], headers: value[2] });
    } });
  return { checker, calls };
}

test('HEAD success, verified GET fallback, redirects and last-ok date', async () => {
  const { checker, calls } = fixture({
    [`HEAD ${origin}/old`]: [301, null, { location: '/new' }],
    [`HEAD ${origin}/new`]: [405], [`GET ${origin}/old`]: [302, null, { location: '/new' }],
    [`GET ${origin}/new`]: [200],
  });
  const result = await checker.checkLink(origin + '/old');
  assert.equal(result.state, 'redirected');
  assert.equal(result.finalUrl, origin + '/new');
  assert.equal(result.lastOkAt, '2026-11-15T00:00:00.000Z');
  assert.equal(result.redirects.length, 2);
  assert.equal(result.redirects[0].status, 301);
  assert.equal(calls.filter(row => row.url.endsWith('robots.txt')).length, 1);
  assert.ok(calls.every(row => row.redirect === 'manual'));
});

test('404/410 are gone only after GET; 403/429 blocked; 5xx counted and last-ok preserved', async () => {
  for (const [status, state] of [[404, 'gone'], [410, 'gone'], [403, 'blocked'], [429, 'blocked'], [503, 'failing']]) {
    const { checker, calls } = fixture({ [`HEAD ${origin}/x`]: [status], [`GET ${origin}/x`]: [status] });
    const result = await checker.checkLink(origin + '/x', { lastOkAt: '2026-10-01T00:00:00Z', failureCount: 2, consecutiveFailures: 1 });
    assert.equal(result.state, state);
    assert.equal(result.lastOkAt, '2026-10-01T00:00:00Z');
    assert.equal(result.failureCount, status === 503 ? 3 : 2);
    assert.equal(result.consecutiveFailures, status === 503 ? 2 : 1);
    assert.equal(calls.filter(row => row.url.endsWith('/x')).length, status === 429 ? 1 : 2);
  }
  const { checker } = fixture({ [`HEAD ${origin}/x`]: [404], [`GET ${origin}/x`]: [200] });
  assert.equal((await checker.checkLink(origin + '/x')).state, 'ok');
});

test('timeouts are failing, counted, and do not erase a previous success', async () => {
  const hang = () => new Promise(() => {});
  const { checker } = fixture({ [`HEAD ${origin}/slow`]: hang, [`GET ${origin}/slow`]: hang }, { timeoutMs: 5 });
  const result = await checker.checkLink(origin + '/slow', { lastOkAt: '2026-10-01T00:00:00Z' });
  assert.equal(result.state, 'failing');
  assert.equal(result.reason, 'timeout');
  assert.equal(result.failureCount, 1);
  assert.equal(result.lastOkAt, '2026-10-01T00:00:00Z');
});

test('robots longest rule, allow ties, specific user agent, percent encoding, wildcard and end anchor', () => {
  const policy = parseRobots('User-agent: *\nDisallow: /\nUser-agent: modelmementolinks\nDisallow: /private\nAllow: /private/open\nDisallow: /*.zip$\nAllow: /same\nDisallow: /same\nDisallow: /caf%C3%A9\nDisallow: /%7Esecret\nCrawl-delay: 2\n');
  assert.equal(policy.allowed(origin + '/'), true);
  assert.equal(policy.allowed(origin + '/private/no'), false);
  assert.equal(policy.allowed(origin + '/private/open'), true);
  assert.equal(policy.allowed(origin + '/a.zip'), false);
  assert.equal(policy.allowed(origin + '/a.zip?readme=1'), true);
  assert.equal(policy.allowed(origin + '/same'), true);
  assert.equal(policy.allowed(origin + '/café'), false);
  assert.equal(policy.allowed(origin + '/~secret'), false);
  assert.equal(policy.delayMs, 2000);
  assert.equal(parseRobots('User-agent: *\nDisallow:').allowed(origin), true);
});

test('robots disallow/unavailability stops probes, including cross-host redirects', async () => {
  const { checker, calls } = fixture({ [`GET ${origin}/robots.txt`]: [200, 'User-agent: *\nDisallow: /private'],
    [`HEAD ${origin}/old`]: [302, null, { location: 'https://other.example.org/private' }],
    'GET https://other.example.org/robots.txt': [200, 'User-agent: *\nDisallow: /private'] });
  assert.equal((await checker.checkLink(origin + '/private')).state, 'blocked');
  const result = await checker.checkLink(origin + '/old');
  assert.equal(result.reason, 'robots-disallowed');
  assert.equal(result.redirects.length, 1);
  assert.ok(!calls.some(row => row.url.endsWith('/private')));
  for (const code of [403, 429, 503]) {
    const f = fixture({ [`GET ${origin}/robots.txt`]: [code] });
    assert.equal((await f.checker.checkLink(origin + '/x')).reason, 'robots-unavailable');
    assert.equal(f.calls.length, 1);
  }
});

test('private URLs, DNS results and redirect targets are never fetched', async () => {
  assert.equal(publicUrl('http://127.0.0.1/a'), null);
  assert.equal(publicUrl('http://169.254.169.254/'), null);
  assert.equal(publicUrl('https://name:secret@example.org/'), null);
  assert.equal(publicUrl('file:///etc/passwd'), null);
  assert.equal(publicAddress('::1'), false);
  assert.equal(publicAddress('::ffff:127.0.0.1'), false);
  const denied = fixture({}, { lookup: async () => [{ address: '10.0.0.1' }] });
  assert.equal((await denied.checker.checkLink(origin)).state, 'blocked');
  assert.equal(denied.calls.length, 0);
  const redirect = fixture({ [`HEAD ${origin}/x`]: [302, null, { location: 'http://127.0.0.1/secrets' }] });
  assert.equal((await redirect.checker.checkLink(origin + '/x')).reason, 'unsafe-redirect');
  assert.equal(redirect.calls.length, 2);
});

test('strict HTTP request budget and oldest-first rotation cover all finite inventory', async () => {
  let previous;
  const observed = new Set();
  const links = ['a', 'b', 'c', 'd', 'e'].map(id => `${origin}/${id}`);
  for (let day = 0; day < 3; day++) {
    const f = fixture(Object.fromEntries(links.map(url => [`HEAD ${url}`, [200]])));
    previous = await checkLinks(links, { checker: f.checker, previous, budget: 2, now: () => at + day * 86400000 });
    f.calls.filter(row => row.method === 'HEAD').forEach(row => observed.add(row.url));
    assert.equal(previous.rotation.daysAtLinkBudget, 3);
  }
  assert.equal(observed.size, 5);
  const f = fixture(Object.fromEntries(links.map(url => [`HEAD ${url}`, [200]])), { requestBudget: 2 });
  const result = await checkLinks(links, { checker: f.checker, budget: 5 });
  assert.equal(result.requests, 2);
  assert.equal(result.checked, 1);
  assert.equal(result.rotation.deferred, 4);
  assert.equal(Object.keys(result.links).length, 1);
});

test('Spaces runtime stage is separate from the page availability, and stale state is explicit', async () => {
  const url = 'https://huggingface.co/spaces/demo/live';
  const api = 'https://huggingface.co/api/spaces/demo/live/runtime';
  const f = fixture({ [`HEAD ${url}`]: [200], [`GET ${api}`]: [200, JSON.stringify({ stage: 'BUILD_ERROR', hardware: { current: 'cpu-basic' } })] });
  const result = await f.checker.checkLink(url);
  assert.equal(result.state, 'ok');
  assert.equal(result.runtime.stage, 'BUILD_ERROR');
  assert.equal(result.runtime.hardware, 'cpu-basic');
  const blocked = fixture({ [`HEAD ${url}`]: [200], [`GET ${api}`]: [403] });
  const newer = await blocked.checker.checkLink(url, result);
  assert.equal(newer.runtime.stage, 'BUILD_ERROR');
  assert.equal(newer.runtime.state, 'blocked');
  assert.equal(newer.runtime.stale, true);
});

test('scheduler caps concurrency, serializes each host and obeys crawl-delay', async () => {
  let clock = at;
  let active = 0;
  let maxActive = 0;
  const hosts = new Set();
  const seen = [];
  const checker = createLinkChecker({ lookup, concurrency: 2, now: () => clock, hostDelayMs: 100,
    sleep: async ms => { clock += ms; }, fetch: async (url, init) => {
      const host = new URL(url).hostname;
      assert.ok(!hosts.has(host));
      hosts.add(host); active++; maxActive = Math.max(active, maxActive);
      seen.push({ host, at: clock, method: init.method });
      await new Promise(resolve => setImmediate(resolve));
      active--; hosts.delete(host);
      return new Response(url.endsWith('robots.txt') ? 'User-agent: *\nCrawl-delay: 2' : null);
    } });
  const links = ['https://a.example.org/1', 'https://a.example.org/2', 'https://b.example.org/1', 'https://c.example.org/1'];
  await checkLinks(links, { checker, budget: 4 });
  assert.ok(maxActive <= 2);
  assert.ok(maxActive >= 2);
  for (const host of ['a.example.org', 'b.example.org', 'c.example.org']) {
    const rows = seen.filter(row => row.host === host);
    for (let i = 1; i < rows.length; i++) assert.ok(rows[i].at - rows[i - 1].at >= 2000);
  }
});

test('missing prior schema is ignored and budget zero performs no requests', async () => {
  const f = fixture({});
  const result = await checkLinks([origin, origin + '#x'], { checker: f.checker, budget: 0, previous: { links: {} } });
  assert.equal(result.schema, STATUS_SCHEMA);
  assert.equal(result.total, 1);
  assert.equal(result.checked, 0);
  assert.equal(f.calls.length, 0);
});

test('concurrent DNS lookups cannot overspend the shared request budget', async () => {
  let requests = 0;
  const checker = createLinkChecker({ concurrency: 4, hostDelayMs: 0, requestBudget: 1,
    lookup: async () => { await new Promise(resolve => setImmediate(resolve)); return [{ address: '93.184.216.34' }]; },
    fetch: async () => { requests++; return new Response('User-agent: *\nAllow: /'); } });
  const result = await checkLinks(['https://a.example.org/a', 'https://b.example.org/b', 'https://c.example.org/c'], { checker, budget: 3 });
  assert.equal(requests, 1);
  assert.equal(result.requests, 1);
  assert.equal(result.checked, 0);
  assert.equal(result.rotation.deferred, 3);
});

test('Retry-After and crawl delays yield to the run deadline without marking uncompleted links checked', async () => {
  let clock = at;
  const waits = [];
  const checker = createLinkChecker({ lookup, hostDelayMs: 0, maxRunMs: 1000, now: () => clock,
    sleep: async ms => { waits.push(ms); clock += ms; }, fetch: async url => {
      if (url.endsWith('/robots.txt')) return new Response('User-agent: *\nAllow: /');
      return new Response(null, { status: 503, headers: { 'Retry-After': '5' } });
    } });
  const result = await checker.checkLink(origin + '/busy');
  assert.equal(result, null);
  assert.deepEqual(waits, []);
  assert.equal(checker.requestsUsed, 2);
});

test('normal GET bodies are canceled rather than downloaded and robots allow rules merge across groups', async () => {
  let canceled = false;
  const checker = createLinkChecker({ lookup, hostDelayMs: 0, fetch: async (url, init) => {
    if (url.endsWith('/robots.txt')) return new Response('User-agent: *\nDisallow: /no\nUser-agent: *\nAllow: /no/yes');
    if (init.method === 'HEAD') return new Response(null, { status: 405 });
    assert.equal(init.headers.Range, 'bytes=0-1023');
    return new Response(new ReadableStream({ cancel() { canceled = true; } }));
  } });
  assert.equal((await checker.checkLink(origin + '/no/yes')).state, 'ok');
  assert.equal(canceled, true);
  assert.equal((await checker.checkLink(origin + '/no/other')).state, 'blocked');
});
