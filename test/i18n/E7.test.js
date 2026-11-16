import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const versionFields = ['label', 'defaultModelNote', 'welcome', 'defaultModelName'];
const read = async relative => JSON.parse(await fs.readFile(new URL(relative, import.meta.url), 'utf8'));
const table = await read('../../data/curated/i18n/catalog-en.json');
const patterns = Object.entries(table.patterns).map(([pattern, template]) => [new RegExp(pattern, 'u'), template]);

function translate(value) {
  if (Object.hasOwn(table.exact, value)) return table.exact[value];
  const match = patterns.find(([pattern]) => pattern.test(value));
  return match ? value.replace(match[0], match[1]) : undefined;
}

test('E7 English table has dated patterns, English translations and source URLs', () => {
  assert.equal(table.schema, 'memento.catalog-en.v1');
  assert.equal(translate('最終更新 (2026-11)'), 'Last update (2026-11)');
  assert.equal(translate('初回公開 (2026-03)'), 'First release (2026-03)');
  assert.equal(translate('記録スナップショット (2025)'), 'Recorded snapshot (2025)');
  assert.equal(translate('2020年8月の記録'), 'Snapshot (2020-8)');
  assert.equal(translate('最終更新 (2030-12)'), 'Last update (2030-12)');
  assert.equal(translate('未翻訳の項目'), undefined);
  for (const [original, english] of Object.entries(table.exact)) {
    assert.equal(typeof english, 'string', original);
    assert.ok(english.trim(), original);
    assert.doesNotMatch(english, japanese, original);
    assert.ok(table.sources[original]?.length, `Source URL missing for ${original}`);
    for (const url of table.sources[original]) assert.match(url, /^https?:\/\//u, original);
  }
});

for (const name of ['catalog', 'catalog-core', 'catalog-extra']) {
  test(`E7 every Japanese display value in built ${name} has an English sibling`, async () => {
    const catalog = await read(`../../web/data/${name}.json`);
    const checked = new Set();
    function check(record, fields, location) {
      for (const field of fields) {
        const original = record[field];
        if (typeof original !== 'string' || !japanese.test(original)) continue;
        const english = record[`${field}_en`];
        assert.equal(typeof english, 'string', `${location}.${field}_en missing`);
        assert.ok(english.trim(), `${location}.${field}_en empty`);
        assert.doesNotMatch(english, japanese, `${location}.${field}_en`);
        assert.equal(english, translate(original), `${location}.${field}_en differs from table`);
        checked.add(field);
      }
    }
    for (const tool of catalog.tools) {
      check(tool, ['description'], tool.id);
      for (const version of tool.versions || []) check(version, versionFields, `${tool.id}/${version.id}`);
    }
    assert.ok(checked.size, `${name} did not exercise any Japanese display values`);
    if (name === 'catalog') assert.deepEqual([...checked].sort(), [...versionFields, 'description'].sort());
  });
}

test('E7 catalog partitions retain the full catalog’s original text and English siblings', async () => {
  const [full, core, extra] = await Promise.all(['catalog', 'catalog-core', 'catalog-extra']
    .map(name => read(`../../web/data/${name}.json`)));
  const tools = new Map(full.tools.map(tool => [tool.id, tool]));
  assert.equal(core.tools.length + extra.tools.length, full.tools.length);
  for (const tool of [...core.tools, ...extra.tools]) {
    const original = tools.get(tool.id);
    assert.ok(original, tool.id);
    assert.equal(tool.description, original.description, tool.id);
    assert.equal(tool.description_en, original.description_en, tool.id);
    assert.deepEqual(tool.versions, original.versions, tool.id);
  }
});

test('E7 pick reads all five English fields and preserves Japanese mode', async () => {
  const previous = globalThis.__MEMENTO_LANG;
  try {
    globalThis.__MEMENTO_LANG = 'en';
    const { pick: pickEnglish } = await import('../../web/js/i18n.js?E7-en');
    globalThis.__MEMENTO_LANG = 'ja';
    const { pick: pickJapanese } = await import('../../web/js/i18n.js?E7-ja');
    const catalog = await read('../../web/data/catalog.json');
    const checked = new Set();
    for (const tool of catalog.tools) {
      const records = [[tool, ['description']], ...(tool.versions || []).map(version => [version, versionFields])];
      for (const [record, fields] of records) {
        for (const field of fields) {
          if (typeof record[field] !== 'string' || !japanese.test(record[field])) continue;
          assert.equal(pickEnglish(record, field), record[`${field}_en`]);
          assert.equal(pickJapanese(record, field), record[field]);
          checked.add(field);
        }
      }
    }
    assert.equal(checked.size, 5);
  } finally {
    if (previous === undefined) delete globalThis.__MEMENTO_LANG;
    else globalThis.__MEMENTO_LANG = previous;
  }
});
