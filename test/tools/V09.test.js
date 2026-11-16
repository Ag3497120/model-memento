import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'transformeroptimus--superagi';
const versions = read('web/data/catalog.json').tools.find(t => t.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('each edition renders its sourced interface offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('network forbidden'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/transformeroptimus--superagi.js');
  const eras = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({version, send: text => sent.push(text)});
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const main = root.querySelector(i === 0 ? '.sa-terminal' : '.sa-app');
    const strings = i === 0
      ? ['Welcome to SuperAGI - The future of AGI', "Enter your Goals seperated by ',':", 'Iteration : 1', 'I am Super AGI', 'Goals:', 'Tools:', 'Thinking...']
      : ['Agents', '+ Create Agent', 'No Agents found', 'Create new agent', 'Name', 'Description', 'Goals', 'Model', 'Tools', 'Select Tools', i === 1 ? 'Add agent' : 'Create and Run'];
    for (const s of strings) assert.ok(main.textContent.includes(s), `${version.id}: ${s}`);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-input]'));
    assert.ok(root.querySelector('[data-era-slot="panel"]'));
    assert.ok(!main.textContent.toLowerCase().includes('unverified'));
    if (i) {
      const controller = mountModelSwitch(root, {era:eras[version.id], onPick() {}});
      assert.equal(controller.mounted, true);
      controller.dispose();
      const goal = root.querySelector('[data-era-input]');
      goal.value = 'Example goal';
      root.querySelector('.sa-primary').click();
      assert.deepEqual(sent, ['Example goal']);
    }
  }
});

test('release changes are visible at the relevant states', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/transformeroptimus--superagi.js');
  const screen = n => render({version:versions[n]});
  assert.ok(screen(0).querySelector('.sa-terminal'));
  assert.ok(screen(1).textContent.includes('Marketplace (coming soon)'));
  assert.ok(!screen(1).textContent.includes('Instructions (optional)'));
  assert.ok(screen(2).textContent.includes('Instructions (optional)'));
  assert.ok(screen(3).textContent.includes('Create & Schedule Run'));
  assert.ok(screen(4).textContent.includes('Models'));
  assert.ok(screen(4).textContent.includes('Select knowledge'));
});
