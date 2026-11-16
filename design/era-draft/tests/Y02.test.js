import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'stablyai--orca';
const versions = read('web/data/catalog.json').tools.find(tool => tool.id === id).versions;
const spec = read(`design/specs/${id}.json`);
const era = read(`design/era/${id}.json`);

test('each Orca snapshot renders its sourced landing and museum input offline', async t => {
  installDOM(t);
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Y02 runs offline'); };
  t.after(() => { globalThis.fetch = fetchBefore; });
  const { render } = await import('../../web/js/tools/stablyai--orca.js');
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  const index = createEraIndex([era]);
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({version, send: value => sent.push(value), open() {}});
    const visible = root.querySelector('.orca-sidebar').textContent + ' ' + root.querySelector('.orca-landing').textContent;
    const expected = i === 0
      ? ['Worktrees', 'All', 'PR Status', 'Repo', 'No worktrees found', 'Add a repository to get started.', 'Add Repo', 'Create Worktree', 'Move up worktree', 'Move down worktree']
      : ['Search', 'Automations', 'Orca Mobile', 'Add a project to get started.', 'Add project', 'Create workspace', 'Move up workspace', 'Move down workspace'];
    for (const label of expected) assert.ok(visible.includes(label), `${version.id}: ${label}`);
    if (i === 0) assert.equal(root.querySelector('.orca-search').getAttribute('placeholder'), 'Search...');
    assert.doesNotMatch(visible, /unverified|未確認/i);
    assert.equal(root.querySelector('img, svg'), null);
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    assert.ok(root.querySelector('details a'));
    assert.ok(root.querySelector('[data-era-slot="input-left"]'));
    const control = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(control.mounted, false);
    control.dispose();
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    input.value = 'Hello';
    input.dispatch('keydown', {key:'Enter'});
    assert.deepEqual(sent, ['Hello']);
    assert.ok(spec.versions[i].sources.every(url => url.startsWith('https://github.com/stablyai/orca/')));
  }
});

test('the worktree controls change to later navigation without invented later differences', async t => {
  installDOM(t);
  const { render } = await import('../../web/js/tools/stablyai--orca.js');
  const early = render({version:versions[0]});
  const later = versions.slice(1).map(version => render({version}));
  assert.ok(early.querySelector('.orca-groups'));
  assert.equal(early.querySelector('.orca-nav'), null);
  for (const root of later) {
    assert.equal(root.querySelector('.orca-groups'), null);
    assert.ok(root.querySelector('.orca-nav'));
    assert.equal(root.querySelector('.orca-landing').textContent, later[0].querySelector('.orca-landing').textContent);
  }
});

test('Japanese source-data fields have English siblings', () => {
  const visit = (value, path='root') => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach((item, i) => visit(item, `${path}[${i}]`));
    for (const [key, item] of Object.entries(value)) {
      const hasJapanese = x => typeof x === 'string' ? /[\u3040-\u30ff\u3400-\u9fff]/.test(x) : Array.isArray(x) && x.some(hasJapanese);
      if (hasJapanese(item) && !key.endsWith('_en')) {
        assert.ok(Object.hasOwn(value, `${key}_en`), `${path}.${key}_en`);
        if (JSON.stringify(item).includes('未確認')) assert.match(JSON.stringify(value[`${key}_en`]), /unverified/i);
      }
      visit(item, `${path}.${key}`);
    }
  };
  visit(spec); visit(era);
});
