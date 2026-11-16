import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { land } from '../../scripts/ai-maintain/land.js';
import { json } from '../../scripts/ai-maintain/common.js';

const base = 'a'.repeat(40), commit = 'b'.repeat(40);
const here = path.dirname(fileURLToPath(import.meta.url));
const content = { schema: 'memento.ai-prompting-trends.v1', checkedAt: '2026-11-16', summary: '書き方を見直す資料がありました。', sources: ['https://example.com/trend'], items: [] };
const patch = { schema: 'memento.ai-patch.v1', changes: [{ path: 'data/curated/prompting-trends.json', beforeSha256: null, content: json(content) }] };
async function setup(t, stale = false) {
  const root = await fs.mkdtemp(path.join(here, '.tmp-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const calls = [];
  const fetcher = async (url, options = {}) => {
    const route = url.replace('https://api.github.com/repos/owner/repo/', '');
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ route, method: options.method ?? 'GET', body });
    let result;
    if (route === 'git/ref/heads/main') result = { object: { sha: stale ? commit : base } };
    else if (route.startsWith('releases?')) result = [{ tag_name: 'memento-patch-26.7', body: JSON.stringify({ schema: 'memento.patch-release.v1', id: '26.7', status: 'deployed', bytes: 1, sha256: 'a'.repeat(64) }) }];
    else if (route === `git/commits/${base}`) result = { tree: { sha: 'c'.repeat(40) } };
    else if (route === 'git/commits') result = { sha: commit };
    else if (route === 'git/blobs' || route === 'git/trees') result = { sha: 'd'.repeat(40) };
    else if (route === 'git/refs' || route === 'git/refs/heads/main' || route === 'pulls') result = {};
    else if (route === 'actions/workflows/pages.yml/dispatches') return new Response(null, { status: 204 });
    else throw new Error(`unexpected API: ${route}`);
    return Response.json(result);
  };
  return { calls, options: { repository: 'owner/repo', token: 'fixture', branch: 'main', base, patch, runId: '123', root, now: '2026-11-16', fetcher } };
}
test('default landing creates numbered bot PR and writes only curated data plus deterministic notes', async t => {
  const { calls, options } = await setup(t);
  const result = await land(options);
  assert.equal(result.message, 'AI保守 26.8'); assert.equal(result.branch, 'ai/daily-2026-11-16');
  const tree = calls.find(c => c.route === 'git/trees').body.tree;
  assert.ok(tree.every(f => f.path.startsWith('data/curated/')));
  assert.ok(tree.some(f => f.path === 'data/curated/ai-maintain-history/123.json'));
  assert.ok(calls.some(c => c.route === 'pulls')); assert.ok(!calls.some(c => c.route === 'git/refs/heads/main'));
  assert.ok(!calls.some(c => c.route.includes('dispatches')));
});
test('automerge uses non-force update and explicitly dispatches the existing pages workflow', async t => {
  const { calls, options } = await setup(t); await land({ ...options, automerge: true });
  assert.deepEqual(calls.find(c => c.route === 'git/refs/heads/main').body, { sha: commit, force: false });
  assert.deepEqual(calls.find(c => c.route.includes('dispatches')).body, { ref: 'main', inputs: { dry_run: 'false' } });
  assert.ok(!calls.some(c => c.route === 'pulls'));
});
test('stale default branch rejects before any remote mutation', async t => {
  const { calls, options } = await setup(t, true); await assert.rejects(land(options));
  assert.ok(calls.every(c => c.method === 'GET'));
});
