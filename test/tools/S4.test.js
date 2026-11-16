import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM } from '../era/dom.js';
import { modelSlotNames } from '../../web/js/era/model-switch.js';

const ids = [
  'aws--amazon-q-developer-cli',
  'superagent-ai--grok-cli', 'openinterpreter--openinterpreter'
];
const read = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const catalog = read('web/data/catalog.json').tools;

for (const id of ids) test(`${id}: every catalog edition renders and accepts input`, async t => {
  installDOM(t);
  const { render } = await import(`../../web/js/tools/${id}.js`);
  const versions = catalog.find(tool => tool.id === id).versions;
  const spec = read(`design/specs/${id}.json`), era = read(`design/era/${id}.json`);
  assert.deepEqual(spec.versions.map(v => v.id), versions.map(v => v.id));
  assert.deepEqual(era.versions.map(v => v.id), versions.map(v => v.id));
  for (const version of versions) {
    const sent = [];
    const root = render({ tool: { id }, version, messages: [], send: value => sent.push(value) });
    assert.ok(root.querySelector('.thread'), version.id);
    assert.ok(root.querySelector('[data-era-slot="panel"]'), version.id);
    const slots = modelSlotNames(era.versions.find(v => v.id === version.id).model_switch);
    if (slots.length) assert.ok(slots.some(name => root.querySelector(`[data-era-slot="${name}"]`)), version.id);
    const input = root.querySelector('textarea[data-era-input]');
    assert.ok(input, version.id);
    assert.ok(root.querySelector('[data-recreation-label]'), version.id);
    assert.ok(root.querySelector('details a'), version.id);
    assert.equal(root.querySelector('img,svg'), null, version.id);
    input.value = 'test request';
    input.dispatch('keydown', { key: 'Enter', shiftKey: false, isComposing: false });
    assert.deepEqual(sent, ['test request'], version.id);
    assert.equal(input.value, '', version.id);
    const record = era.versions.find(v => v.id === version.id);
    assert.ok(record.desktop && record.model_switch && Array.isArray(record.accents));
    assert.ok(record.trend && record.trend_en);
  }
});
