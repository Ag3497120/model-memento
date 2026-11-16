import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TestNode, findAll } from '../news/fixtures/dom.js';
import { buildGuideIndex } from '../../lib/guides/build.js';

// Set the language before any browser module (or its shared dependencies) loads.
globalThis.__MEMENTO_LANG = 'en';
const recipes = await import('../../web/js/recipes/data.js?E5-en');
const { openCombine } = await import('../../web/js/recipes/combine.js?E5-en');
const { createWorldScreen, countSummary } = await import('../../web/js/world/screen.js?E5-en');
const { createWorldIndexClient } = await import('../../web/js/world/index-client.js?E5-en');
const { createNewsScreen } = await import('../../web/js/news/screen.js?E5-en');
const { guideCard, openGuides } = await import('../../web/js/guides/index.js?E5-en');
const { filterGuides } = await import('../../web/js/guides/data.js?E5-en');
const { mountAdmin } = await import('../../web/js/admin/index.js?E5-en');
const { labels, createClient } = await import('../../web/js/admin/client.js?E5-en');
const { statusLabel } = await import('../../web/js/links/status.js?E5-en');
const { patchLabel, setPatchLabel } = await import('../../web/js/patch/label.js?E5-en');
const { getNavEntries } = await import('../../web/js/nav.js');
const { index } = await buildGuideIndex({ write: false });
const savedRecipes = JSON.parse(await readFile(new URL('../../web/data/recipes.json', import.meta.url), 'utf8'));
const counts = JSON.parse(await readFile(new URL('../../web/data/counts.json', import.meta.url), 'utf8'));
const tick = () => new Promise(resolve => setImmediate(resolve));
const noJapanese = text => assert.doesNotMatch(String(text), /[ぁ-んァ-ヶ一-龠]/u);

class Element extends TestNode {
  constructor(...args) { super(...args); this.dataset = {}; this.isConnected = true; }
  setAttribute(key, value) {
    super.setAttribute(key, value);
    if (key === 'id' || key === 'href') this[key] = value;
    if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
  }
  removeAttribute(key) { delete this.attrs[key]; }
  append(...children) { super.append(...children.map(child => typeof child === 'string' ? new Element('#text', child) : child)); }
  querySelectorAll(selector) {
    return findAll(this, node => selector.split(',').some(part => {
      const value = part.trim();
      if (value.startsWith('#')) return node.id === value.slice(1);
      if (value.startsWith('.')) return (node.className || '').split(' ').includes(value.slice(1));
      if (value.startsWith('[')) return Object.hasOwn(node.attrs, value.slice(1, -1));
      return node.tagName === value.split('[')[0];
    }));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  contains(node) { return findAll(this, item => item === node).length > 0; }
  showModal() { this.open = true; }
  close() { this.open = false; this.events.close?.(); }
  focus() { document.activeElement = this; }
  dispatch(type, value) {
    if (value !== undefined) this.value = value;
    return this.events[type]?.({ target: this, preventDefault() {} });
  }
}

async function withDocument(run) {
  const previous = Object.fromEntries(['document', 'Node', 'fetch', 'location'].map(key => [key, globalThis[key]]));
  const body = new Element('body'), head = new Element('head');
  globalThis.Node = Element;
  globalThis.document = { body, head, activeElement: null, createElement: tag => new Element(tag),
    createTextNode: value => new Element('#text', value), querySelectorAll: selector => head.querySelectorAll(selector) };
  globalThis.location = { hostname: 'localhost' };
  try { await run(body); } finally { Object.assign(globalThis, previous); }
}
const button = (root, text) => {
  const node = findAll(root, item => item.tagName === 'button' && item.textContent === text)[0];
  assert.ok(node, `Missing button ${text}`);
  return node;
};
function checkUI(root) {
  noJapanese(root.textContent);
  for (const node of findAll(root, () => true)) {
    for (const key of ['aria-label', 'placeholder', 'title']) if (node.attrs[key]) noJapanese(node.attrs[key]);
  }
}

test('combine renders English catalog choices, examples, editing, plan and confirmation through its normal entry point', async () => withDocument(async body => {
  const applied = [];
  globalThis.fetch = async (input, options) => {
    const url = String(input);
    if (url === '/api/status') return Response.json({ app: true, features: { recipes: true } });
    if (url.endsWith('/recipes.json') || url === '/api/recipes/catalog') return Response.json(savedRecipes);
    if (url === '/api/recipes/recommend') return Response.json({ recipes: savedRecipes.examples });
    if (url === '/api/recipes/plan') return Response.json({ files: [{ path: 'PLAN.md', content: 'Review the task.' }],
      manual: ['Sign in to the selected apps.'], unsupported: [{ what: 'frontend', why: 'unverified' }],
      directories: ['project'], workspace: 'fixture-workspace', harnesses: [{ ...savedRecipes.examples[0].conductor, role: 'conductor', argv: ['example'], env: { EXAMPLE: 'fixture' } }] });
    if (url === '/api/recipes/apply') { applied.push(JSON.parse(options.body)); return Response.json({ workspace: 'fixture-workspace' }); }
    return new Response('', { status: 404 });
  };
  openCombine(); await tick(); await tick();
  assert.match(body.textContent, /What would you like to do/);
  const wish = body.querySelector('#combine-wish'); wish.dispatch('input', 'research and review');
  await findAll(body, node => node.tagName === 'form')[0].dispatch('submit');
  assert.match(body.textContent, /Combine conductor, research and review roles/); checkUI(body);
  button(body, 'Adjust this combination').dispatch('click');
  assert.match(body.textContent, /AGENTS.md \(shared instructions\)/); checkUI(body);
  await button(body, 'Use this combination').dispatch('click');
  assert.match(body.textContent, /Instruction style|Review and use the plan/); checkUI(body);
  button(body, 'Create workspace').dispatch('click');
  assert.match(body.textContent, /Create a workspace with these settings/); checkUI(body);
  await button(body, 'Confirm and create').dispatch('click');
  assert.match(body.textContent, /Workspace created at fixture-workspace/); checkUI(body);
  assert.equal(applied.length, 1);
  assert.deepEqual(Object.keys(applied[0].recipe).sort(), Object.keys(savedRecipes.examples[0]).sort(), 'display translations never enter strict recipe payloads');
  assert.equal(recipes.roleName('reviewer'), 'Reviewer');
  noJapanese(recipes.helperHandoff({}, null).text);
  noJapanese(recipes.draftErrors(null, {}).join(' '));
  await assert.rejects(recipes.requestJson('/fixture', { fetcher: async () => new Response('', { status: 404 }) }), /local Model Memento app/);
}));

test('world renders English counts, arrivals, saved search and record details offline', async () => withDocument(async body => {
  const record = { id: 'maker/model', n: 'Example model', r: 'hf', a: 'maker', url: 'https://example.org/model' };
  const screen = createWorldScreen({ currentDay: () => '2026-11-16', fetch: async input => {
    const url = String(input);
    if (url.endsWith('/manifest.json')) return new Response('', { status: 404 });
    if (url.endsWith('/counts.json')) return Response.json(counts);
    if (url.endsWith('/2026-11-16.json.gz')) return Response.json({ models: [record], tools: [] });
    throw new Error(`Unexpected offline request ${url}`);
  }, loadClient: async () => ({ createWorldIndexClient: () => ({ searchNotable: async () => [record] }) }) });
  screen.open(); await tick(); await tick();
  assert.match(body.textContent, /Counts by registry/); assert.match(body.textContent, /unique/); checkUI(body);
  const input = findAll(body, node => node.attrs.name === 'query')[0]; input.value = 'model';
  for (const [name, value] of [['kind', 'text'], ['registry', 'all'], ['mode', 'saved']]) findAll(body, node => node.attrs.name === name)[0].value = value;
  await findAll(body, node => node.tagName === 'form' && node.className === 'world-search')[0].dispatch('submit');
  assert.match(body.textContent, /Records shown · 1/); checkUI(body);
  await button(body, 'View record').dispatch('click');
  assert.match(body.textContent, /Approval before use/); checkUI(body);
  assert.match(countSummary({ registries: { hf: { count: 2, meta: {} } } }).rows[0].method, /unique registry IDs/);
  const client = createWorldIndexClient({ fetch: async () => Response.json({}), cacheStorage: null });
  await assert.rejects(client.lookup('bad registry', 'id'), /Check the registry/);
  screen.close();
}));

test('guides publish bilingual fields and render English cards, filters and technique history', async () => withDocument(async body => {
  globalThis.fetch = async input => String(input).endsWith('/guides.json') ? Response.json(index) : Response.json({ files: [] });
  for (const guide of index.guides) { const card = guideCard(guide, index); checkUI(card); assert.ok(card.textContent.includes(guide.title_en)); }
  assert.ok(filterGuides(index, { query: 'acceptance' }).length > 0 || filterGuides(index, { query: 'success criteria' }).length > 0);
  await openGuides({ toolId: 'aider' }); await tick(); checkUI(body);
  assert.match(body.textContent, /Prompting guides/);
  body.querySelector('#guides-technique').dispatch('change', 'skills'); checkUI(body);
  assert.match(body.textContent, /earliest evidenced dates/);
  button(body, 'Clear all filters').dispatch('click'); await tick(); checkUI(body);
  for (const id of ['combine', 'guides', 'world']) {
    const entry = getNavEntries().find(row => row.id === id); noJapanese(entry.label); noJapanese(entry.description);
  }
}));

test('news keeps the original headline and hides its Japanese summary in English mode', async () => withDocument(async () => {
  const now = '2026-11-16T01:00:00Z';
  const screen = createNewsScreen({ now: () => now, load: async () => ({ fetchedAt: now, statuses: [], items: [{
    schema: 'memento.news.v1', id: 'example', title: 'Original headline', lang: 'en', kind: 'prompting', date: now,
    dateBasis: 'observed', url: 'https://example.org/news', source: { name: 'Example source', url: 'https://example.org/' },
    summary: '日本語の要約です。', summaryLabel: 'AI による要約', summaryBasis: 'headline',
  }] }) });
  await screen.refresh(); checkUI(screen.element);
  assert.match(screen.element.textContent, /Original headline/); assert.match(screen.element.textContent, /Example source/);
  assert.match(screen.element.textContent, /Nov/); assert.equal(findAll(screen.element, node => node.className === 'news-summary').length, 0);
  screen.destroy();
}));

test('admin labels, job descriptions and bilingual result fields render in English', async () => withDocument(async body => {
  const client = { connect: async () => ({ jobs: [{ id: 'refresh-quick', title: '新しい情報を調べる', description: '少ない回数でモデル・道具・ニュース・リンクを確認します。' }] }),
    list: async () => ({ jobs: [{ id: 'one', job: 'refresh-quick', startedAt: '2026-11-16T00:00:00Z', state: 'succeeded' }] }),
    get: async () => ({ job: { state: 'succeeded', events: [], result: { summary: '確認を終えました。', summary_en: 'Checks completed.' } } }),
    drafts: async () => ({ drafts: [] }) };
  const admin = await mountAdmin({ target: body, localApp: true, client });
  await button(body, 'Maintenance').dispatch('click'); checkUI(body);
  assert.match(body.textContent, /Check for new information/); assert.equal(labels.running, 'Running');
  await findAll(body, node => node.tagName === 'button' && node.textContent.startsWith('Check for new information — Completed'))[0].dispatch('click');
  assert.match(body.textContent, /Checks completed/); checkUI(body);
  const unavailable = createClient({ fetch: async () => new Response('', { headers: { 'content-type': 'text/html' } }) });
  await assert.rejects(unavailable.connect(), /local app/);
  admin.destroy();
}));

test('link status and patch validity remain independent of translated labels', () => {
  assert.equal(statusLabel(null), 'unverified');
  for (const state of ['ok', 'redirected', 'gone', 'failing', 'blocked']) noJapanese(statusLabel({ checkedAt: '2026-11-16', lastOkAt: '2026-11-15', state,
    runtime: { state: 'ok', stage: 'SLEEPING' } }));
  assert.match(statusLabel({ checkedAt: '2026-11-16', state: 'ok', runtime: { stale: true } }), /runtime unverified/);
  assert.equal(patchLabel({ id: '26.7' }), 'Information as of 26.7');
  const node = new Element('p'); setPatchLabel(node, { id: '26.7' }); assert.equal(node.attrs['data-patch-id'], '26.7');
  setPatchLabel(node, null); assert.equal(node.getAttribute('data-patch-id'), null); noJapanese(node.textContent);
});
