import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fetchNews, parseFeed, deduplicate, linkEntities } from '../../lib/news/fetch.js';
import { feedSourceSchema, newsItemSchema, projectItem, canonicalUrl, publicUrl, newsId } from '../../lib/news/schema.js';
import { pageFingerprint } from '../../lib/news/parse.js';

const read = name => readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const NOW = '2026-11-15T04:00:00.000Z';
const source = (extra = {}) => feedSourceSchema.parse({ id: 'test-source', name: '架空のニュース', url: 'https://news.example.org/',
  feedUrl: 'https://news.example.org/feed.xml', format: 'rss', kind: 'model', language: 'ja', ...extra });
const response = (body, headers = {}, status = 200) => new Response(status === 304 ? null : body, { status, headers });
const collect = options => fetchNews({ now: NOW, sources: [source()], ...options });

test('curated sources cover all required groups and carry evidence and rights notes', async () => {
  const sources = JSON.parse(await readFile(new URL('../../data/curated/news-sources.json', import.meta.url), 'utf8'));
  assert.ok(sources.length >= 40 && sources.length <= 80);
  assert.equal(new Set(sources.map(s => s.id)).size, sources.length);
  for (const entry of sources) {
    feedSourceSchema.parse(entry);
    assert.ok(entry.terms.note.includes('unverified'));
    assert.ok(publicUrl(entry.terms.url));
    assert.ok(entry.evidence.includes(entry.url));
    assert.ok(entry.trustedBecause);
    assert.ok(['verified', 'unverified'].includes(entry.verification.status));
  }
  for (const id of ['hugging-face', 'arxiv-cs-cl', 'arxiv-cs-ai', 'simon-willison', 'guide-gemini']) assert.ok(sources.some(s => s.id === id));
  assert.ok(sources.filter(s => s.id.startsWith('release-') && ['atom', 'github-releases'].includes(s.format)).length >= 10);
  assert.ok(sources.filter(s => s.id.startsWith('guide-') && s.format === 'page').length >= 4);
  assert.ok(sources.filter(s => s.id.startsWith('arxiv-')).every(s => s.filter.titleIncludes.length));
});

test('RSS metadata, CDATA, namespaces, relative links and feed dates; bodies never escape', async () => {
  const items = parseFeed(await read('rss.xml'), source());
  assert.equal(items.length, 3);
  assert.equal(items[0].title, 'Example Model & 新しい頼み方');
  assert.equal(items[0].kind, 'prompting');
  assert.equal(items[0].url, 'https://news.example.org/launch');
  assert.equal(items[1].date, '2026-11-14T09:00:00.000Z');
  assert.equal(items[2].dateBasis, 'feed');
  assert.equal(items[2].date, '2026-11-15T01:00:00.000Z');
  assert.ok(!JSON.stringify(items).includes('BODY_DO_NOT_STORE'));
  items.forEach(i => newsItemSchema.parse(i));
});

test('Atom alternate links, original published dates, missing dates, arXiv version canonicalization', async () => {
  const items = parseFeed(await read('atom.xml'), source({ format: 'atom' }));
  assert.equal(items[0].title, 'Example Tool v2');
  assert.equal(items[0].url, 'https://news.example.org/release/2');
  assert.equal(items[0].date, '2026-11-13T00:00:00.000Z');
  assert.equal(items[1].date, null);
  assert.equal(items[1].dateBasis, 'unknown');
  assert.equal(items[2].url, 'https://arxiv.org/abs/2611.00001');
  assert.ok(!JSON.stringify(items).includes('BODY_DO_NOT_STORE'));
});

test('GitHub JSON and JSON Feed project only stable public metadata', async () => {
  const releases = parseFeed(await read('releases.json'), source({ format: 'github-releases', entityNames: ['Example Tool'] }));
  assert.equal(releases.length, 1);
  assert.equal(releases[0].title, 'Example Tool v2.0');
  const json = parseFeed(await read('json-feed.json'), source({ format: 'json-feed' }));
  assert.equal(json.length, 1); assert.equal(json[0].kind, 'prompting');
  assert.ok(!JSON.stringify([...releases, ...json]).includes('BODY_DO_NOT_STORE'));
  assert.throws(() => parseFeed('{}', source({ format: 'github-releases' })));
  assert.throws(() => parseFeed('{"items":[]}', source({ format: 'json-feed' })));
});

test('arXiv relevance is filtered on title, never on copied abstracts', async () => {
  const filtered = parseFeed(await read('atom.xml'), source({ format: 'atom', kind: 'research', filter: { titleIncludes: ['prompt', 'language model'] } }));
  assert.equal(filtered.length, 1);
  assert.match(filtered[0].title, /Prompt/);
});

test('XML rejects HTML, malformed nesting, DTDs and deep documents', () => {
  assert.throws(() => parseFeed('<html><body>not a feed</body></html>', source()));
  assert.throws(() => parseFeed('<rss><channel></rss>', source()));
  assert.throws(() => parseFeed('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///secret">]><rss/>', source()));
  assert.throws(() => parseFeed('<rss>' + '<x>'.repeat(66) + '</x>'.repeat(66) + '</rss>', source()));
});

test('document declarations inside CDATA article content are inert and never exported', () => {
  const xml = '<rss><channel><item><title>安全な見出し</title><link>https://news.example.org/doctype</link><description><![CDATA[<!DOCTYPE html><p>BODY_DO_NOT_STORE</p>]]></description></item></channel></rss>';
  const result = parseFeed(xml, source());
  assert.equal(result.length, 1); assert.ok(!JSON.stringify(result).includes('DOCTYPE')); assert.ok(!JSON.stringify(result).includes('BODY_DO_NOT_STORE'));
  const releases = parseFeed('<feed><entry><title>v2.0</title><link href="https://github.com/example/tool/releases/tag/v2.0"/></entry></feed>', source({ format: 'atom', tags: ['release'], entityNames: ['Example Tool'] }));
  assert.equal(releases[0].title, 'Example Tool v2.0');
});

test('canonical links remove only tracking, and block credentials and local network targets', () => {
  assert.equal(canonicalUrl('https://news.example.org/a/?b=2&utm_medium=rss&a=1#x'), 'https://news.example.org/a?a=1&b=2');
  for (const url of ['file:///tmp/a', 'javascript:x', 'http://127.0.0.1/', 'http://[::1]/', 'https://localhost/a', 'https://name:pass@news.example.org/a', 'http://news.internal/a']) assert.equal(publicUrl(url), null);
  assert.equal(canonicalUrl(undefined, 'https://news.example.org/'), null);
});

test('ETag and Last-Modified conditional requests retain metadata after 304', async () => {
  const first = await collect({ fetch: async () => response(await read('rss.xml'), { etag: '"first"', 'last-modified': 'Sun, 15 Nov 2026 01:00:00 GMT' }) });
  let headers;
  const second = await collect({ previous: first, fetch: async (_url, options) => { headers = options.headers; return response('', {}, 304); } });
  assert.equal(headers['If-None-Match'], '"first"');
  assert.equal(headers['If-Modified-Since'], 'Sun, 15 Nov 2026 01:00:00 GMT');
  assert.deepEqual(second.items, first.items);
  assert.equal(second.statuses[0].status, 'unchanged');
  assert.ok(!JSON.stringify(first).includes('BODY_DO_NOT_STORE'));
});

test('timeouts, response limits, redirects and request budgets are enforced offline', async () => {
  const timed = await collect({ budget: { timeoutMs: 15 }, fetch: () => new Promise(() => {}) });
  assert.equal(timed.statuses[0].status, 'error'); assert.match(timed.statuses[0].reason, /待ち時間/);
  const big = await collect({ budget: { maxResponseBytes: 10 }, fetch: async () => response('x'.repeat(20)) });
  assert.equal(big.statuses[0].status, 'budget');
  const length = await collect({ budget: { maxResponseBytes: 10 }, fetch: async () => response('', { 'content-length': '99' }) });
  assert.equal(length.statuses[0].status, 'budget');
  let calls = 0;
  const redirects = await collect({ budget: { maxRequests: 1 }, fetch: async () => { calls++; return response('', { location: 'https://news.example.org/next' }, 302); } });
  assert.equal(calls, 1); assert.equal(redirects.stats.requests, 1); assert.equal(redirects.statuses[0].status, 'budget');
  const local = await collect({ fetch: async () => response('', { location: 'http://127.0.0.1/secret' }, 302) });
  assert.equal(local.stats.requests, 1); assert.equal(local.statuses[0].status, 'error');
  const zero = await collect({ budget: { maxRequests: 0 }, fetch: async () => { throw new Error('must not call'); } });
  assert.equal(zero.stats.requests, 0);
});

test('budget cursor resumes at the next source, instead of starving later sources', async () => {
  const sources = [source({ id: 'one' }), source({ id: 'two', feedUrl: 'https://news.example.org/two' })];
  const first = await collect({ sources, budget: { maxRequests: 1 }, fetch: async () => response(await read('rss.xml')) });
  assert.equal(first.state.cursor, 1);
  let target;
  const second = await collect({ sources, previous: first, budget: { maxRequests: 1 }, fetch: async url => { target = url; return response(await read('rss.xml')); } });
  assert.equal(target, 'https://news.example.org/two'); assert.equal(second.state.cursor, 0);
});

test('429 Retry-After pauses the host, persists across runs, and resumes when due', async () => {
  const sources = [source({ id: 'one' }), source({ id: 'two', feedUrl: 'https://news.example.org/two' })];
  const first = await collect({ sources, fetch: async () => response('', { 'retry-after': '120' }, 429) });
  assert.equal(first.stats.requests, 1);
  assert.equal(first.state.sources.one.retryAt, '2026-11-15T04:02:00.000Z');
  const second = await collect({ sources, previous: first, now: '2026-11-15T04:01:00Z', fetch: () => { throw new Error('must not call'); } });
  assert.equal(second.stats.requests, 0);
  const third = await collect({ sources, previous: second, now: '2026-11-15T04:03:00Z', fetch: async () => response(await read('rss.xml')) });
  assert.equal(third.stats.requests, 2);
});

test('failed/malformed responses preserve old items and do not accept new validators', async () => {
  const first = await collect({ fetch: async () => response(await read('rss.xml'), { etag: '"good"' }) });
  const broken = await collect({ previous: first, fetch: async () => response('<html>oops</html>', { etag: '"bad"' }) });
  assert.deepEqual(broken.items, first.items); assert.equal(broken.state.sources['test-source'].etag, '"good"');
  const failed = await collect({ previous: first, fetch: async () => response('secret body', {}, 500) });
  assert.deepEqual(failed.items, first.items); assert.ok(!JSON.stringify(failed).includes('secret body'));
  const malformedJson = await collect({ sources: [source({ format: 'json-feed' })], fetch: async () => response('SECRET_RESPONSE_BODY') });
  assert.ok(!JSON.stringify(malformedJson).includes('SECRET_RESPONSE_BODY'));
  const thrown = await collect({ fetch: async () => { throw new Error('SECRET_FETCH_BODY'); } });
  assert.ok(!JSON.stringify(thrown).includes('SECRET_FETCH_BODY'));
});

test('page hashes establish a baseline, ignore navigation and catch changes after 300 characters', async () => {
  const sources = [source({ feedUrl: null, format: 'page', kind: 'prompting' })];
  const html = `<html><nav>one</nav><main>${'長い本文'.repeat(200)}<p>最初</p></main></html>`;
  const first = await collect({ sources, fetch: async () => response(html) });
  assert.equal(first.items.length, 0); assert.ok(first.state.sources['test-source'].hash);
  const same = await collect({ sources, previous: first, fetch: async () => response(html.replace('one', 'two')) });
  assert.equal(same.items.length, 0);
  const changed = await collect({ sources, previous: same, fetch: async () => response(html.replace('最初', '変更')) });
  assert.equal(changed.items.length, 1); assert.equal(changed.items[0].dateBasis, 'observed');
  assert.equal(changed.items[0].date, NOW); assert.ok(!JSON.stringify(changed).includes('長い本文'));
  assert.throws(() => pageFingerprint('<html><title>Access denied</title></html>'));
});

test('dedupe preserves provenance, exact entity matching avoids partial names, summaries survive unchanged metadata', async () => {
  const [item] = parseFeed(await read('rss.xml'), source());
  const summary = projectItem({ ...item, summary: '新しい頼み方の紹介です。', summaryLabel: 'AI による要約', summaryBasis: 'headline' });
  const duplicate = { ...item, url: 'https://other.example.org/launch', id: newsId('https://other.example.org/launch'), source: { id: 'other', name: '別の出典', url: 'https://other.example.org/' } };
  const merged = deduplicate([item, duplicate, summary]);
  assert.equal(merged.length, 1); assert.equal(merged[0].sources.length, 2); assert.equal(merged[0].summary, summary.summary);
  const linked = linkEntities({ ...item, title: 'Example Model と Example Toolkit' }, { world: [{ id: 'yes', r: 'hf', n: 'Example Model' }, { id: 'no', n: 'Example' }, { id: 'no-2', n: 'Example Tool' }, { id: 'case', n: 'example model' }], recipes: [{ id: 'recipe', title: 'Example Model' }] });
  // "Example" itself is an exact word; longer prefix-only and case-folded matches are not accepted.
  assert.deepEqual(linked.entities.world.map(e => e.id), ['yes', 'no']);
  assert.deepEqual(linked.entities.recipes, ['recipe']);
  const changed = await collect({ previous: { items: [summary] }, fetch: async () => response((await read('rss.xml')).replace('新しい頼み方', '別の頼み方')) });
  assert.equal(changed.items.find(i => i.id === item.id).summary, undefined);
});

test('resumed input and state are whitelisted; unknown fields never persist', async () => {
  const [item] = parseFeed(await read('rss.xml'), source());
  const result = await collect({ previous: { items: [{ ...item, body: 'NEVER_KEEP' }], state: { sources: { 'test-source': { url: source().feedUrl, body: 'NEVER_KEEP', etag: '"x"' } } } }, budget: { maxRequests: 0 } });
  assert.ok(!JSON.stringify(result).includes('NEVER_KEEP'));
});
