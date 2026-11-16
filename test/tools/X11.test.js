import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/vxcontrol--pentagi.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'vxcontrol--pentagi';
const versions = read('web/data/catalog.json').tools.find(item => item.id === id).versions;
const specs = read(`design/specs/${id}.json`).versions;
const eras = read(`design/era/${id}.json`).versions;

test('sourced 2026 editions show the new-flow form and accept prompts', t => {
  installDOM(t);
  for (const [index, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: message => sent.push(message) });
    assert.equal(root.querySelector('img,svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    if (index < 6) {
      assert.equal(root.querySelector('[data-era-input]'), null);
      continue;
    }
    const main = root.querySelector('main');
    for (const label of ['New flow', 'Create a new flow', 'Describe what you would like PentAGI to test', 'Automation', 'Assistant', 'Select Provider']) {
      assert.ok(main.textContent.includes(label), `${version.id}: ${label}`);
    }
    assert.ok(root.querySelector('[data-era-slot="settings"]'));
    const input = root.querySelector('[data-era-input]');
    assert.equal(input.getAttribute('placeholder'), 'Describe what you would like PentAGI to test...');
    input.value = 'Hello'; input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
    const buttons = root.querySelectorAll('button');
    buttons.find(button => button.textContent === 'Assistant').dispatch('click');
    assert.equal(input.getAttribute('placeholder'), 'What would you like me to help you with?');
    assert.equal(root.textContent.includes('Resources'), index >= 7);
  }
});

test('research records cover catalog IDs and mark pre-squash versions as uncertain', () => {
  assert.deepEqual(specs.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(eras.map(v => v.id), versions.map(v => v.id));
  for (let i = 0; i < versions.length; i++) {
    assert.ok(specs[i].sources.length);
    assert.ok(eras[i].trend_en);
    if (i < 6) assert.equal(specs[i].ref, null);
    else assert.equal(eras[i].model_switch.where, 'settings');
  }
});
