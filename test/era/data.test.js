import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createEraIndex, ERA_SCHEMA, eraForVersion, formatEraClock, frameStyle, sourceUrls, activeAccents, eraSources, mementoForModel } from '../../web/js/era/data.js';
import { testEra } from './dom.js';

const directory = new URL('../../design/era/', import.meta.url);
const documents = await Promise.all((await fs.readdir(directory)).filter(name => name.endsWith('.json')).sort().map(async name => JSON.parse(await fs.readFile(new URL(name, directory), 'utf8'))));
test('all source-era versions are indexed without dropping sourced fields or inventing defaults', () => {
  const index = createEraIndex(documents);
  assert.equal(Object.keys(index).length, documents.reduce((total, doc) => total + doc.versions.length, 0));
  for (const doc of documents) for (const version of doc.versions) {
    assert.deepEqual(index[version.id], { tool_id: doc.tool_id, ...version });
    assert.equal(eraForVersion(index, { id: doc.tool_id }, { id: version.id }), index[version.id]);
    assert.ok(eraSources(index[version.id]).length, version.id);
  }
});
test('bad schema and duplicate version ids fail the build instead of silently overwriting records', () => {
  const doc = { schema: ERA_SCHEMA, tool_id: 'example', versions: [testEra()] };
  assert.throws(() => createEraIndex([{ ...doc, schema: 'wrong' }]), TypeError);
  assert.throws(() => createEraIndex([doc, doc]), /重複/);
  assert.throws(() => createEraIndex([{ ...doc, versions: [{ id: 'broken' }] }]), /不足/);
});
test('missing/wrong-tool data stays explicitly unverified', () => {
  const era = eraForVersion({ 'example-2023': testEra() }, { id: 'different' }, { id: 'example-2023', from: '2023-03-14' });
  assert.equal(era.unverified, true); assert.equal(era.desktop.date_shown, null);
  assert.deepEqual(era.model_switch.options, []); assert.match(era.trend, /未確認/);
});
test('Japanese clock is deterministic across host timezones; missing times are not fabricated', () => {
  assert.equal(formatEraClock('2022-11-30T21:14:00+09:00'), '2022年11月30日（水） 21:14');
  assert.equal(formatEraClock('2022-11-30'), '2022年11月30日（水）');
  assert.equal(formatEraClock('2023-02-30'), '日付未確認');
  assert.equal(formatEraClock(null), '日付未確認');
  assert.deepEqual(frameStyle({ os: 'terminal', date_shown: '2019-02-14' }), { os: 'terminal', shell: 'terminal', period: 'early' });
  assert.equal(frameStyle({ os: 'Windows 11' }).os, 'windows');
});
test('unsafe links and accents outside their dated window are excluded', () => {
  assert.deepEqual(sourceUrls([{ url: 'javascript:alert(1)' }, 'https://example.com/a', { url: 'https://example.com/a' }]), ['https://example.com/a']);
  const era = testEra(); era.accents = [
    { text: 'past', when: '2023-03-01..2023-03-13', sources: ['https://example.com/a'] },
    { text: 'today', when: '2023-03-14..2023-03-14', sources: ['https://example.com/b'] },
    { text: 'unsupported', sources: [] }
  ];
  assert.deepEqual(activeAccents(era).map(accent => accent.text), ['today']);
});
test('memento retirement is sourced, scoped by its label and never confused with a deprecation notice', () => {
  const model = { name: 'Example', evidence: [{ id: 'E1', url: 'https://example.com/retirement' }], lifecycle: { status: 'retired', events: [
    { type: 'retired_api', date: '2024-10-01', label: 'API提供終了', source: 'E1' },
    { type: 'deprecation_notice', date: '2025-01-01', label: '予告', source: 'E1' }
  ] } };
  assert.deepEqual(mementoForModel(model).retirement, { text: '2024-10-01 · API提供終了', sources: ['https://example.com/retirement'] });
  assert.equal(mementoForModel({ ...model, evidence: [] }).retirement.text, '提供終了日は未確認です。');
  assert.equal(mementoForModel({ ...model, lifecycle: { status: 'retired', events: [] } }).retirement.text, '提供終了日は未確認です。');
  assert.equal(mementoForModel(null).name, null);
});
