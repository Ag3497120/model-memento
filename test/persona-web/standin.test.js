import test from 'node:test';
import assert from 'node:assert/strict';
import { createStandIn, standInPrompt, standInLabel, STAND_IN, mountStandIn } from '../../web/js/persona/standin.js';
import { mountGuides } from '../../web/js/persona/guides.js';
import { renderPersonaAnswer } from '../../web/js/persona/render.js';

const ctx = { model: { id: 'selected', name: '試験モデル', release: '2025-01-02', evidence: [{ url: 'https://example.org/model' }], traits: [] } };
const gpu = { requestAdapter: async () => ({ features: new Set(['shader-f16']) }) };

function engineModule({ failLoad = false, reply = '小さな代役として答えます。', finishReason = 'stop', reload = async () => {} } = {}) {
  const calls = { constructed: 0, loaded: 0, unloaded: 0, requests: [] };
  class MLCEngine {
    constructor() { calls.constructed++; }
    async reload(id) { assert.equal(id, STAND_IN.model); calls.loaded++; await reload(); if (failLoad) throw new Error('load failed'); }
    async unload() { calls.unloaded++; }
    chat = { completions: { create: async request => { calls.requests.push(request); return { choices: [{ message: { content: reply }, finish_reason: finishReason }] }; } } };
  }
  return { MLCEngine, calls };
}

test('nothing is imported or loaded before explicit enable', async () => {
  let imports = 0;
  const module = engineModule();
  const session = createStandIn(ctx, { gpu, importer: async url => { imports++; assert.equal(url, STAND_IN.module); return module; } });
  assert.equal(imports, 0);
  await assert.rejects(session.generate('コードを書いて'), /先に代役モデル/);
  assert.equal(imports, 0);
  await session.enable();
  assert.equal(imports, 1);
  const response = await session.generate('Pythonでフィボナッチを書いて');
  assert.equal(response.kind, 'standin');
  assert.ok(response.text.startsWith(standInLabel(ctx.model)));
  const request = module.calls.requests[0];
  assert.match(request.messages[0].content, /You are a stand-in, say so/);
  assert.match(request.messages[0].content, /2025-01-02/);
  assert.equal(request.messages[1].content, 'Pythonでフィボナッチを書いて');
  assert.equal(request.max_tokens, 512);
  assert.equal(request.stream, false);
  await session.dispose();
  assert.equal(module.calls.unloaded, 1);
});

test('missing WebGPU or required features does not load third-party code', async () => {
  let imports = 0;
  const importer = async () => { imports++; throw new Error('unexpected'); };
  for (const unsupported of [null, { requestAdapter: async () => null }, { requestAdapter: async () => ({ features: new Set() }) }]) {
    const session = createStandIn(ctx, { gpu: unsupported, importer });
    await assert.rejects(session.enable(), /機能|WebGPU/);
  }
  assert.equal(imports, 0);
});

test('failed loads release resources and can be retried', async () => {
  const failed = engineModule({ failLoad: true });
  const ok = engineModule();
  let attempt = 0;
  const session = createStandIn(ctx, { gpu, importer: async () => ++attempt === 1 ? failed : ok });
  await assert.rejects(session.enable(), /load failed/);
  assert.equal(failed.calls.unloaded, 1);
  await session.enable();
  await session.generate('短い依頼');
  await session.dispose();
  assert.equal(ok.calls.unloaded, 1);
});

test('concurrent enable waits for one shared load', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const module = engineModule({ reload: () => pending });
  const session = createStandIn(ctx, { gpu, importer: async () => module });
  const first = session.enable();
  await new Promise(resolve => setImmediate(resolve));
  let finished = false;
  const second = session.enable().then(() => { finished = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(finished, false);
  release();
  await Promise.all([first, second]);
  assert.equal(module.calls.loaded, 1);
  await session.dispose();
});

test('disposal during module import prevents a later model download', async () => {
  let release;
  const module = engineModule();
  const session = createStandIn(ctx, { gpu, importer: () => new Promise(resolve => { release = () => resolve(module); }) });
  const enable = session.enable();
  await new Promise(resolve => setImmediate(resolve));
  const disposal = session.dispose();
  release();
  await assert.rejects(enable, /終了/);
  await disposal;
  assert.equal(module.calls.loaded, 0);
});

test('empty model answers and long inputs have recoverable errors', async () => {
  const module = engineModule({ reply: '' });
  const session = createStandIn(ctx, { gpu, importer: async () => module });
  await session.enable();
  await assert.rejects(session.generate(''), /依頼/);
  await assert.rejects(session.generate('あ'.repeat(1201)), /1200/);
  await assert.rejects(session.generate('依頼'), /答えを作れません/);
  await session.dispose();
});

test('a truncated answer identifies the length limit', async () => {
  const module = engineModule({ finishReason: 'length' });
  const session = createStandIn(ctx, { gpu, importer: async () => module });
  await session.enable();
  assert.match((await session.generate('依頼')).text, /長さの上限に達しました/);
  await session.dispose();
});

test('an inherited persona does not enter the system prompt', () => {
  const text = standInPrompt({ ...ctx, persona: { schema: 'memento.persona.v1', model_id: 'selected', name: '試験モデル',
    resolution: { kind: 'inherited' }, traits: { tone: { value: '架空の語尾', basis: 'inherited-from:parent', source: 'https://example.org', confidence: 0.9 } } } });
  assert.ok(!text.includes('架空の語尾'));
  assert.match(text, /普通の文体/);
});

// A minimal DOM checks the mount contract offline, without launching a browser.
class Element {
  constructor(tag, doc) { this.tagName = tag; this.ownerDocument = doc; this.children = []; this.textContent = ''; this.listeners = {}; this.attributes = {}; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  remove() { this.removed = true; }
}
const documentStub = { createElement: tag => new Element(tag, documentStub) };
function textOf(node) { return `${node.textContent} ${node.children.map(textOf).join(' ')}`; }

test('mount shows download size and real links before any click', async () => {
  const container = new Element('div', documentStub);
  const control = mountStandIn(container, { ...ctx, realLinks: { selected: { links: [{ kind: 'official-api', url: 'https://example.org/api' }] } } });
  const text = textOf(control.section);
  assert.match(text, /約290 MB/);
  assert.match(text, /本物を試す入口/);
  assert.match(text, /公式の開発者向け窓口/);
  await control.dispose();
  assert.equal(control.section.removed, true);
});

test('optional guides load only when their module exists', async () => {
  const container = new Element('div', documentStub);
  let called = 0;
  assert.equal(await mountGuides(container, ctx, { importer: async () => ({ guidesSection: passed => { assert.equal(passed.modelId, ctx.model.id); called++; return new Element('section', documentStub); } }) }), true);
  assert.equal(called, 1);
  assert.equal(await mountGuides(container, ctx, { importer: async () => { throw new Error('missing module'); } }), false);
  assert.match(textOf(container), /まだ用意されていません/);
});

test('answer rendering uses text nodes and safe clickable sources', () => {
  const container = new Element('div', documentStub);
  renderPersonaAnswer(container, { text: '私は<script>です。\n\n出典\n- Markdown形式のリンク',
    facts: [{ sources: ['https://example.org/model', 'javascript:alert(1)', 'https://example.org/model'] }] });
  assert.equal(container.children[0].tagName, 'p');
  assert.equal(container.children[0].textContent, '私は<script>です。');
  const list = container.children[2];
  assert.equal(list.children.length, 1);
  const anchor = list.children[0].children[0];
  assert.equal(anchor.href, 'https://example.org/model');
  assert.equal(anchor.rel, 'noopener noreferrer');
});

test('D4 a stand-in never receives future successor or retirement records as role knowledge', async () => {
  const old = { ...ctx.model, specs: { knowledge_cutoff: '2020-12' }, successor: 'later', lifecycle: { status: 'retired', events: [{ type: 'retired_api', date: '2025-06-01' }] } };
  const later = { id: 'later', name: 'Later Model', release: '2024-01-01', evidence: [{ url: 'https://example.org/later' }] };
  const context = { model: old, models: [old, later] };
  const prompt = standInPrompt(context, 'What is your successor?');
  assert.match(prompt, /2020-12/);
  assert.doesNotMatch(prompt, /2025-06-01|"successor"|"status"/);
  const module = engineModule();
  const session = createStandIn(context, { gpu, importer: async () => module });
  await session.enable();
  const result = await session.generate('Later Modelの公開日は？');
  assert.equal(result.eraBlocked, true);
  assert.equal(module.calls.requests.length, 0);
  assert.match(result.museumNote.text, /2024-01-01/);
  await session.dispose();
});
