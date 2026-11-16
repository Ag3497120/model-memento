import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';

const catalog = JSON.parse(readFileSync(new URL('../../web/data/catalog.json', import.meta.url), 'utf8'));
const versions = catalog.tools.find(tool => tool.id === 'bytedance--ui-tars-desktop').versions;
const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));

test('preliminary records cover the catalog and preserve bilingual era text', () => {
  const spec = read('design/specs/bytedance--ui-tars-desktop.json');
  const era = read('design/era/bytedance--ui-tars-desktop.json');
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  assert.equal(Object.keys(createEraIndex([era])).length, versions.length);
  const checkTranslations = value => {
    if (Array.isArray(value)) return value.forEach(checkTranslations);
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (key.endsWith('_en')) continue;
      const strings = typeof item === 'string' ? [item] : Array.isArray(item) && item.every(x => typeof x === 'string') ? item : [];
      if (strings.some(x => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(x))) {
        const translated = value[`${key}_en`];
        assert.equal(Array.isArray(translated), Array.isArray(item), key);
        const english = Array.isArray(translated) ? translated : [translated];
        assert.equal(english.length, strings.length, key);
        for (const text of english) assert.ok(typeof text === 'string' && text.trim(), key);
      }
      checkTranslations(item);
    }
  };
  checkTranslations(spec);
  checkTranslations(era);
  for (const record of era.versions) {
    assert.ok(record.model_switch.sources[0].url.startsWith('https://github.com/bytedance/UI-TARS-desktop/blob/'));
    assert.equal(record.model_switch.steps.length, record.model_switch.steps_en.length);
    assert.ok(record.trend_en);
  }
});

test('initial desktop editions render the sparse sourced chat and accept input', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/bytedance--ui-tars-desktop.js');
  for (const version of versions.slice(0, 3)) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text) });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.ok(root.textContent.includes('Settings'));
    assert.ok(root.textContent.includes('`Enter` to run'));
    assert.equal(root.querySelector('textarea').getAttribute('placeholder'), 'What can I do for you today?');
    assert.ok(root.querySelector('[data-era-slot="settings"]'));
    assert.ok(root.querySelector('[data-era-input]'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    const input = root.querySelector('textarea');
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter', metaKey: true });
    assert.deepEqual(sent, []);
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
  }
});

test.todo('render and source the other nine catalog editions');
test.todo('assert six sourced product strings per edition in a faithful reachable state');
