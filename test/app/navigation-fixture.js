import { Element, installDOM, testEra } from '../era/dom.js';

export const tick = () => new Promise(resolve => setImmediate(resolve));

// State and event fixture. Browser layout is intentionally outside its scope.
let mounts = 0;
export async function mountNavigation(t, { welcome = false, search = '', selection, featured = false, prepare, restGate } = {}) {
  installDOM(t);
  const keys = ['window', 'location', 'history', 'localStorage', 'fetch', 'requestAnimationFrame', 'MutationObserver', 'matchMedia'];
  const previous = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  });
  class ShellElement extends Element {
    constructor(...args) {
      super(...args);
      this.classList.remove = (...names) => { this.className = this.className.split(/\s+/).filter(name => !names.includes(name)).join(' '); };
    }
    get ownerDocument() { return document; }
    get isConnected() { return this === document || Boolean(this.parentNode?.isConnected); }
    get parentElement() { return this.parentNode; }
    contains(other) { for (let node = other; node; node = node.parentNode) if (node === this) return true; return false; }
    matches(selector) {
      const id = /#([\w-]+)/.exec(selector)?.[1];
      const tag = /^[a-zA-Z][\w-]*/.exec(selector)?.[0];
      return (!id || this.getAttribute('id') === id) && (!tag || this.tagName === tag.toUpperCase())
        && super.matches(selector.replace(/#[\w-]+/g, '').replace(/^[a-zA-Z][\w-]*/, ''));
    }
    closest(selector) {
      for (let node = this; node; node = node.parentNode) {
        if (selector.split(',').some(choice => node.matches(choice.trim()))) return node;
      }
      return null;
    }
    removeAttribute(key) { delete this.attrs[key]; }
    append(...nodes) {
      super.append(...nodes);
      if (this.tagName === 'SELECT' && !this.value) this.value = this.children[0]?.value || '';
    }
    addEventListener(type, handler, options) {
      if (options?.once) {
        const once = event => { this.removeEventListener(type, once); handler(event); };
        super.addEventListener(type, once, Boolean(options.capture));
      } else super.addEventListener(type, handler, typeof options === 'object' ? Boolean(options.capture) : options);
    }
    showModal() { this.open = true; this.setAttribute('open', ''); }
    close() { if (this.open) { this.open = false; this.removeAttribute('open'); this.dispatch('close'); } }
  }
  const doc = new ShellElement('document');
  globalThis.document = doc;
  doc.createElement = tag => new ShellElement(tag);
  doc.createTextNode = text => new ShellElement('', String(text));
  doc.documentElement = new ShellElement('html');
  doc.head = new ShellElement('head'); doc.body = new ShellElement('body');
  doc.append(doc.documentElement); doc.documentElement.append(doc.head, doc.body);
  for (const id of ['era-menu-bar', 'era-desktop', 'era-window-shell', 'era-accents', 'era-transition', 'app', 'memento-timeline', 'memento-entrance-note', 'settings', 'chrome-dialog', 'chrome-hint']) {
    const node = new ShellElement(['settings', 'chrome-dialog', 'chrome-hint'].includes(id) ? 'dialog' : 'div');
    node.setAttribute('id', id); doc.body.append(node);
  }
  const saved = new Map(welcome ? [] : [['museum.chrome-hints-v2-era', 'true']]);
  if (selection) saved.set('museum.selection', JSON.stringify(selection));
  globalThis.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
  globalThis.location = { href: 'https://example.com/' + search, search };
  globalThis.history = { replaceState() {} };
  let idle;
  globalThis.window = { sessionStorage: localStorage, dispatchEvent() {}, requestIdleCallback(fn) { idle = fn; } };
  globalThis.requestAnimationFrame = fn => fn();
  globalThis.MutationObserver = class { observe() {} disconnect() {} };
  globalThis.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  const model = { id: 'fixture-model', name: 'Fixture model', release: '2022-01-01', specs: {}, traits: [], evidence: [{ url: 'https://example.com/model' }] };
  const versions = [
    { id: 'fixture-2022', from: '2022-11-30', label: '初期の版', label_en: 'First edition' },
    { id: 'fixture-2023', from: '2023-03-14', label: '次の版', label_en: 'Second edition' }
  ].map(version => ({ ...version, defaultModel: model.id, available: [model.name], sources: ['https://example.com/edition'],
    harness: { instruction_rules: '記録の指示', instruction_rules_en: 'Recorded instruction rules.' } }));
  const tool = { id: 'fixture', name: 'Fixture tool', tier: 'C', versions, description: '説明', description_en: 'Fixture description' };
  const records = {
    models: [model], closed: [], 'catalog-core': { tools: [tool] }, research: {}, counts: { registries: [], at: '2026-11-16' },
    manifest: { at: '2026-11-16', models: 1, closed: 0, tools: 1, versions: 2, tiers: { A: 0, B: 0, C: 1 } },
    memories: [], instructions: { files: [] }, 'captured-surfaces': {}, 'vcross-status': null,
    era: Object.fromEntries(versions.map(version => [version.id, { ...testEra(), tool_id: tool.id, id: version.id,
      desktop: { ...testEra().desktop, date_shown: version.from }, trend_en: 'Fixture trend',
      model_switch: { where: 'none', steps: [], options: [], sources: [] } }])),
    personas: [], 'real-links': {}, patch: { id: '26.7' }, 'links-status': { links: {} },
    guides: { guides: [], publishers: [], techniques: [] }
  };
  prepare?.(records);
  if (featured) records.featured = { schema: 'memento.featured.v1', catalog: records['catalog-core'], models: records.models,
    closed: records.closed, era: records.era, manifest: records.manifest };
  const requests = [];
  globalThis.fetch = async input => {
    const path = new URL(String(input), 'https://example.com/').pathname;
    if (path === '/api/status') return Response.json({ app: false, features: {} });
    const name = path.split('/').at(-1).replace(/\.json$/, '');
    requests.push(name);
    if (restGate && ['models', 'closed', 'catalog-core', 'research', 'counts', 'manifest', 'memories', 'instructions', 'era', 'captured-surfaces', 'vcross-status'].includes(name)) await restGate;
    return Object.hasOwn(records, name) ? Response.json(records[name]) : new Response('{}', { status: 404 });
  };
  await import(`../../web/js/app.js?navigation=${++mounts}`);
  // Legacy E1 tests explicitly exercise the Help surface. Startup itself never opens it.
  if (welcome) window.museum.help({ standalone: true });
  return {
    doc, saved, records, requests, idle: () => idle?.(), museum: window.museum, panel: doc.querySelector('#chrome-dialog'),
    open: () => doc.querySelector('#era-menu-bar button').click(),
    key: (key, props = {}) => (props.target || doc.body).dispatch('keydown', { key, ...props })
  };
}
