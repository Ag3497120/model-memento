import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const file = new URL('../../data/curated/models-updates.json', import.meta.url);
const data = JSON.parse(await readFile(file, 'utf8'));

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(value)) return false;
  const [year, month = '01', day = '01'] = value.split('-');
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  return Number(year) > 0 && Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === `${year}-${month}-${day}`;
}

function checkValues(value, path = '') {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) return value.forEach((item, i) => checkValues(item, `${path}[${i}]`));
  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      const name = path ? `${path}.${key}` : key;
      if ((key === 'date' || key === 'release' || key === 'knowledge' || key === 'knowledge_cutoff') && item !== null) {
        assert.ok(validDate(item), `${name}: invalid date ${item}`);
      }
      if (/^(?:context|output|context_tokens|max_output_tokens)$/.test(key) && item !== null) {
        assert.equal(typeof item, 'number', `${name}: token limit must be numeric`);
      }
      if (typeof item === 'number') {
        assert.ok(Number.isFinite(item) && item >= 0, `${name}: invalid number ${item}`);
        if (/(?:^|_)(?:context|output)(?:_tokens)?$/.test(key)) assert.ok(Number.isSafeInteger(item) && item > 0, `${name}: invalid token limit ${item}`);
      }
      checkValues(item, name);
    }
  }
}

test('all curated and closed overrides have HTTPS sources and valid facts', () => {
  assert.ok(validDate(data.researched_at), 'invalid research date');
  for (const [section, records] of Object.entries({ curated_updates: data.curated_updates, closed_overrides: data.closed_overrides })) {
    assert.ok(records && typeof records === 'object' && !Array.isArray(records), `${section} missing`);
    for (const [id, record] of Object.entries(records)) {
      assert.ok(Array.isArray(record.sources) && record.sources.length > 0, `${section}.${id} has no sources`);
      for (const source of record.sources) {
        let url;
        try { url = new URL(source); } catch { assert.fail(`${section}.${id}: invalid URL ${source}`); }
        assert.equal(url.protocol, 'https:', `${section}.${id}: source must use HTTPS`);
      }
      checkValues(record, `${section}.${id}`);
    }
  }
});

test('new curated records have valid dates, numbers and HTTPS evidence', () => {
  assert.ok(Array.isArray(data.new_curated_models));
  for (const record of data.new_curated_models) {
    assert.ok(record.id && Array.isArray(record.evidence) && record.evidence.length, 'new model needs id and evidence');
    for (const evidence of record.evidence) assert.equal(new URL(evidence.url).protocol, 'https:', `${record.id}: evidence must use HTTPS`);
    checkValues(record, `new_curated_models.${record.id}`);
  }
});

test('date and number validation rejects malformed values', () => {
  for (const date of ['2026-13', '2025-02-29', '2026-04-31', 'tomorrow']) assert.equal(validDate(date), false);
  for (const date of ['2024', '2024-02', '2024-02-29']) assert.equal(validDate(date), true);
  assert.throws(() => checkValues({ context_tokens: '8192' }));
  assert.throws(() => checkValues({ max_output_tokens: 0 }));
  assert.throws(() => checkValues({ context_tokens: -1 }));
});
