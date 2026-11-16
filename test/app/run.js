import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
async function discover(folder) {
  const found = [];
  for (const entry of await fs.readdir(path.join(root, folder), { withFileTypes: true }).catch(error => { if (error.code !== 'ENOENT') throw error; return []; })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) found.push(...await discover(file));
    else if (entry.isFile() && /\.(?:test|spec)\.js$/.test(entry.name)) found.push(file);
  }
  return found;
}
const files = (await Promise.all(['test', 'tests', 'web/js'].map(discover))).flat().sort();
if (!files.length) throw new Error('テストがありません。');
const home = await fs.mkdtemp(path.join(root, 'test/app/.home-'));
try {
  const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit',
    env: { ...process.env, MODEL_MEMENTO_HOME: home, MODEL_MEMENTO_NO_DISCOVERY: '1', TMPDIR: home } });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally { await fs.rm(home, { recursive: true, force: true }); }
