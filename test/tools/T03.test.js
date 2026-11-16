import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { mountModelSwitch, modelSlotNames } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const id = 'mintplex-labs--anything-llm';
const versions = read('../../web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const specs = read('../../design/specs/mintplex-labs--anything-llm.json').versions;
const eras = read('../../design/era/mintplex-labs--anything-llm.json').versions;

test('all AnythingLLM editions show source-backed workspace controls and send messages', async t => {
  installDOM(t);
  const previousFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('test must remain offline'); };
  t.after(() => { globalThis.fetch = previousFetch; });
  const { render } = await import('../../web/js/tools/mintplex-labs--anything-llm.js');
  assert.deepEqual(specs.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(eras.map(v => v.id), versions.map(v => v.id));
  for (const [index, version] of versions.entries()) {
    const sent = [];
    const root = render({ tool: { id }, version, send: text => sent.push(text), open() {} });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.equal(root.querySelector('img,svg,picture,canvas'), null, version.id);
    assert.ok(root.querySelector('[data-recreation-label]'), version.id);
    assert.ok(root.querySelector('details a'), version.id);
    assert.ok(root.querySelector('[data-era-slot="top"]'), version.id);
    if (index >= 11) assert.equal(root.querySelector('.t03-search').textContent, 'Search', version.id);
    assert.ok(root.querySelector('[data-era-slot="input-left"]'), version.id);
    const input = root.querySelector('textarea[data-era-input]');
    assert.equal(input.getAttribute('placeholder'), 'Send a message', version.id);
    const strings = index >= 17
      ? ['New Workspace', 'Workspaces', index === 23 ? 'What are we working on?' : 'How can I help you today?', 'Select Model', 'Tools', 'Start Agent Session', 'Create an Agent', 'Edit Workspace', 'Upload a Document']
      : ['New Workspace', 'Workspaces', 'Welcome to your new workspace.', 'upload a document', 'send a chat.', 'Slash commands button', '@agent', 'Change text size'];
    for (const text of strings) assert.ok(root.textContent.includes(text), `${version.id}: ${text}`);
    assert.equal(/unverified|未確認/.test(root.querySelector('main').querySelector('.thread').textContent), false, version.id);
    input.value = 'Hello'; input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello'], version.id);
    const era = eras[index];
    assert.equal(era.model_switch.where, index >= 17 ? 'top-dropdown' : index >= 10 ? 'input-bar' : 'settings', version.id);
    if (index >= 10 && index < 17) assert.ok(root.querySelector('[data-era-slot="input-left"]').textContent.includes('LLM Selector'), version.id);
    assert.ok(modelSlotNames(era.model_switch).some(name => root.querySelector(`[data-era-slot="${name}"]`)), version.id);
    const mounted = mountModelSwitch(root, { era, onPick() {} });
    assert.equal(mounted.mounted, true, version.id);
    mounted.dispose();
  }
});
