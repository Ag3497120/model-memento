import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';
import { render } from '../../web/js/tools/deepseek-ai--deepseek-harness.js';

const catalog = JSON.parse(readFileSync(new URL('../../web/data/catalog.json', import.meta.url)));
const versions = catalog.tools.find(tool => tool.id === 'deepseek-ai--deepseek-harness').versions;
const spec = JSON.parse(readFileSync(new URL('../../design/specs/deepseek-ai--deepseek-harness.json', import.meta.url)));
const era = JSON.parse(readFileSync(new URL('../../design/era/deepseek-ai--deepseek-harness.json', import.meta.url)));

test('all snapshots show sourced English controls and submit through the exhibit', t => {
  installDOM(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('unexpected network access'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: value => sent.push(value), newChat() {}, open() {} });
    const input = root.querySelector('[data-era-input]');
    const prompt = i === 0 ? 'Describe what you want to build' : i === 1
      ? 'Describe what you want to build... / commands, @ files or sessions'
      : 'Describe what you want to build, / commands, @ files or sessions';
    assert.equal(input.getAttribute('placeholder'), 'Choose a workspace to start');
    root.querySelector('.dsh-workspace').dispatch('click');
    assert.equal(input.getAttribute('placeholder'), prompt);
    const visible = `${root.querySelector('.dsh-side').textContent} ${root.querySelector('.dsh-center').textContent} ${input.getAttribute('placeholder')}`;
    for (const label of ['New Session', 'Workspaces', 'No sessions yet', 'Add workspace', 'Into the Unknown', 'Preview', 'Select model', 'Send message', i < 2 ? 'Commands' : 'Add files or run commands', prompt]) {
      assert.ok(visible.includes(label), `${version.id}: ${label}`);
    }
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.ok(root.querySelector('[data-era-slot="input-right"]'));
    assert.ok(root.querySelector('[data-recreation-label]'));
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img,svg,picture,canvas'), null);
    assert.ok(!visible.includes('unverified'));
    const mounted = mountModelSwitch(root, { era: era.versions[i], onPick() {} });
    assert.equal(mounted.mounted, true);
    mounted.dispose();
    input.value = 'Hello';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Hello']);
  }
});
