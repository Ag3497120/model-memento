import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, Element } from '../era/dom.js';
import { mountModelSwitch, modelSlotNames } from '../../web/js/era/model-switch.js';

const renderers = {
  aider: 'aider', bing: 'bing-chat-microsoft-copilot', 'cherry-studio': 'cherry-studio',
  cline: 'cline-formerly-claude-dev', continue: 'continue', gpt2: 'openai-gpt-2-interactive',
  'hermes-agent': 'hermes-agent', huggingchat: 'huggingchat', lmstudio: 'lm-studio', n8n: 'n8n',
  ollama: 'ollama', openclaw: 'openclaw-formerly-clawdbot-moltbot', openwebui: 'open-webui',
  'pi-coding-agent': 'pi-coding-agent', zed: 'zed'
};
const read = (folder, id) => JSON.parse(readFileSync(new URL(`../../design/${folder}/${id}.json`, import.meta.url), 'utf8'));
const modules = Object.fromEntries(await Promise.all(Object.keys(renderers).map(async file => [file, await import(`../../web/js/tools/${file}.js`)])));
const noAssets = (root, id) => assert.equal(root.querySelector('img,svg,picture,canvas'), null, `${id}: no product artwork, including SVG paths`);
function setup(t) {
  installDOM(t);
  const previous = { observer: globalThis.MutationObserver, fetch: globalThis.fetch };
  const observers = [];
  globalThis.MutationObserver = class {
    constructor(update) { this.update = update; }
    observe() { observers.push(this); }
  };
  globalThis.fetch = () => { throw new Error('D3 renderer tests must stay offline'); };
  t.after(() => {
    if (previous.observer === undefined) delete globalThis.MutationObserver;
    else globalThis.MutationObserver = previous.observer;
    globalThis.fetch = previous.fetch;
  });
  return () => observers.forEach(observer => observer.update());
}
function context(file, version, overrides = {}) {
  return { tool: { id: renderers[file], name: file }, version, model: { name: 'Example model' }, messages: [], newChat() {}, open() {}, send() {}, ...overrides };
}
function render(file, id, overrides) {
  const version = read('specs', renderers[file]).versions.find(v => v.id === id);
  assert.ok(version, id);
  return modules[file].render(context(file, version, overrides));
}
function message(root, role, text) {
  const item = new Element('article'); item.className = `message ${role}`;
  const label = new Element('span', role); label.className = 'message-label';
  const answer = new Element('div', text); answer.className = 'answer-text';
  item.append(label, answer); root.querySelector('.thread').append(item); return item;
}

// One independent rights regression per renderer, covering every spec edition.
for (const [file, tool] of Object.entries(renderers)) {
  test(`D3 ${file}: all editions and streaming DOM contain no image or SVG artwork`, t => {
    const flush = setup(t);
    for (const version of read('specs', tool).versions) {
      const root = modules[file].render(context(file, version));
      noAssets(root, version.id);
      assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1, version.id);
      const sources = root.querySelector('.d3-fidelity-sources');
      assert.ok(sources?.querySelector('a'), `${version.id}: source disclosure retains links`);
      assert.ok(!sources.open, `${version.id}: evidence collapsed initially`);
      for (const note of root.querySelectorAll('.era-terminal-reference,.d3-unverified,.d4-status')) {
        assert.ok(note.closest('.d3-fidelity-sources'), `${version.id}: caveat remains in disclosure`);
      }
      const log = root.querySelector('.thread');
      if (!log) continue;
      const assistant = message(root, 'assistant is-thinking', 'Answer');
      // Simulate the host's later streaming decoration, including a path. These
      // nodes are removed even when appended after the renderer has returned.
      const chrome = new Element('div'); chrome.className = 'stream-fx-head';
      const vector = new Element('svg'); vector.append(new Element('path')); chrome.append(vector); assistant.append(chrome);
      flush(); noAssets(root, `${version.id}: after host decoration`);
      assert.equal(log.getAttribute('aria-busy'), 'true');
      assistant.classList.toggle('is-thinking', false); assistant.classList.add('is-complete');
      flush(); assert.equal(log.getAttribute('aria-busy'), 'false');
      assert.equal(assistant.querySelectorAll('.d3-generation-label').length, 1);
    }
  });
}

test('D3 retains the sourced edition model slots and slash-command interception', t => {
  setup(t);
  let editions = 0, slots = 0, commands = 0;
  for (const [file, tool] of Object.entries(renderers)) {
    for (const era of read('era', tool).versions) {
      const sent = [], root = modules[file].render(context(file, era, { send: text => sent.push(text) }));
      const slot = modelSlotNames(era.model_switch).map(name => root.querySelector(`[data-era-slot="${name}"]`)).find(Boolean);
      const controller = mountModelSwitch(root, { era, currentModel: { name: 'Example model' }, onPick() {} });
      if (slot && era.model_switch.sources.length && era.model_switch.where !== 'none') {
        assert.ok(controller.mounted, era.id); slots++;
      }
      if (era.model_switch.where === 'none') assert.equal(controller.mounted, false, era.id);
      const input = root.querySelector('[data-era-input]');
      if (input && era.model_switch.where === 'slash-command') {
        const command = /\/[a-z]+\b/.exec(era.model_switch.label)?.[0];
        assert.ok(command, era.id); input.value = command;
        assert.equal(input.dispatch('keydown', { key: 'Enter' }).defaultPrevented, true, era.id);
        assert.deepEqual(sent, [], era.id);
        assert.ok(root.querySelector('[data-era-model-panel]'), era.id); commands++;
      }
      controller.dispose(); editions++;
    }
  }
  console.log(`D3 model inventory: ${editions} editions, ${slots} sourced slots, ${commands} slash-command flows.`);
  assert.ok(editions >= 100); assert.ok(slots >= 50); assert.ok(commands >= 20);
});

test('D3 n8n model subnode opens settings without becoming a sequential output', t => {
  setup(t);
  const root = render('n8n', 'n8n-2024-09');
  root.querySelector('.workflow-canvas button').click();
  assert.equal(root.querySelectorAll('.d3-workflow-flow .workflow-node').length, 3);
  const model = root.querySelector('.d3-workflow-model-branch .model');
  assert.ok(model); assert.equal(root.querySelector('.workflow-chat').hidden, true);
  model.click();
  assert.equal(root.querySelector('.d3-node-details').hidden, false);
  assert.equal(model.getAttribute('aria-pressed'), 'true');
  const slot = root.querySelector('[data-era-slot="settings"]');
  assert.equal(slot.parentNode.hidden, false);
  noAssets(root, 'n8n expanded canvas');
});

test('D3 code gutters preserve code text and file selection after a transcript update', t => {
  const flush = setup(t);
  for (const [file, id] of [['continue', 'continue-2024-11'], ['cline', 'cline-2025-07'], ['zed', 'zed-2024-05-macos']]) {
    const root = render(file, id);
    const code = root.querySelector('.code-content');
    assert.match(code.textContent, /\n/);
    assert.ok(code.querySelectorAll('.d3-code-line').length >= 3);
    root.querySelectorAll('.explorer button').at(-1).click();
    const selected = code.textContent; flush();
    assert.equal(code.textContent, selected, file);
    assert.ok(code.querySelector('.d3-code-line'), file);
    assert.equal(root.querySelector('.editor-tab').textContent, 'README.md');
  }
});

test('D3 Open WebUI response actions retry the real preceding question once', t => {
  const flush = setup(t), sent = [], opened = [];
  const root = render('openwebui', 'open-webui-2024-09', { send: text => sent.push(text), open: target => opened.push(target) });
  message(root, 'user', 'Actual question');
  const response = message(root, 'assistant is-complete', 'Actual answer');
  flush(); flush();
  assert.equal(response.querySelectorAll('.d3-answer-actions').length, 1);
  const actions = response.querySelectorAll('.d3-answer-actions button');
  actions.at(-1).click(); assert.deepEqual(sent, ['Actual question']);
  actions[1].click(); assert.deepEqual(opened, ['votes']);
  assert.ok(actions[0].hasAttribute('disabled'));
});

test('D3 GPT-2 keeps a terminal prompt and warns before empty input clears', t => {
  setup(t);
  const root = render('gpt2', 'openai-gpt-2-2019-11');
  assert.equal(root.querySelector('.prompt-glyph').textContent, 'Model prompt >>>');
  const input = root.querySelector('[data-era-input]'); input.value = '';
  input.dispatch('keydown', { key: 'Enter' });
  assert.equal(root.querySelector('.d1-input-error').hidden, false);
  assert.ok(root.querySelector('.d3-fidelity-sources .era-terminal-reference'));
});
