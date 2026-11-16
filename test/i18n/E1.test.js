import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { Element, installDOM, testEra } from '../era/dom.js';

globalThis.__MEMENTO_LANG = 'en';
const frame = await import('../../web/js/era/frame.js?en');
const eraData = await import('../../web/js/era/data.js?en');
const accents = await import('../../web/js/era/accents.js?en');
const modelSwitch = await import('../../web/js/era/model-switch.js?en');
const transition = await import('../../web/js/era/transition.js?en');
const generic = await import('../../web/js/generic.js?en');
const surface = await import('../../web/js/surface.js?en');
const sources = await import('../../web/js/real-capture-viewer.js?en');
const runtime = await import('../../web/js/model/runtime.js?en');
const stream = await import('../../web/js/stream-fx.js?en');
const modelPage = await import('../../web/js/model/index.js?en');
const blend = await import('../../web/js/allstar.js?en');
const japanese = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

function english(root) {
  assert.doesNotMatch(root.textContent, japanese);
  for (const node of [root, ...root.querySelectorAll('*')]) {
    for (const name of ['aria-label', 'placeholder', 'title']) assert.doesNotMatch(node.getAttribute(name) || '', japanese);
  }
}

test('E1 frame, deterministic clocks and unofficial notice render in English', t => {
  const make = installDOM(t), desktop = make('div'), menuBar = make('nav'), shell = make('header');
  frame.renderEraFrame({ desktop, menuBar, shell, tool: { name: 'Example' }, version: {}, era: testEra(), onMenu() {} });
  assert.equal(eraData.formatEraClock('2023-03-14'), 'Tue, Mar 14, 2023');
  assert.equal(eraData.formatEraClock('2023-03-14T09:30'), 'Tue, Mar 14, 2023 09:30');
  assert.equal(eraData.formatEraClock('2023-02-30'), 'Date unverified');
  assert.match(frame.unofficialNotice, /Unofficial recreation/);
  assert.doesNotMatch(frame.unofficialNotice, japanese);
  english(menuBar); english(shell);
  const fallback = eraData.eraForVersion({}, { id: 'example' }, { id: 'missing' });
  assert.match(fallback.model_switch.steps[0], /unverified/);
});

test('E1 era controls select English siblings while preserving Japanese placement parsing and fallback', t => {
  const make = installDOM(t), root = make('div'), slot = make('div');
  slot.setAttribute('data-era-slot', 'top'); root.append(slot);
  const era = testEra('input-bar');
  era.model_switch.steps_en = ['Choose a recorded model.'];
  era.model_switch.notes = '日本語の注記'; era.model_switch.notes_en = 'Recorded options only.';
  const mounted = modelSwitch.mountModelSwitch(root, { era, onPick() {} });
  mounted.open();
  assert.match(root.textContent, /Choose a recorded model/); english(root); mounted.dispose();
  const accent = { kind: 'beta-badge', text: '日本語', text_en: 'Historical beta', where: '上部', where_en: 'Top of screen', sources: ['https://example.com/source'] };
  assert.deepEqual(accents.accentSlotNames(accent), ['top']);
  const card = accents.accentCard(accent, { demo: true, threshold: { count: 5, verified: false } });
  assert.match(card.textContent, /Historical beta/); english(card);
  assert.match(accents.accentCard({ ...accent, text_en: undefined }).textContent, /日本語/);
});

test('E1 transitions use translated notices and trend captions', async t => {
  const make = installDOM(t), host = make('aside'), callbacks = [];
  const effect = transition.createEraTransition({ host, reducedMotion: () => true,
    schedule: callback => { callbacks.push(callback); return callbacks.length; }, unschedule() {} });
  const era = { ...testEra(), trend_en: 'Conversation-first layout' };
  const from = { tool: { id: 'example' }, version: { id: 'old', from: '2022-01-01' } };
  const to = { tool: { id: 'example' }, version: { id: 'new', from: '2023-03-14' }, era };
  const done = effect.run({ from, to, swap: async () => {} });
  await Promise.resolve();
  assert.match(host.textContent, /Conversation-first layout/); english(host);
  effect.cancel(); await done;
});

test('E1 generic screens and source panels use English inline text and sibling data', t => {
  installDOM(t);
  const version = { id: 'example-2023', from: '2023-03-14', label: '日本語の版', label_en: 'Recorded edition', features: ['機能'], features_en: ['Recorded feature'] };
  const tool = { id: 'example', name: 'Example', tier: 'C', description: '説明', description_en: 'Example description', versions: [version] };
  const ctx = { tool, version, model: { name: 'Model A' }, messages: [], send() {}, open() {} };
  for (const archetype of ['generic', 'terminal', 'ide', 'vscode-panel', 'desktop-chat', 'messaging', 'mcp-server', 'workflow-canvas', 'dashboard', 'notebook', 'framework', 'browser-agent', 'web-builder']) {
    const root = generic.render({ ...ctx, tool: { ...tool, archetype } });
    english(root);
  }
  const tree = generic.render({ ...ctx, tool: { ...tool, tier: 'B', spec: { layout: { t: 'col', c: [{ t: 'thread', label: '会話', label_en: 'Conversation' }, { t: 'composer', label: '入力', label_en: 'Message' }] } } } });
  english(tree);
  const root = document.createElement('div');
  sources.mountWithSourcesPanel(root, document.createElement('main'), { open: true }, {}, tool,
    { ...version, sources: ['https://example.com/source'] }, () => {});
  assert.match(root.textContent, /Sources/); english(root);
  english(surface.composer(ctx)); english(surface.thread(ctx));
});

test('E1 stream labels and report counts use English', () => {
  for (const id of ['claude-code', 'gemini-cli', 'chatgpt']) {
    const profile = stream.resolveStreamProfile({ tool: { id }, version: { id: `${id}-2023`, from: '2023-03-14' } });
    for (const value of Object.values(profile)) if (typeof value === 'string') assert.doesNotMatch(value, japanese);
  }
  assert.equal(runtime.recipeStatsLabel(null), 'Too few reports to display');
  assert.equal(runtime.recipeStatsLabel({ count: 20, ok: 14, partial: 4, failed: 2 }), 'Success 70% · 20 reports');
});

test('E1 model records and blend blueprints show English data and controls', async t => {
  const make = installDOM(t), body = make('body'); document.body = body;
  const previous = { fetch: globalThis.fetch, localStorage: globalThis.localStorage };
  t.after(() => Object.assign(globalThis, previous));
  globalThis.localStorage = { getItem: () => null, setItem() {} };
  globalThis.fetch = async input => {
    const name = String(input).split('/').at(-1);
    const records = {
      'personas.json': [{ model_id: 'fixture', traits: { tone: { value: '口調', value_en: 'Concise', basis: 'researched', source: 'https://example.com/tone' } }, resolution: { warnings: ['注意'], warnings_en: ['Recorded trait.'] } }],
      'real-links.json': { fixture: { links: [{ label: '案内', label_en: 'Access guide', note: '注記', note_en: 'Recorded access.', url: 'https://example.com/access', sources: ['https://example.com/access'] }] } },
      'patch.json': { id: '26.7' }, 'links-status.json': { schema: 'memento.links-status.v1', links: {} }
    };
    return Object.hasOwn(records, name) ? Response.json(records[name]) : new Response('{}', { status: 404 });
  };
  await modelPage.openModelPage({ id: 'fixture', name: 'Fixture model', url: 'https://example.com/model' });
  assert.match(body.textContent, /Speaking style records/); assert.match(body.textContent, /Concise/); english(body);
  const version = { id: 'fixture-2023', from: '2023-03-14', label: '版', label_en: 'Edition', features: ['機能'], features_en: ['Feature'] };
  const tool = { id: 'fixture', name: 'Fixture tool', tier: 'C', versions: [version], description: '説明', description_en: 'Description' };
  const model = { id: 'fixture', name: 'Fixture model' };
  const panel = make('div');
  blend.renderBlendPanel(panel, { state: { tool, version, model }, catalog: { tools: [tool] }, allModels: [model],
    answer: () => ({ text: 'Recorded compatibility.' }), closureContext: () => ({}), selectTool() {}, dialog: make('dialog') });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(panel.textContent, /Appearance reference/); assert.match(panel.textContent, /Model routing/); english(panel);
});

test('E1 app menu, picker, panels, welcome guide and both language switches use normal entry points', async t => {
  installDOM(t);
  class ShellElement extends Element {
    contains(other) { for (let node = other; node; node = node.parentNode) if (node === this) return true; return false; }
    matches(selector) {
      const id = /#([\w-]+)/.exec(selector)?.[1];
      const tag = /^[a-zA-Z][\w-]*/.exec(selector)?.[0];
      return (!id || this.getAttribute('id') === id) && (!tag || this.tagName === tag.toUpperCase())
        && super.matches(selector.replace(/#[\w-]+/g, '').replace(/^[a-zA-Z][\w-]*/, ''));
    }
    append(...nodes) {
      super.append(...nodes);
      if (this.tagName === 'SELECT' && !this.value) this.value = this.children[0]?.value || '';
    }
  }
  document.createElement = tag => new ShellElement(tag);
  document.createTextNode = text => new ShellElement('', String(text));
  const previous = Object.fromEntries(['window', 'location', 'history', 'localStorage', 'fetch', 'requestAnimationFrame', 'MutationObserver'].map(key => [key, globalThis[key]]));
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } });
  const body = new ShellElement('body');
  document.body = body;
  document.querySelectorAll = selector => body.querySelectorAll(selector);
  document.querySelector = selector => body.querySelector(selector);
  document.addEventListener = () => {};
  for (const id of ['era-menu-bar', 'era-desktop', 'era-window-shell', 'era-accents', 'era-transition', 'app', 'settings', 'chrome-dialog', 'chrome-hint']) {
    const node = new ShellElement(['settings', 'chrome-dialog', 'chrome-hint'].includes(id) ? 'dialog' : 'div');
    node.setAttribute('id', id); body.append(node);
  }
  const saved = new Map();
  globalThis.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
  globalThis.location = { href: 'https://example.com/?lang=en', search: '?lang=en' };
  globalThis.history = { replaceState() {} };
  globalThis.window = { sessionStorage: localStorage, dispatchEvent() {}, requestIdleCallback() {} };
  globalThis.requestAnimationFrame = fn => fn();
  globalThis.MutationObserver = class { observe() {} disconnect() {} };
  const model = { id: 'fixture', name: 'Fixture model', release: '2023-01-01', specs: {}, traits: [], evidence: [{ url: 'https://example.com/model' }] };
  const version = { id: 'fixture-2023', from: '2023-03-14', label: '版名', label_en: 'Fixture edition', defaultModel: model.id, available: [model.name],
    harness: { instruction_rules: '日本語の指示', instruction_rules_en: 'Recorded instruction rules.' } };
  const tool = { id: 'fixture', name: 'Fixture tool', tier: 'C', versions: [version], description: '説明', description_en: 'Fixture description' };
  const records = {
    models: [model], closed: [], 'catalog-core': { tools: [tool] }, research: {}, counts: { registries: [], at: '2026-11-16' },
    manifest: { at: '2026-11-16', models: 1, closed: 0, tools: 1, versions: 1, tiers: { A: 0, B: 0, C: 1 } },
    memories: [], instructions: { files: [{ toolId: 'fixture', since: '2023-01-01', path: 'RULES.md', scope: '範囲', scope_en: 'Project', note: '注記', note_en: 'Recorded file.' }] },
    'captured-surfaces': {}, 'vcross-status': null,
    era: { [version.id]: { ...testEra(), tool_id: tool.id, id: version.id, trend_en: 'Fixture trend', model_switch: { where: 'none', steps: [], options: [], sources: [] } } }
  };
  globalThis.fetch = async input => {
    const path = new URL(String(input), 'https://example.com/').pathname;
    if (path === '/api/status') return Response.json({ app: false, features: {} });
    const name = path.split('/').at(-1).replace(/\.json$/, '');
    return Object.hasOwn(records, name) ? Response.json(records[name]) : new Response('{}', { status: 404 });
  };
  await import('../../web/js/app.js?en');
  const nav = await import('../../web/js/nav.js');
  const hint = document.querySelector('#chrome-hint');
  const language = hint.querySelector('.chrome-language-switch');
  assert.ok(language);
  assert.equal(language.textContent, '日本語');
  language.click(); assert.equal(new URL(location.href).searchParams.get('lang'), 'ja');
  language.remove(); english(hint);
  assert.match(document.title, /Model Memento \(unofficial\)/);
  hint.close();
  document.querySelector('#era-menu-bar button').click();
  const menu = document.querySelector('#chrome-dialog');
  assert.match(menu.textContent, /Settings and records/);
  assert.match(menu.textContent, /Unofficial recreation/);
  const entry = nav.getNavEntries().find(item => item.id === 'language');
  assert.equal(entry.group, 'help'); assert.equal(entry.keepMenu, true); assert.equal(entry.label, '日本語');
  menu.querySelector('[data-nav-id="language"]').remove(); english(menu);
  await nav.openNavEntry('language'); assert.equal(saved.get('museum.lang'), 'ja');
  menu.querySelector('[data-chrome-trigger="picker"]').click();
  assert.match(menu.textContent, /Choose a tool, era and model/); english(menu);
  await nav.openNavEntry('search'); english(menu); assert.match(menu.textContent, /Found 1/);
  await import('../../web/js/persona/standin.js');
  for (const id of ['settings', 'models', 'tools', 'blend', 'instructions', 'memories', 'votes', 'research', 'app']) {
    await window.museum.open(id);
    await new Promise(resolve => setImmediate(resolve));
    const panel = document.querySelector('#settings');
    english(panel);
  }
  const html = await fs.readFile(new URL('../../web/index.html', import.meta.url), 'utf8');
  assert.match(html, /data-content-en="A static museum/);
  assert.match(html, /data-en="Loading records…"/);
});
