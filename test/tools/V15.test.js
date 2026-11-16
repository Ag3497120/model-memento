import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'n4ze3m--page-assist';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('every Page Assist edition renders sourced controls and a usable composer offline', async t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('The exhibit must work offline'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const { render } = await import('../../web/js/tools/n4ze3m--page-assist.js');
  const index = createEraIndex([era]);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    let newChats = 0;
    const root = render({ version, send: text => sent.push(text), newChat: () => newChats++, open() {} });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    const visible = root.querySelector('.pa-header').textContent + root.querySelector('.thread').textContent + root.querySelector('.pa-compose').textContent;
    for (const label of ['New Chat', 'Select a Model', 'Select a Prompt', 'Settings', 'Search Internet', 'Speech to Text', 'Upload Image', 'Submit']) {
      assert.ok(visible.includes(label), `${version.id}: ${label}`);
    }
    assert.equal(root.querySelector('[data-era-input]').getAttribute('placeholder'), 'Type a message...');
    assert.ok(visible.includes(i ? 'Hello! How can I help you today?' : 'Unable to connect to Ollama'));
    assert.equal(visible.includes('MCP Servers'), i >= 2);
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot="top"]'));
    assert.ok(spec.versions[i].sources.length >= 8);
    const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(controller.mounted, true);
    controller.dispose();
    const input = root.querySelector('[data-era-input]');
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter', shiftKey: false });
    assert.deepEqual(sent, ['Hello']);
    root.querySelector('.pa-new').click();
    assert.equal(newChats, 1);
    const drawer = root.querySelector('.pa-drawer');
    assert.equal(drawer.hidden, true);
    root.querySelector('.pa-history-trigger').click();
    assert.equal(drawer.hidden, false);
    assert.ok(drawer.textContent.includes('No chat history'));
  }
});
