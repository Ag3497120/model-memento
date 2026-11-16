import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { modelSlotNames, mountModelSwitch } from '../../web/js/era/model-switch.js';

const ids = ['kilo-org--kilocode', 'codota--tabnine'];
const json = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const catalog = json('web/data/catalog.json');
const modules = Object.fromEntries(await Promise.all(ids.map(async id => [id, await import(`../../web/js/tools/${id}.js`)])));

for (const id of ids) {
  test(`${id}: every catalog edition renders with evidence and no artwork`, t => {
    installDOM(t);
    const tool = catalog.tools.find(item => item.id === id);
    const spec = json(`design/specs/${id}.json`);
    const era = json(`design/era/${id}.json`);
    const expected = tool.versions.map(v => v.id);
    assert.deepEqual(spec.versions.map(v => v.id), expected);
    assert.deepEqual(era.versions.map(v => v.id), expected);
    for (const version of tool.versions) {
      const sent = [];
      const root = modules[id].render({ tool, version, messages: [], send: value => sent.push(value), open() {}, newChat() {} });
      assert.equal(root.getAttribute('data-spec-version'), version.id);
      assert.equal(root.querySelector('img,svg,picture,canvas'), null);
      assert.ok(root.querySelector('[data-recreation-label]'));
      assert.ok(root.querySelector('details a'));
      assert.ok(root.querySelector('.thread'));
      const input = root.querySelector('[data-era-input]');
      assert.ok(input, version.id);
      input.value = 'example question';
      input.dispatch('keydown', { key: 'Enter' });
      assert.deepEqual(sent, ['example question']);
      const record = era.versions.find(v => v.id === version.id);
      assert.ok(record.model_switch.sources.length);
      const names = modelSlotNames(record.model_switch);
      if (names.length) {
        assert.ok(names.some(name => root.querySelector(`[data-era-slot="${name}"]`)));
        const controller = mountModelSwitch(root, { era: record, onPick() {} });
        assert.equal(controller.mounted, true);
        controller.dispose();
      }
    }
  });
}
// （2026-11-16）この道具の画面は第 3 波で作り直したため、ひな形の操作の検査は外した。新しい画面の検査は test/tools/U*.test.js にある。
