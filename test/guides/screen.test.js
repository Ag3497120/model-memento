import test from 'node:test';
import assert from 'node:assert/strict';
import { TestNode, findAll } from '../news/fixtures/dom.js';
import { buildGuideIndex } from '../../lib/guides/build.js';
import { guideCard, guidesSection, openGuides } from '../../web/js/guides/index.js';
import { getNavEntries } from '../../web/js/nav.js';

const { index } = await buildGuideIndex({ write: false });
const tick = () => new Promise(resolve => setImmediate(resolve));

test('offline DOM fixture checks registration, error recovery, filters, timeline, safe cards and embedded guidance', async () => {
  const previous = { document: globalThis.document, Node: globalThis.Node, fetch: globalThis.fetch };
  class Element extends TestNode {
    constructor(...args) { super(...args); this.isConnected = true; }
    querySelectorAll(selector) { return findAll(this, node => selector.split(',').map(value => value.trim()).includes(node.tagName)); }
    showModal() { this.open = true; }
    close() { this.open = false; this.events.close?.(); }
    focus() { this.focused = true; }
  }
  globalThis.Node = Element;
  const body = new Element('body');
  const opener = new Element('button');
  globalThis.document = { body, activeElement: opener, createElement: tag => new Element(tag), createTextNode: text => new Element('#text', text) };
  let fail = true, requests = [];
  globalThis.fetch = async input => {
    const url = String(input); requests.push(url);
    if (url.endsWith('/guides.json')) return new Response(JSON.stringify(index), { status: fail ? 503 : 200 });
    if (url.endsWith('/instructions.json')) return new Response(JSON.stringify({ files: [{ toolId: 'aider', path: 'CONVENTIONS.md', sources: ['https://aider.chat/docs/usage/conventions.html'] }] }));
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    const entry = getNavEntries().find(row => row.id === 'guides');
    assert.equal(entry.label, '指示の出し方'); assert.equal(entry.order, 22);
    assert.equal(guidesSection({}), null);
    await openGuides();
    assert.match(body.textContent, /読み込めませんでした/);
    fail = false;
    await openGuides({ toolId: 'aider' }); await tick();
    const dialog = findAll(body, node => node.tagName === 'dialog')[0];
    const header = dialog.children[0];
    assert.match(header.className, /screen-header/);
    assert.equal(header.children[0].textContent, '‹ メニュー');
    assert.equal(header.children[0].getAttribute('data-screen-back'), '');
    assert.equal(header.children.at(-1).textContent, '閉じる');
    assert.match(body.textContent, /2 件の資料/);
    assert.match(body.textContent, /CONVENTIONS.md/);
    const input = findAll(body, node => node.attrs.id === 'guides-query')[0];
    input.dispatch('input', '見つからない語');
    assert.match(body.textContent, /条件に合う資料はまだありません/);
    const reset = findAll(body, node => node.tagName === 'button' && node.textContent === '絞り込みをすべて解除')[0];
    reset.dispatch('click');
    assert.match(body.textContent, new RegExp(`${index.guides.length} 件の資料`));
    const technique = findAll(body, node => node.attrs.id === 'guides-technique')[0];
    technique.dispatch('change', 'skills');
    assert.match(body.textContent, /作り手ごとに確認できる最古の日付/);
    assert.match(body.textContent, /2025-10-16/);
    const section = guidesSection({ modelId: 'deepseek-r1' }); await tick();
    assert.match(section.textContent, /DeepSeek-R1/);
    const unknown = guidesSection({ modelId: 'no-record' }); await tick();
    assert.match(unknown.textContent, /まだ収録していません/);
    const oldModel = guidesSection({ modelId: 'gpt-3.5-turbo-0301' }); await tick();
    assert.match(oldModel.textContent, /このモデルの版への適用は未確認/);
    const technical = guideCard(index.guides.find(guide => guide.id === 'deepseek-thinking'), index);
    assert.match(technical.textContent, /別のソフトから AI などの機能を使うための窓口/);
    const unsafe = guideCard({ ...index.guides[0], title: '<script>alert(1)</script>', url: 'javascript:alert(1)' }, index);
    assert.match(unsafe.textContent, /<script>/);
    assert.equal(findAll(unsafe, node => node.tagName === 'script').length, 0);
    assert.ok(findAll(body, node => node.tagName === 'a').every(node => /^https:/.test(node.attrs.href) && node.attrs.rel === 'noopener noreferrer'));
    header.children.at(-1).dispatch('click'); assert.equal(dialog.open, false); assert.equal(opener.focused, true);
    assert.ok(requests.every(url => /\/(guides|instructions)\.json$/.test(url)), 'screen makes only local JSON requests');
  } finally { Object.assign(globalThis, previous); }
});
