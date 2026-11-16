import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'bytedance--deer-flow';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('each release renders sourced welcome and working composer offline', async t => {
  installDOM(t);
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('offline test'); };
  t.after(() => { globalThis.fetch = oldFetch; });
  const { render } = await import('../../web/js/tools/bytedance--deer-flow.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text) });
    const main = root.querySelector('.df-main');
    for (const text of ['Hello, again!', 'Add attachments', 'Flash', 'Surprise', 'Write', 'Research', 'Collect', 'Learn']) {
      assert.ok(main.textContent.includes(text), `${version.id}: ${text}`);
    }
    const input = root.querySelector('[data-era-input]');
    assert.equal(input.getAttribute('placeholder'), 'How can I assist you today?');
    assert.ok(root.querySelector('[data-era-slot="input-right"]'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(controller.mounted, true);
    controller.dispose();
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter', shiftKey: false });
    assert.deepEqual(sent, ['Hello']);
    assert.equal(root.textContent.includes('Scheduled tasks'), i >= 1);
    assert.equal(root.textContent.includes('Projects'), i >= 1);
    assert.equal(main.textContent.includes('DeerFlow is AI and can make mistakes'), i >= 1);
    assert.equal(main.textContent.includes('Add a reference'), i === 2);
    assert.ok(spec.versions[i].sources.length >= 8);
  }
});

test('Japanese era and spec fields have matching English siblings', () => {
  const japanese = /[ぁ-んァ-ヶ一-龠]/u;
  const urls = s => s.match(/https?:\/\/[^\s（）<>]+/g) || [];
  function check(value, path = '') {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach((v, i) => check(v, `${path}[${i}]`)); return; }
    for (const [key, original] of Object.entries(value)) {
      if (key.endsWith('_en')) continue;
      const entries = typeof original === 'string' ? [original] : Array.isArray(original) && original.every(x => typeof x === 'string') ? original : null;
      if (entries?.some(s => japanese.test(s))) {
        const english = value[`${key}_en`];
        const translations = Array.isArray(original) ? english : [english];
        assert.ok(Array.isArray(translations), `${path}.${key}_en`);
        assert.equal(translations.length, entries.length);
        entries.forEach((s, i) => { assert.equal(typeof translations[i], 'string'); assert.doesNotMatch(translations[i], japanese); assert.deepEqual(urls(translations[i]), urls(s)); });
      }
      check(original, `${path}.${key}`);
    }
  }
  check(era, 'era'); check(spec, 'spec');
});
