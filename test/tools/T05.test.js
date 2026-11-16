import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { render } from '../../web/js/tools/langflow-ai--langflow.js';

const catalog = JSON.parse(readFileSync(new URL('../../web/data/catalog.json', import.meta.url)));
const tool = catalog.tools.find(item => item.id === 'langflow-ai--langflow');
const spec = JSON.parse(readFileSync(new URL('../../design/specs/langflow-ai--langflow.json', import.meta.url)));
const era = JSON.parse(readFileSync(new URL('../../design/era/langflow-ai--langflow.json', import.meta.url)));
const context = (version, sent = []) => ({ tool, version, messages: [], send: text => sent.push(text), newChat() {} });

test('T05: every catalog version has a sourced, asset-free exhibit and input slots', t => {
  installDOM(t);
  assert.equal(tool.versions.length, 10);
  assert.deepEqual(spec.versions.map(v => v.id), tool.versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), tool.versions.map(v => v.id));
  for (const [i, version] of tool.versions.entries()) {
    const root = render(context(version));
    const view = root.querySelector('.lf-shell');
    const labels = i === 0 ? ['Components', 'Prompts', 'LLMs', 'Chains', 'Agents', 'Tools', 'Memories', 'Chat', 'Clear'] : ['Components', 'Inputs', 'Outputs', 'Prompts', 'Models', 'Agents', 'Processing', 'Playground', 'Chat Input', 'Language Model', 'Chat Output'];
    for (const label of labels) assert.ok(view.textContent.includes(label), `${version.id}: ${label}`);
    assert.equal(root.querySelector('img,svg,picture,canvas'), null);
    assert.ok(root.querySelector('[data-era-slot="settings"]'));
    assert.ok(root.querySelector('[data-era-slot="input-left"]'));
    assert.ok(root.querySelector('[data-era-input]'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('.d3-fidelity-sources a'));
    assert.doesNotMatch(view.textContent, /unverified/i);
    assert.equal(root.querySelector('[data-era-input]').getAttribute('placeholder'), i === 0 || i >= 4 ? 'Send a message...' : 'Send a message');
    assert.equal(view.textContent.includes('Version History'), i >= 2);
    assert.equal(view.querySelectorAll('.lf-category').some(x => x.textContent === 'Agent'), i >= 5);
    assert.ok(spec.versions[i].sources.length >= 5);
    assert.ok(era.versions[i].model_switch.sources.length);
  }
});

test('T05: composer sends and the modern Playground toggles', t => {
  installDOM(t);
  const sent = [], root = render(context(tool.versions[1], sent));
  const input = root.querySelector('[data-era-input]');
  input.value = 'Hello'; input.dispatch('keydown', { key: 'Enter', shiftKey: false, isComposing: false });
  assert.deepEqual(sent, ['Hello']);
  assert.equal(input.value, '');
  const chat = root.querySelector('.lf-chat');
  const toggle = root.querySelector('.lf-toolbar button');
  toggle.click(); assert.equal(chat.hidden, true);
  toggle.click(); assert.equal(chat.hidden, false);
});
