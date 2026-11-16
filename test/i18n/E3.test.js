import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Element, installDOM } from '../era/dom.js';

globalThis.__MEMENTO_LANG = 'en';

const catalog = {
  aider: 'aider',
  antigravity: 'antigravity',
  bing: 'bing-chat-microsoft-copilot',
  chatgpt: 'chatgpt',
  'cherry-studio': 'cherry-studio',
  'claude-code': 'claude-code',
  'claude-desktop': 'claude-desktop',
  claude: 'claude.ai',
  cline: 'cline-formerly-claude-dev',
  codex: 'openai-codex-cli',
  continue: 'continue',
  copilot: 'github-copilot-vs-code',
  cursor: 'cursor',
  deepseek: 'deepseek',
  'gemini-cli': 'gemini-cli'
};
const renderers = Object.fromEntries(await Promise.all(Object.keys(catalog).map(async name =>
  [name, await import(`../../web/js/tools/${name}.js?en`)]
)));
const versions = name => JSON.parse(readFileSync(new URL(`../../design/specs/${catalog[name]}.json`, import.meta.url), 'utf8')).versions;
const japanese = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

// Extend the event fixture for the DOM operations used by these renderers.
// These tests inspect strings and interaction state without measuring layout.
class ScreenElement extends Element {
  constructor(tag) {
    super(tag);
    this.classList.remove = (...names) => names.forEach(name => this.classList.toggle(name, false));
  }
  matches(selector) {
    const excluded = [...selector.matchAll(/:not\(([^)]+)\)/g)];
    return excluded.every(([, value]) => !super.matches(value))
      && super.matches(selector.replace(/:not\([^)]+\)/g, ''));
  }
  querySelectorAll(selector) {
    if (selector.includes(' > ')) {
      const [parent, child] = selector.split(' > ');
      return super.querySelectorAll(parent).flatMap(node => node.children.filter(item => item.matches(child)));
    }
    return super.querySelectorAll(selector);
  }
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
  globalThis.fetch = () => { throw new Error('E3 tests run offline'); };
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
    for (const attr of ['aria-label', 'placeholder', 'data-base-placeholder', 'title']) {
      assert.doesNotMatch(node.getAttribute(attr) || '', japanese, `${label} ${attr}`);
    }
    assert.doesNotMatch(node.placeholder || '', japanese, `${label} placeholder property`);
  }
}

function named(root, text) {
  const node = root.querySelectorAll('button').find(item => item.textContent === text);
  assert.ok(node, `Button ${text}`);
  return node;
}

function labelled(root, text) {
  const node = root.querySelectorAll('[aria-label]').find(item => item.getAttribute('aria-label') === text);
  assert.ok(node, `Control ${text}`);
  return node;
}

function addMessages(root, messages) {
  const log = root.querySelector('.thread');
  for (const message of messages) {
    const node = document.createElement('article'); node.className = `message ${message.role}`;
    const label = document.createElement('span'); label.className = 'message-label'; label.textContent = message.role === 'user' ? 'You' : 'Assistant';
    const answer = document.createElement('div'); answer.className = 'answer-text'; answer.textContent = message.content;
    node.append(label, answer); log.append(node);
  }
  return log;
}

test('E3 renders every assigned spec edition with English text and accessible labels', t => {
  setup(t);
  let count = 0;
  for (const name of Object.keys(catalog)) {
    for (const version of versions(name)) {
      const root = renderers[name].render(context(name, version));
      english(root, version.id);
      assert.ok(root.querySelectorAll('a').some(node => /^https:\/\//.test(node.getAttribute('href'))), `${version.id} sources`);
      count++;
    }
  }
  console.log(`E3 English inventory · ${count} spec editions across ${Object.keys(catalog).length} renderers`);
});

test('E3 example buttons send the displayed English requests', t => {
  setup(t);
  const sent = [];
  const overrides = { send: text => sent.push(text) };
  const chatgpt = screen('chatgpt', 'chatgpt-2022-11', overrides);
  named(chatgpt, 'Tell me about the history of AI').click();
  named(chatgpt, 'Who are you?').click();
  const bing = screen('bing', 'bing-chat-microsoft-copilot-2024-02', overrides);
  named(bing, 'Summarize text').click();
  const claude = screen('claude', 'claude.ai-2025-07', overrides);
  named(claude, 'Create new').click();
  assert.deepEqual(sent, [
    'Tell me about the history of AI', 'Who are you?',
    'Show me how to summarize text', 'I want to create flashcards for studying.'
  ]);
});

test('E3 Antigravity controls update English notices and placeholders', t => {
  setup(t);
  const launch = screen('antigravity', 'antigravity-2025-11');
  named(launch, 'Editor').click();
  assert.match(launch.querySelector('.d4-editor pre').textContent, /Hello, \$\{name\}/);
  assert.match(launch.querySelector('[role="status"]').textContent, /separate window examples/);
  english(launch);
  const may = screen('antigravity', 'antigravity-2026-05');
  named(may, 'Add a comment').click();
  assert.equal(may.querySelector('textarea').placeholder, 'Enter an artifact comment (sent as a question about the record)');
  named(may, 'New working copy').click();
  assert.match(may.querySelector('[role="status"]').textContent, /separate working copy/);
  english(may);
  const latest = screen('antigravity', 'antigravity-2026-11');
  named(latest, 'Open overview').click();
  named(latest, 'Expand').click();
  assert.ok(named(latest, 'Restore size'));
  named(latest, 'Close overview').click();
  assert.ok(named(latest, 'Expand'));
  const sort = labelled(latest, 'Sort chats');
  sort.value = 'Newest first'; sort.dispatch('change');
  assert.equal(latest.querySelector('[role="status"]').textContent, 'Sort chats · Newest first (example)');
  const purpose = labelled(latest, 'Interface purpose');
  purpose.value = 'development'; purpose.dispatch('change');
  assert.equal(latest.querySelector('[role="status"]').textContent, 'Example view for the selected purpose.');
  english(latest);
});

test('E3 DeepSeek search feedback and history controls remain English', t => {
  setup(t);
  for (const id of ['deepseek-2025-01', 'deepseek-2026-07']) {
    const root = screen('deepseek', id);
    named(root, 'Search').click();
    assert.equal(root.querySelector('[role="status"]').textContent, 'Search enabled (example). This reconstruction does not run web searches.');
    named(root, 'Search').click();
    assert.match(root.querySelector('[role="status"]').textContent, /Search disabled/);
    assert.equal(named(root, 'Add file').getAttribute('title'), 'This reconstruction does not upload files.');
    if (id === 'deepseek-2025-01') {
      named(root, 'Chat history').click();
      assert.equal(root.querySelector('.d4-history').hidden, false);
    }
    english(root);
  }
});

test('E3 Cherry Studio translates option labels while retaining the CSS layout values', t => {
  setup(t);
  const root = screen('cherry-studio', 'cherry-studio-2026-03-macos');
  const format = labelled(root, 'Answer layout');
  assert.deepEqual(format.children.map(option => option.textContent), ['Collapsed', 'Side by side', 'Grid']);
  assert.equal(format.children[2].value, '格子状');
  format.value = format.children[2].value; format.dispatch('change');
  const group = root.querySelector('.d3-model-group');
  assert.equal(group.dataset.layout, '格子状');
  assert.equal(group.hidden, false);
  assert.equal(group.textContent, 'Answers from multiple models appear together in this group.');
  english(root);
});

test('E3 Continue mode changes, stop feedback, and message controls are English', t => {
  const update = setup(t);
  let stopped = 0;
  const root = screen('continue', 'continue-2026-11', { stop: () => stopped++ });
  const mode = labelled(root, 'Select mode');
  mode.value = 'Plan'; mode.dispatch('change');
  assert.equal(root.querySelector('textarea').placeholder, 'Enter a request for Plan');
  assert.equal(named(root, 'Stop').getAttribute('title'), 'Stop generation');
  named(root, 'Stop').click(); assert.equal(stopped, 1);
  const log = addMessages(root, [{ role: 'user', content: 'Question' }]);
  update();
  assert.equal(log.querySelector('.answer-text').getAttribute('aria-label'), 'Edit question');
  english(root);
});

test('E3 message decorations translate reasoning, tool details, counters, and roles', t => {
  const update = setup(t);
  const messages = [
    { role: 'user', content: 'Question' },
    { role: 'assistant', content: 'Answer', reasoning: 'Example reasoning', reasoning_ms: 1250, tool_calls: [{ arguments: {}, result: 'Example result' }] }
  ];
  for (const [name, id] of [
    ['cherry-studio', 'cherry-studio-2026-03-macos'],
    ['continue', 'continue-2025-02'],
    ['bing', 'bing-chat-microsoft-copilot-2023-03'],
    ['chatgpt', 'chatgpt-2022-12'],
    ['gemini-cli', 'gemini-cli-2025-08']
  ]) {
    const root = screen(name, id, { messages });
    const log = addMessages(root, messages);
    update();
    assert.equal(log.querySelector('.message.user .message-label').textContent, 'You', name);
    if (name === 'cherry-studio') assert.match(log.textContent, /Reasoning \(1\.3s\)/);
    if (name === 'cherry-studio' || name === 'continue') assert.match(log.textContent, /Tool details/);
    if (name === 'bing') assert.match(log.textContent, /Reply 1 \(limit unverified\)/);
    if (name === 'chatgpt') assert.ok(named(log, 'Edit question'));
    english(root, name);
  }
});

test('E3 permission examples and marketplace empty states update in English', t => {
  setup(t);
  const claudeCode = screen('claude-code', 'claude-code-2026-08', { model: null });
  named(claudeCode, 'Allow (example)').click();
  assert.equal(claudeCode.querySelector('[role="status"]').textContent, 'Allow selected in this example.');
  named(claudeCode, 'Cancel').click();
  assert.equal(claudeCode.querySelector('[role="status"]').textContent, 'Canceled.');
  assert.match(claudeCode.querySelector('.terminal-status').textContent, /Model Not selected/);
  english(claudeCode);
  const cline = screen('cline', 'cline-formerly-claude-dev-2025-02');
  named(cline, 'Installed').click();
  assert.equal(cline.querySelector('.d2-market-results').textContent, 'No installed tool list.');
  const search = labelled(cline, 'Search external tools');
  search.value = 'example'; search.dispatch('input');
  assert.equal(cline.querySelector('.d2-market-results').textContent, 'No matching tools.');
  named(cline, 'Back to chat').click();
  english(cline);
});
