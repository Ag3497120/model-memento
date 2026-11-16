import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';

const read = p => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const id = 'huggingface--smolagents';
const versions = read('web/data/catalog.json').tools.find(t => t.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('each edition renders sourced session labels and a working composer offline', async t => {
  installDOM(t);
  const previousFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Unexpected network access'); };
  t.after(() => { globalThis.fetch = previousFetch; });
  const { render } = await import('../../web/js/tools/huggingface--smolagents.js');
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: value => sent.push(value) });
    const main = root.querySelector('.smol-layout');
    const labels = i < 2
      ? ['Agent', 'Chat Message', 'Used tool', 'code interpreter', 'Error', 'Final answer:']
      : ['Agent', 'Step 1', 'Used tool', 'python_interpreter', 'Execution Logs', 'Final answer:'];
    for (const label of labels) assert.ok(main.textContent.includes(label), `${version.id}: ${label}`);
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot]'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    input.value = 'Calculate 2 + 2';
    input.dispatch('keydown', { key: 'Enter', shiftKey: i >= 4 && i < 12, isComposing: false });
    assert.deepEqual(sent, ['Calculate 2 + 2']);
    assert.equal(input.value, '');
    assert.equal(era.versions[i].model_switch.where, 'none');
  }
});

test('layout and output labels follow the source changes', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/huggingface--smolagents.js');
  const screens = versions.map(version => render({ version }));
  assert.equal(screens[0].querySelector('.smol-request'), null);
  assert.equal(screens[3].querySelector('.smol-request'), null);
  assert.ok(screens[4].querySelector('.smol-request').textContent.includes('Your request'));
  assert.ok(screens[4].querySelector('.smol-request').textContent.includes('huggingface/smolagents'));
  assert.ok(screens[6].querySelector('.smol-request').textContent.includes('Powered by smolagents'));
  assert.equal(screens[11].querySelector('.smol-history'), null);
  assert.ok(screens[12].querySelector('.smol-history').textContent.includes('New chat'));
  assert.equal(screens[4].querySelector('.smol-example').textContent.includes('Planning step'), false);
  assert.ok(screens[5].querySelector('.smol-example').textContent.includes('Planning step'));
  assert.ok(screens[2].querySelector('.smol-example').textContent.includes('Input-tokens:'));
  assert.ok(screens[5].querySelector('.smol-example').textContent.includes('Input tokens:'));
});
