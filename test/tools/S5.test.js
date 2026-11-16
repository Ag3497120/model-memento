import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { createEraIndex } from '../../web/js/era/data.js';
import { modelSlotNames, mountModelSwitch } from '../../web/js/era/model-switch.js';

const ids = [
  'sourcegraph--cody-public-snapshot', 'deepseek-ai--deepseek-harness',
  'farion1231--cc-switch', 'huggingface--smolagents'
];
const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const catalog = read('web/data/catalog.json');

for (const id of ids) {
  test(`${id}: each catalog edition renders with evidence and working museum input`, async t => {
    installDOM(t);
    const previousFetch = globalThis.fetch;
    globalThis.fetch = () => { throw new Error('S5 tests must stay offline'); };
    t.after(() => { globalThis.fetch = previousFetch; });
    const module = await import(`../../web/js/tools/${id}.js`);
    const editions = catalog.tools.find(tool => tool.id === id).versions;
    const spec = read(`design/specs/${id}.json`);
    const era = read(`design/era/${id}.json`);
    const eraIndex = createEraIndex([era]);
    assert.equal(spec.schema, 'memento.design.v1');
    assert.deepEqual(spec.versions.map(v => v.id), editions.map(v => v.id));
    assert.deepEqual(era.versions.map(v => v.id), editions.map(v => v.id));
    for (const version of editions) {
      const sent = [];
      const root = module.render({ tool: { id }, version, messages: [], send: text => sent.push(text), newChat() {} });
      assert.equal(root.getAttribute('data-spec-version'), version.id);
      assert.ok(root.querySelector('[data-era-slot]'), version.id);
      const input = root.querySelector('[data-era-input]');
      assert.ok(input, version.id);
      assert.ok(root.querySelector('.thread'), version.id);
      assert.equal(root.querySelectorAll('[data-recreation-label]').length, 1, version.id);
      assert.ok(root.querySelector('details a'), version.id);
      assert.equal(root.querySelector('img,svg,picture,canvas'), null, version.id);
      const controller = mountModelSwitch(root, { era: eraIndex[version.id], onPick() {} });
      const control = eraIndex[version.id].model_switch;
      const slots = modelSlotNames(control);
      if (slots.length) {
        assert.ok(control.sources.length, version.id);
        assert.ok(slots.some(name => root.querySelector(`[data-era-slot="${name}"]`)), version.id);
      }
      assert.equal(controller.mounted, slots.length > 0, `${version.id}: model selector`);
      controller.dispose();
      input.value = 'What is this?';
      const shiftToSend = id === 'huggingface--smolagents' && !!root.querySelector('.smol-request');
      if (shiftToSend) {
        input.dispatch('keydown', { key: 'Enter' });
        assert.deepEqual(sent, [], version.id);
      }
      input.dispatch('keydown', { key: 'Enter', shiftKey: shiftToSend });
      assert.deepEqual(sent, ['What is this?'], version.id);
    }
  });
}
// （2026-11-16）この道具の画面は第 3 波で作り直したため、ひな形の操作の検査は外した。新しい画面の検査は test/tools/U*.test.js にある。
