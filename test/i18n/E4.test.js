import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Element, installDOM } from '../era/dom.js';

globalThis.__MEMENTO_LANG = 'en';

const catalog = {
  gemini: 'google-bard-gemini',
  gpt2: 'openai-gpt-2-interactive',
  'hermes-agent': 'hermes-agent',
  huggingchat: 'huggingchat',
  lmstudio: 'lm-studio',
  n8n: 'n8n',
  ollama: 'ollama',
  openclaw: 'openclaw-formerly-clawdbot-moltbot',
  opencode: 'opencode',
  openwebui: 'open-webui',
  'pi-coding-agent': 'pi-coding-agent',
  playground: 'openai-playground',
  windsurf: 'windsurf',
  zed: 'zed'
};
const renderers = Object.fromEntries(await Promise.all(Object.keys(catalog).map(async name =>
  [name, await import(`../../web/js/tools/${name}.js?en`)]
)));
const { renderTool } = await import('../../web/js/tools/index.js?en');
const japanese = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
const versions = name => JSON.parse(fs.readFileSync(new URL(`../../design/specs/${catalog[name]}.json`, import.meta.url), 'utf8')).versions;

// Extend the existing event fixture only for DOM operations used by these screens.
// This fixture checks strings and interactions without measuring browser layout.
class ScreenElement extends Element {
  constructor(tag) {
    super(tag);
    this.classList.remove = (...names) => names.forEach(name => this.classList.toggle(name, false));
  }
  removeAttribute(key) { delete this.attrs[key]; }
  get childNodes() { return this.children; }
  get previousElementSibling() {
    return this.parentNode?.children[this.parentNode.children.indexOf(this) - 1] || null;
  }
  matches(selector) {
    const excluded = [...selector.matchAll(/:not\(([^)]+)\)/g)];
    return excluded.every(([, value]) => !super.matches(value))
      && super.matches(selector.replace(/:not\([^)]+\)/g, ''));
  }
  querySelectorAll(selector) {
    if (selector.includes(' > ')) {
      const [parent, child] = selector.split(' > ');
      const parents = parent === ':scope' ? [this] : super.querySelectorAll(parent);
      return parents.flatMap(node => node.children.filter(item => item.matches(child)));
    }
    return super.querySelectorAll(selector);
  }
  requestSubmit() { this.dispatch('submit'); }
}

function setup(t) {
  installDOM(t);
  document.createElement = tag => new ScreenElement(tag);
  const previous = { observer: globalThis.MutationObserver, fetch: globalThis.fetch };
  const observers = [];
  globalThis.MutationObserver = class {
    constructor(callback) { this.callback = callback; }
    observe() { observers.push(this); }
  };
  globalThis.fetch = () => { throw new Error('E4 tests run offline'); };
  t.after(() => {
    if (previous.observer === undefined) delete globalThis.MutationObserver;
    else globalThis.MutationObserver = previous.observer;
    globalThis.fetch = previous.fetch;
  });
  return () => observers.forEach(observer => observer.callback());
}

function context(name, version, overrides = {}) {
  return {
    tool: { id: catalog[name], name, description: 'Example tool' },
    version, model: { name: 'Example model' }, messages: [],
    send() {}, open() {}, newChat() {}, ...overrides
  };
}

function screen(name, id, overrides) {
  const version = versions(name).find(item => item.id === id);
  assert.ok(version, id);
  return renderers[name].render(context(name, version, overrides));
}

function english(root, label = 'screen') {
  assert.doesNotMatch(root.textContent, japanese, label);
  for (const node of [root, ...root.querySelectorAll('*')]) {
    for (const attr of ['placeholder', 'data-placeholder', 'title', 'aria-label']) {
      assert.doesNotMatch(node.getAttribute(attr) || '', japanese, `${label} ${attr}`);
    }
  }
}

function named(root, text) {
  const node = root.querySelectorAll('button').find(item => item.textContent === text);
  assert.ok(node, `Button ${text}`);
  return node;
}

test('E4 renders every assigned spec edition with English screen text and placeholders', t => {
  setup(t);
  let count = 0;
  for (const name of Object.keys(catalog)) {
    for (const version of versions(name)) {
      const root = renderers[name].render(context(name, version, { isAdmin: true, webSearchEnabled: true, model: { name: 'Example model', reasoning: true } }));
      english(root, version.id);
      assert.ok(root.querySelectorAll('a').some(node => /^https:\/\//.test(node.getAttribute('href'))), `${version.id} sources`);
      count++;
    }
  }
  console.log(`E4 English inventory · ${count} spec editions across ${Object.keys(catalog).length} renderers`);
});

test('E4 Gemini starter cards send English prompts and preserve historical English labels', t => {
  setup(t);
  const sent = [];
  const root = screen('gemini', 'google-bard-gemini-2024-02', { send: text => sent.push(text) });
  const cards = root.querySelectorAll('.era-starter-card');
  assert.equal(cards.length, 4);
  assert.equal(cards[0].textContent, 'Organize thoughts');
  cards.forEach(card => card.click());
  assert.deepEqual(sent, [
    'Ask me questions to help organize my thoughts',
    'Give me tips for summarizing text',
    'Explain how to make a learning plan',
    'Give me tips for explaining a difficult topic simply'
  ]);
  sent.forEach(text => assert.doesNotMatch(text, japanese));
  const gpt2 = screen('gpt2', 'openai-gpt-2-2019-02');
  assert.equal(gpt2.querySelector('.prompt-glyph').textContent, 'Model prompt >>>');
  gpt2.querySelector('textarea').dispatch('keydown', { key: 'Enter' });
  assert.equal(gpt2.querySelector('[role="status"]').textContent, 'Please enter text.');
  assert.equal(gpt2.querySelector('[role="status"]').hidden, false);
});

test('E4 terminal controls update English statuses and accessible labels', t => {
  setup(t);
  const hermes = screen('hermes-agent', 'nousresearch--hermes-agent-2026-09-5', { model: null });
  named(hermes, '/verbose · Tool detail level').click();
  assert.equal(hermes.querySelector('[role="status"]').textContent, 'Detailed tool output · shown (example). No tools are running.');
  assert.equal(hermes.querySelector('.d4-session-status').getAttribute('aria-label'), 'Chat status');
  assert.match(hermes.textContent, /Model · Not selected/);
  english(hermes);
  const tui = screen('hermes-agent', 'hermes-agent-2026-05');
  named(tui, '/details · Details').click();
  assert.equal(tui.querySelector('[role="status"]').textContent, 'Tool details · hidden (example).');
  const pi = screen('pi-coding-agent', 'earendil-works--pi-record', { model: null });
  named(pi, 'Fullscreen layout').click();
  assert.equal(pi.querySelector('[role="status"]').textContent, 'The input and status areas scroll with the history.');
  const effort = pi.querySelector('select');
  assert.equal(effort.getAttribute('aria-label'), 'Reasoning effort example');
  effort.value = 'strong'; effort.dispatch('change');
  assert.match(pi.querySelector('[role="status"]').textContent, /Example input border showing reasoning effort/);
  english(pi);
});

test('E4 workflow and work-pane interactions stay in English', t => {
  setup(t);
  const workflow = screen('n8n', 'n8n-2025-08');
  named(workflow, 'Add the first node').click();
  named(workflow, 'OpenAI Chat Model').click();
  named(workflow, 'Run').click();
  assert.equal(workflow.querySelector('.d3-node-details').getAttribute('aria-label'), 'Selected node details');
  assert.match(workflow.textContent, /Actual processing is unavailable/);
  english(workflow);
  const lm = screen('lmstudio', 'lm-studio-2026-11');
  const lmTabs = lm.querySelector('select');
  lmTabs.value = 'Files'; lmTabs.dispatch('change');
  assert.equal(lm.querySelector('.d3-work-view').textContent, 'Files will appear as needed for the task.');
  const windsurf = screen('windsurf', 'windsurf-2026-11');
  const windsurfTabs = windsurf.querySelector('select');
  windsurfTabs.value = 'Changes'; windsurfTabs.dispatch('change');
  assert.equal(windsurf.querySelector('.d3-work-view').textContent, 'Changes will appear as needed for the task.');
  const webui = screen('openwebui', 'open-webui-2026-11');
  const tabType = webui.querySelector('select'); tabType.value = 'Files';
  named(webui, '＋ Add tab').click();
  named(webui, 'Files').click();
  assert.equal(webui.querySelector('.d3-work-content').textContent, 'Files contents will appear based on the connection or task.');
  english(webui);
});

test('E4 translated choices still drive conditional controls and English example prompts', t => {
  setup(t);
  const arena = screen('windsurf', 'windsurf-2026-01');
  const routing = arena.querySelector('select');
  routing.value = 'Continue separately'; routing.dispatch('change');
  assert.equal(arena.querySelectorAll('.composer').length, 2);
  assert.equal(arena.querySelectorAll('textarea')[1].getAttribute('placeholder'), 'Request for comparison B');
  routing.value = 'Send to both'; routing.dispatch('change');
  assert.equal(arena.querySelectorAll('.composer').length, 1);
  const sent = [];
  const huggingchat = screen('huggingchat', 'huggingchat-2023-04', { send: text => sent.push(text) });
  named(huggingchat, 'Brainstorm writing ideas').click();
  named(huggingchat, 'Explain simply').click();
  assert.deepEqual(sent, ['Suggest ideas for a short piece of writing', 'Explain how to use AI in simple terms']);
  const openclaw = screen('openclaw', 'openclaw-2026-03-macos');
  named(openclaw, 'Open chat').click();
  assert.equal(openclaw.querySelector('.chat-main').hidden, false);
  assert.equal(named(openclaw, 'Open chat').getAttribute('aria-label'), 'Open chat in a separate view');
  english(openclaw);
});

test('E4 message decorations translate reasoning, tool details, roles, and approval controls', t => {
  const update = setup(t);
  for (const [name, id] of [
    ['huggingchat', 'huggingchat-2026-11'],
    ['lmstudio', 'lm-studio-2026-11'],
    ['ollama', 'ollama-2026-03-macos'],
    ['windsurf', 'windsurf-2025-11'],
    ['zed', 'zed-2026-11-macos'],
    ['openwebui', 'open-webui-2026-11'],
    ['n8n', 'n8n-2026-11'],
    ['gemini', 'google-bard-gemini-2023-07'],
    ['playground', 'openai-playground-2025-06'],
    ['openclaw', 'openclaw-2026-11'],
    ['opencode', 'opencode-2026-11']
  ]) {
    const messages = [
      { role: 'user', content: 'Question' },
      { role: 'assistant', content: 'Answer', reasoning: 'Example reasoning', reasoning_ms: 1250, tool_calls: [{ arguments: {}, result: 'Example result', status: 'awaiting_approval' }] }
    ];
    const root = screen(name, id, { messages });
    const log = root.querySelector('.thread');
    for (const message of messages) {
      const node = document.createElement('article'); node.className = `message ${message.role}`;
      const label = document.createElement('span'); label.className = 'message-label'; label.textContent = message.role === 'user' ? 'You' : 'Assistant';
      const text = document.createElement('div'); text.className = 'answer-text'; text.textContent = message.content;
      node.append(label, text); log.append(node);
    }
    update();
    assert.equal(log.querySelector('.message.user .message-label').textContent, 'You', name);
    if (['huggingchat', 'lmstudio', 'ollama'].includes(name)) assert.match(log.textContent, /Reasoning \(1\.3 s\)/, name);
    if (['huggingchat', 'lmstudio', 'ollama', 'windsurf', 'zed'].includes(name)) assert.match(log.textContent, /Tool details/, name);
    if (name === 'lmstudio') assert.ok(named(log, 'Allow once'));
    english(root, name);
  }
});

test('E4 auto-synced cards use sibling English labels and feature arrays through renderTool', async t => {
  setup(t);
  const version = {
    ...versions('gpt2')[0], autoSynced: true,
    label: '日本語の版名', label_en: 'English edition',
    features: ['日本語の機能'], features_en: ['First feature', 'Second feature', 'Third feature', 'Fourth feature']
  };
  const root = await renderTool(context('gpt2', version));
  const card = root.querySelector('.auto-sync-card');
  assert.match(card.textContent, /Fetched by CI · English edition/);
  assert.deepEqual(card.querySelectorAll('li').map(node => node.textContent), ['First feature', 'Second feature', 'Third feature']);
  english(root);
  const fallback = await renderTool(context('gpt2', { ...version, features_en: [] }));
  assert.equal(fallback.querySelector('li').textContent, 'Upstream release English edition');
});
