import fs from 'node:fs/promises';
import path from 'node:path';
import { constants } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';

export class AdminError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export const digest = value => createHash('sha256').update(value).digest('hex');
export const idPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;

// Every existing component is checked, including parents of the configured root.
// Paths arriving from the browser are always ids, never filesystem paths.
export async function safePath(root, relative = '', { mkdir = false } = {}) {
  const base = path.resolve(root), target = path.resolve(base, relative);
  if (target !== base && !target.startsWith(base + path.sep)) throw new AdminError('保存先の外には書き込めません。');
  let current = path.parse(target).root;
  const parts = target.slice(current.length).split(path.sep).filter(Boolean);
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    let stat;
    try { stat = await fs.lstat(current); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!mkdir) continue;
      await fs.mkdir(current, { mode: 0o700 }).catch(e => { if (e.code !== 'EEXIST') throw e; });
      stat = await fs.lstat(current);
    }
    if (stat.isSymbolicLink() || (!stat.isDirectory() && index < parts.length - 1) ||
        (!stat.isDirectory() && (!stat.isFile() || stat.nlink !== 1))) {
      throw new AdminError('リンクや特殊なファイルは扱えません。');
    }
  }
  return target;
}

export async function readText(root, relative, max = 2 << 20) {
  const file = await safePath(root, relative);
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.nlink !== 1 || stat.size > max) throw new AdminError('ファイルの種類か容量を確認してください。');
    return await handle.readFile('utf8');
  } finally { await handle.close(); }
}
export async function readJSON(root, relative, fallback) {
  try { return JSON.parse(await readText(root, relative)); }
  catch (error) { if (error.code === 'ENOENT' && arguments.length === 3) return fallback; throw error; }
}
export async function writeText(root, relative, content, { exclusive = false } = {}) {
  await safePath(root, path.dirname(relative), { mkdir: true });
  const target = await safePath(root, relative);
  if (exclusive) {
    const handle = await fs.open(target, 'wx', 0o600);
    try { await handle.writeFile(content, 'utf8'); } finally { await handle.close(); }
    return;
  }
  const temporary = `${target}.tmp-${randomUUID()}`;
  try {
    await fs.writeFile(temporary, content, { mode: 0o600, flag: 'wx' });
    await safePath(root, relative);
    await fs.rename(temporary, target);
  } finally { await fs.rm(temporary, { force: true }); }
}
export const writeJSON = (root, file, value, options) => writeText(root, file, JSON.stringify(value, null, 2) + '\n', options);

export async function jsonFiles(root, relative = '', limit = 200) {
  const output = [];
  async function walk(folder, depth) {
    if (depth > 8) throw new AdminError('保存先の階層が深すぎます。');
    const directory = await safePath(root, folder);
    let entries;
    try { entries = await fs.readdir(directory, { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const name = path.join(folder, entry.name);
      await safePath(root, name);
      if (entry.isDirectory()) await walk(name, depth + 1);
      else if (entry.isFile() && name.endsWith('.json') && !name.endsWith('.review.json')) {
        output.push(name);
        if (output.length > limit) throw new AdminError('一度に扱えるファイル数を超えました。');
      }
    }
  }
  await walk(relative, 0);
  return output;
}
