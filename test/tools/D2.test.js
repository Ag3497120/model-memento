import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';
import { createStreamFx } from '../../web/js/stream-fx.js';

const renderers = {
  chatgpt: 'chatgpt', 'claude.ai': 'claude', 'claude-code': 'claude-code',
  'claude-desktop': 'claude-desktop', cursor: 'cursor', 'openai-codex-cli': 'codex',
  'google-bard-gemini': 'gemini', 'gemini-cli': 'gemini-cli', opencode: 'opencode',
  'github-copilot-vs-code': 'copilot', windsurf: 'windsurf',
  'openai-playground': 'playground', antigravity: 'antigravity', deepseek: 'deepseek'
};
const read = (folder, id) => JSON.parse(readFileSync(new URL(`../../design/${folder}/${id}.json`, import.meta.url)));
const context = (id, version, sent = []) => ({
  tool: { id, name: id }, version, model: { name: 'Test model' }, messages: [],
  send: value => sent.push(value), open() {}, newChat() {}
});
// Extend the event fixture only for DOM operations used by the real stream helper.
// This is not a layout engine; CSS geometry still needs a browser review.
function installFixture(t) {
  installDOM(t);
  const create = document.createElement;
  function matches(node, selector, scope) {
    const parts = selector.trim().replace(/\s*>\s*/g, ' > ').split(/\s+/);
    const simple = (item, part) => {
      if (part === ':scope') return item === scope;
      const exclusions = [...part.matchAll(/:not\(([^)]+)\)/g)].map(match => match[1]);
      return exclusions.every(value => !item.matches(value)) && item.matches(part.replace(/:not\([^)]+\)/g, ''));
    };
    const at = (item, index) => {
      if (!item || !simple(item, parts[index])) return false;
      if (index === 0) return true;
      if (parts[index - 1] === '>') return at(item.parentNode, index - 2);
      for (let parent = item.parentNode; parent; parent = parent.parentNode) if (at(parent, index - 1)) return true;
      return false;
    };
    return at(node, parts.length - 1);
  }
  document.createElement = tag => {
    const node = create(tag);
    node.classList.remove = (...names) => { for (const name of names) node.classList.toggle(name, false); };
    node.removeAttribute = key => { delete node.attrs[key]; };
    node.closest = selector => {
      for (let item = node; item; item = item.parentNode) if (selector.split(',').some(value => matches(item, value, node))) return item;
      return null;
    };
    node.querySelectorAll = selector => {
      const descendants = item => item.children.flatMap(child => [child, ...descendants(child)]);
      return descendants(node).filter(item => selector.split(',').some(value => matches(item, value, node)));
    };
    return node;
  };
  document.createElementNS = (_namespace, tag) => document.createElement(tag);
  return tag => document.createElement(tag);
}
function observers(t) {
  const callbacks = [], previous = globalThis.MutationObserver;
  globalThis.MutationObserver = class {
    constructor(callback) { callbacks.push(callback); }
    observe() {}
    disconnect() {}
  };
  t.after(() => { if (previous === undefined) delete globalThis.MutationObserver; else globalThis.MutationObserver = previous; });
  return () => { for (const callback of callbacks) callback([]); };
}
function message(make, role, text) {
  const node = make('article'), answer = make('div'), label = make('span');
  node.className = `message ${role}`; answer.className = 'answer-text'; label.className = 'message-label';
  answer.textContent = text; label.textContent = role === 'user' ? 'You' : 'Test model';
  node.append(label, answer); return node;
}

// Renderers emit no media. The shared host may add simple generic
// stream glyphs; those may contain only lines/circles, never a logo path or image.
for (const [id, file] of Object.entries(renderers)) test(`D2 ${file}: every edition stays logo-free and keeps its source disclosure`, async t => {
  const make = installFixture(t), flush = observers(t);
  const { render } = await import(`../../web/js/tools/${file}.js`);
  const source = readFileSync(new URL(`../../web/js/tools/${file}.js`, import.meta.url), 'utf8');
  assert.doesNotMatch(source, /<(?:img|svg)\b|(?:el|createElement)\(\s*['"](?:img|svg)['"]|createElementNS\s*\(/i);
  for (const version of read('specs', id).versions) {
    const ctx = context(id, version), root = render(ctx);
    assert.equal(root.querySelector('img,svg,canvas'), null, version.id);
    assert.equal(root.querySelectorAll('.d2-recreation').length, 1, version.id);
    const disclosure = root.querySelector('.d1-sources,.d2-sources,.d3-sources,.d4-record-note details');
    assert.ok(disclosure, version.id); assert.ok(!disclosure.open, version.id + ' closed by default');
    assert.ok(disclosure.querySelector('a'), version.id + ' source URL');
    for (const note of root.querySelectorAll('.era-terminal-reference,[data-fidelity-note],p.native-footnote')) {
      assert.ok(note.closest('.d1-sources,.d2-sources,.d3-sources,.d4-record-note details'), version.id + ' provenance in disclosure');
    }
    const input = root.querySelector('.composer textarea');
    if (input) assert.ok(input.hasAttribute('data-era-input'), version.id + ' input marker');
    const log = root.querySelector('.thread');
    if (log) {
      const turn = message(make, 'assistant', 'Example response'); log.append(turn);
      const fx = createStreamFx(turn, ctx, true); flush();
      assert.equal(root.querySelectorAll('img,canvas').length, 0, version.id + ' response media');
      for (const graphic of root.querySelectorAll('svg')) {
        assert.ok(['cli-prompt', 'browser-crosshair', 'chat-orbit', 'framework-nodes'].includes(fx.profile.svgType), version.id + ' generic stream glyph');
        for (const shape of graphic.querySelectorAll('*')) {
          assert.ok(['LINE', 'POLYLINE', 'CIRCLE', 'POLYGON'].includes(shape.tagName), version.id + ' simple generic geometry');
          if (shape.tagName === 'POLYGON') assert.equal(shape.getAttribute('points'), '12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5', version.id + ' plain hexagon');
        }
        assert.equal(graphic.querySelectorAll('path,image,use').length, 0, version.id + ' no brand-like paths');
      }
      fx?.dispose?.();
    }
  }
});

test('D2 priority renderers keep every sourced model-switch entry functional', async t => {
  installFixture(t); let mounted = 0;
  for (const id of ['chatgpt', 'claude.ai', 'claude-code', 'cursor', 'openai-codex-cli', 'google-bard-gemini']) {
    const { render } = await import(`../../web/js/tools/${renderers[id]}.js`);
    for (const era of read('era', id).versions) {
      const version = read('specs', id).versions.find(item => item.id === era.id);
      const root = render(context(id, { ...version, ...era }));
      const controller = mountModelSwitch(root, { era, onPick() {} });
      if (['top-dropdown', 'input-bar', 'side-panel', 'settings', 'cli-flag', 'slash-command'].includes(era.model_switch.where) && era.model_switch.sources.length) {
        assert.equal(controller.mounted, true, era.id); mounted++;
      }
      controller.dispose();
    }
  }
  assert.ok(mounted > 40); console.log(`D2 model entry inventory: ${mounted} sourced edition controls mounted.`);
});

test('D2 chat actions survive repeated stream updates and rate only their own answer', async t => {
  const make = installFixture(t), flush = observers(t);
  for (const [id, versionId] of [['chatgpt', 'chatgpt-2024-05'], ['claude.ai', 'claude.ai-2024-06'], ['google-bard-gemini', 'google-bard-gemini-2024-02']]) {
    const { render } = await import(`../../web/js/tools/${renderers[id]}.js`);
    const version = read('specs', id).versions.find(item => item.id === versionId), sent = [];
    const root = render(context(id, version, sent)), log = root.querySelector('.thread');
    const question = message(make, 'user', 'A test question'), answer = message(make, 'assistant', 'A test answer');
    log.append(question, answer); flush(); flush();
    assert.equal(answer.querySelectorAll('.d2-turn-actions').length, 1, id);
    const ratings = answer.querySelectorAll('[data-rating-choice]');
    assert.equal(ratings.length, 2, id); ratings[0].click();
    assert.equal(answer.getAttribute('data-rating'), 'helpful');
    assert.equal(ratings[0].getAttribute('aria-pressed'), 'true');
    assert.equal(ratings[1].getAttribute('aria-pressed'), 'false');
    ratings[1].click(); assert.equal(answer.getAttribute('data-rating'), 'review');
    assert.equal(question.getAttribute('data-rating'), null);
    if (id === 'chatgpt') {
      answer.querySelectorAll('button').find(node => node.getAttribute('aria-label') === 'もう一度試す').click();
      assert.deepEqual(sent, ['A test question']);
      question.querySelector('button').click();
      assert.equal(root.querySelector('.composer textarea').value, 'A test question');
    }
  }
});

test('D2 August Cursor Composer toggle is mounted and preserves its separate Chat input', async t => {
  installFixture(t);
  const { render } = await import('../../web/js/tools/cursor.js');
  const version = read('specs', 'cursor').versions.find(item => item.id === 'cursor-2024-08');
  const root = render(context('cursor', version)), composer = root.querySelector('.cursor-cmdi-overlay');
  const toggle = root.querySelectorAll('button').find(node => node.textContent.includes('Cmd+I'));
  assert.ok(toggle); assert.ok(composer); toggle.click(); assert.equal(composer.hidden, true);
  toggle.click(); assert.equal(composer.hidden, false);
  assert.equal(root.querySelectorAll('.composer textarea').length, 2);
  assert.ok(root.querySelector('[data-era-slot="input-left"]'));
});

test('D2 priority streams transition from thinking to text to completion without media', async t => {
  const make = installFixture(t), flush = observers(t);
  for (const id of ['chatgpt', 'claude.ai', 'claude-code', 'cursor', 'openai-codex-cli', 'google-bard-gemini']) {
    const { render } = await import(`../../web/js/tools/${renderers[id]}.js`);
    const version = read('specs', id).versions[0], ctx = context(id, version), root = render(ctx);
    const turn = message(make, 'assistant', ''); root.querySelector('.thread').append(turn);
    const fx = createStreamFx(turn, ctx, false);
    try {
      flush(); assert.equal(turn.querySelector('.stream-fx-head').getAttribute('data-fx-state'), 'thinking', id);
      fx.startStreaming(100); turn.querySelector('.answer-text').textContent = 'Example answer'; fx.update(14, 14, 300); flush();
      assert.equal(turn.querySelector('.stream-fx-head').getAttribute('data-fx-state'), 'streaming', id);
      assert.equal(root.querySelector('img,svg,canvas'), null, id);
      fx.complete(400); flush();
      assert.equal(turn.querySelector('.stream-fx-head').getAttribute('data-fx-state'), 'complete', id);
      assert.equal(turn.classList.contains('is-streaming'), false, id);
    } finally { fx.dispose(); }
  }
});

test('D2 April Codex draws both sourced startup boxes at 64 terminal cells', async t => {
  installFixture(t);
  const { render } = await import('../../web/js/tools/codex.js');
  const version = read('specs', 'openai-codex-cli').versions[0];
  const root = render(context('openai-codex-cli', version)), boxes = root.querySelectorAll('.d2-text-box');
  assert.equal(boxes.length, 2);
  for (const box of boxes) assert.equal([...box.textContent.split('\n')[0]].length, 64);
});
