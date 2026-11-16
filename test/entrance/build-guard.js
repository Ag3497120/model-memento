// Execute the real build without writing any shared generated output.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const memory = new Map(), read = fs.readFile.bind(fs);
const name = value => path.resolve(value instanceof URL ? fileURLToPath(value) : String(value));
fs.writeFile = async (file, data) => { memory.set(name(file), Buffer.isBuffer(data) ? Buffer.from(data) : Buffer.from(String(data))); };
fs.readFile = async (file, options) => {
  if (!memory.has(name(file))) return read(file, options);
  const body = memory.get(name(file));
  return typeof options === 'string' || options?.encoding ? body.toString(typeof options === 'string' ? options : options.encoding) : Buffer.from(body);
};
fs.copyFile = async (from, to) => { memory.set(name(to), await fs.readFile(from)); };
fs.mkdir = async () => {};
globalThis.fetch = async () => { throw new Error('Offline build: network disabled'); };
process.on('exit', () => {
  if (process.exitCode) return;
  const bytes = memory.get(fileURLToPath(new URL('../../web/data/featured.json', import.meta.url)));
  assert.ok(bytes, 'real build produced featured.json');
  const featured = JSON.parse(bytes);
  assert.equal(featured.schema, 'memento.featured.v1');
  assert.deepEqual(featured.catalog.tools.map(tool => tool.id), ['chatgpt', 'claude.ai', 'claude-code']);
  assert.ok(featured.era['chatgpt-2022-11']);
  assert.ok(featured.models.length);
  const html = memory.get(fileURLToPath(new URL('../../web/index.html', import.meta.url))).toString();
  assert.match(html, /css\/entrance.css/);
  console.log(`R1 featured build verified: ${bytes.length} bytes; ${memory.size} generated files held in memory; no build files written.`);
});
