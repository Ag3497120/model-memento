import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { modelSlotNames, mountModelSwitch } from '../../web/js/era/model-switch.js';

const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const id = 'foundationagents--metagpt';
const versions = read('web/data/catalog.json').tools.find(t => t.id === id).versions;

test('MetaGPT editions render source-based terminal examples and museum input offline', async t => {
  installDOM(t);
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Network is not allowed in this test'); };
  t.after(() => { globalThis.fetch = oldFetch; });
  const { render } = await import('../../web/js/tools/foundationagents--metagpt.js');
  const spec = read(`design/specs/${id}.json`);
  const era = read(`design/era/${id}.json`);
  const index = createEraIndex([era]);
  assert.equal(spec.schema, 'memento.design.v1');
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const [i, version] of versions.entries()) {
    const sent = [];
    const root = render({ version, tool: { id }, messages: [], send: text => sent.push(text) });
    const main = root.querySelector('main');
    assert.equal(root.getAttribute('data-spec-version'), version.id);
    for (const text of ['Investment: $3.0.', 'Alice(Product Manager)', 'WritePRD', 'Bob(Architect)', 'WriteDesign', 'Eve(Project Manager)', 'WriteTasks']) assert.ok(main.textContent.includes(text), `${version.id}: ${text}`);
    assert.ok(main.textContent.includes(i < 4 ? 'ready to' : 'to do'));
    assert.ok(main.textContent.includes(i < 3 ? 'python startup.py' : 'metagpt "Create a 2048 game"'));
    assert.equal(main.textContent.includes('PrepareDocuments'), i >= 3);
    assert.equal(root.querySelector('img, svg, picture, canvas'), null);
    assert.ok(root.querySelector('[data-era-slot]'));
    assert.ok(root.querySelector('details a'));
    assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1);
    const slots = modelSlotNames(index[version.id].model_switch);
    assert.equal(slots.length, 0);
    const controller = mountModelSwitch(root, { era: index[version.id], onPick() {} });
    assert.equal(controller.mounted, false);
    controller.dispose();
    const input = root.querySelector('[data-era-input]');
    assert.ok(input);
    input.value = 'Explain this';
    input.dispatch('keydown', { key: 'Enter' });
    assert.deepEqual(sent, ['Explain this']);
  }
});

test('Japanese spec and era fields have English siblings', () => {
  function check(value, path = '') {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach((item, i) => check(item, `${path}[${i}]`)); return; }
    for (const [key, item] of Object.entries(value)) {
      if (!key.endsWith('_en') && (typeof item === 'string' || Array.isArray(item) && item.every(x => typeof x === 'string')) && /[\u3040-\u30ff\u3400-\u9fff]/u.test(JSON.stringify(item))) {
        assert.ok(Object.hasOwn(value, `${key}_en`), `${path}.${key}`);
      }
      check(item, `${path}.${key}`);
    }
  }
  check(read(`design/specs/${id}.json`), 'spec');
  check(read(`design/era/${id}.json`), 'era');
});
