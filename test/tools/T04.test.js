import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/chatboxai--chatbox.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const versions = read('web/data/catalog.json').tools.find(t => t.id === 'chatboxai--chatbox').versions;
const spec = read('design/specs/chatboxai--chatbox.json');
const era = read('design/era/chatboxai--chatbox.json');

test('all editions render their source-derived controls and live composer offline', t => {
  installDOM(t);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  versions.forEach((version, i) => {
    const sent = [];
    let created = 0;
    const root = render({ version, send: text => sent.push(text), newChat: () => created++ });
    const input = root.querySelector('[data-era-input]');
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.ok(input, version.id);
    assert.ok(root.querySelector('.thread'), version.id);
    assert.ok(root.querySelector('[data-era-slot="input-left"]'), version.id);
    assert.ok(root.querySelector('[data-era-slot="settings"]'), version.id);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1, version.id);
    assert.equal(root.querySelector('img,svg,picture,canvas'), null, version.id);
    assert.ok(root.querySelector('details a'), version.id);
    const visible = root.querySelector('.cb-side').textContent + root.querySelector('.cb-head').textContent + root.querySelector('.cb-compose').textContent + input.getAttribute('placeholder');
    const required = i === 0 ? ['CHAT', 'New Chat', 'Settings', 'Prompt', 'Send', 'Random Talk', 'English translator']
      : i < 5 ? ['Chat', 'New Chat', 'Settings', 'About', 'Prompt', 'Send']
      : i < 10 ? ['New Chat', 'My Copilots', 'Settings', 'About', 'Type your question here...', 'Send']
      : ['New Chat', 'My Copilots', 'Settings', 'Select Model', 'Type your question here...', 'Send', ...(i === 10 ? ['New Images'] : i >= 13 ? ['Create Image'] : [])];
    for (const label of required) assert.ok(visible.includes(label), `${version.id}: ${label}`);
    assert.ok(!/unverified/i.test(visible), version.id);
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello'], version.id);
    root.querySelector('button').click();
    assert.equal(created, 1, version.id);
    assert.ok(spec.versions[i].sources.every(s => s.url.startsWith('https://github.com/chatboxai/chatbox/blob/')), version.id);
  });
});

test('era model controls attach at the appropriate host without inventing options', async t => {
  installDOM(t);
  const { createEraIndex } = await import('../../web/js/era/data.js');
  const { mountModelSwitch } = await import('../../web/js/era/model-switch.js');
  const index = createEraIndex([era]);
  for (const n of [1, 5, 10, 20]) {
    const version = versions[n];
    const root = render({ version });
    const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(controller.mounted, true, version.id);
    const control = root.querySelector('[data-era-model-control]');
    assert.ok(control, version.id);
    const expected = n < 10 ? root.querySelector('details [data-era-slot="settings"]') : root.querySelector('[data-era-slot="input-left"]');
    assert.ok(expected.querySelector('[data-era-model-control]'), version.id);
    assert.deepEqual(era.versions[n].model_switch.options, [], version.id);
    controller.dispose();
  }
});
