import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createAdminRunner } from '../../lib/admin/runner.js';
import { runProcess, redact } from '../../lib/admin/process.js';
import { readJSON, safePath, writeJSON } from '../../lib/admin/files.js';
import { fixture } from './helpers.js';

test('fixed quick job runs Node fixtures, keeps going on failure, reports missing scripts, and persists history', async t => {
  const f = await fixture(t);
  await f.write('scripts/world-build.js', 'console.log(JSON.stringify(process.argv.slice(2)));');
  await f.write('scripts/sync-upstream.js', 'console.log("確認用の失敗"); process.exitCode = 7;');
  const runner = createAdminRunner({ ...f, env: {} });
  const job = await runner.start('refresh-quick'), done = await runner.wait(job.id);
  assert.equal(done.state, 'partial');
  assert.deepEqual(done.result.steps.map(s => s.code), [0, 7, null, null]);
  const text = done.events.map(e => e.data.text ?? '').join('\n');
  assert.match(text, /\["--delta","--budget","5","--out",".world-out"\]/);
  assert.match(text, /news-fetch.js: 未導入/);
  assert.match(text, /check-links.js: 未導入/);
  const restarted = createAdminRunner({ ...f, env: {} });
  assert.equal((await restarted.get(job.id)).state, 'partial');
  assert.equal((await readJSON(f.home, `history/${job.id}.json`)).finishedAt, done.finishedAt);
  await assert.rejects(runner.start('node -e bad'), /処理の名前/);
  await assert.rejects(runner.get('../package'), /見つかりません/);
});

test('all quick-job arguments are fixed, and enrichment uses server settings', async t => {
  const f = await fixture(t), calls = [];
  for (const script of ['world-build.js', 'sync-upstream.js', 'news-fetch.js', 'check-links.js', 'enrich-local.js']) await f.write(`scripts/${script}`, '');
  const runner = createAdminRunner({ ...f, env: {}, actor: 'codex:fixture',
    run: async (bin, args) => { calls.push([bin, args]); return { code: 0, output: '' }; } });
  let job = await runner.start('refresh-quick'); assert.equal((await runner.wait(job.id)).state, 'succeeded');
  job = await runner.start('enrich'); await runner.wait(job.id);
  assert.deepEqual(calls.map(([bin, args]) => [bin === process.execPath, path.basename(args[0]), ...args.slice(1)]), [
    [true, 'world-build.js', '--delta', '--budget', '5', '--out', '.world-out'],
    [true, 'sync-upstream.js', '--targets', 'tools', '--limit', '5', '--world-out', '.world-out'],
    [true, 'news-fetch.js', '--out', '.world-out/news', '--budget', '5'],
    [true, 'check-links.js', '--artifact', '.world-out', '--input', 'data/curated', '--input', 'recipes/catalog', '--budget', '20', '--request-budget', '100', '--max-run-ms', '120000'],
    [true, 'enrich-local.js', '--max', '3', '--actor', 'codex:fixture', '--queue', '.world-out/world/data/enrich-queue.json'],
  ]);
});

test('kind locks cover other runner instances, different kinds can run, and cancel releases the lock', async t => {
  const f = await fixture(t);
  const jobs = { enrich: ctx => new Promise(resolve => ctx.signal.addEventListener('abort', () => resolve({}), { once: true })),
    'refresh-quick': async () => ({ summary: '確認用' }) };
  const a = createAdminRunner({ ...f, jobs, env: {} }), b = createAdminRunner({ ...f, jobs, env: {} });
  const running = await a.start('enrich');
  await assert.rejects(a.start('enrich'), error => error.status === 409);
  await assert.rejects(b.start('enrich'), error => error.status === 409);
  const other = await a.start('refresh-quick'); assert.equal((await a.wait(other.id)).state, 'succeeded');
  await a.cancel(running.id); assert.equal((await a.wait(running.id)).state, 'cancelled');
  const next = await b.start('enrich'); await b.cancel(next.id); await b.wait(next.id);
});

test('job deadline aborts cooperative jobs and CI refuses to start', async t => {
  const f = await fixture(t);
  const runner = createAdminRunner({ ...f, env: {}, timeoutMs: 30, jobs: {
    enrich: ctx => new Promise(resolve => ctx.signal.addEventListener('abort', () => resolve({}), { once: true })),
  } });
  // Keep a Node test handle alive; production jobs have child processes or network handles.
  const keeper = setTimeout(() => {}, 200); t.after(() => clearTimeout(keeper));
  const job = await runner.start('enrich'); assert.equal((await runner.wait(job.id)).state, 'cancelled');
  await assert.rejects(createAdminRunner({ ...f, env: { CI: 'true' } }).start('enrich'), /本人の端末/);
});

test('owned Node process supports cancellation, timeout, and output caps', async t => {
  const f = await fixture(t);
  const controller = new AbortController();
  const processPromise = runProcess(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { cwd: f.root, signal: controller.signal });
  controller.abort(new Error('fixture-cancel'));
  await assert.rejects(processPromise, /fixture-cancel/);
  await assert.rejects(runProcess(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { cwd: f.root, timeoutMs: 30 }), /制限時間/);
  await assert.rejects(runProcess(process.execPath, ['-e', 'console.log("x".repeat(1000))'], { cwd: f.root, maxBytes: 50 }), /容量上限/);
  assert.equal(redact('api_key=secret sk-abcdefghijk'), 'api_key=[非表示] [非表示]');
});

test('safe file access rejects traversal, symlinks and hard links', async t => {
  const f = await fixture(t);
  await assert.rejects(safePath(f.root, '../outside'), /外には/);
  await fs.symlink(path.join(f.root, 'package.json'), path.join(f.root, 'alias.json'));
  await assert.rejects(readJSON(f.root, 'alias.json'), /リンク/);
  await fs.link(path.join(f.root, 'package.json'), path.join(f.root, 'hard.json'));
  await assert.rejects(readJSON(f.root, 'hard.json'), /リンク/);
  await assert.rejects(writeJSON(f.root, 'alias.json', {}), /リンク/);
});

test('dead owner history is interrupted and its stale kind lease can be reused', async t => {
  const f = await fixture(t), id = 'fixture-interrupted';
  await writeJSON(f.home, `history/${id}.json`, { id, job: 'enrich', pid: 2_147_483_647, state: 'running',
    startedAt: '2026-11-15T00:00:00Z', sequence: 0, events: [] });
  await writeJSON(f.home, 'locks/enrich/owner.json', { pid: 2_147_483_647 });
  const runner = createAdminRunner({ ...f, env: {}, jobs: { enrich: async () => ({}) } });
  assert.equal((await runner.get(id)).state, 'interrupted');
  const job = await runner.start('enrich'); assert.equal((await runner.wait(job.id)).state, 'succeeded');
});

test('bursty logs stay bounded and persist the final state after coalesced writes', async t => {
  const f = await fixture(t), runner = createAdminRunner({ ...f, env: {}, jobs: {
    enrich: async ctx => { for (let i = 0; i < 5000; i++) ctx.log(`確認用 ${i}`); return { summary: '確認完了' }; },
  } });
  const job = await runner.start('enrich'), done = await runner.wait(job.id);
  assert.equal(done.events.length, 500); assert.equal(done.events.at(-1).data.state, 'succeeded');
  assert.match(done.events.at(-2).data.text, /行数上限/);
  const saved = await readJSON(f.home, `history/${job.id}.json`);
  assert.equal(saved.sequence, 2002); assert.equal(saved.state, 'succeeded');
  assert.ok((await fs.stat(path.join(f.home, `history/${job.id}.json`))).size < 2 << 20);
});
