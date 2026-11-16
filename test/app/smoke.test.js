import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import childProcess from 'node:child_process';
import http from 'node:http';
import { syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadCuratedPersonas } from '../../lib/persona/catalog.js';
import { realModelLinks } from '../../lib/links/real.js';

const home = await fs.mkdtemp(fileURLToPath(new URL('./.smoke-', import.meta.url)));
const savedEnv = { home: process.env.MODEL_MEMENTO_HOME, temp: process.env.TMPDIR };
process.env.MODEL_MEMENTO_HOME = home; process.env.TMPDIR = home;
// Older modules run `which` during import. No third-party discovery/process may run in this test.
const execFileSync = childProcess.execFileSync;
childProcess.execFileSync = () => { throw new Error('External process discovery is disabled in the offline smoke test.'); };
syncBuiltinESMExports();
const { createMementoServer, createPublishedStore } = await import('../../server.js');
childProcess.execFileSync = execFileSync; syncBuiltinESMExports();
test.after(async () => {
  if (savedEnv.home === undefined) delete process.env.MODEL_MEMENTO_HOME; else process.env.MODEL_MEMENTO_HOME = savedEnv.home;
  if (savedEnv.temp === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = savedEnv.temp;
  await fs.rm(home, { recursive: true, force: true });
});

const at = '2026-11-15T00:00:00Z';
const artifacts = {
  'data/models.json': [{ id: 'gpt-2', name: 'GPT-2' }],
  'data/personas.json': loadCuratedPersonas(),
  'data/recipe-runtime.json': { mcp: [], styles: [], examples: [] },
  'data/news.json': { schema: 'memento.news-feed.v1', fetchedAt: at, items: [], statuses: [] },
  'data/news-sources.json': [{ id: 'fixture', name: 'テスト用', url: 'https://example.org/news', language: 'ja', kind: 'rss', verification: 'unverified' }],
  'links-status.json': { schema: 'memento.links-status.v1', links: {} },
  'data/patch.json': { id: '26.1' },
  'data/contrib/credits.json': { schema: 'memento.contributor-credits.v1', builtAt: at, contributors: [] },
  'data/contrib/review-queue.json': { schema: 'memento.contribution-review.v1', builtAt: at, items: [] },
};
const published = { siteUrl: 'https://example.org/museum/',
  async json(relative) { if (!Object.hasOwn(artifacts, relative)) throw new Error('Offline fixture not found'); return structuredClone(artifacts[relative]); },
  async get(relative) { return Buffer.from(JSON.stringify(await this.json(relative))); },
};
async function listening(server, callback) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('server.js app smoke: root, alias, legacy, features, all mounted modules, and local admin token', async () => {
  let played = 0;
  const runner = { catalog: () => [], list: async () => [], drafts: { list: async () => [] } };
  await fs.mkdir(home + '/contrib', { recursive: true }); await fs.writeFile(home + '/contrib/review-queue.json', JSON.stringify(artifacts['data/contrib/review-queue.json']));
  const server = createMementoServer({ skipActors: true, published, adminRunner: runner, contributionDirectory: home + '/contrib',
    actorProvider: async () => [{ id: 'fixture:actor', label: 'テスト用' }],
    modelLinks: record => realModelLinks(record, { requestJson: async () => ({ data: [{ id: 'fixture/demo', models: ['fixture/model'], runtime: { stage: 'RUNNING' }, likes: 1 }], next: null }) }),
    playPersona: async (persona, history) => { played++; assert.equal(persona.model_id, 'gpt-2'); assert.equal(history[0].role, 'user'); return { text: '【再現】テスト用の回答です。', notice: '【再現】' }; },
  });
  await listening(server, async base => {
    const page = await fetch(base + '/'); const html = await page.text();
    assert.match(html, /id="era-menu-bar"/); assert.match(html, /id="memento-bootstrap"/);
    assert.match(page.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
    const bootstrap = JSON.parse(/id="memento-bootstrap">([^<]+)<\/script>/.exec(html)[1]);
    assert.equal(bootstrap.app, true); assert.match(bootstrap.adminToken, /^[a-f0-9]{64}$/);
    assert.equal(page.headers.get('cache-control'), 'no-store');
    assert.match(await (await fetch(base + '/w/')).text(), /id="era-menu-bar"/);
    assert.doesNotMatch(await (await fetch(base + '/legacy/')).text(), /id="era-menu-bar"/);
    const status = await (await fetch(base + '/api/status')).json();
    assert.equal(status.app, true); for (const name of ['recipes', 'persona', 'links', 'news', 'admin', 'contributions', 'patch']) assert.equal(status.features[name], true);
    for (const route of ['/api/recipes/catalog', '/api/persona?id=gpt-2', '/api/links?id=gpt-2&spaces=false', '/api/model/links?id=gpt-2&spaces=false', '/api/news', '/api/news/sources', '/api/contrib/credits', '/contributors', '/api/patch', '/data/models.json', '/w/data/models.json']) {
      assert.equal((await fetch(base + route)).status, 200, route);
    }
    const persona = await (await fetch(base + '/api/persona?id=gpt-2')).json(); assert.equal(persona.persona.model_id, 'gpt-2');
    const spaces = await (await fetch(base + '/api/links?r=hf&id=fixture%2Fmodel')).json();
    assert.equal(spaces.spacesStatus, 'checked'); assert.equal(spaces.spaces[0].stage, 'RUNNING'); assert.equal(spaces.spaces[0].modelId, 'fixture/model');
    for (const route of ['/api/recipes/plan', '/api/recipes/apply']) assert.equal((await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipe: {}, confirm: false }) })).status, 400, route);
    assert.equal((await fetch(base + '/api/news', { method: 'POST' })).status, 405);
    assert.equal((await fetch(base + '/api/admin/status')).status, 403);
    const headers = { 'X-Memento-Admin': bootstrap.adminToken };
    assert.equal((await fetch(base + '/api/admin/status', { headers: { ...headers, Origin: 'https://foreign.example.org' } })).status, 403);
    const foreignHostStatus = await new Promise((resolve, reject) => {
      const req = http.get(base + '/api/admin/status', { headers: { ...headers, Host: 'foreign.example.org' } }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject);
    });
    assert.equal(foreignHostStatus, 403);
    assert.equal((await fetch(base + '/api/admin/status', { headers: { ...headers, 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
    assert.equal((await fetch(base + '/api/admin/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"job":"refresh-quick"}' })).status, 403);
    for (const route of ['/api/admin/status', '/api/admin/jobs', '/api/admin/drafts', '/api/admin/contrib', '/admin/contributions']) assert.equal((await fetch(base + route, { headers })).status, 200, route);
    assert.equal((await (await fetch(base + '/api/admin/status', { headers })).json()).token, bootstrap.adminToken);
    assert.equal((await fetch(base + '/api/admin/status', { headers: { Cookie: `memento-admin=${bootstrap.adminToken}` } })).status, 200);
    const foreignPage = await (await fetch(base + '/', { headers: { Origin: 'https://foreign.example.org' } })).text();
    assert.doesNotMatch(foreignPage, new RegExp(bootstrap.adminToken));
    const result = await fetch(base + '/api/persona/play', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'gpt-2', actor: 'fixture:actor', history: [{ role: 'user', content: 'こんにちは' }] }) });
    assert.equal(result.status, 200); assert.equal((await result.json()).recreation, true); assert.equal(played, 1);
    assert.equal((await fetch(base + '/api/persona/play', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'gpt-2', actor: 'fixture:actor', history: [{ role: 'system', content: 'ignored' }] }) })).status, 400);
    assert.equal((await fetch(base + '/api/persona/play', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://foreign.example.org' }, body: '{}' })).status, 403);
  });
});

test('published data is fetched lazily, cached by site, reused offline, and rejects traversal', async () => {
  let requests = 0, offline = false;
  const options = { siteUrl: 'https://example.org/museum/', cacheDir: home + '/cache-test', ttl: 0,
    fetch: async url => { requests++; if (offline) throw new Error('offline'); assert.equal(url.href, 'https://example.org/museum/data/models.json'); return new Response('[{"id":"fixture"}]'); } };
  const store = createPublishedStore(options); assert.equal(requests, 0);
  assert.deepEqual(await store.json('data/models.json'), [{ id: 'fixture' }]);
  offline = true;
  assert.deepEqual(await createPublishedStore(options).json('data/models.json'), [{ id: 'fixture' }]);
  const before = requests;
  await assert.rejects(store.get('data/../secret.json')); await assert.rejects(store.get('data/%2e%2e/secret.json'));
  assert.equal(requests, before);
  assert.throws(() => createPublishedStore({ ...options, siteUrl: 'http://example.org' }));
  let revisionRequests = 0;
  const revisions = createPublishedStore({ ...options, fetch: async () => { revisionRequests++; return new Response('{"new":true}'); } });
  await revisions.get('data/models.json', { version: 'b'.repeat(64) });
  await revisions.get('data/models.json', { version: 'b'.repeat(64) });
  assert.equal(revisionRequests, 1, 'a new manifest version fetches fresh data once and retains it');
});
