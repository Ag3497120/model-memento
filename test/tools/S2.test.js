import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';

const ids = ['stackblitz--bolt.new'];
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const catalog = read('../../web/data/catalog.json').tools;
const modules = Object.fromEntries(await Promise.all(ids.map(async id => [id, await import(`../../web/js/tools/${id}.js`)])));

for (const id of ids) {
  test(`${id}: every catalog edition renders with input, slots, provenance and no artwork`, t => {
    installDOM(t);
    const oldFetch = globalThis.fetch;
    globalThis.fetch = () => { throw new Error('Renderer tests must be offline'); };
    t.after(() => { globalThis.fetch = oldFetch; });
    const tool = catalog.find(item => item.id === id);
    const spec = read(`../../design/specs/${id}.json`);
    const era = read(`../../design/era/${id}.json`);
    assert.deepEqual(spec.versions.map(v => v.id), tool.versions.map(v => v.id));
    assert.deepEqual(era.versions.map(v => v.id), tool.versions.map(v => v.id));
    for (const version of tool.versions) {
      const sent = [];
      const root = modules[id].render({ tool, version, messages: [], send: text => sent.push(text), newChat() {}, open() {} });
      assert.ok(root.querySelector('.thread'), version.id);
      assert.ok(root.querySelector('[data-era-slot]'), version.id);
      const input = root.querySelector('[data-era-input]');
      assert.ok(input, version.id);
      assert.equal(root.querySelector('img,svg,picture,canvas'), null, version.id);
      assert.ok(root.querySelector('[data-recreation-label]'), version.id);
      assert.ok(root.querySelector('details a'), version.id);
      input.value = 'Test request';
      input.dispatch('keydown', { key: 'Enter' });
      assert.deepEqual(sent, ['Test request'], version.id);
    }
  });
}

test('Bolt opens its reference workbench after a request', t => {
  installDOM(t);
  const tool = catalog.find(item => item.id === 'stackblitz--bolt.new');
  const sent = [];
  const root = modules[tool.id].render({ tool, version: tool.versions[1], send: text => sent.push(text) });
  assert.ok(root.querySelector('.bolt-workbench'));
  assert.equal(root.classList.contains('bolt-started'), false);
  const input = root.querySelector('[data-era-input]');
  input.value = 'Build a page';
  input.dispatch('keydown', { key: 'Enter' });
  assert.equal(root.classList.contains('bolt-started'), true);
  assert.deepEqual(sent, ['Build a page']);
});
