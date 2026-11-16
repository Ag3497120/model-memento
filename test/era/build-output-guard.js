// Preload only in build verification: never write generated files in the shared checkout.
import '../../test/app/build-guard.js';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createEraIndex } from '../../web/js/era/data.js';

const directory = new URL('../../design/era/', import.meta.url);
const documents = await Promise.all((await fs.readdir(directory)).filter(name => name.endsWith('.json')).sort()
  .map(async name => JSON.parse(await fs.readFile(new URL(name, directory), 'utf8'))));
const expected = createEraIndex(documents);
const holdWrite = fs.writeFile;
let checked = false;
fs.writeFile = async (file, body, ...options) => {
  if (String(file).endsWith('/web/data/era.json')) {
    assert.deepEqual(JSON.parse(String(body)), JSON.parse(JSON.stringify(expected)));
    checked = true;
    console.log(`V1 era output verified: ${Object.keys(expected).length} versions, exact source fields, held in memory.`);
  }
  return holdWrite(file, body, ...options);
};
process.on('exit', code => { if (code === 0 && !checked) { console.error('V1: build never wrote era.json.'); process.exitCode = 1; } });
