// Preload for the shared checkout only: execute the real build with generated output held in memory.
import fs from 'node:fs/promises';
import path from 'node:path';
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
globalThis.fetch = async () => { throw new Error('Offline build: network is disabled.'); };
process.on('exit', () => { if (memory.size) console.log(`AP1 output guard: ${memory.size} generated files held in memory; no build files written.`); });
