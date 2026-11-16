import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'codota--tabnine';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('all catalog editions render offline with slots and source disclosure', async t => {
  installDOM(t);
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('U03 must run offline'); };
  t.after(() => { globalThis.fetch = oldFetch; });
  const { render } = await import('../../web/js/tools/codota--tabnine.js');
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const version of versions) {
    const root = render({ version, send() {} });
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    assert.ok(root.querySelector('[data-era-input]'), version.id);
    assert.ok(root.querySelector('[data-era-slot]'), version.id);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelector('img, svg'), null);
    assert.ok(spec.versions.find(v => v.id === version.id).sources.length >= 2);
  }
});

test('dated evidence distinguishes completion and later chat controls', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/codota--tabnine.js');
  const early = render({ version: versions[4] });
  assert.ok(early.querySelector('.tn-completion'));
  assert.equal(early.querySelector('.tn-chat'), null);
  const launch = render({ version: versions[5] });
  assert.ok(launch.querySelector('.tn-chat').textContent.includes('Tabnine Chat'));
  assert.equal(launch.querySelector('.tn-shortcuts'), null);
  const later = render({ version: versions[6] });
  for (const text of ['Tabnine Chat', '/explain-code', '/generate-test-for-code', '/fix-code', '/workspace', '@']) {
    assert.ok(later.querySelector('.tn-chat').textContent.includes(text), text);
  }
  assert.ok(later.querySelector('.tn-shortcuts').textContent.includes('/'));
  const modern = render({ version: versions[7] });
  for (const text of ['Tabnine Chat', 'Explain this code', 'Generate tests', 'Document this code', 'Fix this code', '@', '/']) {
    assert.ok(modern.querySelector('.tn-chat').textContent.includes(text), text);
  }
  const input = modern.querySelector('[data-era-input]');
  modern.querySelector('.tn-actions button').click();
  assert.equal(input.value, 'Explain this code');
});
