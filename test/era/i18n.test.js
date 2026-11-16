import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createEraIndex } from '../../web/js/era/data.js';

const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const urls = text => text.match(/https?:\/\/[^\s（）<>()]+/g) || [];

async function readDocuments(directory) {
  const url = new URL(directory, import.meta.url);
  return Promise.all((await fs.readdir(url)).filter(name => name.endsWith('.json')).sort()
    .map(async name => JSON.parse(await fs.readFile(new URL(name, url), 'utf8'))));
}

const documents = await readDocuments('../../design/era/');

// Provenance descriptions are retained verbatim in sources. All display fields are traversed.
function checkEnglish(value, location) {
  if (Array.isArray(value)) return value.reduce((count, item, index) => count + checkEnglish(item, `${location}[${index}]`), 0);
  if (!value || typeof value !== 'object') return 0;
  let checked = 0;
  for (const [key, text] of Object.entries(value)) {
    if (key === 'sources' || key.endsWith('_en')) continue;
    const field = `${location}.${key}`;
    const entries = typeof text === 'string' ? [text]
      : Array.isArray(text) && text.every(item => typeof item === 'string') ? text : null;
    if (!entries?.some(item => japanese.test(item))) {
      checked += checkEnglish(text, field);
      continue;
    }
    const english = value[`${key}_en`];
    if (Array.isArray(text)) {
      assert.ok(Array.isArray(english), `${field}_en must be an array`);
      assert.equal(english.length, text.length, `${field}_en must preserve array length`);
    } else assert.equal(typeof english, 'string', `${field}_en must be a string`);
    const translated = Array.isArray(english) ? english : [english];
    translated.forEach((item, index) => {
      assert.equal(typeof item, 'string', `${field}_en[${index}]`);
      assert.ok(item.trim(), `${field}_en[${index}] must contain text`);
      assert.doesNotMatch(item, japanese, `${field}_en[${index}] must be English`);
      assert.deepEqual(urls(item), urls(entries[index]), `${field}_en[${index}] must retain source URLs`);
      if (/unverified|未確認/.test(entries[index])) assert.match(item, /unverified/, `${field}_en[${index}] must preserve uncertainty`);
    });
    checked++;
  }
  return checked;
}

test('every Japanese era display string has a complete English sibling', () => {
  assert.ok(documents.length > 0);
  const checked = documents.reduce((total, document) => total + checkEnglish(document, document.tool_id), 0);
  assert.ok(checked > 0);
});

test('the version index preserves every English field and all original source records', () => {
  const index = createEraIndex(documents);
  for (const document of documents) for (const version of document.versions) {
    assert.deepEqual(index[version.id], { tool_id: document.tool_id, ...version });
    assert.equal(index[version.id].trend_en, version.trend_en);
    assert.deepEqual(index[version.id].model_switch.steps_en, version.model_switch.steps_en);
  }
});

test('Japanese official and researched persona values have sourced English equivalents', async () => {
  const personas = await readDocuments('../../data/curated/personas/');
  let checked = 0;
  for (const persona of personas) for (const trait of Object.values(persona.traits).flat()) {
    if (!['official', 'researched'].includes(trait.basis) || typeof trait.value !== 'string' || !japanese.test(trait.value)) continue;
    const field = `${persona.model_id}: ${trait.value}`;
    assert.equal(typeof trait.value_en, 'string', field);
    assert.ok(trait.value_en.trim(), field);
    assert.doesNotMatch(trait.value_en, japanese, field);
    assert.match(trait.source, /^https?:\/\//, field);
    checked++;
  }
  assert.ok(checked > 0);
});

test('the era build rejects missing strings and incomplete or Japanese English arrays', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const guard = new URL('../app/build-guard.js', import.meta.url).href;
  const cases = [
    ['delete document.versions[0].trend_en;', /aider.*trend/],
    ['document.versions[0].model_switch.steps_en = [];', /aider.*model_switch.steps/],
    ['document.versions[0].model_switch.steps_en = ["日本語"];', /aider.*model_switch.steps/],
  ];
  for (const [mutation, message] of cases) {
    const preload = `
      import ${JSON.stringify(guard)};
      import fs from 'node:fs/promises';
      const read = fs.readFile;
      fs.readFile = async (file, ...options) => {
        const body = await read(file, ...options);
        if (!String(file).endsWith('/design/era/aider.json')) return body;
        const document = JSON.parse(String(body));
        ${mutation}
        return JSON.stringify(document);
      };
    `;
    const result = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(preload)}`,
      'scripts/build-web.js', '--offline', '--era-only'], { cwd: root, encoding: 'utf8' });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0, mutation);
    assert.match(result.stderr, /Era English translation/);
    assert.match(result.stderr, message);
  }
});
