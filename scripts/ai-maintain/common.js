import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { z } from 'zod';

export const LIMITS = Object.freeze({ models: 3, news: 8, guides: 5, links: 5, requests: 24,
  pageBytes: 100_000, textBytes: 24_000, patchBytes: 600_000, fileBytes: 300_000,
  growthBytes: 24_000, totalGrowthBytes: 120_000, files: 24, stateBytes: 1_000_000 });
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const json = value => `${JSON.stringify(value, null, 2)}\n`;
export const httpsURL = value => {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && u.href.length <= 2048; }
  catch { return false; }
};
export const source = z.string().refine(httpsURL, '出典は認証情報を含まない HTTPS のページにしてください。');
export const sources = z.array(source).min(1).max(12);
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const text = max => z.string().min(1).max(max);
export const japanese = max => text(max).refine(s => /[ぁ-んァ-ヶ一-龠]/u.test(s), '日本語で書いてください。');
export const patchSchema = z.strictObject({ schema: z.literal('memento.ai-patch.v1'),
  changes: z.array(z.strictObject({ path: text(200), beforeSha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
    content: text(LIMITS.fileBytes) })).max(LIMITS.files) });

export function allowedPath(file) {
  if (typeof file !== 'string' || !/^[A-Za-z0-9_./-]+$/.test(file)
    || file.split('/').some(p => !p || p === '.' || p === '..' || p.startsWith('.'))) return false;
  return /^data\/curated\/(?:personas|guides|news-summaries|model-records)\/[A-Za-z0-9_-]+\.json$/.test(file)
    || ['data/curated/models-updates.json', 'data/curated/link-replacements.json', 'data/curated/prompting-trends.json'].includes(file);
}
export async function safeFile(root, relative) {
  if (!relative || path.isAbsolute(relative) || relative.split(/[\\/]/).some(p => !p || p === '.' || p === '..')) throw new Error('保存先が範囲外です。');
  const base = path.resolve(root);
  if ((await fs.lstat(base)).isSymbolicLink()) throw new Error('作業フォルダーに別の場所を指すリンクは使えません。');
  let cursor = base;
  for (const part of relative.split('/')) {
    cursor = path.join(cursor, part);
    try { const s = await fs.lstat(cursor); if (s.isSymbolicLink() || (!s.isDirectory() && !s.isFile()) || s.isFile() && s.nlink > 1) throw new Error('通常のファイルだけを使ってください。'); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return cursor;
}
export async function readBounded(file, max = LIMITS.stateBytes) {
  const s = await fs.lstat(file);
  if (!s.isFile() || s.isSymbolicLink() || s.nlink > 1 || s.size > max) throw new Error('入力ファイルの種類か容量が範囲外です。');
  const h = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try { const opened = await h.stat();
    if (!opened.isFile() || opened.nlink > 1 || opened.dev !== s.dev || opened.ino !== s.ino || opened.size > max) throw new Error('入力ファイルが変更されました。');
    const b = Buffer.alloc(max + 1); let n = 0;
    while (n < b.length) { const r = await h.read(b, n, b.length - n, null); if (!r.bytesRead) break; n += r.bytesRead; }
    if (n > max) throw new Error('入力が大きすぎます。');
    return new TextDecoder('utf-8', { fatal: true }).decode(b.subarray(0, n));
  } finally { await h.close(); }
}
export async function readJSON(root, file, fallback = null, max) {
  try { return JSON.parse(await readBounded(await safeFile(root, file), max)); }
  catch (e) { if (e.code === 'ENOENT') return fallback; throw e; }
}
export async function listJSON(root, folder) {
  const dir = await safeFile(root, folder);
  try { return (await fs.readdir(dir)).filter(f => /^[A-Za-z0-9_-]+\.json$/.test(f)).sort().map(f => `${folder}/${f}`); }
  catch (e) { if (e.code === 'ENOENT') return []; throw e; }
}
export const slug = value => String(value).replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 140);
export function urls(value, result = new Set()) {
  if (typeof value === 'string' && httpsURL(value)) result.add(value);
  else if (Array.isArray(value)) value.forEach(v => urls(v, result));
  else if (value && typeof value === 'object') Object.values(value).forEach(v => urls(v, result));
  return [...result];
}
