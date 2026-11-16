import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'can1357--oh-my-pi';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('every edition renders sourced terminal details and a working composer offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('X07 must run offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/can1357--oh-my-pi.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text) });
    const main = root.querySelector('.terminal-main');
    const strings = i === 0 ? ['Welcome back!', 'Tips', '? for keyboard shortcuts', '/ for commands', '! to run bash', '/status for loaded extensions', 'Recent sessions', 'No recent sessions'] : ['Tip:', '/model', '/btw', '/tan', '/hotkeys', '/vibe'];
    for (const str of strings) assert.ok(main.textContent.includes(str), `${version.id}: ${str}`);
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(root.querySelector('[data-era-slot]'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    const switcher = mountModelSwitch(root, { era:index[version.id], onPick() {} });
    assert.equal(switcher.mounted, true);
    input.value = 'Hello'; input.dispatch('keydown', { key:'Enter' });
    assert.deepEqual(sent, ['Hello']);
    switcher.dispose();
  }
});

test('early welcome and later welcome differ according to source', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/can1357--oh-my-pi.js');
  const early = render({ version:versions[0] });
  const late = render({ version:versions[1] });
  assert.ok(early.querySelector('.omp-early-box'));
  assert.equal(late.querySelector('.omp-early-box'), null);
  assert.ok(late.querySelector('.omp-modern-welcome'));
  assert.ok(render({ version:versions[2] }).textContent.includes('chillax'));
});

test('Japanese fields have English siblings with matching source URLs', () => {
  const japanese = /[\u3040-\u30ff\u3400-\u9fff]/;
  const urls = text => [...String(text).matchAll(/https?:\/\/[^\s（）<>]+/g)].map(match => match[0]);
  function check(node, path) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach((item, i) => check(item, `${path}[${i}]`)); return; }
    for (const [key, value] of Object.entries(node)) {
      if (key.endsWith('_en')) continue;
      const values = Array.isArray(value) ? value : [value];
      if (values.some(item => typeof item === 'string' && japanese.test(item))) {
        const english = node[`${key}_en`];
        assert.equal(Array.isArray(english), Array.isArray(value), `${path}.${key}`);
        const translations = Array.isArray(english) ? english : [english];
        assert.equal(translations.length, values.length);
        values.forEach((item, i) => {
          assert.equal(typeof translations[i], 'string', `${path}.${key}_en`);
          assert.deepEqual(urls(translations[i]), urls(item));
        });
      } else check(value, `${path}.${key}`);
    }
  }
  check(spec, 'spec'); check(era, 'era');
});
