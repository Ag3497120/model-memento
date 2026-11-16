import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'fmaclen--hollama';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('all Hollama editions render sourced strings, controls, and usable museum input offline', async t => {
  installDOM(t);
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('V13 must run offline'); };
  t.after(() => { globalThis.fetch = fetchBefore; });
  const { render } = await import('../../web/js/tools/fmaclen--hollama.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: value => sent.push(value), newChat() {}, open() {} });
    const view = root.querySelector('.hl-card');
    const expected = i === 0
      ? ['Settings', 'New session', 'No sessions in history', 'Session', 'Model', 'Prompt', 'Send', 'Write a prompt to start a new session']
      : i < 8 ? ['Sessions', 'New session', 'No sessions', 'Session', 'Available models', 'Messages', 'Controls', 'Run', 'Write a prompt to start a new session']
      : ['Session', 'New session', 'Available models', 'Messages', 'Controls', 'Run', 'Write a prompt to start a new session'];
    for (const value of expected) assert.ok(view.textContent.includes(value), `${version.id}: ${value}`);
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(root.querySelector('[data-era-slot="input-left"]'));
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    assert.equal(input.getAttribute('placeholder'), i === 0 ? 'No model selected' : 'Write literally anything');
    const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(controller.mounted, true);
    controller.dispose();
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter', shiftKey: false });
    assert.deepEqual(sent, ['Hello']);
  }
});

test('source-backed layout and attachment changes appear at their catalog versions', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/fmaclen--hollama.js');
  const screen = i => render({ version: versions[i] });
  assert.ok(screen(0).querySelector('.hl-split'));
  const middle = screen(1);
  assert.ok(middle.querySelector('.hl-rail'));
  const controls = middle.querySelector('.hl-controls');
  controls.querySelectorAll('button')[1].click();
  assert.equal(middle.querySelector('.hl-controls-view').hidden, false);
  assert.equal(middle.querySelector('.thread').hidden, true);
  controls.querySelectorAll('button')[0].click();
  assert.equal(middle.querySelector('.thread').hidden, false);
  assert.equal(screen(1).querySelector('.hl-attachments'), null);
  assert.ok(screen(2).querySelector('.hl-attachments').textContent.includes('Knowledge'));
  assert.equal(screen(6).textContent.includes('Attach image'), false);
  assert.ok(screen(7).querySelector('.hl-attachments').textContent.includes('Attach image'));
  assert.ok(screen(8).querySelector('.hl-tabs'));
  assert.equal(screen(8).querySelector('.hl-rail'), null);
});
