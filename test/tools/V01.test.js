import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';
const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'enricoros--big-agi';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`), era = read(`design/era/${id}.json`);

test('every tagged edition renders sourced persona labels, slots and an offline composer', async t => {
  installDOM(t);
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('V01 must run offline'); };
  t.after(() => { globalThis.fetch = oldFetch; });
  const { render } = await import('../../web/js/tools/enricoros--big-agi.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const version of versions) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text), newChat() {}, open() {} });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const main = root.querySelector('.ba-main');
    for (const text of ['AI Persona', 'Default', 'Developer', 'Scientist', 'Catalyst', 'Executive', 'Designer', 'Custom', 'Chat'])
      assert.ok(main.textContent.includes(text), `${version.id}: ${text}`);
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot="top"]'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(controller.mounted, true);
    controller.dispose();
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter', shiftKey: false });
    assert.deepEqual(sent, ['Hello']);
  }
});

test('composer language and persona descriptions track source snapshots', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/enricoros--big-agi.js');
  const root = i => render({ version: versions[i] });
  assert.equal(root(0).querySelector('textarea').getAttribute('placeholder'), 'Chat · /react · /imagine · drop text files...');
  assert.equal(root(2).querySelector('textarea').getAttribute('placeholder'), 'Chat · /react · /draw · drop text files...');
  assert.equal(root(6).querySelector('textarea').getAttribute('placeholder'), 'Chat · /beam · /draw · drop files...');
  assert.equal(root(8).querySelector('textarea').getAttribute('placeholder'), 'Type · drop files · /react...');
  assert.ok(root(0).textContent.includes('Helps you think'));
  assert.ok(root(8).textContent.includes('Start here'));
});

test('Japanese era fields retain English translations and source URLs', () => {
  const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
  const urls = value => value.match(/https?:\/\/[^\s（）<>()]+/g) || [];
  const walk = value => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (key === 'sources' || key.endsWith('_en')) continue;
      const entries = typeof item === 'string' ? [item] : Array.isArray(item) && item.every(x => typeof x === 'string') ? item : null;
      if (entries?.some(x => japanese.test(x))) {
        const translated = Array.isArray(item) ? value[`${key}_en`] : [value[`${key}_en`]];
        assert.ok(Array.isArray(translated), key);
        assert.equal(translated.length, entries.length, key);
        translated.forEach((english, i) => {
          assert.equal(typeof english, 'string', key);
          assert.ok(english.trim(), key);
          assert.doesNotMatch(english, japanese, key);
          assert.deepEqual(urls(english), urls(entries[i]), key);
          if (/unverified|未確認/.test(entries[i])) assert.match(english, /unverified/, key);
        });
      } else walk(item);
    }
  };
  walk(spec); walk(era);
});
