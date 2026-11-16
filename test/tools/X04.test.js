import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'pingdotgg--t3code';
const versions = read('web/data/catalog.json').tools.find(item => item.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('both sourced editions render distinct product UI and accept a request offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('X04 must run offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/pingdotgg--t3code.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text), newChat() {}, open() {} });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const mainView = root.querySelector('.t3-main');
    const input = mainView.querySelector('[data-era-input]');
    const visible = root.querySelector('.t3-side').textContent + mainView.querySelector('.t3-content').textContent + mainView.querySelector('.t3-top').textContent;
    const expected = i === 0 ? ['New thread', '+ Add project', 'Open', 'Supervised'] : ['New thread', 'No project', 'Settings', 'What should we work on?'];
    for (const value of expected) assert.ok(visible.includes(value), `${version.id}: ${value}`);
    assert.equal(input.getAttribute('placeholder'), i === 0 ? 'Ask anything, @tag files/folders, or use /model' : 'Ask anything. @ files, $ skills, / commands');
    assert.equal(root.querySelector('.send').getAttribute('aria-label'), 'Send message');
    if (i === 0) assert.ok([...root.querySelectorAll('button')].some(node => node.getAttribute('aria-label') === 'Toggle diff panel'));
    else assert.equal(root.querySelector('.t3-search').getAttribute('aria-label'), 'Search threads');
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(root.querySelector('[data-era-slot="input-left"]'));
    const switcher = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(switcher.mounted, true);
    switcher.dispose();
    input.value = 'Explain this code';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Explain this code']);
  }
});


test('Japanese evidence fields have English siblings and retain their URLs', () => {
  const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
  const urls = value => value.match(/https?:\/\/[^\s（）<>()]+/g) || [];
  function check(value) {
    if (Array.isArray(value)) return value.forEach(check);
    if (!value || typeof value !== 'object') return;
    for (const [key, text] of Object.entries(value)) {
      if (key.endsWith('_en')) continue;
      const items = typeof text === 'string' ? [text] : Array.isArray(text) && text.every(item => typeof item === 'string') ? text : null;
      if (!items || !items.some(item => japanese.test(item))) { check(text); continue; }
      const translated = Array.isArray(text) ? value[key + '_en'] : [value[key + '_en']];
      assert.ok(Array.isArray(translated), key);
      assert.equal(translated.length, items.length, key);
      for (const [i, item] of items.entries()) {
        assert.equal(typeof translated[i], 'string', key);
        assert.doesNotMatch(translated[i], japanese, key);
        assert.deepEqual(urls(translated[i]), urls(item), key);
      }
    }
  }
  check(spec); check(era);
});
