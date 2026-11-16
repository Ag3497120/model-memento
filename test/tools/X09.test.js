import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'openbmb--chatdev';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const specs = read(`design/specs/${id}.json`).versions;
const eras = read(`design/era/${id}.json`).versions;

test('each edition renders the sourced viewer or launch screen offline', async t => {
  installDOM(t);
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('X09 must run offline'); };
  t.after(() => { globalThis.fetch = fetchBefore; });
  const { render } = await import('../../web/js/tools/openbmb--chatdev.js');
  assert.deepEqual(specs.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(eras.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, send: value => sent.push(value), open() {} });
    const main = root.querySelector('.cd-main');
    const expected = i < 2
      ? ['File Upload', 'Replay', 'Task:', 'Replaying Speed', 'version_updates', 'num_code_files']
      : i < 7
        ? ['ChatDev', 'ChatChain Visualizer', 'Replay Visualizer', 'Log Visualizer', 'Explore all the phases', "Replay the agents' dialog"]
        : ['Launch', 'Settings', 'Workflow Selection', 'Status', 'View', 'Chat', 'Graph', 'Upload File', 'Cancel', 'Download Logs'];
    for (const text of expected) assert.ok(main.textContent.includes(text), `${version.id}: ${text}`);
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot]'));
    assert.ok(root.querySelector('[data-era-input]'));
    assert.ok(!/unverified|未確認/.test(main.textContent));
    if (i >= 7) {
      const input = root.querySelector('[data-era-input]');
      assert.equal(input.getAttribute('placeholder'), 'Please enter task prompt...');
      input.value = 'Make a small tool';
      main.querySelector('.cd-action').dispatch('click');
      assert.deepEqual(sent, ['Make a small tool']);
    } else assert.equal(main.querySelector('[data-era-input]'), null);
  }
});
