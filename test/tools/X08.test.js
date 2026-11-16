import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/esengine--deepseek-reasonix.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'esengine--deepseek-reasonix';
const catalog = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const specs = read(`design/specs/${id}.json`).versions;
const eras = read(`design/era/${id}.json`).versions;

test('each edition renders its source-backed terminal and accepts input offline', t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('X08 runs offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  assert.deepEqual(specs.map(v => v.id), catalog.map(v => v.id));
  assert.deepEqual(eras.map(v => v.id), catalog.map(v => v.id));
  for (const [i, version] of catalog.entries()) {
    const sent = [];
    const root = render({ version, model: { name: 'Example model' }, send: text => sent.push(text) });
    const main = root.querySelector('.terminal-main');
    const expected = i === 0
      ? ['DeepSeek-native coding agent', 'cache-first · flash-first', 'type a message to start your session', '/help', '/init', '/memory', '/cost']
      : ['reasonix', 'Context is kept across turns', "Type 'exit'", 'Ctrl-D', 'ready', 'Shift+Tab', 'MODEL', 'EFFORT'];
    for (const value of expected) assert.ok(main.textContent.includes(value), `${version.id}: ${value}`);
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot="input-left"]'));
    assert.doesNotMatch(main.textContent, /unverified|未確認/);
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    const controller = mountModelSwitch(root, { era: eras[i], onPick() {} });
    assert.equal(controller.mounted, true);
    input.value = 'A task'; input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['A task']);
    controller.dispose();
    assert.ok(specs[i].sources.length >= 5);
  }
});

test('early welcome and later ruled composer follow different terminal generations', t => {
  installDOM(t);
  const early = render({ version: catalog[0] });
  const later = render({ version: catalog[1] });
  assert.ok(early.querySelector('.rx-card'));
  assert.equal(later.querySelector('.rx-card'), null);
  assert.ok(later.querySelector('.rx-late .rx-status'));
  assert.equal(early.querySelector('textarea').getAttribute('placeholder'), 'type a message · slash for commands · at-sign for files');
});

test('the sourced /model command integrates with the museum model control', t => {
  installDOM(t);
  const picked = [];
  const root = render({ version: catalog[0] });
  const controller = mountModelSwitch(root, { era: eras[0], onPick: name => picked.push(name) });
  assert.equal(controller.handleCommand('/model deepseek-v4-flash'), true);
  assert.deepEqual(picked, ['deepseek-v4-flash']);
  assert.equal(controller.handleCommand('/help'), false);
  controller.dispose();
});
