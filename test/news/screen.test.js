import test from 'node:test';
import assert from 'node:assert/strict';
import { selectNews, readableItems, createNewsScreen, mountNewsScreen } from '../../web/js/news/screen.js';
import { documentFixture, TestNode, findAll } from './fixtures/dom.js';

const NOW = '2026-11-15T01:00:00Z';
const item = (id, date, kind = 'model', extra = {}) => ({ schema: 'memento.news.v1', id, title: `${id} の見出し`,
  url: `https://news.example.org/${id}`, source: { id: 'source', name: '架空の発行元', url: 'https://news.example.org/' },
  date, dateBasis: 'published', kind, tags: [], lang: 'ja', ...extra });
const snapshot = { fetchedAt: NOW, items: [item('today', '2026-11-15T00:00:00Z'), item('japan-today', '2026-11-14T15:30:00Z'), item('week', '2026-11-09T00:00:00Z', 'prompting'), item('old', '2026-11-08T00:00:00Z'), item('undated', null), item('future', '2026-11-15T02:00:00Z')] };
const textNode = (root, text) => findAll(root, n => n.tagName === 'button' && n.textContent === text)[0];

test('today and this week use Japanese calendar boundaries; future and undated dates are never invented', () => {
  const week = selectNews(snapshot, { now: NOW });
  assert.deepEqual(week.items.map(i => i.id), ['today', 'japan-today', 'week']);
  assert.equal(week.groups.today.length, 2); assert.equal(week.week, '2026-11-09');
  assert.equal(selectNews(snapshot, { period: 'today', now: NOW }).items.length, 2);
  const all = selectNews(snapshot, { period: 'all', now: NOW });
  assert.equal(all.groups.undated.length, 1); assert.equal(all.groups.older.length, 1);
  assert.equal(selectNews(snapshot, { tab: 'prompting', now: NOW }).items[0].id, 'week');
  assert.equal(selectNews(snapshot, { kind: 'tool', now: NOW }).items.length, 0);
  assert.equal(selectNews(snapshot, { query: 'japan', now: NOW }).items[0].id, 'japan-today');
});

test('invalid links and malformed records are omitted; malformed dates become unknown', () => {
  assert.equal(readableItems({ items: [item('bad', NOW, 'model', { url: 'javascript:alert(1)' })] }).length, 0);
  assert.equal(readableItems({ items: [item('bad', 'unverified')] })[0].date, null);
  assert.equal(readableItems(null).length, 0);
});

test('offline document renders filters, sources, labels, summaries and safe outbound links as text', async () => {
  const before = globalThis.document; globalThis.document = documentFixture();
  try {
    const malicious = '<img src=x onerror=alert(1)>';
    const screen = createNewsScreen({ now: () => NOW, load: async () => ({ ...snapshot, items: [
      item('today', '2026-11-15T00:00:00Z', 'prompting', { title: malicious, lang: 'en', summary: '頼み方を紹介しています。', summaryLabel: 'AI による要約', summaryBasis: 'headline' })] }) });
    await screen.refresh();
    assert.match(screen.element.textContent, /AI による要約 · 見出しの情報から作成/);
    assert.match(screen.element.textContent, /架空の発行元/); assert.match(screen.element.textContent, /原文の見出し/);
    assert.ok(screen.element.textContent.includes(malicious));
    assert.equal(findAll(screen.element, n => n.tagName === 'img').length, 0);
    const links = findAll(screen.element, n => n.tagName === 'a');
    assert.ok(links.every(n => n.attrs.target === '_blank' && n.attrs.rel === 'noopener noreferrer'));
    textNode(screen.element, 'プロンプト術').dispatch('click');
    assert.match(screen.element.textContent, /頼み方や、作業の進め方/);
    screen.destroy();
  } finally { globalThis.document = before; }
});

test('loading errors, retry and published-static fallback work without a browser or server', async () => {
  const before = globalThis.document; globalThis.document = documentFixture();
  try {
    let broken = true;
    const screen = createNewsScreen({ now: () => NOW, load: async () => { if (broken) throw new Error('offline'); return snapshot; } });
    await screen.refresh(); assert.match(screen.element.textContent, /読み込めませんでした/);
    broken = false; await screen.refresh(); assert.match(screen.element.textContent, /最終確認/);
    const calls = [];
    const fallback = createNewsScreen({ now: () => NOW, endpoint: '/api/news', staticUrl: '/news/news.json', fetch: async url => {
      calls.push(url); return url === '/api/news' ? new Response('', { status: 404 }) : Response.json(snapshot);
    } });
    await fallback.refresh(); assert.deepEqual(calls, ['/api/news', '/news/news.json']);
    assert.match(fallback.element.textContent, /保存済みの一覧/);
  } finally { globalThis.document = before; }
});

test('mount adds CSS once, stale requests do not overwrite newer results, and destroy detaches', async () => {
  const before = globalThis.document; globalThis.document = documentFixture();
  try {
    const container = new TestNode('div');
    const first = mountNewsScreen(container, { now: () => NOW, load: async () => snapshot }); await first.ready;
    const second = mountNewsScreen(container, { now: () => NOW, load: async () => snapshot }); await second.ready;
    assert.equal(document.head.children.length, 1); first.destroy(); second.destroy(); assert.equal(container.children.length, 0);
    let resolveOld; let count = 0;
    const race = createNewsScreen({ now: () => NOW, load: () => ++count === 1 ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve(snapshot) });
    const pending = race.refresh(); await race.refresh(); resolveOld({ fetchedAt: NOW, items: [] }); await pending;
    assert.match(race.element.textContent, /3件/);
  } finally { globalThis.document = before; }
});
