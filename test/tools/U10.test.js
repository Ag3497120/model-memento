import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'huggingface--smolagents';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('each edition renders its source-defined Gradio interface offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('U10 must run offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/huggingface--smolagents.js');
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: value => sent.push(value) });
    const screen = root.querySelector('.smol-layout');
    const expected = i < 2
      ? ['Agent', 'Chat Message', 'Used tool', 'Execution logs:', 'Error', 'Final answer:']
      : i < 4
        ? ['Agent', 'Chat Message', 'Step 1', 'Used tool', 'Execution Logs', 'Final answer:']
        : i < 12
          ? ['Agent interface', 'Your request', 'Submit', 'Step 1', 'Used tool', 'Execution Logs', 'Final answer:']
          : ['Agent interface', 'New chat', 'Step 1', 'Used tool', 'Execution Logs', 'Final answer:'];
    for (const text of expected) assert.ok(screen.textContent.includes(text), `${version.id}: ${text}`);
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(root.querySelector('[data-era-slot]'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('.thread'));
    assert.equal(era.versions[i].model_switch.where, 'none');
    assert.ok(spec.versions[i].sources.some(s => s.url.endsWith(`${spec.versions[i].source_ref}/src/smolagents/gradio_ui.py`)));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter', shiftKey: i >= 4 && i < 12 });
    assert.deepEqual(sent, ['Hello']);
  }
});

test('versions retain the recorded layout transitions and optional controls', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/huggingface--smolagents.js');
  const screen = index => render({ version: versions[index] });
  assert.equal(screen(0).querySelector('.smol-request'), null);
  assert.equal(screen(3).querySelector('.smol-request'), null);
  assert.ok(screen(4).querySelector('.smol-request'));
  assert.ok(screen(11).querySelector('.smol-request'));
  assert.equal(screen(12).querySelector('.smol-request'), null);
  assert.ok(screen(12).querySelector('.smol-history'));
  assert.equal(screen(4).querySelector('textarea').getAttribute('rows'), '3');
  assert.equal(screen(0).querySelector('textarea').getAttribute('rows'), '1');
  assert.equal(screen(4).textContent.includes('Upload a file'), false);
});
