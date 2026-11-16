import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createAdminRunner } from '../../lib/admin/runner.js';
import { inspectDraft } from '../../lib/admin/drafts.js';
import { readJSON } from '../../lib/admin/files.js';
import { fixture, modelDraft, fakeCheckUrl } from './helpers.js';

test('AI review writes beside each draft; human acceptance requires current contents and moves to curated', async t => {
  const f = await fixture(t), draft = modelDraft();
  await f.write('data/drafts/nested/sample.json', draft);
  let asks = 0;
  const runner = createAdminRunner({ ...f, env: {}, checkUrl: fakeCheckUrl, ask: async () => {
    asks++; return { verdict: 'approve', summary: '確認用の事前判定です。', issues: [] };
  } });
  const job = await runner.start('review-drafts'), done = await runner.wait(job.id);
  assert.equal(done.state, 'succeeded'); assert.equal(asks, 1);
  const [row] = await runner.drafts.list(); assert.equal(row.review.verdict, 'approve');
  assert.equal((await runner.drafts.get(row.id)).draft.name, draft.name);
  await assert.rejects(runner.drafts.decide(row.id, 'accept', 'c'.repeat(64)), /下書きが変わりました/);
  const accepted = await runner.drafts.decide(row.id, 'accept', row.hash);
  assert.match(accepted.file, /^data\/curated\/admin\//);
  assert.equal((await readJSON(f.root, accepted.file)).status, 'accepted');
  assert.equal((await runner.drafts.list()).length, 0);
  await assert.rejects(fs.stat(path.join(f.root, row.file)), { code: 'ENOENT' });
  assert.equal((await readJSON(f.home, `accepted/${row.id}.json`)).decision, 'accepted');
});

test('schema, citations, unreachable sources, and changed content prevent acceptance', async t => {
  const f = await fixture(t), draft = modelDraft();
  draft.summary = '<svg>not allowed</svg>';
  assert.ok((await inspectDraft(draft)).issues.length > 0);
  const unsourced = modelDraft(); unsourced.review.citations = [];
  assert.match((await inspectDraft(unsourced)).issues.join(' '), /出典のない/);
  await f.write('data/drafts/sample.json', modelDraft());
  const runner = createAdminRunner({ ...f, env: {}, checkUrl: async url => ({ url, ok: false }), ask: async () => { throw new Error('must not ask'); } });
  const job = await runner.start('review-drafts'); await runner.wait(job.id);
  let [row] = await runner.drafts.list(); assert.equal(row.review.verdict, 'needs-work');
  await assert.rejects(runner.drafts.decide(row.id, 'accept', row.hash), /要修正/);
  await f.write('data/drafts/sample.json', { ...modelDraft(), name: '変更された下書き' });
  [row] = await runner.drafts.list(); assert.equal(row.review, null);
  await assert.rejects(runner.drafts.decide(row.id, 'accept', row.hash), /先に最新/);
});

test('human rejection persists without deleting the original draft', async t => {
  const f = await fixture(t); await f.write('data/drafts/sample.json', modelDraft());
  const runner = createAdminRunner({ ...f, env: {}, checkUrl: fakeCheckUrl,
    ask: async () => ({ verdict: 'needs-work', summary: '再確認してください。', issues: [] }) });
  const job = await runner.start('review-drafts'); await runner.wait(job.id);
  const [row] = await runner.drafts.list(); await runner.drafts.decide(row.id, 'reject', row.hash);
  assert.equal((await runner.drafts.list())[0].review.decision, 'rejected');
  await assert.rejects(runner.drafts.decide(row.id, 'reject', row.hash), /判断済み/);
});

test('malformed JSON and AI unavailability receive per-draft verdicts without losing other drafts', async t => {
  const f = await fixture(t);
  await f.write('data/drafts/invalid.json', '{broken');
  await f.write('data/drafts/null.json', 'null');
  await f.write('data/drafts/valid.json', modelDraft());
  const runner = createAdminRunner({ ...f, env: {}, checkUrl: fakeCheckUrl, ask: async () => { throw new Error('fixture AI unavailable'); } });
  const job = await runner.start('review-drafts'), done = await runner.wait(job.id);
  assert.equal(done.result.pending, 3);
  const rows = await runner.drafts.list(); assert.ok(rows.every(row => row.review.verdict === 'needs-work'));
  assert.match(rows.find(row => row.file.endsWith('valid.json') && !row.file.endsWith('invalid.json')).review.issues.join(' '), /AI の事前確認/);
});
