import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createAdminRunner } from '../../lib/admin/runner.js';
import { readJSON } from '../../lib/admin/files.js';
import { contributePage } from '../../lib/admin/contribute.js';
import { validateContribution } from '../../lib/contrib/validate.js';
import { fixture, modelDraft, fakeCheckUrl } from './helpers.js';

test('local AI news summaries preserve source URLs and explicitly identify their headline basis', async t => {
  const f = await fixture(t);
  await f.write('.world-out/news/news.json', { items: [{ schema: 'memento.news.v1', id: `news-${'a'.repeat(24)}`, title: '確認用のお知らせ',
    url: 'https://nodejs.org/api/', source: { id: 'fixture', name: '確認用の出典', url: 'https://nodejs.org/api/' },
    date: null, kind: 'tool', tags: [], lang: 'ja' }] });
  const runner = createAdminRunner({ ...f, env: {}, checkUrl: fakeCheckUrl, ask: async (purpose, request) => {
    assert.equal(purpose, 'news'); assert.match(request.system, /見出し以外の事実を補わない/);
    return { summary: '確認用のお知らせが出ています。' };
  } });
  const job = await runner.start('summarize-news'), done = await runner.wait(job.id);
  assert.equal(done.state, 'succeeded'); assert.equal(done.result.count, 1);
  const saved = await readJSON(f.home, 'news-summaries.json');
  assert.equal(saved.items[0].summaryLabel, 'AI による要約'); assert.equal(saved.items[0].summaryBasis, 'headline');
  assert.equal(saved.items[0].url, 'https://nodejs.org/api/');
});

test('contribute exports only schema-valid new results without local paths or uploads', async t => {
  const f = await fixture(t), now = () => '2026-11-15T00:00:00Z';
  await f.write('data/drafts/sample.json', modelDraft());
  await f.write('.world-out/links-status.json', { links: { 'https://nodejs.org/api/': { state: 'ok', checkedAt: now(), privatePath: '/private/person' } } });
  const runner = createAdminRunner({ ...f, env: {}, now, checkUrl: fakeCheckUrl, page: 'https://github.com/fixture/project/issues/new',
    ask: async () => ({ verdict: 'approve', summary: '確認用の判定です。', issues: [] }) });
  let job = await runner.start('review-drafts'); await runner.wait(job.id);
  const [row] = await runner.drafts.list(); await runner.drafts.decide(row.id, 'accept', row.hash);
  job = await runner.start('contribute'); const done = await runner.wait(job.id);
  assert.equal(done.state, 'succeeded'); assert.equal(done.result.files.length, 3);
  assert.match(done.result.url, /^https:\/\/github.com\/fixture\/project\/issues\/new\?title=/);
  assert.equal(new URL(done.result.url).searchParams.has('body'), false);
  for (const file of done.result.files) {
    const item = await readJSON(f.home, `contributions/${file.id}.json`);
    assert.equal(validateContribution(item, { now: new Date(now()) }).ok, true);
    assert.doesNotMatch(JSON.stringify(item), /privatePath|\/private\/person|actor|citation_paths/);
  }
  job = await runner.start('contribute'); assert.equal((await runner.wait(job.id)).result.files.length, 0);
  assert.throws(() => contributePage('https://evil.invalid/issues/new'), /寄稿先/);
  assert.equal(contributePage(null), null);
  assert.equal((await fs.readdir(path.join(f.home, 'contributions'))).length, 3);
});

test('missing news is unavailable and unknown contribution destination stays explicit', async t => {
  const f = await fixture(t), runner = createAdminRunner({ ...f, env: {} });
  let job = await runner.start('summarize-news'); assert.equal((await runner.wait(job.id)).state, 'unavailable');
  job = await runner.start('contribute'); const done = await runner.wait(job.id);
  assert.equal(done.state, 'partial'); assert.equal(done.result.url, null); assert.match(done.result.summary, /寄稿先は未設定/);
});
