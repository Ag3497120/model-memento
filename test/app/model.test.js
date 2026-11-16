import test from 'node:test';
import assert from 'node:assert/strict';
import { TestNode, findAll } from '../news/fixtures/dom.js';
import { openModelPage, setPersonaPlayer } from '../../web/js/model/index.js';

test('model view displays basis, sources, last checks and patch, and keeps recreation disabled on a static site', async () => {
  const previous = { document: globalThis.document, Node: globalThis.Node, fetch: globalThis.fetch };
  class Element extends TestNode {
    showModal() { this.open = true; }
    close() { this.open = false; this.events.close?.(); }
    focus() {}
  }
  const body = new Element('body');
  globalThis.Node = Element;
  globalThis.document = { body, activeElement: null, createElement: tag => new Element(tag), createTextNode: value => new Element('#text', value) };
  globalThis.fetch = async input => {
    const url = String(input);
    let value;
    if (url.endsWith('/personas.json')) value = [{ model_id: 'fixture', traits: { tone: { value: '短く説明します', basis: 'inherited-from:parent', source: 'https://example.org/basis' } }, resolution: { warnings: ['本人の調査結果ではありません。'] } }];
    else if (url.endsWith('/real-links.json')) value = { fixture: { links: [{ label: '本物の案内', url: 'https://example.org/model', sources: ['https://example.org/model'] }] } };
    else if (url.endsWith('/patch.json')) value = { id: '26.7' };
    else if (url.endsWith('/links-status.json')) value = { schema: 'memento.links-status.v1', links: { 'https://example.org/model': { checkedAt: '2026-11-15T00:00:00Z', state: 'ok' } } };
    else throw new Error('No live requests in this test');
    return new Response(JSON.stringify(value));
  };
  try {
    setPersonaPlayer(() => {});
    await openModelPage({ id: 'fixture', name: '架空のモデル', _worldLevel: 'indexed', url: 'https://example.org/model' });
    assert.match(body.textContent, /記録のみ（自動）/); assert.match(body.textContent, /近いモデルから借りた特徴（parent）/);
    assert.match(body.textContent, /元のモデル本人ではありません/); assert.match(body.textContent, /この情報は 26.7 時点/);
    assert.match(body.textContent, /最終確認 2026-11-15 ・ 確認できました/);
    const play = findAll(body, node => node.tagName === 'button' && node.textContent === 'このモデルを演じる')[0];
    assert.equal(play.attrs.disabled, '');
    assert.ok(findAll(body, node => node.tagName === 'a').every(node => node.attrs.rel === 'noopener noreferrer'));
  } finally { Object.assign(globalThis, previous); }
});
