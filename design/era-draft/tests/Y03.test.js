import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'agentscope-ai--agentscope';
const versions = read('web/data/catalog.json').tools.find(t => t.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('all editions render offline with input and source disclosures', async t => {
  installDOM(t);
  const previous = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Y03 must run offline'); };
  t.after(() => { globalThis.fetch = previous; });
  const { render } = await import('../../web/js/tools/agentscope-ai--agentscope.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: text => sent.push(text), newChat() {}, open() {} });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot]'));
    const field = root.querySelector('[data-era-input]');
    assert.ok(field);
    field.value = 'Hello';
    field.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
    if (i < 11) {
      assert.ok(root.querySelector('.terminal-main').textContent.includes(i ? 'User Input:' : 'User:'));
      assert.equal(index[version.id].model_switch.where, 'none');
    } else {
      const screen = root.querySelector('.as-layout');
      for (const text of ['Agent', 'Select an agent', 'Session', 'No sessions', 'Select an agent first.', 'Send']) assert.ok(screen.textContent.includes(text), `${version.id}: ${text}`);
      assert.equal(field.getAttribute('placeholder'), 'Type a message...');
      assert.ok(screen.textContent.includes(i >= 13 ? 'Where should we start?' : 'No Messages Yet'));
      const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
      assert.equal(controller.mounted, true);
      controller.dispose();
    }
  }
});

test('source-backed changes distinguish terminal and web generations', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/agentscope-ai--agentscope.js');
  const screen = i => render({ version: versions[i] });
  assert.ok(screen(0).textContent.includes('User:'));
  assert.ok(screen(1).textContent.includes('User Input:'));
  assert.ok(screen(11).textContent.includes('No Messages Yet'));
  assert.ok(screen(13).textContent.includes('Where should we start?'));
  assert.ok(screen(14).className.includes('as-late'));
});
