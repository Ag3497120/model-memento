import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, mkdtemp, rm, mkdir, writeFile, symlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { summarizeItem, summarizeNews } from '../../lib/news/summarize.js';
import { techniqueDraft, extractTechniqueDraft, writeTechniqueDrafts } from '../../lib/news/techniques.js';
import { createNewsHandler } from '../../lib/news/routes.js';
import { newsId } from '../../lib/news/schema.js';
import { styleSchema } from '../../lib/recipes/catalog.js';
import { run } from '../../scripts/news-fetch.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const temp = () => mkdtemp(path.join(ROOT, 'test/news/.tmp-'));
const item = (extra = {}) => ({ schema: 'memento.news.v1', id: newsId('https://news.example.org/prompt'),
  title: 'Example prompting の研究', url: 'https://news.example.org/prompt', source: { id: 'test', name: '架空の出典', url: 'https://news.example.org/' },
  date: '2026-11-15T01:00:00.000Z', dateBasis: 'published', kind: 'prompting', tags: [], lang: 'en', ...extra });

test('injected local complete receives bounded context, returns at most two Japanese sentences and the AI label', async () => {
  let called = 0;
  const result = await summarizeItem({ ...item(), body: 'MUST_NOT_LEAK' }, { actor: 'test:local', env: {}, complete: async (actor, options) => {
    called++; assert.equal(actor, 'test:local'); assert.equal(options.web, false);
    assert.ok(!JSON.stringify(options).includes('MUST_NOT_LEAK'));
    assert.equal(JSON.parse(options.messages[0].content).basis, 'headline');
    return { text: JSON.stringify({ summary: 'AI への頼み方を紹介する記事です。詳細は出典で確認できます。', body: 'MUST_NOT_LEAK' }) };
  } });
  assert.equal(called, 1); assert.equal(result.summaryLabel, 'AI による要約'); assert.equal(result.summaryBasis, 'headline');
  assert.ok(!JSON.stringify(result).includes('MUST_NOT_LEAK'));
  const provided = await summarizeItem(item(), { actor: 'test', env: {}, text: 'TRANSIENT_SOURCE_TEXT', complete: async (_actor, options) => {
    assert.match(options.messages[0].content, /TRANSIENT_SOURCE_TEXT/); return { summary: '資料で頼み方を説明しています。' };
  } });
  assert.equal(provided.summaryBasis, 'provided-text'); assert.ok(!JSON.stringify(provided).includes('TRANSIENT_SOURCE_TEXT'));
  const structured = await summarizeItem(item(), { actor: 'test', env: {}, complete: async () => ({ text: '', json: { summary: '資料で頼み方を説明しています。' } }) });
  assert.ok(structured.summary);
  const refused = await summarizeItem(item(), { actor: 'test', env: {}, complete: async () => ({ refused: true, json: { summary: '採用しない要約です。' } }) });
  assert.equal(refused.summary, undefined);
});

test('CI never calls AI even with explicit injection and ci:false; missing AI leaves news publishable', async () => {
  const complete = () => { throw new Error('AI must never run in CI'); };
  for (const options of [{ ci: true, env: {} }, { ci: false, env: { CI: 'true' } }, { env: { GITHUB_ACTIONS: 'true' } }]) {
    assert.deepEqual(await summarizeItem(item(), { actor: 'test', complete, ...options }), item());
  }
  assert.deepEqual(await summarizeItem(item(), { env: {} }), item());
  let calls = 0;
  await summarizeItem(item(), { env: { CI: 'false' }, actor: 'test', complete: async () => { calls++; return { summary: '記事の紹介です。' }; } });
  assert.equal(calls, 1);
});

test('invalid, English, overlong, three-sentence, injected HTML, and unavailable summaries are not published', async () => {
  for (const output of ['invalid json', { summary: 'Only English text.' }, { summary: 'あ'.repeat(281) }, { summary: '一文です。二文です。三文です。' }, { summary: '<script>危険</script>' }, { summary: '説明です。https://bad.example.org/' }]) {
    const result = await summarizeItem(item(), { env: {}, actor: 'test', complete: async () => output });
    assert.equal(result.summary, undefined);
  }
  assert.equal((await summarizeItem(item(), { env: {}, actor: 'test', complete: async () => { throw new Error('offline'); } })).summary, undefined);
  assert.equal((await summarizeItem(item(), { env: {}, actor: 'test', timeoutMs: 10, complete: () => new Promise(() => {}) })).summary, undefined);
  let calls = 0;
  const items = await summarizeNews([item(), item(), item()], { maxCalls: 1, env: {}, actor: 'test', complete: async () => { calls++; return { summary: '記事の紹介です。' }; } });
  assert.equal(calls, 1); assert.equal(items.filter(i => i.summary).length, 1);
});

test('techniques create inert valid style drafts with sources and explicitly unverified claims', () => {
  const draft = techniqueDraft(item(), { now: '2026-11-15' });
  styleSchema.parse(draft);
  assert.equal(draft.status, 'draft'); assert.equal(draft.reviewRequired, true);
  assert.deepEqual(draft.files, []); assert.deepEqual(draft.fits, {});
  assert.ok(draft.sources.includes(item().url)); assert.equal(draft.review.effectiveness, 'unverified');
  assert.equal(techniqueDraft(item({ kind: 'tool' })), null);
  assert.equal(techniqueDraft(item(), { existingStyles: [{ sources: [item().url] }] }), null);
  assert.equal(techniqueDraft(item(), { existingStyles: [{ name: item().title }] }), null);
});

test('local technique extraction creates short Japanese instruction candidates only as sourced review drafts', async () => {
  const candidate = { name: '結果の確認から頼む', plain: '先に結果の確認方法を決めてから依頼します。', when: '答えが正しいか確かめたいとき。', steps: ['望む結果と確認方法を先に伝えてください。', '結果を確認し、分からない点を報告してください。'] };
  const complete = async (_actor, options) => { assert.equal(options.web, false); assert.match(options.messages[0].content, /TRANSIENT_TECHNIQUE_SOURCE/); return { json: candidate, text: '' }; };
  const draft = await extractTechniqueDraft(item(), { actor: 'test', env: {}, complete, text: 'TRANSIENT_TECHNIQUE_SOURCE' });
  styleSchema.parse(draft); assert.equal(draft.status, 'draft'); assert.equal(draft.stage, 'needs-instruction-review');
  assert.equal(draft.files[0].path, 'project/AGENTS.md'); assert.match(draft.files[0].content, /望む結果/);
  assert.equal(draft.generation.label, 'AI が作成した下書き'); assert.ok(draft.sources.includes(item().url));
  assert.ok(!JSON.stringify(draft).includes('TRANSIENT_TECHNIQUE_SOURCE'));
  const ci = await extractTechniqueDraft(item(), { actor: 'test', env: { CI: 'true' }, complete: () => { throw new Error('no AI'); }, text: 'source' });
  assert.equal(ci.files.length, 0);
  const invalid = await extractTechniqueDraft(item(), { actor: 'test', env: {}, complete: async () => ({ ...candidate, steps: ['<script>命令</script>'] }), text: 'source' });
  assert.equal(invalid.files.length, 0);
  const repeated = 'この資料の長い文章をそのまま転載しないよう確認するためのテスト用の日本語の文です。'.repeat(3);
  const copied = await extractTechniqueDraft(item(), { actor: 'test', env: {}, complete: async () => ({ ...candidate, plain: repeated }), text: repeated });
  assert.equal(copied.files.length, 0);
});

test('batch technique extraction honors its AI budget and does not re-extract existing human drafts', async () => {
  const root = await temp();
  try {
    const first = item(), second = item({ id: newsId('https://news.example.org/second'), url: 'https://news.example.org/second' });
    let calls = 0;
    const options = { root, sourceTexts: { [first.id]: 'first source', [second.id]: 'second source' }, maxCalls: 1,
      extraction: { actor: 'test', env: {}, complete: async () => { calls++; return { name: '確かめて依頼する', plain: '確認方法を添える頼み方です。', when: '結果を確かめたいとき。', steps: ['確認の基準を先に決めてください。', '基準に沿って結果を説明してください。'] }; } } };
    assert.equal((await writeTechniqueDrafts([first, second], options)).written.length, 2); assert.equal(calls, 1);
    assert.equal((await writeTechniqueDrafts([first, second], options)).existing.length, 2); assert.equal(calls, 1);
    const persisted = await readFile(path.join(root, 'data/drafts/styles', `${first.id}.json`), 'utf8');
    assert.ok(!persisted.includes('first source'));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('draft writes are idempotent, retain human edits, refuse catalog writes and symlinks', async () => {
  const root = await temp();
  try {
    const first = await writeTechniqueDrafts([item()], { root });
    assert.equal(first.written.length, 1);
    await writeFile(first.written[0], '{"human":"手で編集した内容"}\n');
    const second = await writeTechniqueDrafts([item()], { root });
    assert.equal(second.existing.length, 1); assert.match(await readFile(first.written[0], 'utf8'), /human/);
    await assert.rejects(writeTechniqueDrafts([item()], { root, draftsDir: 'recipes/catalog/styles' }), /下書き/);
    await rm(path.join(root, 'data'), { recursive: true });
    await mkdir(path.join(root, 'actual'));
    await symlink(path.join(root, 'actual'), path.join(root, 'data'));
    await assert.rejects(writeTechniqueDrafts([item()], { root }), /リンク/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('draft file symlinks and traversal never overwrite another file', async () => {
  const root = await temp();
  try {
    const target = path.join(root, 'target.json'); await writeFile(target, 'preserve');
    await mkdir(path.join(root, 'data/drafts/styles'), { recursive: true });
    await symlink(target, path.join(root, 'data/drafts/styles', `${techniqueDraft(item()).id}.json`));
    await assert.rejects(writeTechniqueDrafts([item()], { root }), /リンク/);
    assert.equal(await readFile(target, 'utf8'), 'preserve');
    await assert.rejects(writeTechniqueDrafts([item()], { root, draftsDir: '../escape' }), /下書き/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

function res() {
  return { statusCode: 0, headers: {}, body: null, setHeader(k, v) { this.headers[k] = v; }, end(value) { this.body = value; } };
}
test('read-only route mounts without starting a server and strips bodies/private state', async () => {
  const handler = createNewsHandler({ getSnapshot: async () => ({ items: [{ ...item(), body: 'NEVER_PUBLISH' }], state: { private: 'NEVER_PUBLISH' } }) });
  const response = res(); assert.equal(await handler({ url: '/api/news', method: 'GET' }, response), true);
  assert.equal(response.statusCode, 200); assert.ok(!response.body.includes('NEVER_PUBLISH'));
  const head = res(); await handler({ url: '/api/news', method: 'HEAD' }, head); assert.equal(head.body, '');
  const post = res(); await handler({ url: '/api/news', method: 'POST' }, post); assert.equal(post.statusCode, 405);
  assert.equal(await handler({ url: '/other', method: 'GET' }, res()), false);
  const failing = createNewsHandler({ getSnapshot: async () => { throw new Error('secret'); } });
  const unavailable = res(); await failing({ url: '/api/news', method: 'GET' }, unavailable); assert.equal(unavailable.statusCode, 503); assert.ok(!unavailable.body.includes('secret'));
});

test('CLI offline mode writes metadata-only public and resumable snapshots, and never starts AI', async () => {
  const root = await temp();
  try {
    const lines = [];
    const result = await run(['--sources', path.join(ROOT, 'test/news/fixtures/sources.json'), '--offline', path.join(ROOT, 'test/news/fixtures/run.json'), '--out', 'output', '--budget', '2'], { root, env: { CI: 'true' }, stdout: line => lines.push(line), fetch: () => { throw new Error('network must not run'); } });
    assert.equal(result.stats.requests, 2); assert.equal(result.items.length, 4);
    const published = await readFile(path.join(root, 'output/news.json'), 'utf8');
    assert.ok(!published.includes('BODY_DO_NOT_STORE')); assert.equal(JSON.parse(published).state, undefined);
    assert.ok(JSON.parse(await readFile(path.join(root, 'output/snapshot.json'), 'utf8')).state.sources);
    assert.match(lines[0], /ニュース: 4件、通信 2回/);
    await assert.rejects(run(['--out', 'output', '--drafts'], { root, env: { CI: 'true' } }), /CI/);
    await assert.rejects(run(['--out', '../escape'], { root }), /保存先/);
    await assert.rejects(run(['--out', 'output', '--budget', '-1'], { root }), /整数/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
