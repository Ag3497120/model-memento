import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { discoverTools, loadTrackedTools, toolArtifacts } from '../../lib/world/tools/index.js';
import { adapterMetadata } from '../../lib/world/tools/tracked.js';
import { classifyRepository, classifyTool, githubRepo, osiLicense } from '../../lib/world/tools/classifier.js';
import { githubRelease, majorVersion, npmRecord, pypiCandidates, pypiRecord, requester } from '../../lib/world/tools/registry.js';

const fixture = async name => JSON.parse(await readFile(new URL(`./fixtures/tools/${name}.json`, import.meta.url), 'utf8'));
const today = '2026-11-15';
const budget = (maxRequests = 40, extra = {}) => ({ maxRequests, now: `${today}T14:00:00Z`, sleep: async () => {}, ...extra });
const repo = (name = 'lab/agent', extra = {}) => ({ name: name.split('/')[1], full_name: name, fork: false, archived: false,
  stargazers_count: 200, topics: ['coding-agent'], license: { spdx_id: 'MIT' }, ...extra });
const release = (version = 'v1.2.0', date = '2026-11-15T10:00:00Z') => ({ tag_name: version, published_at: date, draft: false, prerelease: false });
function pack(name = 'memento-test-agent', version = '1.2.0', extra = {}) {
  return { name, 'dist-tags': { latest: version, next: '9.0.0-rc.1' },
    time: { [version]: '2026-11-15T10:00:00Z' },
    versions: { [version]: { name, version, license: 'MIT', keywords: ['coding-agent'], ...extra } } };
}
const emptyRSS = '<rss><channel></channel></rss>';
function network(handler) {
  const urls = [];
  const fetch = async (url, options) => {
    urls.push(url);
    assert.equal(options.redirect, 'error');
    const response = await handler(new URL(url), options);
    if (response instanceof Response) return response;
    return new Response(typeof response === 'string' ? response : JSON.stringify(response), { status: 200 });
  };
  return { fetch, urls };
}
const emptySearch = url => url.hostname === 'api.github.com' ? { total_count: 0, items: [] }
  : url.hostname === 'registry.npmjs.org' ? { total: 0, objects: [] } : emptyRSS;

test('classifier requires a tool function; noise cannot pass just by saying AI/MCP', () => {
  const rejected = [
    { name: 'stock-api', description: 'Stock quote API for AI agents and MCP' },
    { name: 'tidb', description: 'Database for agentic workloads' },
    { name: 'awesome-coding-agent', topics: ['coding-agent'] },
    { name: 'agent-tutorial', description: 'AI agent framework tutorial' },
    { name: 'generic-cli', language: 'Rust', description: 'Command line HTTP client' },
    { name: 'crawler', description: 'Web scraping framework' },
    { name: 'sdk', keywords: ['mcp'], description: 'MCP client SDK' },
    { name: 'prompt-library', description: 'Collection of resources for coding agents' },
  ];
  for (const item of rejected) assert.equal(classifyTool(item).accepted, false, item.name);
  for (const [item, kind] of [
    [{ name: 'tool', topics: ['coding-agent'] }, 'coding-agent'],
    [{ name: 'tool', description: 'AI editor for code' }, 'ai-editor'],
    [{ name: 'tool', description: 'LLM agent harness' }, 'harness'],
    [{ name: 'tool', description: 'AI chat interface' }, 'chat-app'],
    [{ name: 'tool', keywords: ['mcp-server'] }, 'mcp-server'],
    [{ name: 'tool', description: 'LLM agents framework' }, 'agent-framework'],
    [{ name: 'tool', description: 'Agent engineering platform' }, 'agent-framework'],
  ]) assert.equal(classifyTool(item).kind, kind);
});

test('repository star, OSI, fork, archive gates are enforced locally', () => {
  assert.equal(classifyRepository(repo()).accepted, true);
  for (const [extra, reason] of [[{ fork: true }, 'fork'], [{ archived: true }, 'archived'],
    [{ stargazers_count: 99 }, 'stars'], [{ license: null }, 'license-unverified'],
    [{ license: { spdx_id: 'BUSL-1.1' } }, 'license-unverified']]) {
    assert.equal(classifyRepository(repo('lab/agent', extra)).reason, reason);
  }
  assert.equal(osiLicense('MIT'), 'MIT');
  assert.equal(osiLicense('MIT OR LicenseRef-custom'), null);
  assert.equal(githubRepo('git+https://github.com/lab/agent.git'), 'lab/agent');
  assert.equal(githubRepo('https://evil.example/lab/agent'), null);
  assert.equal(githubRepo('../agent'), null);
});

test('trimmed live samples parse without retaining descriptions or release prose', async () => {
  const search = await fixture('github-search');
  assert.ok(search.items.some(item => classifyRepository(item).accepted));
  const gh = await fixture('github-repo');
  assert.equal(gh.full_name, 'Aider-AI/aider');
  const latest = githubRelease(await fixture('github-releases'), gh.full_name);
  assert.ok(latest.version && latest.url.startsWith('https://github.com/Aider-AI/aider/releases/tag/'));
  const npm = npmRecord(await fixture('npm-package'), '@modelcontextprotocol/sdk');
  assert.equal(npm.latest.version, '1.32.2');
  assert.equal(npm.repo, 'modelcontextprotocol/typescript-sdk');
  assert.equal(classifyTool(npm.evidence).accepted, false); // SDK, not a server.
  const pypi = pypiRecord(await fixture('pypi-package'), 'aider-chat');
  assert.equal(pypi.latest.version, '0.86.2');
  assert.equal(pypi.license, null);
  const rss = await readFile(new URL('./fixtures/tools/pypi-new.xml', import.meta.url), 'utf8');
  assert.deepEqual(pypiCandidates(rss, '2026-11-15T00:00:00Z').map(x => x.name), ['spiegel-mcp']);
  const provenance = await fixture('provenance');
  for (const host of ['api.github.com', 'registry.npmjs.org', 'pypi.org']) {
    assert.ok(provenance.requests.filter(r => new URL(r.url).hostname === host).length <= 20);
  }
});

test('PyPI stable highest version excludes prereleases, empty and entirely yanked releases', () => {
  const data = { info: { name: 'test_agent', version: '9.0.0rc1', license_expression: 'MIT' }, releases: {
    '1.9.0': [{ yanked: false, upload_time_iso_8601: '2026-11-13T00:00:00Z' }],
    '1.10.0': [{ yanked: false, upload_time_iso_8601: '2026-11-14T00:00:00Z' }],
    '2.0.0': [{ yanked: true }], '9.0.0rc1': [{ yanked: false }], '10.0.0': [],
  } };
  const result = pypiRecord(data, 'test-agent');
  assert.equal(result.latest.version, '1.10.0');
  assert.equal(result.latest.date, '2026-11-14T00:00:00.000Z');
  assert.equal(pypiRecord({ ...data, releases: {} }, 'test-agent'), null);
  assert.throws(() => pypiCandidates('<!DOCTYPE rss><rss/>'));
  const file = [{ yanked: false }];
  assert.equal(pypiRecord({ ...data, releases: { '1.0.post2': file, '1.0.post10': file, '1.0': file } }, 'test-agent').latest.version, '1.0.post10');
  assert.equal(pypiRecord({ ...data, releases: { '9.0': file, '1!1.0': file } }, 'test-agent').latest.version, '1!1.0');
  assert.equal(pypiRecord({ ...data, releases: { '1.0+vendor.9': file, '1.0+vendor.10': file, '1.0': file } }, 'test-agent').latest.version, '1.0+vendor.10');
});

test('GitHub releases choose latest published stable metadata, never release text', () => {
  const result = githubRelease([release('v2.0.0'), { ...release('v3.0.0'), prerelease: true },
    { ...release('v4.0.0'), draft: true }, release('v1.0.0', '2026-10-01T00:00:00Z')], 'lab/agent');
  assert.equal(result.version, 'v2.0.0');
  assert.equal(githubRelease([], 'lab/agent'), null);
  assert.equal(majorVersion('v2.3.4'), 2);
  assert.equal(majorVersion('2026.11.15'), null);
  assert.equal(majorVersion('2.0.0-rc.1'), null);
  assert.equal(majorVersion('rust-v2.3.4'), 2);
});

test('new GitHub tool: discovery, release, artifact and enrichment; no state mutation', async () => {
  const net = network(url => {
    if (url.pathname === '/search/repositories') return { total_count: 1, items: [repo()] };
    if (url.pathname === '/repos/lab/agent') return repo();
    if (url.pathname.endsWith('/releases')) return [release()];
    return emptySearch(url);
  });
  const state = {};
  const result = await discoverTools({ fetch: net.fetch, state, since: today, budget: budget(), tracked: [] });
  assert.deepEqual(state, {});
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].schema, 'memento.world-tool.v1');
  assert.equal(result.records[0].id, 'github:lab/agent');
  assert.equal(result.records[0].first_seen, today);
  assert.equal(result.records[0].license, 'MIT');
  assert.equal(result.queue.length, 1);
  assert.equal(result.queue[0].reason, 'new-tool');
  assert.equal(result.stats.total, net.urls.length);
  for (const url of net.urls.filter(u => u.includes('/search/repositories'))) {
    const query = new URL(url).searchParams;
    assert.equal(query.get('sort'), 'updated'); assert.equal(query.get('order'), 'desc');
    assert.match(query.get('q'), /stars:>=100.*fork:false.*archived:false.*pushed:>=2026-11-15/);
  }
  const files = toolArtifacts(result, { date: today, arrivals: [
    { schema: 'memento.world-model.v1', r: 'hf', id: 'lab/model' },
    { schema: 'memento.world-model.v1', r: 'ollama', id: 'lab/model' },
  ] });
  assert.equal(files[`new/${today}.json`].length, 3);
  assert.equal(files['data/enrich-queue.json'].length, 1);
  const merged = toolArtifacts(result, { date: today, arrivals: files[`new/${today}.json`], queue: result.queue });
  assert.equal(merged[`new/${today}.json`].length, 3);
  assert.equal(merged['data/enrich-queue.json'].length, 1);
  const repeat = await discoverTools({ fetch: net.fetch, state: result.state, since: today, budget: budget(), tracked: [] });
  assert.deepEqual(repeat.records, []); assert.deepEqual(repeat.queue, []); assert.equal(repeat.stats.total, 0);
  assert.doesNotMatch(JSON.stringify(result.state), /description|body|readme|avatar_url/);
});

test('bootstrapping a tool already in the catalog does not queue it as a new tool', async () => {
  const net = network(url => url.pathname === '/search/repositories' ? { total_count: 1, items: [repo()] }
    : url.pathname === '/repos/lab/agent' ? repo() : url.pathname.endsWith('/releases') ? [release()] : emptySearch(url));
  const result = await discoverTools({ fetch: net.fetch, budget: budget(), tracked: [], known: [{ repo: 'lab/agent' }] });
  assert.equal(result.records.length, 1); assert.equal(result.queue.length, 0);
});

test('npm keyword discovery verifies package metadata and dist-tags, with unknown stars null', async () => {
  const net = network(url => {
    if (url.hostname === 'registry.npmjs.org' && url.pathname === '/-/v1/search') {
      return { total: 2, objects: [{ package: { name: 'memento-test-agent', keywords: ['coding-agent'] } },
        { package: { name: 'stock-api', keywords: ['mcp-server'] } }] };
    }
    if (url.pathname === '/memento-test-agent') return pack();
    return emptySearch(url);
  });
  const result = await discoverTools({ fetch: net.fetch, budget: budget(), tracked: [] });
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].latest.version, '1.2.0');
  assert.equal(result.records[0].stars, null);
  assert.deepEqual(result.records[0].package, { registry: 'npm', name: 'memento-test-agent' });
  assert.equal(result.queue.length, 1);
  assert.equal(result.coverage.npm.newestFirst, false);
});

test('PyPI RSS keyword discovery uses JSON facts; since filters old candidates', async () => {
  const xml = '<rss><channel><item><link>https://pypi.org/project/test-agent/</link><pubDate>Sun, 15 Nov 2026 12:00:00 GMT</pubDate></item>'
    + '<item><link>https://pypi.org/project/old-agent/</link><pubDate>Sat, 14 Nov 2026 12:00:00 GMT</pubDate></item></channel></rss>';
  const net = network(url => {
    if (url.pathname === '/rss/packages.xml') return xml;
    if (url.pathname === '/pypi/test-agent/json') return { info: { name: 'test-agent', summary: 'LLM agents framework', license_expression: 'MIT' },
      releases: { '1.0.0': [{ yanked: false, upload_time_iso_8601: '2026-11-15T12:00:00Z' }] } };
    return emptySearch(url);
  });
  const result = await discoverTools({ fetch: net.fetch, since: today, budget: budget(), tracked: [] });
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].id, 'pypi:test-agent');
  assert.equal(result.records[0].kind, 'agent-framework');
  assert.equal(net.urls.some(url => url.includes('old-agent')), false);
  assert.equal(net.urls.filter(url => new URL(url).hostname === 'pypi.org')
    .some(url => url.includes('/search/') || url.includes('/pypi/') && !url.endsWith('/json')), false);
});

test('tracked tools bypass discovery license/stars gate and queue only a later major', async () => {
  let version = '1.0.0';
  const net = network(url => url.pathname === '/tracked-agent' ? pack('tracked-agent', version, { license: 'LicenseRef-proprietary', keywords: [] }) : emptySearch(url));
  const tracked = [{ id: 'known', name: 'Tracked', kind: 'cli', package: { registry: 'npm', name: 'tracked-agent' } }];
  const a = await discoverTools({ fetch: net.fetch, budget: budget(), tracked });
  assert.equal(a.records.length, 1); assert.equal(a.records[0].license, null); assert.equal(a.queue.length, 0);
  version = '1.2.0';
  const b = await discoverTools({ fetch: net.fetch, state: a.state, budget: budget(40, { now: '2026-11-16T14:00:00Z' }), tracked });
  assert.equal(b.records[0].latest.version, '1.2.0'); assert.equal(b.queue.length, 0);
  version = '2.0.0';
  const c = await discoverTools({ fetch: net.fetch, state: b.state, budget: budget(40, { now: '2026-11-17T14:00:00Z' }), tracked });
  assert.equal(c.records[0].first_seen, today); assert.equal(c.queue[0].reason, 'new-major-version');
  version = '1.0.0';
  const d = await discoverTools({ fetch: net.fetch, state: c.state, budget: budget(40, { now: '2026-11-18T14:00:00Z' }), tracked });
  assert.equal(d.queue.length, 0); // A rollback is not a new major.
});

test('tracked GitHub repo without releases has unknown version; later major is queued', async () => {
  let releases = [];
  const tracked = [{ id: 'known', name: 'Known', kind: 'cli', repo: 'lab/known' }];
  const net = network(url => url.pathname === '/repos/lab/known' ? repo('lab/known', { license: null, stargazers_count: 0 })
    : url.pathname === '/repos/lab/known/releases' ? releases : emptySearch(url));
  const a = await discoverTools({ fetch: net.fetch, budget: budget(), tracked });
  assert.equal(a.records[0].latest.version, null); assert.equal(a.records[0].latest.date, null);
  releases = [release('rust-v1.1.0')];
  const b = await discoverTools({ fetch: net.fetch, state: a.state, budget: budget(40, { now: '2026-11-16T14:00:00Z' }), tracked });
  assert.equal(b.records[0].latest.version, 'rust-v1.1.0'); assert.equal(b.queue.length, 0);
  releases = [release('rust-v2.0.0')];
  const c = await discoverTools({ fetch: net.fetch, state: b.state, budget: budget(40, { now: '2026-11-17T14:00:00Z' }), tracked });
  assert.equal(c.queue[0].reason, 'new-major-version');
});

test('npm pages resume with an offset and package repo links deduplicate tool identities', async () => {
  const net = network(url => {
    if (url.pathname === '/search/repositories') return { total_count: 1, items: [repo()] };
    if (url.pathname === '/repos/lab/agent') return repo();
    if (url.pathname.endsWith('/releases')) return [release()];
    if (url.pathname === '/-/v1/search') return { total: 101, objects: [{ package: { name: 'memento-test-agent', keywords: ['coding-agent'] } }] };
    if (url.pathname === '/memento-test-agent') return pack('memento-test-agent', '1.2.0', { repository: { url: 'git+https://github.com/lab/agent.git' } });
    return emptySearch(url);
  });
  const a = await discoverTools({ fetch: net.fetch, budget: budget(), tracked: [] });
  assert.ok(net.urls.some(url => new URL(url).searchParams.get('from') === '100'));
  assert.equal(Object.keys(a.state.tools).length, 1);
  assert.equal(a.records.length, 1);
  assert.equal(a.queue.filter(q => q.reason === 'new-tool').length, 1);
  const entry = Object.values(a.state.tools)[0];
  assert.equal(entry.endpoints.github, 'lab/agent'); assert.equal(entry.endpoints.npm, 'memento-test-agent');
});

test('untrackable tools and truncated GitHub searches report uncertainty explicitly', async () => {
  const net = network(url => url.pathname === '/search/repositories' ? { total_count: 0, items: [], incomplete_results: true } : emptySearch(url));
  const result = await discoverTools({ fetch: net.fetch, budget: budget(), tracked: [{ id: 'no-endpoint', name: 'Unknown' }] });
  assert.equal(result.coverage.unverified[0].status, 'unverified');
  assert.equal(result.coverage.github.complete, false);
  assert.ok(result.warnings.some(w => w.registry === 'github'));
});

test('new package evidence cannot use a search keyword to override missing licensing or an unrelated exact package', async () => {
  for (const extra of [{ license: 'BUSL-1.1' }, { description: 'Stock quote API', license: 'MIT' }]) {
    const net = network(url => url.pathname === '/-/v1/search'
      ? { total: 1, objects: [{ package: { name: 'memento-test-agent', keywords: ['coding-agent'] } }] }
      : url.pathname === '/memento-test-agent' ? pack('memento-test-agent', '1.0.0', extra) : emptySearch(url));
    const result = await discoverTools({ fetch: net.fetch, budget: budget(), tracked: [] });
    assert.deepEqual(result.records, []); assert.deepEqual(result.queue, []);
  }
});

test('package candidates linked to archived repositories or forks are rejected before publication', async () => {
  for (const extra of [{ fork: true }, { archived: true }]) {
    const net = network(url => {
      if (url.pathname === '/-/v1/search') return { total: 1, objects: [{ package: { name: 'memento-test-agent', keywords: ['coding-agent'] } }] };
      if (url.pathname === '/memento-test-agent') return pack('memento-test-agent', '1.0.0', { repository: 'https://github.com/lab/agent' });
      if (url.pathname === '/repos/lab/agent') return repo('lab/agent', extra);
      return emptySearch(url);
    });
    const result = await discoverTools({ fetch: net.fetch, budget: budget(), tracked: [] });
    assert.equal(result.records.length, 0); assert.equal(result.queue.length, 0);
    assert.ok(net.urls.some(url => url.endsWith('/repos/lab/agent')));
  }
});

test('one-request budgets resume GitHub pagination and eventually finish dependent work', async () => {
  const net = network(url => {
    if (url.pathname === '/search/repositories') return { total_count: url.searchParams.get('page') === '1' ? 101 : 101,
      items: [repo()] };
    if (url.pathname === '/repos/lab/agent') return repo();
    if (url.pathname.endsWith('/releases')) return [release()];
    return emptySearch(url);
  });
  let state = {}; const emitted = [];
  for (let i = 0; i < 12; i++) {
    const result = await discoverTools({ fetch: net.fetch, state, since: today, budget: budget(1), tracked: [] });
    assert.equal(result.stats.total, 1); state = result.state; emitted.push(...result.records);
  }
  assert.ok(emitted.some(r => r.id === 'github:lab/agent'));
  assert.ok(net.urls.some(url => url.includes('page=2')));
  assert.ok(net.urls.some(url => url.includes('registry.npmjs.org')));
  assert.ok(net.urls.some(url => url.includes('pypi.org')));
});

test('429 backoff persists Retry-After, retains work and does not retry early', async () => {
  const net = network(url => url.hostname === 'registry.npmjs.org'
    ? new Response('', { status: 429, headers: { 'retry-after': '120' } }) : emptySearch(url));
  const a = await discoverTools({ fetch: net.fetch, budget: budget(3), tracked: [] });
  assert.equal(a.state.backoff.npm, '2026-11-15T14:02:00.000Z');
  assert.equal(a.stats.npm, 1);
  const before = net.urls.filter(u => u.includes('registry.npmjs.org')).length;
  await discoverTools({ fetch: net.fetch, state: a.state, budget: budget(3, { now: '2026-11-15T14:01:00Z' }), tracked: [] });
  assert.equal(net.urls.filter(u => u.includes('registry.npmjs.org')).length, before);
});

test('offline and malformed responses preserve retry jobs and respect zero/per-registry budgets', async () => {
  const tracked = [{ id: 'known', repo: 'lab/agent', kind: 'cli' }];
  const result = await discoverTools({ fetch: async () => { throw new Error('offline'); }, budget: budget(2), tracked });
  assert.equal(result.stats.total, 2); assert.equal(result.records.length, 0); assert.ok(result.state.pending.length > 0);
  assert.ok(result.warnings.length > 0);
  let calls = 0;
  const zero = await discoverTools({ fetch: async () => { calls++; }, budget: budget(0), tracked });
  assert.equal(calls, 0); assert.equal(zero.stats.total, 0);
  const net = network(url => url.pathname === '/repos/lab/agent' ? {} : emptySearch(url));
  const bad = await discoverTools({ fetch: net.fetch, budget: budget(4, { perRegistry: { github: 1, npm: 0, pypi: 0 } }), tracked });
  assert.equal(bad.stats.total, 1); assert.equal(bad.records.length, 0); assert.equal(bad.state.pending.length, 1);
});

test('request pacing and primary rate-limit reset are honored without real waits', async () => {
  const waits = []; const state = {};
  const fetch = async () => new Response('{}', { headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1794758400' } });
  const client = requester(fetch, budget(3, { sleep: async ms => waits.push(ms) }), state, new Date('2026-11-15T14:00:00Z'), []);
  await client.get('github', 'https://api.github.com/test');
  assert.equal(client.available('github'), false);
  await client.get('npm', 'https://registry.npmjs.org/one');
  // A successful response reporting zero remaining blocks this registry too.
  assert.equal(client.available('npm'), false);
  const paced = requester(async () => new Response('{}'), budget(3, { sleep: async ms => waits.push(ms) }), {}, new Date(), []);
  await paced.get('github', 'https://api.github.com/one'); await paced.get('github', 'https://api.github.com/two');
  assert.ok(waits.some(ms => ms >= 6000));
});

test('tracked adapter metadata is read without evaluating JavaScript or install commands', async () => {
  const source = `throw new Error('must not execute');\nexport const meta = {\n id: 'test', name: 'Test', repo: 'lab/agent', kind: 'cli',\n install: { how: 'npm', display: 'npm install -g --ignore-scripts @lab/agent@latest' },\n};`;
  assert.deepEqual(adapterMetadata(source), { id: 'test', name: 'Test', repo: 'lab/agent', kind: 'cli', package: { registry: 'npm', name: '@lab/agent' } });
  const tracked = await loadTrackedTools();
  assert.ok(tracked.some(t => t.repo === 'Aider-AI/aider' && t.package?.name === 'aider-chat'));
  assert.ok(tracked.some(t => t.repo === 'earendil-works/pi' && t.package?.name === '@earendil-works/pi-coding-agent'));
  assert.ok(tracked.some(t => t.repo === 'n8n-io/n8n'));
  assert.equal(tracked.filter(t => t.repo?.toLowerCase() === 'openai/codex').length, 1);
});

test('script entrypoint can be imported without running the CLI or making network calls', async () => {
  const before = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('network forbidden'); };
  try {
    const entry = await import('../../scripts/sync-upstream.js');
    assert.equal(entry.discoverTools, discoverTools);
  } finally { globalThis.fetch = before; }
});
